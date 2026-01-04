CREATE TYPE "budgetbuddy_backend"."attachment_usage" AS ENUM('avatar', 'transaction');--> statement-breakpoint
CREATE TABLE "budgetbuddy_backend"."attachment" (
	"attachment_id" uuid PRIMARY KEY NOT NULL,
	"owner_id" varchar NOT NULL,
	"usage" "budgetbuddy_backend"."attachment_usage" NOT NULL,
	"fileName" varchar(255) NOT NULL,
	"fileExtension" varchar(16) NOT NULL,
	"contentType" varchar(128) NOT NULL,
	"location" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
