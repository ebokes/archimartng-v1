CREATE TYPE "public"."marketplace_account_status" AS ENUM('active', 'suspended', 'closed');--> statement-breakpoint
CREATE TYPE "public"."marketplace_role" AS ENUM('client', 'professional');--> statement-breakpoint
CREATE TYPE "public"."professional_account_event_type" AS ENUM('onboarding_started', 'approval_granted', 'approval_rejected', 'review_reopened', 'account_suspended', 'account_restored', 'account_closed', 'profile_claim_approved');--> statement-breakpoint
CREATE TYPE "public"."professional_approval_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "marketplace_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_subject" text NOT NULL,
	"role" "marketplace_role" NOT NULL,
	"status" "marketplace_account_status" DEFAULT 'active' NOT NULL,
	"suspended_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "marketplace_accounts_auth_subject_unique" UNIQUE("auth_subject"),
	CONSTRAINT "marketplace_accounts_suspended_at_required" CHECK ("marketplace_accounts"."status" <> 'suspended' OR "marketplace_accounts"."suspended_at" IS NOT NULL),
	CONSTRAINT "marketplace_accounts_closed_at_required" CHECK ("marketplace_accounts"."status" <> 'closed' OR "marketplace_accounts"."closed_at" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "professional_account_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"actor_admin_id" uuid,
	"event_type" "professional_account_event_type" NOT NULL,
	"reason" text,
	"profile_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "professional_account_events_admin_reason_required" CHECK ("professional_account_events"."event_type" = 'onboarding_started' OR ("professional_account_events"."actor_admin_id" IS NOT NULL AND "professional_account_events"."reason" IS NOT NULL AND length(btrim("professional_account_events"."reason")) > 0)),
	CONSTRAINT "professional_account_events_claim_profile_required" CHECK (("professional_account_events"."event_type" = 'profile_claim_approved' AND "professional_account_events"."profile_id" IS NOT NULL) OR ("professional_account_events"."event_type" <> 'profile_claim_approved' AND "professional_account_events"."profile_id" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "professional_accounts" (
	"account_id" uuid PRIMARY KEY NOT NULL,
	"approval_status" "professional_approval_status" DEFAULT 'pending' NOT NULL,
	"profile_id" uuid,
	"application_id" uuid,
	"reviewed_at" timestamp with time zone,
	"reviewed_by_admin_id" uuid,
	"profile_claimed_at" timestamp with time zone,
	"profile_claim_approved_by_admin_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "professional_accounts_review_attribution_required" CHECK ("professional_accounts"."approval_status" = 'pending' OR ("professional_accounts"."reviewed_at" IS NOT NULL AND "professional_accounts"."reviewed_by_admin_id" IS NOT NULL)),
	CONSTRAINT "professional_accounts_claim_requires_approval" CHECK ("professional_accounts"."profile_id" IS NULL OR "professional_accounts"."approval_status" = 'approved'),
	CONSTRAINT "professional_accounts_claim_attribution_required" CHECK (("professional_accounts"."profile_id" IS NULL AND "professional_accounts"."profile_claimed_at" IS NULL AND "professional_accounts"."profile_claim_approved_by_admin_id" IS NULL) OR ("professional_accounts"."profile_id" IS NOT NULL AND "professional_accounts"."profile_claimed_at" IS NOT NULL AND "professional_accounts"."profile_claim_approved_by_admin_id" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "marketplace_accounts" ADD CONSTRAINT "marketplace_accounts_auth_subject_user_id_fk" FOREIGN KEY ("auth_subject") REFERENCES "auth"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_account_events" ADD CONSTRAINT "professional_account_events_account_id_professional_accounts_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."professional_accounts"("account_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_account_events" ADD CONSTRAINT "professional_account_events_actor_admin_id_admins_id_fk" FOREIGN KEY ("actor_admin_id") REFERENCES "public"."admins"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_account_events" ADD CONSTRAINT "professional_account_events_profile_id_professionals_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."professionals"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_accounts" ADD CONSTRAINT "professional_accounts_account_id_marketplace_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."marketplace_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_accounts" ADD CONSTRAINT "professional_accounts_profile_id_professionals_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."professionals"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_accounts" ADD CONSTRAINT "professional_accounts_application_id_professional_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."professional_applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_accounts" ADD CONSTRAINT "professional_accounts_reviewed_by_admin_id_admins_id_fk" FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "public"."admins"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professional_accounts" ADD CONSTRAINT "professional_accounts_profile_claim_approved_by_admin_id_admins_id_fk" FOREIGN KEY ("profile_claim_approved_by_admin_id") REFERENCES "public"."admins"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "marketplace_accounts_role_status_idx" ON "marketplace_accounts" USING btree ("role","status");--> statement-breakpoint
CREATE INDEX "professional_account_events_account_created_idx" ON "professional_account_events" USING btree ("account_id","created_at");--> statement-breakpoint
CREATE INDEX "professional_account_events_admin_created_idx" ON "professional_account_events" USING btree ("actor_admin_id","created_at");--> statement-breakpoint
CREATE INDEX "professional_account_events_profile_idx" ON "professional_account_events" USING btree ("profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "professional_accounts_profile_unique" ON "professional_accounts" USING btree ("profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "professional_accounts_application_unique" ON "professional_accounts" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "professional_accounts_approval_created_idx" ON "professional_accounts" USING btree ("approval_status","created_at");--> statement-breakpoint
CREATE INDEX "professional_accounts_reviewed_by_idx" ON "professional_accounts" USING btree ("reviewed_by_admin_id");--> statement-breakpoint
CREATE INDEX "professional_accounts_claim_admin_idx" ON "professional_accounts" USING btree ("profile_claim_approved_by_admin_id");