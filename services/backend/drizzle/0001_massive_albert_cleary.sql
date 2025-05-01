ALTER TABLE "newsletter_subscription" DROP CONSTRAINT "newsletter_subscription_ownerId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "newsletter_subscription" DROP CONSTRAINT "newsletter_subscription_newsletter_newsletter_newsletter_fk";
--> statement-breakpoint
ALTER TABLE "category" DROP CONSTRAINT "category_ownerId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "payment_method" DROP CONSTRAINT "payment_method_ownerId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "translation" DROP CONSTRAINT "translation_ownerId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "translation" DROP CONSTRAINT "translation_categoryId_category_id_fk";
--> statement-breakpoint
ALTER TABLE "translation" DROP CONSTRAINT "translation_paymentMethodId_payment_method_id_fk";
--> statement-breakpoint
ALTER TABLE "subscription" DROP CONSTRAINT "subscription_ownerId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "subscription" DROP CONSTRAINT "subscription_categoryId_category_id_fk";
--> statement-breakpoint
ALTER TABLE "subscription" DROP CONSTRAINT "subscription_paymentMethodId_payment_method_id_fk";
--> statement-breakpoint
ALTER TABLE "stock_position" DROP CONSTRAINT "stock_position_ownerId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "stock_position" DROP CONSTRAINT "stock_position_exchange_stock_exchange_symbol_fk";
--> statement-breakpoint
ALTER TABLE "stock_watchlist" DROP CONSTRAINT "stock_watchlist_ownerId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "stock_watchlist" DROP CONSTRAINT "stock_watchlist_exchange_stock_exchange_symbol_fk";
--> statement-breakpoint
ALTER TABLE "budget" DROP CONSTRAINT "budget_ownerId_user_id_fk";
--> statement-breakpoint
ALTER TABLE "budget_categorie" DROP CONSTRAINT "budget_categorie_budgetId_budget_id_fk";
--> statement-breakpoint
ALTER TABLE "budget_categorie" DROP CONSTRAINT "budget_categorie_categoryId_category_id_fk";
--> statement-breakpoint
ALTER TABLE "newsletter_subscription" ADD CONSTRAINT "newsletter_subscription_ownerId_user_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_subscription" ADD CONSTRAINT "newsletter_subscription_newsletter_newsletter_newsletter_fk" FOREIGN KEY ("newsletter") REFERENCES "public"."newsletter"("newsletter") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_ownerId_user_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_method" ADD CONSTRAINT "payment_method_ownerId_user_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translation" ADD CONSTRAINT "translation_ownerId_user_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translation" ADD CONSTRAINT "translation_categoryId_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translation" ADD CONSTRAINT "translation_paymentMethodId_payment_method_id_fk" FOREIGN KEY ("paymentMethodId") REFERENCES "public"."payment_method"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_ownerId_user_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_categoryId_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_paymentMethodId_payment_method_id_fk" FOREIGN KEY ("paymentMethodId") REFERENCES "public"."payment_method"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_position" ADD CONSTRAINT "stock_position_ownerId_user_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_position" ADD CONSTRAINT "stock_position_exchange_stock_exchange_symbol_fk" FOREIGN KEY ("exchange") REFERENCES "public"."stock_exchange"("symbol") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_watchlist" ADD CONSTRAINT "stock_watchlist_ownerId_user_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_watchlist" ADD CONSTRAINT "stock_watchlist_exchange_stock_exchange_symbol_fk" FOREIGN KEY ("exchange") REFERENCES "public"."stock_exchange"("symbol") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget" ADD CONSTRAINT "budget_ownerId_user_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_categorie" ADD CONSTRAINT "budget_categorie_budgetId_budget_id_fk" FOREIGN KEY ("budgetId") REFERENCES "public"."budget"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_categorie" ADD CONSTRAINT "budget_categorie_categoryId_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;