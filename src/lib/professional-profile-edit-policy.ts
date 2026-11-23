import 'server-only'

import { z } from 'zod'
import { MarketplaceAccountAccessError } from './marketplace-account-authorization'
import { MarketplaceAccountServiceError } from './marketplace-account-resolver'
import {
  isDisposableProfessionalStatusPageEnabled,
  mayViewDisposableProfessionalStatus,
} from './professional-onboarding-gate'

const optionalLocation = z
  .string()
  .trim()
  .max(120)
  .transform((value) => value || null)

// The strict allowlist is the only shape a future owner edit action may write.
// There is no portfolio-description column in the current professionals table.
const editableFields = z
  .strictObject({
    bio: z.string().trim().min(20).max(10000).optional(),
    websiteUrl: z
      .union([z.literal(''), z.url().startsWith('https://').max(2048)])
      .transform((value) => value || null)
      .optional(),
    city: optionalLocation.optional(),
    state: optionalLocation.optional(),
    country: optionalLocation.optional(),
  })
  .refine((value) => Object.keys(value).length > 0)

export type ProfessionalProfileEditChanges = z.output<typeof editableFields>

export class ProfessionalProfileEditError extends Error {
  constructor(readonly code: 'invalid_input' | 'forbidden') {
    super(code === 'invalid_input' ? 'Invalid profile changes' : 'Forbidden')
    this.name = 'ProfessionalProfileEditError'
  }
}

type TrustedAccount = {
  id: string
  authSubject: string
  profileId: string | null
}

type TrustedOwnership = {
  ownerAccountId: string
  profileId: string
  publicationStatus: 'draft' | 'archived' | 'published'
}

type Dependencies = {
  // Use requireApprovedProfessional() from the server session-backed resolver.
  requireApproved: () => Promise<TrustedAccount>
  // A future action must re-read and lock this relationship in its transaction.
  findOwnership: (
    accountId: string,
    profileId: string,
  ) => Promise<TrustedOwnership | null>
}

export function createProfessionalProfileEditPolicy(
  dependencies: Dependencies,
) {
  return async function prepareOwnedProfileEdit(
    submittedChanges: unknown,
    env: Record<string, string | undefined> = process.env,
  ): Promise<{
    accountId: string
    profileId: string
    changes: ProfessionalProfileEditChanges
  }> {
    if (!isDisposableProfessionalStatusPageEnabled(env))
      throw new MarketplaceAccountAccessError(403)

    const account = await dependencies.requireApproved()
    if (!mayViewDisposableProfessionalStatus(account.authSubject, env))
      throw new MarketplaceAccountAccessError(403)
    if (!account.profileId) throw new ProfessionalProfileEditError('forbidden')

    let ownership: TrustedOwnership | null
    try {
      ownership = await dependencies.findOwnership(
        account.id,
        account.profileId,
      )
    } catch {
      throw new MarketplaceAccountServiceError()
    }
    if (
      !ownership ||
      ownership.ownerAccountId !== account.id ||
      ownership.profileId !== account.profileId ||
      !['draft', 'archived', 'published'].includes(ownership.publicationStatus)
    )
      throw new ProfessionalProfileEditError('forbidden')

    const parsed = editableFields.safeParse(submittedChanges)
    if (!parsed.success) throw new ProfessionalProfileEditError('invalid_input')

    return {
      accountId: account.id,
      profileId: account.profileId,
      changes: parsed.data,
    }
  }
}
