ALTER TABLE "budgetbuddy_backend"."attachment" DROP CONSTRAINT "attachment_owner_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."attachment" ADD CONSTRAINT "attachment_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "budgetbuddy_auth"."user"("id") ON DELETE cascade ON UPDATE no action;