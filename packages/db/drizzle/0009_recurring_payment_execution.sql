CREATE TABLE "budgetbuddy_backend"."recurring_payment_execution" (
	"owner_id" varchar NOT NULL,
	"recurring_payment_id" uuid NOT NULL,
	"scheduled_for" date NOT NULL,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"transaction_id" uuid,
	CONSTRAINT "recurring_payment_execution_pkey" PRIMARY KEY("owner_id","recurring_payment_id","scheduled_for")
);
--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."recurring_payment_execution" ADD CONSTRAINT "recurring_payment_execution_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "budgetbuddy_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."recurring_payment_execution" ADD CONSTRAINT "recurring_payment_execution_transaction_id_transaction_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "budgetbuddy_backend"."transaction"("transaction_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recurring_payment_execution_transaction_idx" ON "budgetbuddy_backend"."recurring_payment_execution" USING btree ("transaction_id");