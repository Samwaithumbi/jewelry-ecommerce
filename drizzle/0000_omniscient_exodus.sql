CREATE TYPE "public"."affiliate_status" AS ENUM('pending', 'active', 'paused', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."category" AS ENUM('ring', 'necklace', 'bracelet', 'earring', 'pendant', 'bangle', 'set');--> statement-breakpoint
CREATE TYPE "public"."cert_lab" AS ENUM('GIA', 'IGI', 'EGL', 'AGS', 'HRD');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('view', 'add_cart', 'purchase', 'wishlist', 'search_click', 'review', 'ar_tryOn');--> statement-breakpoint
CREATE TYPE "public"."fraud_status" AS ENUM('clear', 'flagged', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."loyalty_type" AS ENUM('earn_purchase', 'earn_review', 'earn_referral', 'redeem', 'expire', 'bonus');--> statement-breakpoint
CREATE TYPE "public"."metal_purity" AS ENUM('9k', '14k', '18k', '24k', '925', '950');--> statement-breakpoint
CREATE TYPE "public"."metal_type" AS ENUM('gold', 'silver', 'platinum', 'rose_gold', 'white_gold');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('customer', 'admin');--> statement-breakpoint
CREATE TYPE "public"."search_type" AS ENUM('semantic', 'visual', 'keyword');--> statement-breakpoint
CREATE TYPE "public"."size_system" AS ENUM('US', 'UK', 'EU', 'JP', 'CH');--> statement-breakpoint
CREATE TYPE "public"."stone_cut" AS ENUM('round', 'princess', 'cushion', 'oval', 'marquise', 'pear', 'heart', 'emerald', 'radiant');--> statement-breakpoint
CREATE TYPE "public"."stone_type" AS ENUM('diamond', 'ruby', 'emerald', 'sapphire', 'pearl', 'moissanite', 'opal', 'amethyst', 'none');--> statement-breakpoint
CREATE TYPE "public"."customer_tier" AS ENUM('standard', 'vip', 'wholesale');--> statement-breakpoint
CREATE TYPE "public"."vendor_status" AS ENUM('pending', 'active', 'suspended');--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"lab" "cert_lab" NOT NULL,
	"cert_number" varchar(20) NOT NULL,
	"file_url" text,
	"stone_shape" varchar(50),
	"carat_weight" numeric(6, 3),
	"color_grade" varchar(5),
	"clarity_grade" varchar(5),
	"cut_grade" varchar(20),
	"polish" varchar(20),
	"symmetry" varchar(20),
	"fluorescence" varchar(20),
	"issued_at" date,
	CONSTRAINT "certificates_cert_number_unique" UNIQUE("cert_number")
);
--> statement-breakpoint
CREATE TABLE "metal_pricing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metal" varchar(20) NOT NULL,
	"purity" varchar(5) NOT NULL,
	"price_per_gram_cents" integer NOT NULL,
	"spot_price_per_troy_oz" numeric(10, 4),
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"qty" smallint NOT NULL,
	"price_cents" integer NOT NULL,
	"metal_price_at_purchase" integer,
	"engraving_text" varchar(50),
	"engraving_font" varchar(30),
	"engraving_price_cents" integer,
	"nfc_tag_uuid" uuid
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(20) NOT NULL,
	"user_id" uuid,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"shipping_cents" integer DEFAULT 0,
	"tax_cents" integer DEFAULT 0,
	"gift_wrap_cents" integer DEFAULT 0,
	"discount_cents" integer DEFAULT 0,
	"total_cents" integer NOT NULL,
	"stripe_pi_id" varchar(100),
	"shipping_address" jsonb NOT NULL,
	"is_gift" boolean DEFAULT false,
	"gift_message" text,
	"gift_wrap" boolean DEFAULT false,
	"hide_price_on_slip" boolean DEFAULT false,
	"tracking_number" varchar(100),
	"carrier" varchar(50),
	"easypost_shipment_id" varchar(100),
	"insurance_id" varchar(100),
	"fraud_score" smallint,
	"fraud_status" "fraud_status" DEFAULT 'clear',
	"device_fingerprint" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number"),
	CONSTRAINT "orders_stripe_pi_id_unique" UNIQUE("stripe_pi_id")
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"url" text NOT NULL,
	"position" smallint NOT NULL,
	"is_primary" boolean DEFAULT false,
	"is_360" boolean DEFAULT false,
	"angle_degrees" smallint,
	"alt_text" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" varchar(100) NOT NULL,
	"size" varchar(10),
	"size_system" "size_system",
	"stone_type" "stone_type",
	"stone_carat" numeric(6, 3),
	"stone_cut" "stone_cut",
	"stone_color" varchar(5),
	"stone_clarity" varchar(5),
	"stock_qty" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 3,
	"price_adjust_cents" integer DEFAULT 0,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "product_variants_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(300) NOT NULL,
	"description" text,
	"short_desc" varchar(500),
	"metal_type" "metal_type" NOT NULL,
	"metal_purity" "metal_purity" NOT NULL,
	"base_price_cents" integer NOT NULL,
	"weight_grams" numeric(8, 3) NOT NULL,
	"category" "category" NOT NULL,
	"occasion_tags" text[],
	"style_tags" text[],
	"active" boolean DEFAULT true NOT NULL,
	"featured" boolean DEFAULT false,
	"vip_only" boolean DEFAULT false,
	"rating_avg" numeric(3, 2),
	"review_count" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"embedding" vector(1536),
	"vendor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "search_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"query" text NOT NULL,
	"user_id" uuid,
	"session_id" varchar(255),
	"result_count" smallint,
	"top_product_ids" uuid[],
	"clicked_product_id" uuid,
	"search_type" "search_type",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stylist_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"session_token" varchar(100) NOT NULL,
	"messages" jsonb NOT NULL,
	"occasion" varchar(50),
	"budget_min_cents" integer,
	"budget_max_cents" integer,
	"converted" boolean DEFAULT false,
	"order_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "stylist_sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "user_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"session_id" varchar(255),
	"event_type" "event_type" NOT NULL,
	"product_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"email_verified" timestamp with time zone,
	"image" text,
	"role" "role" DEFAULT 'customer' NOT NULL,
	"customer_tier" "customer_tier" DEFAULT 'standard',
	"ring_size_us" varchar(10),
	"bracelet_size_cm" smallint,
	"necklace_length_in" smallint,
	"birthday" date,
	"anniversary" date,
	"loyalty_balance" integer DEFAULT 0,
	"lifetime_spend_cents" integer DEFAULT 0,
	"referral_code" varchar(12),
	"referred_by_id" uuid,
	"email_unsubscribed" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_created_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "variants_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "variants_sku_idx" ON "product_variants" USING btree ("sku");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "products_active_idx" ON "products" USING btree ("active");--> statement-breakpoint
CREATE INDEX "events_user_idx" ON "user_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "events_created_idx" ON "user_events" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_ref_code_idx" ON "users" USING btree ("referral_code");