'use client'

import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'

// The theme class is applied before paint by the inline script in app/layout.tsx,
// so the toggle reads it from <html> instead of keeping its own copy.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
  return () => observer.disconnect()
}

const isDark = () => document.documentElement.classList.contains('dark')

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false)

  const toggle = () => {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle night mode"
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background/60 backdrop-blur transition-colors hover:bg-muted"
    >
      {dark ? (
        <Sun className="h-5 w-5 text-accent" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  )
}
