-- 0015 validates its foreign keys on installation. This guard also covers
-- installations already at 0015, including constraints installed NOT VALID.
LOCK TABLE "budgetbuddy_backend"."category", "budgetbuddy_backend"."transaction", "budgetbuddy_backend"."recurring_payment", "budgetbuddy_backend"."budget", "budgetbuddy_backend"."budget_category" IN SHARE ROW EXCLUSIVE MODE;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM "budgetbuddy_backend"."transaction" t
    LEFT JOIN "budgetbuddy_backend"."category" c ON c.category_id = t.category_id AND c.owner_id = t.owner_id
    WHERE t.category_id IS NOT NULL AND c.category_id IS NULL
  ) OR EXISTS (
    SELECT 1 FROM "budgetbuddy_backend"."recurring_payment" r
    LEFT JOIN "budgetbuddy_backend"."category" c ON c.category_id = r.category_id AND c.owner_id = r.owner_id
    WHERE r.category_id IS NOT NULL AND c.category_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Historical category assignments require reconciliation'
      USING HINT = 'Keep the app stopped. Run packages/db/scripts/preflight-owner-integrity.sql and follow packages/db/README.md.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM "budgetbuddy_backend"."budget_category" l
    LEFT JOIN "budgetbuddy_backend"."budget" b ON b.budget_id = l.budget_id AND b.owner_id = l.owner_id
    LEFT JOIN "budgetbuddy_backend"."category" c ON c.category_id = l.category_id AND c.owner_id = l.owner_id
    WHERE b.budget_id IS NULL OR c.category_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Historical budget category links require reconciliation'
      USING HINT = 'Keep the app stopped. Run packages/db/scripts/preflight-owner-integrity.sql and follow packages/db/README.md.';
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."transaction" VALIDATE CONSTRAINT "transaction_owner_category_fk";--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."recurring_payment" VALIDATE CONSTRAINT "recurring_payment_owner_category_fk";--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."budget_category" VALIDATE CONSTRAINT "budget_link_owner_category_fk";--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."budget_category" VALIDATE CONSTRAINT "budget_link_owner_budget_fk";--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."budget_category" VALIDATE CONSTRAINT "budget_category_budget_id_budget_budget_id_fk";--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."budget_category" VALIDATE CONSTRAINT "budget_category_category_id_category_category_id_fk";
