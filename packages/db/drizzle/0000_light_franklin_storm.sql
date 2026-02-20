CREATE SCHEMA "budgetbuddy_auth";
--> statement-breakpoint
CREATE SCHEMA "budgetbuddy_backend";
--> statement-breakpoint
CREATE TYPE "budgetbuddy_backend"."budget_type" AS ENUM('i', 'e');--> statement-breakpoint
CREATE TABLE "budgetbuddy_auth"."account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgetbuddy_auth"."session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "budgetbuddy_auth"."user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "budgetbuddy_auth"."verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgetbuddy_backend"."budget_category" (
	"budget_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "budget_category_pkey" PRIMARY KEY("budget_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "budgetbuddy_backend"."budget" (
	"budget_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar NOT NULL,
	"type" "budgetbuddy_backend"."budget_type" NOT NULL,
	"name" varchar(32) NOT NULL,
	"budget" double precision NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgetbuddy_backend"."category" (
	"category_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar NOT NULL,
	"name" varchar(40) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgetbuddy_backend"."payment_method" (
	"payment_method_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar NOT NULL,
	"name" varchar(40) NOT NULL,
	"provider" varchar(32) NOT NULL,
	"address" varchar(32) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgetbuddy_backend"."recurring_payment" (
	"recurring_payment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar NOT NULL,
	"category_id" uuid NOT NULL,
	"payment_method_id" uuid NOT NULL,
	"execute_at" integer NOT NULL,
	"paused" boolean DEFAULT false NOT NULL,
	"receiver" varchar(100) NOT NULL,
	"transfer_amount" double precision NOT NULL,
	"information" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgetbuddy_backend"."transaction" (
	"transaction_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" varchar NOT NULL,
	"category_id" uuid NOT NULL,
	"payment_method_id" uuid NOT NULL,
	"processed_at" timestamp NOT NULL,
	"receiver" varchar(100) NOT NULL,
	"transfer_amount" double precision NOT NULL,
	"information" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budgetbuddy_auth"."account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "budgetbuddy_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgetbuddy_auth"."session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "budgetbuddy_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."budget_category" ADD CONSTRAINT "budget_category_budget_id_budget_budget_id_fk" FOREIGN KEY ("budget_id") REFERENCES "budgetbuddy_backend"."budget"("budget_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."budget_category" ADD CONSTRAINT "budget_category_category_id_category_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "budgetbuddy_backend"."category"("category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."budget" ADD CONSTRAINT "budget_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "budgetbuddy_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."category" ADD CONSTRAINT "category_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "budgetbuddy_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."payment_method" ADD CONSTRAINT "payment_method_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "budgetbuddy_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."recurring_payment" ADD CONSTRAINT "recurring_payment_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "budgetbuddy_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."recurring_payment" ADD CONSTRAINT "recurring_payment_category_id_category_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "budgetbuddy_backend"."category"("category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."recurring_payment" ADD CONSTRAINT "recurring_payment_payment_method_id_payment_method_payment_method_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "budgetbuddy_backend"."payment_method"("payment_method_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."transaction" ADD CONSTRAINT "transaction_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "budgetbuddy_auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."transaction" ADD CONSTRAINT "transaction_category_id_category_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "budgetbuddy_backend"."category"("category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."transaction" ADD CONSTRAINT "transaction_payment_method_id_payment_method_payment_method_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "budgetbuddy_backend"."payment_method"("payment_method_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE VIEW "budgetbuddy_backend"."spending_goal_view" AS (select EXTRACT(MONTH FROM "budgetbuddy_backend"."transaction"."processed_at") as "month", EXTRACT(YEAR FROM "budgetbuddy_backend"."transaction"."processed_at") as "year", (DATE_TRUNC('month', "budgetbuddy_backend"."transaction"."processed_at") + INTERVAL '1 month - 1 day')::DATE as "date", "budgetbuddy_backend"."budget_category"."budget_id", "budgetbuddy_backend"."budget"."owner_id", "budgetbuddy_backend"."budget"."budget", COALESCE(SUM(CASE WHEN "budgetbuddy_backend"."transaction"."transfer_amount" < 0 THEN ABS("budgetbuddy_backend"."transaction"."transfer_amount") ELSE 0 END), 0) as "spending_so_far" from "budgetbuddy_backend"."budget" inner join "budgetbuddy_backend"."budget_category" on "budgetbuddy_backend"."budget_category"."budget_id" = "budgetbuddy_backend"."budget"."budget_id" left join "budgetbuddy_backend"."transaction" on "budgetbuddy_backend"."transaction"."category_id" = "budgetbuddy_backend"."budget_category"."category_id" AND "budgetbuddy_backend"."transaction"."owner_id" = "budgetbuddy_backend"."budget"."owner_id" group by EXTRACT(MONTH FROM "budgetbuddy_backend"."transaction"."processed_at"), EXTRACT(YEAR FROM "budgetbuddy_backend"."transaction"."processed_at"), (DATE_TRUNC('month', "budgetbuddy_backend"."transaction"."processed_at") + INTERVAL '1 month - 1 day')::DATE, "budgetbuddy_backend"."budget_category"."budget_id", "budgetbuddy_backend"."budget"."owner_id", "budgetbuddy_backend"."budget"."budget");--> statement-breakpoint
CREATE VIEW "budgetbuddy_backend"."transaction_history_summary_view" AS (select EXTRACT(MONTH FROM "processed_at") as "month", EXTRACT(YEAR FROM "processed_at") as "year", (DATE_TRUNC('month', "processed_at") + INTERVAL '1 month - 1 day')::DATE as "date", "owner_id", SUM(CASE WHEN "transfer_amount" > 0 THEN "transfer_amount" ELSE 0 END) as "income", SUM(CASE WHEN "transfer_amount" < 0 THEN ABS("transfer_amount") ELSE 0 END) as "expenses", SUM("transfer_amount") as "balance" from "budgetbuddy_backend"."transaction" group by EXTRACT(MONTH FROM "budgetbuddy_backend"."transaction"."processed_at"), EXTRACT(YEAR FROM "budgetbuddy_backend"."transaction"."processed_at"), (DATE_TRUNC('month', "budgetbuddy_backend"."transaction"."processed_at") + INTERVAL '1 month - 1 day')::DATE, "budgetbuddy_backend"."transaction"."owner_id");--> statement-breakpoint
CREATE VIEW "budgetbuddy_backend"."transaction_history_view" AS (select EXTRACT(MONTH FROM "processed_at") as "month", EXTRACT(YEAR FROM "processed_at") as "year", (DATE_TRUNC('month', "processed_at") + INTERVAL '1 month - 1 day')::DATE as "date", "owner_id", "category_id", SUM(CASE WHEN "transfer_amount" > 0 THEN "transfer_amount" ELSE 0 END) as "income", SUM(CASE WHEN "transfer_amount" < 0 THEN ABS("transfer_amount") ELSE 0 END) as "expenses", SUM("transfer_amount") as "balance" from "budgetbuddy_backend"."transaction" group by EXTRACT(MONTH FROM "budgetbuddy_backend"."transaction"."processed_at"), EXTRACT(YEAR FROM "budgetbuddy_backend"."transaction"."processed_at"), (DATE_TRUNC('month', "budgetbuddy_backend"."transaction"."processed_at") + INTERVAL '1 month - 1 day')::DATE, "budgetbuddy_backend"."transaction"."owner_id", "budgetbuddy_backend"."transaction"."category_id");--> statement-breakpoint
CREATE VIEW "budgetbuddy_backend"."transaction_receiver_view" AS ((select distinct TRIM("receiver") as "receiver", "owner_id" from "budgetbuddy_backend"."transaction") union (select distinct TRIM("receiver") as "receiver", "owner_id" from "budgetbuddy_backend"."recurring_payment"));