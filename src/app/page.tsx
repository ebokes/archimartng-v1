import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { AIFeatures } from '@/components/landing/AIFeatures'
import { AfricanConstruction } from '@/components/landing/AfricanConstruction'
import { WhyArchimartng } from '@/components/landing/WhyArchimartng'
import { Marketplace } from '@/components/landing/Marketplace'
import { Professionals } from '@/components/landing/Professionals'
import { VerifiedProfiles } from '@/components/landing/VerifiedProfiles'
import { SmartPricing } from '@/components/landing/SmartPricing'
import { ArchiAI } from '@/components/landing/ArchiAI'
import { Diaspora } from '@/components/landing/Diaspora'
import { BuildTrack } from '@/components/landing/BuildTrack'
import { Archive } from '@/components/landing/Archive'
import { Trust } from '@/components/landing/Trust'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { WhyNow } from '@/components/landing/WhyNow'
import { Waitlist } from '@/components/landing/Waitlist'
import { Footer } from '@/components/landing/Footer'
import { WhatsAppFloat } from '@/components/landing/WhatsAppFloat'
import { Toaster } from '@/components/ui/sonner'

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <AfricanConstruction />
        <WhyArchimartng />
        <AIFeatures />
        <ArchiAI />
        <SmartPricing />
        <Marketplace />
        <Professionals />
        <VerifiedProfiles />
        <Diaspora />
        <BuildTrack />
        <Archive />
        <Trust />
        <HowItWorks />
        <WhyNow />
        <Waitlist />
      </main>
      <Footer />
      <WhatsAppFloat />
      <Toaster />
    </div>
  )
}
