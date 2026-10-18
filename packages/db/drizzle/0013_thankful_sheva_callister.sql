CREATE TABLE "budgetbuddy_backend"."preference" (
	"owner_id" varchar PRIMARY KEY NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"language" varchar(8) DEFAULT 'en_US' NOT NULL,
	"time_zone" varchar(64) DEFAULT 'Europe/Berlin' NOT NULL,
	"currency" varchar(3) DEFAULT 'EUR' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."preference" ADD CONSTRAINT "preference_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "budgetbuddy_auth"."user"("id") ON DELETE cascade ON UPDATE no action;