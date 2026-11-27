ALTER TABLE "budgetbuddy_backend"."category" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."category" ADD CONSTRAINT "category_owner_id_unique" UNIQUE("owner_id","category_id");--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."category" ADD CONSTRAINT "category_owner_parent_fk" FOREIGN KEY ("owner_id","parent_id") REFERENCES "budgetbuddy_backend"."category"("owner_id","category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "category_owner_parent_idx" ON "budgetbuddy_backend"."category" USING btree ("owner_id","parent_id");--> statement-breakpoint
CREATE FUNCTION budgetbuddy_backend.check_category_hierarchy() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  -- Serialize changes to this owner's hierarchy, including the merge source check.
  PERFORM pg_advisory_xact_lock(hashtextextended('category-hierarchy:' || NEW.owner_id, 0));
  IF NEW.parent_id IS NOT NULL AND (
    NEW.parent_id = NEW.category_id OR NOT EXISTS (
      SELECT 1 FROM budgetbuddy_backend.category p
      WHERE p.owner_id = NEW.owner_id AND p.category_id = NEW.parent_id AND p.parent_id IS NULL
    ) OR EXISTS (
      SELECT 1 FROM budgetbuddy_backend.category c
      WHERE c.owner_id = NEW.owner_id AND c.parent_id = NEW.category_id
    )
  ) THEN
    RAISE EXCEPTION 'Invalid category hierarchy' USING ERRCODE = '23514', CONSTRAINT = 'category_two_levels';
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER category_check_hierarchy
BEFORE INSERT OR UPDATE OF parent_id ON budgetbuddy_backend.category
FOR EACH ROW EXECUTE FUNCTION budgetbuddy_backend.check_category_hierarchy();--> statement-breakpoint
CREATE VIEW "budgetbuddy_backend"."transaction_child_history_view" AS (select "month", "year", "date", "transaction_history_view"."owner_id", "budgetbuddy_backend"."category"."category_id", "income", "expenses", "balance" from "budgetbuddy_backend"."transaction_history_view" inner join "budgetbuddy_backend"."category" on ("transaction_history_view"."category_id" = "budgetbuddy_backend"."category"."category_id" and "transaction_history_view"."owner_id" = "budgetbuddy_backend"."category"."owner_id") where "budgetbuddy_backend"."category"."parent_id" is not null);--> statement-breakpoint
CREATE VIEW "budgetbuddy_backend"."transaction_root_history_view" AS (select "month", "year", "date", "transaction_history_view"."owner_id", coalesce("budgetbuddy_backend"."category"."parent_id", "budgetbuddy_backend"."category"."category_id") as "category_id", sum("income") as "income", sum("expenses") as "expenses", sum("balance") as "balance" from "budgetbuddy_backend"."transaction_history_view" inner join "budgetbuddy_backend"."category" on ("transaction_history_view"."category_id" = "budgetbuddy_backend"."category"."category_id" and "transaction_history_view"."owner_id" = "budgetbuddy_backend"."category"."owner_id") group by "month", "year", "date", "transaction_history_view"."owner_id", coalesce("budgetbuddy_backend"."category"."parent_id", "budgetbuddy_backend"."category"."category_id"));
