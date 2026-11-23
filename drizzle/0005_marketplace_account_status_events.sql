CREATE TABLE "marketplace_account_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"actor_admin_id" uuid NOT NULL,
	"action" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "marketplace_account_events_action_valid" CHECK ("marketplace_account_events"."action" IN ('account_suspended', 'account_restored')),
	CONSTRAINT "marketplace_account_events_reason_nonblank" CHECK (length(btrim("marketplace_account_events"."reason")) > 0)
);
--> statement-breakpoint
ALTER TABLE "marketplace_account_events" ADD CONSTRAINT "marketplace_account_events_account_id_marketplace_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."marketplace_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_account_events" ADD CONSTRAINT "marketplace_account_events_actor_admin_id_admins_id_fk" FOREIGN KEY ("actor_admin_id") REFERENCES "public"."admins"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "marketplace_account_events_account_created_idx" ON "marketplace_account_events" USING btree ("account_id","created_at");--> statement-breakpoint
CREATE INDEX "marketplace_account_events_admin_created_idx" ON "marketplace_account_events" USING btree ("actor_admin_id","created_at");