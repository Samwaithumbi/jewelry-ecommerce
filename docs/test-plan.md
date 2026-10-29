# Lumina Jewels — Comprehensive Test Plan & Quality Assurance Strategy

## 1. Overview & Quality Objectives

This document establishes the test strategy, critical customer journeys, edge cases, integration verification, and regression test suites for Lumina Jewels. The test strategy guarantees:
- Financial correctness in Kenyan Shillings (KES integer minor units / cents).
- Concurrency and idempotency in inventory reservations and M-Pesa payments.
- Zero customer data leaks or unauthorized admin operations.
- Offline and CI reproducibility without reliance on unmocked third-party rate-limited endpoints.

---

## 2. Test Environments & Data Strategy

### Environments
1. **Local / CI Environment:**
   - Isolated unit and mock integration testing.
   - External dependencies (Safaricom Daraja API, Voyage AI, Resend, S3) are tested via verified contract mocks and unit specifications.
   - Deterministic inputs with zero live network calls in unit tests.
2. **Staging / Sandbox Environment:**
   - Safaricom Daraja Sandbox (`https://sandbox.safaricom.co.ke`).
   - Neon PostgreSQL staging database with seeded jewelry catalog.
   - Upstash Redis sandbox instance.
   - Cloudflare R2 test bucket.
3. **Production Environment:**
   - Production Daraja Paybill (`CustomerPayBillOnline`).
   - Real customer accounts with strict server-side authorization.

---

## 3. Critical User Journeys (CUJ Matrix)

### CUJ-01: Catalog Discovery & Product Viewing
- **Steps:**
  1. Visitor lands on home page `/` and navigates to `/products`.
  2. Products load with authoritative pricing from database.
  3. Filter by category (e.g. `ring`, `necklace`), metal type, and purity.
  4. Product detail page `/products/[slug]` renders selected variant, price adjustment, and real-time available stock.
- **Verification Criteria:**
  - Inactive products (`active = false`) are hidden from storefront.
  - Sold-out variants display authoritative "Out of Stock" indicators.
  - Image galleries provide fallback and accessible `alt` text.

### CUJ-02: Cart Management & Session Persistence
- **Steps:**
  1. Add available variant to cart with valid quantity (1 to 100).
  2. Reject negative, fractional, zero, or excessive (>100) quantities server-side.
  3. Update quantities and verify server recalculates line totals from database unit prices, ignoring client-submitted amounts.
  4. Guest session cookie `guest_session` persists cart across page reloads.
  5. Upon customer login, guest cart items merge deterministically into user cart.
- **Verification Criteria:**
  - Redis cart expires after 7 days TTL.
  - Unavailable variants cannot be added or maintained in cart.

### CUJ-03: Checkout & Authoritative Order Creation
- **Steps:**
  1. Customer proceeds from `/cart` to `/checkout`.
  2. Shipping address validation requires complete Kenyan contact details (name, phone, address, city).
  3. If product prices changed in the database between add-to-cart and checkout, order creation blocks and prompts customer with exact old vs new prices.
  4. Server calculates 16% VAT, standard gift wrap (500 KSh = 50,000 cents), and total in integer cents.
  5. Atomic inventory reservation holds stock at MAIN location for 15 minutes.
  6. Order is persisted with status `pending` and immutable price snapshots in `order_items`.
- **Verification Criteria:**
  - No client-submitted prices or totals are ever trusted.
  - Order items store authoritative purchase-time price snapshot.

### CUJ-04: M-Pesa Payment Lifecycle (Daraja STK Push)
- **Steps:**
  1. Customer enters Kenyan phone number (`07...`, `01...`, or `+254...`).
  2. Phone number is normalized to `2547...` format.
  3. STK Push is sent to Daraja with exact whole KSh amount (`Math.ceil(totalCents / 100)`).
  4. Payment record created with status `pending`, checkout request ID, and 15-minute expiry.
  5. Distributed Redis lock prevents duplicate STK push submissions for the same order within 30 seconds.
  6. Customer-facing form polls `/api/payments/[paymentId]` or queries status safely.
