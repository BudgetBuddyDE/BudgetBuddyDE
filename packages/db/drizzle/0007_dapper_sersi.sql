CREATE TYPE "budgetbuddy_backend"."recurring_interval" AS ENUM('monthly', 'quarterly', 'yearly');--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."recurring_payment" ADD COLUMN "interval" "budgetbuddy_backend"."recurring_interval" DEFAULT 'monthly' NOT NULL;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."recurring_payment" ADD COLUMN "next_execution_at" timestamp;--> statement-breakpoint
UPDATE "budgetbuddy_backend"."recurring_payment"
SET "next_execution_at" = date_trunc('month', current_date + interval '1 month')
  + (LEAST("execute_at", EXTRACT(day FROM date_trunc('month', current_date + interval '2 months') - interval '1 day')) - 1) * interval '1 day';--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."recurring_payment" ALTER COLUMN "next_execution_at" SET NOT NULL;