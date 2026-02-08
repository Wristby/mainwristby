CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"social_handle" text,
	"website" text,
	"country" text,
	"type" text DEFAULT 'client' NOT NULL,
	"notes" text,
	"is_vip" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"inventory_id" integer,
	"description" text NOT NULL,
	"amount" integer NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"is_recurring" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"reference_number" text NOT NULL,
	"serial_number" text,
	"internal_serial" text,
	"year" integer,
	"purchased_from" text,
	"paid_with" text,
	"purchase_price" integer NOT NULL,
	"import_fee" integer DEFAULT 0,
	"watch_register" boolean DEFAULT false,
	"service_fee" integer DEFAULT 0,
	"polish_fee" integer DEFAULT 0,
	"date_sent_to_service" timestamp,
	"date_returned_from_service" timestamp,
	"service_notes" text,
	"sale_price" integer DEFAULT 0,
	"sold_to" text,
	"platform_fees" integer DEFAULT 0,
	"shipping_fee" integer DEFAULT 0,
	"insurance_fee" integer DEFAULT 0,
	"target_sell_price" integer NOT NULL,
	"sold_price" integer,
	"date_received" timestamp,
	"purchase_date" timestamp,
	"date_listed" timestamp,
	"sold_date" timestamp,
	"date_sold" timestamp,
	"condition" text NOT NULL,
	"status" text DEFAULT 'incoming' NOT NULL,
	"box" boolean DEFAULT false NOT NULL,
	"papers" boolean DEFAULT false NOT NULL,
	"images" text[],
	"gdrive_link" text,
	"notes" text,
	"shipping_partner" text,
	"tracking_number" text,
	"sold_platform" text,
	"client_id" integer,
	"buyer_id" integer
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(50) NOT NULL,
	"password" varchar(255) NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_inventory_id_inventory_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_buyer_id_clients_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");