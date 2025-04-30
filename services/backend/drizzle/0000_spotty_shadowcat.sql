CREATE TYPE "public"."BudgetCategoryType" AS ENUM('include', 'exclude');--> statement-breakpoint
CREATE TABLE "account" (
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
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscription" (
	"ownerId" text NOT NULL,
	"newsletter" varchar(30) PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter" (
	"newsletter" varchar(30) PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"name" varchar(30) NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"ownerId" text NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	CONSTRAINT "category_ownerId_name_unique" UNIQUE("ownerId","name")
);
--> statement-breakpoint
CREATE TABLE "payment_method" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"ownerId" text NOT NULL,
	"name" varchar(120) NOT NULL,
	"provider" varchar(120) NOT NULL,
	"addres" varchar(120) NOT NULL,
	"description" text,
	CONSTRAINT "payment_method_ownerId_name_unique" UNIQUE("ownerId","name"),
	CONSTRAINT "payment_method_provider_addres_unique" UNIQUE("provider","addres")
);
--> statement-breakpoint
CREATE TABLE "translation" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"ownerId" text NOT NULL,
	"categoryId" integer NOT NULL,
	"paymentMethodId" integer NOT NULL,
	"processedAt" timestamp NOT NULL,
	"receiver" varchar(120) NOT NULL,
	"transferAmount" double precision NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"ownerId" text NOT NULL,
	"categoryId" integer NOT NULL,
	"paymentMethodId" integer NOT NULL,
	"paused" boolean DEFAULT false NOT NULL,
	"executeAt" integer NOT NULL,
	"transferAmount" double precision NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "stock_exchange" (
	"symbol" varchar(5) PRIMARY KEY NOT NULL,
	"name" varchar(30) NOT NULL,
	"description" text,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_position" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"ownerId" text NOT NULL,
	"exchange" varchar(5) NOT NULL,
	"boughtAt" timestamp NOT NULL,
	"isin" varchar(12) NOT NULL,
	"buyInPrice" double precision NOT NULL,
	"currency" varchar(3) NOT NULL,
	"quantity" integer NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "stock_watchlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"ownerId" text NOT NULL,
	"exchange" varchar(5) NOT NULL,
	"isin" varchar(12) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "budget" (
	"id" serial PRIMARY KEY NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"ownerId" text NOT NULL,
	"label" varchar(120) NOT NULL,
	"type" "BudgetCategoryType" NOT NULL,
	"budgetAmount" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_categorie" (
	"budgetId" integer NOT NULL,
	"categoryId" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_subscription" ADD CONSTRAINT "newsletter_subscription_ownerId_user_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_subscription" ADD CONSTRAINT "newsletter_subscription_newsletter_newsletter_newsletter_fk" FOREIGN KEY ("newsletter") REFERENCES "public"."newsletter"("newsletter") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_ownerId_user_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_method" ADD CONSTRAINT "payment_method_ownerId_user_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translation" ADD CONSTRAINT "translation_ownerId_user_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translation" ADD CONSTRAINT "translation_categoryId_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translation" ADD CONSTRAINT "translation_paymentMethodId_payment_method_id_fk" FOREIGN KEY ("paymentMethodId") REFERENCES "public"."payment_method"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_ownerId_user_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_categoryId_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_paymentMethodId_payment_method_id_fk" FOREIGN KEY ("paymentMethodId") REFERENCES "public"."payment_method"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_position" ADD CONSTRAINT "stock_position_ownerId_user_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_position" ADD CONSTRAINT "stock_position_exchange_stock_exchange_symbol_fk" FOREIGN KEY ("exchange") REFERENCES "public"."stock_exchange"("symbol") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_watchlist" ADD CONSTRAINT "stock_watchlist_ownerId_user_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_watchlist" ADD CONSTRAINT "stock_watchlist_exchange_stock_exchange_symbol_fk" FOREIGN KEY ("exchange") REFERENCES "public"."stock_exchange"("symbol") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget" ADD CONSTRAINT "budget_ownerId_user_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_categorie" ADD CONSTRAINT "budget_categorie_budgetId_budget_id_fk" FOREIGN KEY ("budgetId") REFERENCES "public"."budget"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_categorie" ADD CONSTRAINT "budget_categorie_categoryId_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE no action ON UPDATE no action;