'use server'

import { revalidatePath } from 'next/cache'
import { reviewAdminProfessionalAccount } from '@/lib/admin-professional-accounts'
import { claimAdminProfessionalProfile } from '@/lib/admin-professional-claims'

export type ProfessionalAccountReviewState = {
  error: string | null
  saved: boolean
}

export async function saveProfessionalAccountReview(
  accountId: string,
  _state: ProfessionalAccountReviewState,
  formData: FormData,
): Promise<ProfessionalAccountReviewState> {
  const decision = formData.get('decision')
  const reason = formData.get('reason')
  try {
    await reviewAdminProfessionalAccount({
      accountId,
      decision: typeof decision === 'string' ? decision : '',
      reason: typeof reason === 'string' ? reason : '',
    })
  } catch {
    return {
      error:
        'Review could not be saved. Check the decision and reason, then refresh the account before trying again.',
      saved: false,
    }
  }
  revalidatePath('/admin/professional-accounts')
  revalidatePath(`/admin/professional-accounts/${accountId}`)
  return { error: null, saved: true }
}

export type ProfessionalProfileClaimState = {
  error: string | null
  saved: boolean
}

export async function saveProfessionalProfileClaim(
  accountId: string,
  _state: ProfessionalProfileClaimState,
  formData: FormData,
): Promise<ProfessionalProfileClaimState> {
  const profileId = formData.get('profileId')
  const evidenceSummary = formData.get('evidenceSummary')
  const reason = formData.get('reason')
  try {
    await claimAdminProfessionalProfile({
      accountId,
      profileId: typeof profileId === 'string' ? profileId : '',
      evidenceSummary:
        typeof evidenceSummary === 'string' ? evidenceSummary : '',
      reason: typeof reason === 'string' ? reason : '',
      evidenceReviewed: formData.get('evidenceReviewed') === 'on',
    })
  } catch {
    return {
      error:
        'Claim could not be saved. Review the evidence and current ownership, then refresh before trying again.',
      saved: false,
    }
  }
  revalidatePath('/admin/professional-accounts')
  revalidatePath(`/admin/professional-accounts/${accountId}`)
  return { error: null, saved: true }
}
