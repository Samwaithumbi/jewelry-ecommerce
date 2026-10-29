# Lumina Jewels — Production Deployment Runbook & Release Checklist

---

## 1. Environment Variables Checklist

All values must be configured in Vercel Project Settings under Environment Variables (Production & Preview). **Never print or commit secret values to version control.**

| Variable Name | Required Runtime | Purpose | Verification Method |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Node.js Serverless | Neon PostgreSQL connection string with PgBouncer pooler | Checked by `lib/db.ts` |
| `UPSTASH_REDIS_REST_URL` | Node.js Serverless | Upstash Redis REST endpoint for cart, locks & rate limiting | Checked by `lib/redis.ts` |
| `UPSTASH_REDIS_REST_TOKEN` | Node.js Serverless | Upstash Redis REST authentication token | Checked by `lib/redis.ts` |
| `NEXTAUTH_SECRET` | Node.js Serverless | Cryptographic secret for signing NextAuth JWT tokens | Checked by NextAuth |
| `NEXTAUTH_URL` | Node.js Serverless | Canonical production URL (e.g. `https://luminajewels.com`) | NextAuth redirect & cookie origin |
| `NEXT_PUBLIC_APP_URL` | Client & Server | Public domain for email links and asset references | Checked by `lib/emails/email.ts` |
| `MPESA_ENV` | Node.js Serverless | `'production'` or `'sandbox'` | Checked by `lib/mpesa/config.ts` |
| `MPESA_CONSUMER_KEY` | Node.js Serverless | Safaricom Daraja Consumer Key | Checked by `lib/mpesa/config.ts` |
| `MPESA_CONSUMER_SECRET`| Node.js Serverless | Safaricom Daraja Consumer Secret | Checked by `lib/mpesa/config.ts` |
| `MPESA_SHORTCODE` | Node.js Serverless | Safaricom Paybill or Till Shortcode | Checked by `lib/mpesa/config.ts` |
| `MPESA_PASSKEY` | Node.js Serverless | Lipa Na M-Pesa Passkey | Checked by `lib/mpesa/config.ts` |
| `MPESA_CALLBACK_URL` | Node.js Serverless | Public HTTPS callback URL (must match production domain) | Checked by `lib/mpesa/config.ts` |
| `CRON_SECRET` | Node.js Serverless | Secret header for Vercel Cron authorization | Checked by `/api/cron/*` |
| `RESEND_API_KEY` | Node.js Serverless | Resend transactional email API key | Checked by `lib/emails/email.ts` |
| `EMAIL_FROM` | Node.js Serverless | Verified sender address (e.g. `orders@luminajewels.com`) | Resend verified domain |
| `R2_BUCKET_NAME` | Node.js Serverless | Cloudflare R2 bucket name | Checked by `lib/r2.ts` |
| `R2_PUBLIC_URL` | Node.js Serverless | Public CDN URL for product media | Checked by `lib/r2.ts` |
| `S3_ACCESS_KEY_ID` | Node.js Serverless | Cloudflare R2 Access Key ID | Checked by `lib/r2.ts` |
| `S3_SECRET_KEY` | Node.js Serverless | Cloudflare R2 Secret Access Key | Checked by `lib/r2.ts` |
| `S3_ENDPOINT` | Node.js Serverless | Cloudflare R2 S3 API Endpoint | Checked by `lib/r2.ts` |

---

## 2. Pre-Deployment Quality Gates

Before promoting any release to production:
1. `pnpm run typecheck` passes with 0 errors.
2. `pnpm test` passes 100% of unit and regression tests.
3. `pnpm run build` generates clean production output without build failures.
4. Database migrations have been applied cleanly to the target database.

---

## 3. Database Migration Procedure

1. **Pre-Migration Safety Check:**
   - In Neon Console, create a point-in-time recovery branch/snapshot of the production database before applying migrations.
2. **Migration Execution:**
   - Run migrations via Drizzle:
     ```bash
     pnpm drizzle-kit migrate
     ```
   - Verify that all tables (`users`, `orders`, `order_items`, `payments`, `inventory_levels`, `inventory_reservations`, `inventory_movements`) have required unique indexes.
3. **Rollback Strategy:**
   - If a migration fails, Neon allows instantaneous branch restore to the pre-migration snapshot without data loss.

---

## 4. Post-Deployment Smoke Test Plan

Execute these 10 verification steps immediately after production deployment:
1. **Homepage & Catalog:** Verify `/` loads with product images and categories.
2. **Product Details:** Open a product `/products/[slug]`, select a variant, verify price and availability indicator.
3. **Guest Cart:** Add an item to cart, verify cart drawer displays accurate subtotal, refresh page, verify cart persists.
4. **Checkout:** Proceed to `/checkout`, enter shipping details, verify order creation and VAT / gift wrap totals.
5. **M-Pesa STK Push:** Enter phone number, verify STK Push prompt appears on device in sandbox/production environment.
6. **Payment Confirmation:** Complete payment, verify status changes to confirmed and order success page displays order details.
7. **Order Isolation:** Log in as Customer A, attempt to access Customer B's order by ID, verify 404 response.
8. **Admin Protection:** As a non-admin, attempt to visit `/admin-dashboard`, verify redirect to `/`.
9. **R2 Upload:** In admin panel, upload a product image, verify image loads from R2 CDN.
10. **Cron Verification:** In Vercel Dashboard > Cron Jobs, verify `/api/cron/expire-reservations` runs on schedule without 401 errors.

---

## 5. Rollback & Forward-Fix Guidance

- **Immediate Deployment Rollback:** In Vercel Dashboard > Deployments, click "Instant Rollback" to the previous stable deployment hash.
- **Payment Circuit Breaker:** If Daraja experiences provider-side outages, STK push initiation returns structured error messages to customers while preserving active orders in `pending` state.
