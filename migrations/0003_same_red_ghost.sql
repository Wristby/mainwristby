ALTER TABLE "inventory" ADD COLUMN "list_price" integer;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "link_count" integer;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "instagram_caption" text;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "credit_paid" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "credit_due_date" timestamp;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "credit_notes" text;