import { z } from 'zod'

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email().max(254),
  password: z.string().min(12).max(128),
})

export function parseClientRegistrationForm(formData: FormData) {
  return schema.safeParse({
    name: String(formData.get('name') ?? '').slice(0, 101),
    email: String(formData.get('email') ?? '').slice(0, 255),
    password: String(formData.get('password') ?? '').slice(0, 129),
  })
}
