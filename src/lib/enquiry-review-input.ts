import { z } from 'zod'

export const enquiryStatusInput = z.enum([
  'new',
  'in_progress',
  'closed',
  'spam',
])

export const enquiryNoteInput = z.string().trim().min(1).max(4000)
