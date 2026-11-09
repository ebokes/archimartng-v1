CREATE TYPE "public"."application_status" AS ENUM('submitted', 'under_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."enquiry_status" AS ENUM('new', 'in_progress', 'closed', 'spam');--> statement-breakpoint
CREATE TYPE "public"."publication_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('unverified', 'verified', 'rejected');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_subject" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admins_auth_subject_unique" UNIQUE("auth_subject")
);
--> statement-breakpoint
CREATE TABLE "enquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid,
	"professional_id" uuid,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"message" text NOT NULL,
	"consent_accepted" boolean NOT NULL,
	"consent_version" text NOT NULL,
	"consented_at" timestamp with time zone NOT NULL,
	"status" "enquiry_status" DEFAULT 'new' NOT NULL,
	"assigned_to_admin_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enquiries_exactly_one_target" CHECK (("enquiries"."plan_id" IS NOT NULL) <> ("enquiries"."professional_id" IS NOT NULL)),
	CONSTRAINT "enquiries_consent_required" CHECK ("enquiries"."consent_accepted" = true)
);
--> statement-breakpoint
CREATE TABLE "enquiry_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enquiry_id" uuid NOT NULL,
	"admin_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plan_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"alt_text" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_cover" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plan_images_sort_nonnegative" CHECK ("plan_images"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"description" text NOT NULL,
	"property_type" text NOT NULL,
	"bedrooms" integer,
	"bathrooms" integer,
	"floors" integer,
	"plot_area_sqm" numeric(12, 2),
	"floor_area_sqm" numeric(12, 2),
	"publication_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_by_admin_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plans_slug_unique" UNIQUE("slug"),
	CONSTRAINT "plans_bedrooms_nonnegative" CHECK ("plans"."bedrooms" >= 0),
	CONSTRAINT "plans_bathrooms_nonnegative" CHECK ("plans"."bathrooms" >= 0),
	CONSTRAINT "plans_floors_positive" CHECK ("plans"."floors" > 0),
	CONSTRAINT "plans_plot_area_positive" CHECK ("plans"."plot_area_sqm" > 0),
	CONSTRAINT "plans_floor_area_positive" CHECK ("plans"."floor_area_sqm" > 0),
	CONSTRAINT "plans_published_at_required" CHECK ("plans"."publication_status" <> 'published' OR "plans"."published_at" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "professional_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"applicant_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"business_name" text,
	"specialty" text NOT NULL,
	"city" text,
	"state" text,
	"portfolio_url" text,
	"message" text NOT NULL,
	"status" "application_status" DEFAULT 'submitted' NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by_admin_id" uuid,
	"review_notes" text,
	"professional_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "professionals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"headline" text,
	"bio" text NOT NULL,
	"specialty" text NOT NULL,
	"city" text,
	"state" text,
	"country" text,
	"contact_email" text,
	"contact_phone" text,
	"website_url" text,
	"verification_status" "verification_status" DEFAULT 'unverified' NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_by_admin_id" uuid,
	"publication_status" "publication_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_by_admin_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "professionals_slug_unique" UNIQUE("slug"),
	CONSTRAINT "professionals_published_at_required" CHECK ("professionals"."publication_status" <> 'published' OR "professionals"."published_at" IS NOT NULL),
	CONSTRAINT "professionals_verified_at_required" CHECK ("professionals"."verification_status" <> 'verified' OR "professionals"."verified_at" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_professional_id_professionals_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professionals"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_assigned_to_admin_id_admins_id_fk" FOREIGN KEY ("assigned_to_admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiry_notes" ADD CONSTRAINT "enquiry_notes_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiry_notes" ADD CONSTRAINT "enquiry_notes_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_images" ADD CONSTRAINT "plan_images_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plans" ADD CONSTRAINT "plans_created_by_admin_id_admins_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_applications" ADD CONSTRAINT "professional_applications_reviewed_by_admin_id_admins_id_fk" FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_applications" ADD CONSTRAINT "professional_applications_professional_id_professionals_id_fk" FOREIGN KEY ("professional_id") REFERENCES "public"."professionals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_verified_by_admin_id_admins_id_fk" FOREIGN KEY ("verified_by_admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_created_by_admin_id_admins_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admins_email_lower_unique" ON "admins" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "enquiries_status_created_idx" ON "enquiries" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "enquiries_plan_idx" ON "enquiries" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "enquiries_professional_idx" ON "enquiries" USING btree ("professional_id");--> statement-breakpoint
CREATE INDEX "enquiries_assigned_admin_idx" ON "enquiries" USING btree ("assigned_to_admin_id");--> statement-breakpoint
CREATE INDEX "enquiry_notes_enquiry_created_idx" ON "enquiry_notes" USING btree ("enquiry_id","created_at");--> statement-breakpoint
CREATE INDEX "enquiry_notes_admin_idx" ON "enquiry_notes" USING btree ("admin_id");--> statement-breakpoint
CREATE UNIQUE INDEX "plan_images_plan_sort_unique" ON "plan_images" USING btree ("plan_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "plan_images_one_cover_per_plan" ON "plan_images" USING btree ("plan_id") WHERE "plan_images"."is_cover" = true;--> statement-breakpoint
CREATE INDEX "plans_publication_created_idx" ON "plans" USING btree ("publication_status","created_at");--> statement-breakpoint
CREATE INDEX "plans_created_by_admin_idx" ON "plans" USING btree ("created_by_admin_id");--> statement-breakpoint
CREATE INDEX "professional_applications_status_created_idx" ON "professional_applications" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "professional_applications_reviewed_by_idx" ON "professional_applications" USING btree ("reviewed_by_admin_id");--> statement-breakpoint
CREATE UNIQUE INDEX "professional_applications_professional_unique" ON "professional_applications" USING btree ("professional_id");--> statement-breakpoint
CREATE INDEX "professionals_publication_created_idx" ON "professionals" USING btree ("publication_status","created_at");--> statement-breakpoint
CREATE INDEX "professionals_verification_idx" ON "professionals" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "professionals_verified_by_admin_idx" ON "professionals" USING btree ("verified_by_admin_id");--> statement-breakpoint
CREATE INDEX "professionals_created_by_admin_idx" ON "professionals" USING btree ("created_by_admin_id");