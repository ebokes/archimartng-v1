import type { MetadataRoute } from 'next'
import { getPublicSiteUrl } from '@/lib/site-url'

export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getPublicSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)
  if (!siteUrl) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/auth'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
