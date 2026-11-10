type ApplicationDetails = {
  id: string
  applicantName: string
  email: string
  phone: string | null
  specialty: string
  city: string | null
  state: string | null
  portfolioUrl: string | null
  proposedBio: string | null
}

export function prefillProfessionalFromApplication(
  application: ApplicationDetails,
) {
  const nameSlug = application.applicantName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return {
    displayName: application.applicantName,
    slug: nameSlug || `professional-${application.id.slice(0, 8)}`,
    specialty: application.specialty,
    city: application.city,
    state: application.state,
    country: 'Nigeria',
    contactEmail: application.email,
    contactPhone: application.phone,
    websiteUrl: application.portfolioUrl,
    bio: application.proposedBio ?? '',
    publicationStatus: 'draft' as const,
    verificationStatus: 'unverified' as const,
  }
}
