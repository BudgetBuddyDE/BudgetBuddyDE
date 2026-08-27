CREATE TYPE "budgetbuddy_backend"."execution_plan_type" AS ENUM('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly');--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."recurring_payment" ADD COLUMN "execution_plan" "budgetbuddy_backend"."execution_plan_type" DEFAULT 'monthly' NOT NULL;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."recurring_payment" ADD COLUMN "starts_on" date;--> statement-breakpoint
-- Keep the legacy preferred day as the monthly anchor. In a month that does not
-- contain that day, the preceding month is used so future occurrences still
-- clamp temporarily and then return to the original day.
UPDATE "budgetbuddy_backend"."recurring_payment"
SET "starts_on" = CASE
  WHEN GREATEST(1, LEAST("execute_at", 31)) <=
    EXTRACT(DAY FROM date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::integer
  THEN
    date_trunc('month', CURRENT_DATE)::date
      + GREATEST(1, LEAST("execute_at", 31))
      - 1
  ELSE
    (date_trunc('month', CURRENT_DATE) - interval '1 month')::date
      + GREATEST(1, LEAST("execute_at", 31))
      - 1
END;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."recurring_payment" ALTER COLUMN "starts_on" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "recurring_payment_recurrence_idx" ON "budgetbuddy_backend"."recurring_payment" USING btree ("owner_id","paused","starts_on");--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."recurring_payment" DROP COLUMN "execute_at";
