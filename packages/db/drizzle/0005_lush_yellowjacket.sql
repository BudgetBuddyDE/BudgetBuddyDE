CREATE TYPE "budgetbuddy_backend"."category_type" AS ENUM('income', 'expense', 'both');--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."category" ADD COLUMN "type" "budgetbuddy_backend"."category_type" DEFAULT 'expense' NOT NULL;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."category" ADD COLUMN "color" varchar(7) DEFAULT '#64748b' NOT NULL;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."category" ADD COLUMN "icon" varchar(32) DEFAULT 'circle' NOT NULL;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."category" ADD COLUMN "budget_target" double precision;