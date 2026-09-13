CREATE INDEX "attachment_owner_idx" ON "budgetbuddy_backend"."attachment" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "budget_owner_updated_at_idx" ON "budgetbuddy_backend"."budget" USING btree ("owner_id","updated_at");--> statement-breakpoint
CREATE INDEX "category_owner_updated_at_idx" ON "budgetbuddy_backend"."category" USING btree ("owner_id","updated_at");--> statement-breakpoint
CREATE INDEX "payment_method_owner_updated_at_idx" ON "budgetbuddy_backend"."payment_method" USING btree ("owner_id","updated_at");--> statement-breakpoint
CREATE INDEX "recurring_payment_job_idx" ON "budgetbuddy_backend"."recurring_payment" USING btree ("paused","starts_on");--> statement-breakpoint
CREATE INDEX "transaction_attachment_attachment_id_idx" ON "budgetbuddy_backend"."transaction_attachment" USING btree ("attachment_id");--> statement-breakpoint
CREATE INDEX "transaction_owner_processed_at_idx" ON "budgetbuddy_backend"."transaction" USING btree ("owner_id","processed_at");--> statement-breakpoint
CREATE INDEX "transaction_owner_category_idx" ON "budgetbuddy_backend"."transaction" USING btree ("owner_id","category_id");--> statement-breakpoint
CREATE INDEX "transaction_owner_payment_method_idx" ON "budgetbuddy_backend"."transaction" USING btree ("owner_id","payment_method_id");