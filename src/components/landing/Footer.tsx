import Image from 'next/image'
import Link from 'next/link'
import logo from '@/assets/archimartng-logo-transparent.png'

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div>
          <Link href="/" aria-label="Archimart home">
            <Image
              src={logo}
              alt="ARCHIMARTng"
              width={240}
              height={80}
              className="h-12 w-auto object-contain"
            />
          </Link>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Browse architectural plans and professional profiles in Nigeria.
          </p>
          <p className="mt-5 text-xs text-muted-foreground">
            © {new Date().getFullYear()} ARCHIMARTng.
          </p>
        </div>
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-start gap-6 text-sm font-medium"
        >
          <Link href="/plans" className="hover:underline">
            Plans
          </Link>
          <Link href="/professionals" className="hover:underline">
            Professionals
          </Link>
          <Link href="/professionals/apply" className="hover:underline">
            Apply to be listed
          </Link>
        </nav>
      </div>
    </footer>
  )
}
