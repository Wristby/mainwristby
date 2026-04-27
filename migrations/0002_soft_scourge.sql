ALTER TABLE "inventory" ADD COLUMN "service_start_date" timestamp;--> statement-breakpoint
ALTER TABLE "inventory" ADD COLUMN "movement_specs" jsonb;