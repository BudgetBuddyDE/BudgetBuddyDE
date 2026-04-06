CREATE TABLE "budgetbuddy_backend"."attachment" (
	"attachment_id" uuid PRIMARY KEY NOT NULL,
	"owner_id" varchar NOT NULL,
	"fileName" varchar(255) NOT NULL,
	"fileExtension" varchar(16) NOT NULL,
	"contentType" varchar(128) NOT NULL,
	"location" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attachment_location_unique" UNIQUE("location")
);
--> statement-breakpoint
CREATE TABLE "budgetbuddy_backend"."transaction_attachment" (
	"transaction_id" uuid,
	"attachment_id" uuid,
	CONSTRAINT "transaction_attachment_pkey" PRIMARY KEY("transaction_id","attachment_id")
);
--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."transaction_attachment" ADD CONSTRAINT "transaction_attachment_transaction_id_transaction_transaction_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "budgetbuddy_backend"."transaction"("transaction_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgetbuddy_backend"."transaction_attachment" ADD CONSTRAINT "transaction_attachment_attachment_id_attachment_attachment_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "budgetbuddy_backend"."attachment"("attachment_id") ON DELETE cascade ON UPDATE no action;