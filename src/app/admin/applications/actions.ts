'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { authDb } from '@/db/auth-client'
import { professionalApplications } from '@/db/schema'
import { parseProfessionalApplicationReview } from '@/lib/professional-application-input'
import { requireAdmin } from '@/lib/require-admin'

export type ReviewActionState = { error: string | null; saved: boolean }

export async function reviewProfessionalApplication(
  id: string,
  _state: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const admin = await requireAdmin()
  if (!/^[0-9a-f-]{36}$/i.test(id))
    return { error: 'Invalid application.', saved: false }
  const result = parseProfessionalApplicationReview(formData)
  if (!result.success)
    return {
      error: result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(' '),
      saved: false,
    }
  const [updated] = await authDb
    .update(professionalApplications)
    .set({
      status: result.data.status,
      reviewNotes: result.data.reviewNotes,
      reviewedAt: result.data.status === 'submitted' ? null : new Date(),
      reviewedByAdminId: result.data.status === 'submitted' ? null : admin.id,
    })
    .where(eq(professionalApplications.id, id))
    .returning({ id: professionalApplications.id })
  if (!updated) return { error: 'Application no longer exists.', saved: false }
  revalidatePath('/admin')
  revalidatePath('/admin/applications')
  revalidatePath(`/admin/applications/${id}`)
  return { error: null, saved: true }
}
