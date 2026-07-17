ALTER TABLE "budgetbuddy_backend"."budget" ADD COLUMN "period" varchar(7);--> statement-breakpoint
UPDATE "budgetbuddy_backend"."budget" SET "period" = to_char(current_date, 'YYYY-MM');--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."budget" ALTER COLUMN "period" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."budget" ADD COLUMN "warning_threshold" integer DEFAULT 80 NOT NULL;