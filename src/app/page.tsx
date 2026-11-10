import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Marketplace } from '@/components/landing/Marketplace'
import { VerifiedProfiles } from '@/components/landing/VerifiedProfiles'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Footer } from '@/components/landing/Footer'
import { getPublishedPlans } from '@/lib/plans'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const plans = await getPublishedPlans()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <Marketplace plans={plans.slice(0, 3)} />
        <VerifiedProfiles />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  )
}
