CREATE TYPE "budgetbuddy_backend"."payment_method_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "budgetbuddy_backend"."payment_method_type" AS ENUM('cash', 'bank', 'card', 'wallet', 'other');--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."payment_method" ADD COLUMN "type" "budgetbuddy_backend"."payment_method_type" DEFAULT 'other' NOT NULL;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."payment_method" ADD COLUMN "status" "budgetbuddy_backend"."payment_method_status" DEFAULT 'active' NOT NULL;