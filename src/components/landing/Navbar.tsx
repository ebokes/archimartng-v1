'use client'

import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/landing/ThemeToggle'
import logo from '@/assets/archimartng-logo-transparent.png'
import Image from 'next/image'

const links = [
  { href: '#marketplace', label: 'Marketplace' },
  { href: '#professionals', label: 'Professionals' },
  { href: '#archi-ai', label: 'ARCHI AI' },
  { href: '#pricing', label: 'Pricing AI' },
  { href: '#diaspora', label: 'Diaspora' },
  { href: '#buildtrack', label: 'BUILDTRACK™' },
  { href: '#archive', label: 'ARCHIVE™' },
  { href: '#how', label: 'How It Works' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/80 backdrop-blur-lg border-b border-border'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <a href="#" className="flex items-center" aria-label="ARCHIMARTng">
          <Image
            src={logo}
            alt="ARCHIMARTng"
            width={240}
            height={80}
            priority
            className="h-16 w-auto object-contain drop-shadow-lg"
          />
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />
          <Button
            asChild
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            style={{ boxShadow: 'var(--shadow-gold)' }}
          >
            <a href="#waitlist">Get Early Access</a>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            onClick={() => setOpen((s) => !s)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <div className="space-y-1 px-4 py-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
              >
                {l.label}
              </a>
            ))}
            <Button
              asChild
              className="mt-2 w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            >
              <a href="#waitlist" onClick={() => setOpen(false)}>
                Get Early Access
              </a>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
