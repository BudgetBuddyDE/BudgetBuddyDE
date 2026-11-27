ALTER TABLE "budgetbuddy_backend"."budget_category" ADD COLUMN "owner_id" varchar;--> statement-breakpoint
UPDATE "budgetbuddy_backend"."budget_category" AS link SET "owner_id" = budget."owner_id"
FROM "budgetbuddy_backend"."budget" AS budget WHERE link."budget_id" = budget."budget_id";--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."budget_category" ALTER COLUMN "owner_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."budget" ADD CONSTRAINT "budget_owner_id_unique" UNIQUE("owner_id","budget_id");--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."budget_category" ADD CONSTRAINT "budget_link_owner_category_fk" FOREIGN KEY ("owner_id","category_id") REFERENCES "budgetbuddy_backend"."category"("owner_id","category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."budget_category" ADD CONSTRAINT "budget_link_owner_budget_fk" FOREIGN KEY ("owner_id","budget_id") REFERENCES "budgetbuddy_backend"."budget"("owner_id","budget_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."recurring_payment" ADD CONSTRAINT "recurring_payment_owner_category_fk" FOREIGN KEY ("owner_id","category_id") REFERENCES "budgetbuddy_backend"."category"("owner_id","category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."transaction" ADD CONSTRAINT "transaction_owner_category_fk" FOREIGN KEY ("owner_id","category_id") REFERENCES "budgetbuddy_backend"."category"("owner_id","category_id") ON DELETE cascade ON UPDATE no action;
