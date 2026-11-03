import { Linkedin, Instagram, Facebook } from 'lucide-react'
import logo from '@/assets/archimartng-logo-transparent.png'
import Image from 'next/image'

const cols = [
  {
    title: 'Product',
    links: ['Marketplace', 'Professionals', 'AI Tools', 'How it works'],
  },
  { title: 'Company', links: ['About', 'Careers', 'Investors', 'Contact'] },
  { title: 'Legal', links: ['Privacy Policy', 'Terms', 'Security', 'Cookies'] },
]

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-background">
      <div className="absolute inset-0 -z-10 blueprint-grid-fine opacity-30" />
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-24 sm:px-6 lg:px-8 lg:pb-14">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Image
              src={logo}
              alt="ARCHIMARTng"
              width={240}
              height={80}
              className="h-14 w-auto object-contain"
            />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              Built for Africa's future of construction. Buy plans, hire
              verified pros and build securely.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {[Linkedin, Instagram, Facebook].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social"
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-accent hover:text-accent"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {c.title}
              </div>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="hover:text-foreground">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} ARCHIMARTng. All rights reserved.</p>
          <p>Built for Africa's future of construction.</p>
        </div>
      </div>
    </footer>
  )
}
