CREATE TABLE "account_rate_limits" (
	"key_hash" text PRIMARY KEY NOT NULL,
	"attempts" integer NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "account_rate_limits_attempts_positive" CHECK ("account_rate_limits"."attempts" > 0)
);
--> statement-breakpoint
CREATE INDEX "account_rate_limits_expires_at_idx" ON "account_rate_limits" USING btree ("expires_at");