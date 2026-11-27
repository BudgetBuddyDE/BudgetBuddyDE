-- Fail before changing constraints if historical assignments require manual reconciliation.
-- Do not silently delete or relink financial records.
LOCK TABLE "budgetbuddy_backend"."payment_method", "budgetbuddy_backend"."transaction", "budgetbuddy_backend"."recurring_payment" IN SHARE ROW EXCLUSIVE MODE;--> statement-breakpoint
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM "budgetbuddy_backend"."transaction" t JOIN "budgetbuddy_backend"."payment_method" p USING (payment_method_id) WHERE t.owner_id <> p.owner_id)
     OR EXISTS (SELECT 1 FROM "budgetbuddy_backend"."recurring_payment" r JOIN "budgetbuddy_backend"."payment_method" p USING (payment_method_id) WHERE r.owner_id <> p.owner_id) THEN
    RAISE EXCEPTION 'Reconcile historical payment method ownership before applying this migration';
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."payment_method" ADD CONSTRAINT "payment_method_owner_id_unique" UNIQUE("owner_id","payment_method_id");--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."recurring_payment" ADD CONSTRAINT "recurring_payment_owner_payment_method_fk" FOREIGN KEY ("owner_id","payment_method_id") REFERENCES "budgetbuddy_backend"."payment_method"("owner_id","payment_method_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."transaction" ADD CONSTRAINT "transaction_owner_payment_method_fk" FOREIGN KEY ("owner_id","payment_method_id") REFERENCES "budgetbuddy_backend"."payment_method"("owner_id","payment_method_id") ON DELETE cascade ON UPDATE no action;
