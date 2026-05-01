CREATE TYPE "budgetbuddy_backend"."execution_plan_type" AS ENUM('daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly');
--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."recurring_payment" ADD COLUMN "execution_plan" "budgetbuddy_backend"."execution_plan_type" DEFAULT 'monthly' NOT NULL;
