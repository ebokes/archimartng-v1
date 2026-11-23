'use server'

import { revalidatePath } from 'next/cache'
import { createProfessionalProfileEditAction } from '@/lib/professional-profile-edit-action'
import { isDisposableProfessionalStatusPageEnabled } from '@/lib/professional-onboarding-gate'
import { updateOwnProfessionalProfile } from '@/lib/professional-profile-update-server'
import type { ProfessionalProfileEditActionState } from '@/lib/professional-profile-edit-action'

const submit = createProfessionalProfileEditAction({
  enabled: () => isDisposableProfessionalStatusPageEnabled(),
  update: updateOwnProfessionalProfile,
})

export async function saveOwnProfessionalProfileAction(
  previous: ProfessionalProfileEditActionState,
  formData: FormData,
): Promise<ProfessionalProfileEditActionState> {
  const result = await submit(previous, formData)
  if (result.status === 'saved') revalidatePath('/account/professional/profile')
  return result
}
