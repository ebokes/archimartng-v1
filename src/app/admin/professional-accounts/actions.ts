'use server'

import { revalidatePath } from 'next/cache'
import { reviewAdminProfessionalAccount } from '@/lib/admin-professional-accounts'

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
