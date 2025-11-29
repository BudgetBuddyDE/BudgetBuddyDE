CREATE SCHEMA "budgetbuddy_backend";
--> statement-breakpoint
CREATE TYPE "budgetbuddy_backend"."budget_type" AS ENUM('i', 'e');--> statement-breakpoint
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
	"ownerId" varchar NOT NULL,
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
ALTER TABLE "budgetbuddy_backend"."budget_category" ADD CONSTRAINT "budget_category_budget_id_budget_budget_id_fk" FOREIGN KEY ("budget_id") REFERENCES "budgetbuddy_backend"."budget"("budget_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."budget_category" ADD CONSTRAINT "budget_category_category_id_category_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "budgetbuddy_backend"."category"("category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."recurring_payment" ADD CONSTRAINT "recurring_payment_category_id_category_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "budgetbuddy_backend"."category"("category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."recurring_payment" ADD CONSTRAINT "recurring_payment_payment_method_id_payment_method_payment_method_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "budgetbuddy_backend"."payment_method"("payment_method_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."transaction" ADD CONSTRAINT "transaction_category_id_category_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "budgetbuddy_backend"."category"("category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."transaction" ADD CONSTRAINT "transaction_payment_method_id_payment_method_payment_method_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "budgetbuddy_backend"."payment_method"("payment_method_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE VIEW "budgetbuddy_backend"."transaction_receiver_view" AS ((select distinct "receiver", "ownerId" from "budgetbuddy_backend"."transaction") union all (select distinct "receiver", "owner_id" from "budgetbuddy_backend"."recurring_payment"));