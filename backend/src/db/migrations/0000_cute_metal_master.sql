DO $$ BEGIN
 CREATE TYPE "public"."freshness" AS ENUM('FRESH', 'DELAYED', 'STALE', 'UNAVAILABLE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."sensitivity" AS ENUM('CALM', 'BALANCED', 'SENSITIVE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "instruments" (
	"symbol" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sector" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "market_events" (
	"id" text PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"type" text NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stock_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"price" double precision NOT NULL,
	"day_change_percent" double precision NOT NULL,
	"volume_ratio" double precision NOT NULL,
	"day_high" double precision,
	"day_low" double precision,
	"sector" text,
	"timestamp" timestamp with time zone NOT NULL,
	"provider" text NOT NULL,
	"freshness" "freshness" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"attention_budget" integer DEFAULT 3 NOT NULL,
	"sensitivity" "sensitivity" DEFAULT 'BALANCED' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_stock_state" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"symbol" text NOT NULL,
	"last_seen_at" timestamp with time zone,
	"last_seen_price" double precision,
	"last_seen_change_pct" double precision,
	"last_seen_snapshot_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text DEFAULT 'Demo User' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "watchlist_items" (
	"id" text PRIMARY KEY NOT NULL,
	"watchlist_id" text NOT NULL,
	"symbol" text NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "watchlists" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_stock_state" ADD CONSTRAINT "user_stock_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "watchlist_items" ADD CONSTRAINT "watchlist_items_watchlist_id_watchlists_id_fk" FOREIGN KEY ("watchlist_id") REFERENCES "public"."watchlists"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "watchlists" ADD CONSTRAINT "watchlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "instruments_sector_idx" ON "instruments" USING btree ("sector");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "market_events_symbol_time_idx" ON "market_events" USING btree ("symbol","timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "stock_snapshots_symbol_time_idx" ON "stock_snapshots" USING btree ("symbol","timestamp");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_stock_state_user_symbol_idx" ON "user_stock_state" USING btree ("user_id","symbol");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_stock_state_symbol_idx" ON "user_stock_state" USING btree ("symbol");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "watchlist_items_watchlist_symbol_idx" ON "watchlist_items" USING btree ("watchlist_id","symbol");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "watchlist_items_symbol_idx" ON "watchlist_items" USING btree ("symbol");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "watchlists_user_idx" ON "watchlists" USING btree ("user_id");