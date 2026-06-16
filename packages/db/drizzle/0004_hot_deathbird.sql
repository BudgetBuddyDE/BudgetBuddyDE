ALTER TABLE "budgetbuddy_auth"."apikey" RENAME COLUMN "user_id" TO "reference_id";--> statement-breakpoint
ALTER TABLE "budgetbuddy_auth"."apikey" DROP CONSTRAINT "apikey_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "budgetbuddy_auth"."apikey" ALTER COLUMN "last_refill_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "budgetbuddy_auth"."apikey" ALTER COLUMN "enabled" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "budgetbuddy_auth"."apikey" ALTER COLUMN "rate_limit_enabled" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "budgetbuddy_auth"."apikey" ALTER COLUMN "rate_limit_time_window" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "budgetbuddy_auth"."apikey" ALTER COLUMN "rate_limit_max" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "budgetbuddy_auth"."apikey" ALTER COLUMN "request_count" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "budgetbuddy_auth"."apikey" ALTER COLUMN "last_request" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "budgetbuddy_auth"."apikey" ALTER COLUMN "expires_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "budgetbuddy_auth"."apikey" ALTER COLUMN "created_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "budgetbuddy_auth"."apikey" ALTER COLUMN "updated_at" SET DATA TYPE timestamp (6) with time zone;--> statement-breakpoint
ALTER TABLE "budgetbuddy_auth"."apikey" ADD COLUMN "config_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "budgetbuddy_auth"."apikey" ADD CONSTRAINT "apikey_id_unique" UNIQUE("id");