- **Verification Criteria:**
  - Status check correctly checks authorization for authenticated users.
  - Query URL targets Safaricom's `/mpesa/stkpushquery/v1/query`.

### CUJ-05: Payment Reconciliation & Fulfillment
- **Steps:**
  1. Safaricom sends server-to-server callback to `/api/payments/mpesa/callback`.
  2. IP verification validates allowed Safaricom production subnets (or bypasses safely in sandbox/dev).
  3. Rate limiter restricts callback endpoint abuse.
  4. Payload is structurally validated and extracted.
  5. Callback amount is cross-checked against database expected KSh; mismatches reject with `AmountMismatchError`.
  6. In production, STK Push status is verified via Daraja Query API.
  7. Atomic DB transaction marks `payments` as `success`, updates `orders.status` to `confirmed`, and calls `confirmReservation` (decrements `on_hand` and `reserved`, creates `sale` movement).
  8. Idempotent: Duplicate callbacks return HTTP 200 without double-decrementing stock or re-sending confirmation emails.
- **Verification Criteria:**
  - Failed or cancelled payments transition order to `cancelled` and release inventory reservations back to available stock.
  - Transactional emails fire out-of-band without blocking database transactions.

### CUJ-06: Customer Isolation & Security
- **Steps:**
  1. Authenticated customer visits `/account/orders` and `/account/orders/[orderId]`.
  2. Customer can only access their own orders; accessing another user's order returns 404 Not Found.
  3. Guest orders are protected against unauthorized IDOR enumeration.
  4. Admin dashboard routes `/admin-dashboard/*` and server actions strictly enforce `requireAdminSession`.

---

## 4. Concurrency & Edge-Case Test Scenarios

1. **Race Condition on Last Stock Unit:**
   - Two customers attempt to reserve the last remaining unit concurrently.
   - Conditional database update (`WHERE on_hand - reserved >= quantity`) ensures exactly one succeeds and the second receives `InsufficientStockError`.
2. **Duplicate Callback Delivery:**
   - Safaricom delivers duplicate callbacks for the same `CheckoutRequestID`.
   - `DuplicateCallbackError` catches the second invocation and returns HTTP 200 (`Callback already processed`) without mutating database state.
3. **Out-of-Order / Delayed Callbacks:**
   - Callback arrives after customer leaves checkout page.
   - Status transitions from `pending` -> `confirmed` update order correctly; failure page polls `/api/payments/by-order/[orderId]` and detects recovery.
4. **Reservation Expiry:**
   - Customer initiates checkout but never completes M-Pesa PIN prompt.
   - Vercel Cron triggers `/api/cron/expire-reservations` with `Bearer <CRON_SECRET>`.
   - Reservations older than 15 minutes are transitioned to `expired` and stock is released.

---

## 5. Automated Regression Test Suite

All tests must be run via:
```bash
pnpm test
```
- `tests/auth.test.ts`: Password PBKDF2 hashing, salt generation, and verification.
- `tests/mpesa-phone.test.ts`: Phone number normalization (`07...`, `01...`, `+254...`, whitespace, hyphens, prefixes).
- `tests/mpesa-amounts.test.ts`: Minor-unit cent calculations and KES major-unit conversion.
- `tests/mpesa-callback.test.ts`: Daraja callback payload structural parsing and result code mapping.
- `tests/callback-idempotency.test.ts`: Idempotent processing of duplicate callbacks.
- `tests/order-status.test.ts`: State machine transition validation (`pending` -> `confirmed` -> `processing` -> `shipped` -> `delivered`).
- `tests/embeddings.test.ts`: Embedding dimensions (1024), input sanitization, and fallback behavior.
- `tests/production-regression.test.ts`: Regression suite verifying all P0/P1 audit fixes (stk query URL, authorization in payment status action, gift wrap pricing, guest order protection, and cart quantity validation).
