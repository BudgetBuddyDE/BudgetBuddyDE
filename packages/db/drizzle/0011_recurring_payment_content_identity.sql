ALTER TABLE "budgetbuddy_backend"."recurring_payment_execution" ADD COLUMN "content_hash" varchar(64);--> statement-breakpoint
-- Previous snapshots were compact UTF-8 JSON. PostgreSQL wraps Base64 at 76 columns; Node does not.
UPDATE "budgetbuddy_backend"."recurring_payment_execution"
SET "content" = replace(encode(convert_to("content", 'UTF8'), 'base64'), E'\n', '')
WHERE "content" IS NOT NULL;--> statement-breakpoint
-- An empty fingerprint marks legacy executions without reconstructing unknown payment details.
UPDATE "budgetbuddy_backend"."recurring_payment_execution"
SET "content_hash" = CASE WHEN "content" IS NULL THEN '' ELSE encode(sha256(convert_to("content", 'UTF8')), 'hex') END;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."recurring_payment_execution" ALTER COLUMN "content_hash" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."recurring_payment_execution" DROP CONSTRAINT "recurring_payment_execution_pkey";
--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."recurring_payment_execution" ADD CONSTRAINT "recurring_payment_execution_pkey" PRIMARY KEY("owner_id","recurring_payment_id","scheduled_for","content_hash");
