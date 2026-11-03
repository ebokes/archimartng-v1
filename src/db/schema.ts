import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const publicationStatus = pgEnum('publication_status', [
  'draft',
  'published',
  'archived',
])
export const verificationStatus = pgEnum('verification_status', [
  'unverified',
  'verified',
  'rejected',
])
export const applicationStatus = pgEnum('application_status', [
  'submitted',
  'under_review',
  'approved',
  'rejected',
])
export const enquiryStatus = pgEnum('enquiry_status', [
  'new',
  'in_progress',
  'closed',
  'spam',
])

const timestamps = () => ({
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const admins = pgTable(
  'admins',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    authSubject: text('auth_subject').notNull().unique(),
    email: text('email').notNull(),
    name: text('name').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex('admins_email_lower_unique').on(sql`lower(${table.email})`),
  ],
)

export const plans = pgTable(
  'plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    summary: text('summary'),
    description: text('description').notNull(),
    propertyType: text('property_type').notNull(),
    bedrooms: integer('bedrooms'),
    bathrooms: integer('bathrooms'),
    floors: integer('floors'),
    plotAreaSqm: numeric('plot_area_sqm', { precision: 12, scale: 2 }),
    floorAreaSqm: numeric('floor_area_sqm', { precision: 12, scale: 2 }),
    publicationStatus: publicationStatus('publication_status')
      .default('draft')
      .notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdByAdminId: uuid('created_by_admin_id').references(() => admins.id, {
      onDelete: 'set null',
    }),
    ...timestamps(),
  },
  (table) => [
    index('plans_publication_created_idx').on(
      table.publicationStatus,
      table.createdAt,
    ),
    index('plans_created_by_admin_idx').on(table.createdByAdminId),
    check('plans_bedrooms_nonnegative', sql`${table.bedrooms} >= 0`),
    check('plans_bathrooms_nonnegative', sql`${table.bathrooms} >= 0`),
    check('plans_floors_positive', sql`${table.floors} > 0`),
    check('plans_plot_area_positive', sql`${table.plotAreaSqm} > 0`),
    check('plans_floor_area_positive', sql`${table.floorAreaSqm} > 0`),
    check(
      'plans_published_at_required',
      sql`${table.publicationStatus} <> 'published' OR ${table.publishedAt} IS NOT NULL`,
    ),
  ],
)

export const planImages = pgTable(
  'plan_images',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id, { onDelete: 'cascade' }),
    imageUrl: text('image_url').notNull(),
    altText: text('alt_text').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    isCover: boolean('is_cover').default(false).notNull(),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex('plan_images_plan_sort_unique').on(
      table.planId,
      table.sortOrder,
    ),
    uniqueIndex('plan_images_one_cover_per_plan')
      .on(table.planId)
      .where(sql`${table.isCover} = true`),
    check('plan_images_sort_nonnegative', sql`${table.sortOrder} >= 0`),
  ],
)

export const professionals = pgTable(
  'professionals',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull().unique(),
    displayName: text('display_name').notNull(),
    headline: text('headline'),
    bio: text('bio').notNull(),
    specialty: text('specialty').notNull(),
    city: text('city'),
    state: text('state'),
    country: text('country'),
    contactEmail: text('contact_email'),
    contactPhone: text('contact_phone'),
    websiteUrl: text('website_url'),
    verificationStatus: verificationStatus('verification_status')
      .default('unverified')
      .notNull(),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    verifiedByAdminId: uuid('verified_by_admin_id').references(
      () => admins.id,
      { onDelete: 'set null' },
    ),
    publicationStatus: publicationStatus('publication_status')
      .default('draft')
      .notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdByAdminId: uuid('created_by_admin_id').references(() => admins.id, {
      onDelete: 'set null',
    }),
    ...timestamps(),
  },
  (table) => [
    index('professionals_publication_created_idx').on(
      table.publicationStatus,
      table.createdAt,
    ),
    index('professionals_verification_idx').on(table.verificationStatus),
    index('professionals_verified_by_admin_idx').on(table.verifiedByAdminId),
    index('professionals_created_by_admin_idx').on(table.createdByAdminId),
    check(
      'professionals_published_at_required',
      sql`${table.publicationStatus} <> 'published' OR ${table.publishedAt} IS NOT NULL`,
    ),
    check(
      'professionals_verified_at_required',
      sql`${table.verificationStatus} <> 'verified' OR ${table.verifiedAt} IS NOT NULL`,
    ),
  ],
)

export const professionalApplications = pgTable(
  'professional_applications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    applicantName: text('applicant_name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    businessName: text('business_name'),
    specialty: text('specialty').notNull(),
    city: text('city'),
    state: text('state'),
    portfolioUrl: text('portfolio_url'),
    message: text('message').notNull(),
    status: applicationStatus('status').default('submitted').notNull(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewedByAdminId: uuid('reviewed_by_admin_id').references(
      () => admins.id,
      { onDelete: 'set null' },
    ),
    reviewNotes: text('review_notes'),
    professionalId: uuid('professional_id').references(() => professionals.id, {
      onDelete: 'set null',
    }),
    ...timestamps(),
  },
  (table) => [
    index('professional_applications_status_created_idx').on(
      table.status,
      table.createdAt,
    ),
    index('professional_applications_reviewed_by_idx').on(
      table.reviewedByAdminId,
    ),
    uniqueIndex('professional_applications_professional_unique').on(
      table.professionalId,
    ),
  ],
)

export const enquiries = pgTable(
  'enquiries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    planId: uuid('plan_id').references(() => plans.id, {
      onDelete: 'restrict',
    }),
    professionalId: uuid('professional_id').references(() => professionals.id, {
      onDelete: 'restrict',
    }),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    message: text('message').notNull(),
    consentAccepted: boolean('consent_accepted').notNull(),
    consentVersion: text('consent_version').notNull(),
    consentedAt: timestamp('consented_at', { withTimezone: true }).notNull(),
    status: enquiryStatus('status').default('new').notNull(),
    assignedToAdminId: uuid('assigned_to_admin_id').references(
      () => admins.id,
      { onDelete: 'set null' },
    ),
    ...timestamps(),
  },
  (table) => [
    index('enquiries_status_created_idx').on(table.status, table.createdAt),
    index('enquiries_plan_idx').on(table.planId),
    index('enquiries_professional_idx').on(table.professionalId),
    index('enquiries_assigned_admin_idx').on(table.assignedToAdminId),
    check(
      'enquiries_exactly_one_target',
      sql`(${table.planId} IS NOT NULL) <> (${table.professionalId} IS NOT NULL)`,
    ),
    check('enquiries_consent_required', sql`${table.consentAccepted} = true`),
  ],
)

export const enquiryNotes = pgTable(
  'enquiry_notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    enquiryId: uuid('enquiry_id')
      .notNull()
      .references(() => enquiries.id, { onDelete: 'cascade' }),
    adminId: uuid('admin_id')
      .notNull()
      .references(() => admins.id, { onDelete: 'restrict' }),
    body: text('body').notNull(),
    ...timestamps(),
  },
  (table) => [
    index('enquiry_notes_enquiry_created_idx').on(
      table.enquiryId,
      table.createdAt,
    ),
    index('enquiry_notes_admin_idx').on(table.adminId),
  ],
)
