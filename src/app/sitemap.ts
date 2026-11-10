import type { MetadataRoute } from 'next'
import { getPublishedPlans } from '@/lib/plans'
import { getPublishedProfessionals } from '@/lib/professionals'
import { getPublicSiteUrl } from '@/lib/site-url'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getPublicSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)
  if (!siteUrl) return []

  const [plans, professionals] = await Promise.all([
    getPublishedPlans(),
    getPublishedProfessionals(),
  ])
  return [
    { url: siteUrl },
    { url: `${siteUrl}/plans` },
    { url: `${siteUrl}/professionals` },
    { url: `${siteUrl}/professionals/apply` },
    ...plans.map((plan) => ({ url: `${siteUrl}/plans/${plan.slug}` })),
    ...professionals.map((professional) => ({
      url: `${siteUrl}/professionals/${professional.slug}`,
    })),
  ]
}
