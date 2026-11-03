'use client'

import { useState, type FormEvent } from 'react'
import { CheckCircle2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

const userTypes = [
  'Builder',
  'Homeowner',
  'Architect',
  'Engineer',
  'Investor',
  'Construction Professional',
]

export function Waitlist() {
  const [submitted, setSubmitted] = useState(false)
  const [userType, setUserType] = useState<string>('')

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!userType) {
      toast.error('Please select a user type.')
      return
    }
    setSubmitted(true)
    toast.success("You're on the list! We'll be in touch.")
  }

  return (
    <section id="waitlist" className="relative overflow-hidden py-20 lg:py-28">
      <div className="absolute inset-0 -z-10 blueprint-grid blueprint-mask opacity-40" />
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div
          className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 sm:p-12"
          style={{ boxShadow: 'var(--shadow-luxury)' }}
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
          <div className="relative text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
              Early access
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Join the future of smarter construction in Africa
            </h2>
            <p className="mt-3 text-muted-foreground">
              Be among the first builders, architects and homeowners using
              AI-powered construction tools.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-4 w-4 text-accent" />
              Join architects, builders and future homeowners shaping smarter
              construction.
            </div>
          </div>

          {submitted ? (
            <div className="relative mt-10 flex flex-col items-center gap-3 rounded-2xl bg-muted/60 p-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-accent" />
              <h3 className="text-xl font-semibold text-foreground">
                You're on the list
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                We'll email you as soon as your access is ready.
              </p>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="relative mt-10 grid gap-5 sm:grid-cols-2"
            >
              <div className="sm:col-span-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  required
                  placeholder="Ada Okafor"
                  className="mt-1.5 h-11"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="you@email.com"
                  className="mt-1.5 h-11"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  placeholder="+234 800 000 0000"
                  className="mt-1.5 h-11"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="user-type">I am a…</Label>
                <Select value={userType} onValueChange={setUserType}>
                  <SelectTrigger id="user-type" className="mt-1.5 h-11">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {userTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full bg-accent text-base font-semibold text-accent-foreground hover:bg-accent/90"
                  style={{ boxShadow: 'var(--shadow-gold)' }}
                >
                  Get Early Access
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  By joining you agree to our terms. No spam — ever.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
