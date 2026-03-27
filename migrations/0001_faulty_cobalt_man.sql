CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "date_shipped" timestamp;