'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { authDb } from '@/db/auth-client'
import { enquiries, enquiryNotes } from '@/db/schema'
import {
  enquiryNoteInput,
  enquiryStatusInput,
} from '@/lib/enquiry-review-input'
import { requireAdmin } from '@/lib/require-admin'

export type EnquiryReviewState = { error: string | null; saved: boolean }

function refresh(id: string) {
  revalidatePath('/admin')
  revalidatePath('/admin/enquiries')
  revalidatePath(`/admin/enquiries/${id}`)
}

export async function updateEnquiryStatus(
  id: string,
  _state: EnquiryReviewState,
  formData: FormData,
): Promise<EnquiryReviewState> {
  await requireAdmin()
  if (!/^[0-9a-f-]{36}$/i.test(id))
    return { error: 'Invalid enquiry.', saved: false }
  const status = enquiryStatusInput.safeParse(formData.get('status'))
  if (!status.success) return { error: 'Choose a valid status.', saved: false }
  const [updated] = await authDb
    .update(enquiries)
    .set({ status: status.data })
    .where(eq(enquiries.id, id))
    .returning({ id: enquiries.id })
  if (!updated) return { error: 'Enquiry no longer exists.', saved: false }
  refresh(id)
  return { error: null, saved: true }
}

export async function addEnquiryNote(
  id: string,
  _state: EnquiryReviewState,
  formData: FormData,
): Promise<EnquiryReviewState> {
  const admin = await requireAdmin()
  if (!/^[0-9a-f-]{36}$/i.test(id))
    return { error: 'Invalid enquiry.', saved: false }
  const body = enquiryNoteInput.safeParse(formData.get('body'))
  if (!body.success)
    return { error: 'Write a note of up to 4,000 characters.', saved: false }
  const [enquiry] = await authDb
    .select({ id: enquiries.id })
    .from(enquiries)
    .where(eq(enquiries.id, id))
    .limit(1)
  if (!enquiry) return { error: 'Enquiry no longer exists.', saved: false }
  await authDb.insert(enquiryNotes).values({
    enquiryId: id,
    adminId: admin.id,
    body: body.data,
  })
  refresh(id)
  return { error: null, saved: true }
}
