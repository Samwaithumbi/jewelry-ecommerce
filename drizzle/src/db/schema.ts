// src/db/schema.ts
// Complete production schema — run: pnpm db:push

import {
    pgTable, pgEnum, uuid, varchar, text, integer,
    smallint, boolean, decimal, date, timestamp,
    jsonb, customType, index, uniqueIndex
  } from "drizzle-orm/pg-core";
  
  // ── Enable pgvector ──────────────────────────────────────────────────────────
  // Run in Neon SQL editor FIRST:
  // CREATE EXTENSION IF NOT EXISTS vector;
  // CREATE EXTENSION IF NOT EXISTS pg_trgm;
  
  const vector = (name: string, dim: number) =>
    customType<{ data: number[] }>({
      dataType() { return `vector(${dim})`; },
    })(name);
  
  // ── Enums ────────────────────────────────────────────────────────────────────
  export const roleEnum         = pgEnum("role", ["customer","admin"]);
  export const tierEnum         = pgEnum("customer_tier", ["standard","vip","wholesale"]);
  export const metalTypeEnum    = pgEnum("metal_type", ["gold","silver","platinum","rose_gold","white_gold"]);
  export const metalPurityEnum  = pgEnum("metal_purity", ["9k","14k","18k","24k","925","950"]);
  export const categoryEnum     = pgEnum("category", ["ring","necklace","bracelet","earring","pendant","bangle","set"]);
  export const stoneTypeEnum    = pgEnum("stone_type", ["diamond","ruby","emerald","sapphire","pearl","moissanite","opal","amethyst","none"]);
  export const stoneCutEnum     = pgEnum("stone_cut", ["round","princess","cushion","oval","marquise","pear","heart","emerald","radiant"]);
  export const sizeSysEnum      = pgEnum("size_system", ["US","UK","EU","JP","CH"]);
  export const certLabEnum      = pgEnum("cert_lab", ["GIA","IGI","EGL","AGS","HRD"]);
  export const orderStatusEnum  = pgEnum("order_status", ["pending","confirmed","processing","shipped","delivered","cancelled","refunded"]);
  export const fraudStatusEnum  = pgEnum("fraud_status", ["clear","flagged","approved","rejected"]);
  export const reviewStatusEnum = pgEnum("review_status", ["pending","approved","rejected"]);
  export const searchTypeEnum   = pgEnum("search_type", ["semantic","visual","keyword"]);
  export const eventTypeEnum    = pgEnum("event_type", ["view","add_cart","purchase","wishlist","search_click","review","ar_tryOn"]);
  export const loyaltyTypeEnum  = pgEnum("loyalty_type", ["earn_purchase","earn_review","earn_referral","redeem","expire","bonus"]);
  export const affiliateStatusEnum = pgEnum("affiliate_status", ["pending","active","paused","terminated"]);
  export const vendorStatusEnum = pgEnum("vendor_status", ["pending","active","suspended"]);
  
  const ts = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
  // ── Auth Tables (NextAuth v5) ────────────────────────────────────────────────
  export const users = pgTable("users", {
    id:               uuid("id").primaryKey().defaultRandom(),
    email:            varchar("email", { length: 255 }).unique().notNull(),
    name:             varchar("name", { length: 255 }),
    emailVerified:    timestamp("email_verified", { withTimezone: true }),
    image:            text("image"),
    role:             roleEnum("role").default("customer").notNull(),
    customerTier:     tierEnum("customer_tier").default("standard"),
    // Jewelry preferences
    ringSizeUs:       varchar("ring_size_us", { length: 10 }),
    braceletSizeCm:   smallint("bracelet_size_cm"),
    necklaceLengthIn: smallint("necklace_length_in"),
    birthday:         date("birthday"),
    anniversary:      date("anniversary"),
    // Loyalty
    loyaltyBalance:   integer("loyalty_balance").default(0),
    lifetimeSpend:    integer("lifetime_spend_cents").default(0),
    // Referral
    referralCode:     varchar("referral_code", { length: 12 }).unique(),
    referredById:     uuid("referred_by_id"),
    // Marketing
    emailUnsubscribed: boolean("email_unsubscribed").default(false),
    createdAt:        ts(),
  }, (t: any) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
    refCodeIdx: uniqueIndex("users_ref_code_idx").on(t.referralCode),
  }));
  
  // ── Products ─────────────────────────────────────────────────────────────────
  export const products = pgTable("products", {
    id:            uuid("id").primaryKey().defaultRandom(),
    name:          varchar("name", { length: 255 }).notNull(),
    slug:          varchar("slug", { length: 300 }).unique().notNull(),
    description:   text("description"),
    shortDesc:     varchar("short_desc", { length: 500 }),
    metalType:     metalTypeEnum("metal_type").notNull(),
    metalPurity:   metalPurityEnum("metal_purity").notNull(),
    // ⚠ ALWAYS integer cents — never float
    basePriceCents: integer("base_price_cents").notNull(),
    weightGrams:   decimal("weight_grams", { precision: 8, scale: 3 }).notNull(),
    category:      categoryEnum("category").notNull(),
    occasionTags:  text("occasion_tags").array(),
    styleTags:     text("style_tags").array(),
    active:        boolean("active").default(true).notNull(),
    featured:      boolean("featured").default(false),
    vipOnly:       boolean("vip_only").default(false),
    ratingAvg:     decimal("rating_avg", { precision: 3, scale: 2 }),
    reviewCount:   integer("review_count").default(0),
    viewCount:     integer("view_count").default(0),
    // AI embedding — requires pgvector extension
    embedding:     vector("embedding", 1536),
    vendorId:      uuid("vendor_id"),
    createdAt:     ts(),
    updatedAt:     timestamp("updated_at", { withTimezone: true }),
  }, (t: any) => ({
    slugIdx:     uniqueIndex("products_slug_idx").on(t.slug),
    categoryIdx: index("products_category_idx").on(t.category),
    activeIdx:   index("products_active_idx").on(t.active),
  }));
  
  export const productVariants = pgTable("product_variants", {
    id:                 uuid("id").primaryKey().defaultRandom(),
    productId:          uuid("product_id").notNull(),
    sku:                varchar("sku", { length: 100 }).unique().notNull(),
    size:               varchar("size", { length: 10 }),
    sizeSystem:         sizeSysEnum("size_system"),
    stoneType:          stoneTypeEnum("stone_type"),
    stoneCarat:         decimal("stone_carat", { precision: 6, scale: 3 }),
    stoneCut:           stoneCutEnum("stone_cut"),
    stoneColor:         varchar("stone_color", { length: 5 }),
    stoneClarity:       varchar("stone_clarity", { length: 5 }),
    stockQty:           integer("stock_qty").default(0).notNull(),
    lowStockThreshold:  integer("low_stock_threshold").default(3),
    priceAdjustCents:   integer("price_adjust_cents").default(0),
    active:             boolean("active").default(true).notNull(),
  }, (t: any) => ({
    productIdx: index("variants_product_idx").on(t.productId),
    skuIdx:     uniqueIndex("variants_sku_idx").on(t.sku),
  }));
  
  export const productImages = pgTable("product_images", {
    id:          uuid("id").primaryKey().defaultRandom(),
    productId:   uuid("product_id").notNull(),
    url:         text("url").notNull(),
    position:    smallint("position").notNull(),
    isPrimary:   boolean("is_primary").default(false),
    is360:       boolean("is_360").default(false),
    angleDeg:    smallint("angle_degrees"),
    altText:     varchar("alt_text", { length: 500 }),
  });
  
  export const certificates = pgTable("certificates", {
    id:           uuid("id").primaryKey().defaultRandom(),
    productId:    uuid("product_id").notNull(),
    lab:          certLabEnum("lab").notNull(),
    certNumber:   varchar("cert_number", { length: 20 }).unique().notNull(),
    fileUrl:      text("file_url"),
    stoneShape:   varchar("stone_shape", { length: 50 }),
    caratWeight:  decimal("carat_weight", { precision: 6, scale: 3 }),
    colorGrade:   varchar("color_grade", { length: 5 }),
    clarityGrade: varchar("clarity_grade", { length: 5 }),
    cutGrade:     varchar("cut_grade", { length: 20 }),
    polish:       varchar("polish", { length: 20 }),
    symmetry:     varchar("symmetry", { length: 20 }),
    fluorescence: varchar("fluorescence", { length: 20 }),
    issuedAt:     date("issued_at"),
  });
  
  export const metalPricing = pgTable("metal_pricing", {
    id:               uuid("id").primaryKey().defaultRandom(),
    metal:            varchar("metal", { length: 20 }).notNull(),
    purity:           varchar("purity", { length: 5 }).notNull(),
    pricePerGramCents: integer("price_per_gram_cents").notNull(),
    spotPricePerOz:   decimal("spot_price_per_troy_oz", { precision: 10, scale: 4 }),
    currency:         varchar("currency", { length: 3 }).default("USD").notNull(),
    updatedAt:        timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  });
  
  // ── Orders ───────────────────────────────────────────────────────────────────
  export const orders = pgTable("orders", {
    id:                   uuid("id").primaryKey().defaultRandom(),
    orderNumber:          varchar("order_number", { length: 20 }).unique().notNull(),
    userId:               uuid("user_id"),
    status:               orderStatusEnum("status").default("pending").notNull(),
    subtotalCents:        integer("subtotal_cents").notNull(),
    shippingCents:        integer("shipping_cents").default(0),
    taxCents:             integer("tax_cents").default(0),
    giftWrapCents:        integer("gift_wrap_cents").default(0),
    discountCents:        integer("discount_cents").default(0),
    totalCents:           integer("total_cents").notNull(),
    stripePiId:           varchar("stripe_pi_id", { length: 100 }).unique(),
    shippingAddress:      jsonb("shipping_address").notNull(),
    isGift:               boolean("is_gift").default(false),
    giftMessage:          text("gift_message"),
    giftWrap:             boolean("gift_wrap").default(false),
    hidePriceOnSlip:      boolean("hide_price_on_slip").default(false),
    trackingNumber:       varchar("tracking_number", { length: 100 }),
    carrier:              varchar("carrier", { length: 50 }),
    easypostShipmentId:   varchar("easypost_shipment_id", { length: 100 }),
    insuranceId:          varchar("insurance_id", { length: 100 }),
    fraudScore:           smallint("fraud_score"),
    fraudStatus:          fraudStatusEnum("fraud_status").default("clear"),
    deviceFingerprint:    text("device_fingerprint"),
    createdAt:            ts(),
    shippedAt:            timestamp("shipped_at", { withTimezone: true }),
    deliveredAt:          timestamp("delivered_at", { withTimezone: true }),
  }, (t: any) => ({
    userIdx:    index("orders_user_idx").on(t.userId),
    statusIdx:  index("orders_status_idx").on(t.status),
    createdIdx: index("orders_created_idx").on(t.createdAt),
  }));
  
  export const orderItems = pgTable("order_items", {
    id:                  uuid("id").primaryKey().defaultRandom(),
    orderId:             uuid("order_id").notNull(),
    productId:           uuid("product_id").notNull(),
    variantId:           uuid("variant_id"),
    qty:                 smallint("qty").notNull(),
    priceCents:          integer("price_cents").notNull(),
    metalPriceAtPurchase: integer("metal_price_at_purchase"),
    engravingText:       varchar("engraving_text", { length: 50 }),
    engravingFont:       varchar("engraving_font", { length: 30 }),
    engravingPriceCents: integer("engraving_price_cents"),
    nfcTagUuid:          uuid("nfc_tag_uuid"),
  }, (t: any) => ({
    orderIdx: index("order_items_order_idx").on(t.orderId),
  }));
  
  // ── AI / ML ──────────────────────────────────────────────────────────────────
  export const userEvents = pgTable("user_events", {
    id:         uuid("id").primaryKey().defaultRandom(),
    userId:     uuid("user_id"),
    sessionId:  varchar("session_id", { length: 255 }),
    eventType:  eventTypeEnum("event_type").notNull(),
    productId:  uuid("product_id"),
    metadata:   jsonb("metadata"),
    createdAt:  ts(),
  }, (t: any) => ({
    userIdx:    index("events_user_idx").on(t.userId),
    createdIdx: index("events_created_idx").on(t.createdAt),
  }));
  
  export const searchLogs = pgTable("search_logs", {
    id:               uuid("id").primaryKey().defaultRandom(),
    query:            text("query").notNull(),
    userId:           uuid("user_id"),
    sessionId:        varchar("session_id", { length: 255 }),
    resultCount:      smallint("result_count"),
    topProductIds:    uuid("top_product_ids").array(),
    clickedProductId: uuid("clicked_product_id"),
    searchType:       searchTypeEnum("search_type"),
    createdAt:        ts(),
  });
  
  export const stylistSessions = pgTable("stylist_sessions", {
    id:             uuid("id").primaryKey().defaultRandom(),
    userId:         uuid("user_id"),
    sessionToken:   varchar("session_token", { length: 100 }).unique().notNull(),
    messages:       jsonb("messages").notNull(),
    occasion:       varchar("occasion", { length: 50 }),
    budgetMin:      integer("budget_min_cents"),
    budgetMax:      integer("budget_max_cents"),
    converted:      boolean("converted").default(false),
    orderId:        uuid("order_id"),
    createdAt:      ts(),
    updatedAt:      timestamp("updated_at", { withTimezone: true }),
  });
  