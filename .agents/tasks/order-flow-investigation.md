# Order Flow Investigation Report
> Jewelry E-Commerce — Next.js + Drizzle ORM + NeonDB + M-Pesa (Safaricom Daraja) + Resend

---

## Executive Summary

The order-to-delivery flow is **substantially complete** — all the core layers exist (checkout → order creation → inventory reservation → M-Pesa payment → callback webhook → order confirmation email → admin status management → shipped/delivered emails). However, there are **seven concrete gaps** that will cause bugs or silent failures in production:

| # | Gap | Severity |
|---|-----|----------|
| 1 | Cart is **never cleared** after a successful payment | Critical |
| 2 | `emailShippedSent` / `emailDeliveredSent` timestamps are **never written** | High |
| 3 | Admin order detail page uses PATCH `/api/orders` (bulk endpoint) which **does not trigger emails** | High |
| 4 | Admin inventory adjust endpoint has **no auth guard** | High |
| 5 | Payment status API returns `success: false` for cancelled/failed, breaking the poller's success-path check | Medium |
| 6 | `checkPaymentStatus` server action passes `userId = undefined` — authorization is effectively disabled | Medium |
| 7 | Debug `fetch('http://127.0.0.1:7357/...')` instrumentation calls are embedded in production route handlers | Low |

---

## 1. Order Placement

### What exists

**Entry point:** `app/(shop)/checkout/page.tsx`

The checkout page is a three-step form (Shipping → Payment → Review). When the user advances to the Payment step, the `createOrderFromCart` server action is called automatically via a `useEffect`.

**`app/actions/checkout/create-order.ts` — `createOrderFromCart()`**
- Reads the cart from Redis via `getCart()`.
- Calculates `subtotalCents`, `shippingCents` (always 0), `giftWrapCents` ($12), and `taxCents` (16% VAT flat).
- Inserts a row into `orders` (status = `pending`) and inserts all cart items into `order_items`.
- Calls `reserveInventory()` from `lib/inventory/service.ts` for all items **that have a `variantId`** — items without variants are silently skipped.
- Returns `{ success, orderId, orderNumber, totalCents, reservationId }`.

**Gap:** The comment `// TODO: Implement clear cart functionality` is present at line 155 of `create-order.ts`. `clearCart()` exists in `app/actions/cart/clear-cart.ts` and works (deletes the Redis key) but is **never called after order creation or payment success**. The customer's cart remains populated forever after a successful purchase.

---

## 2. Payment Integration (M-Pesa / Safaricom Daraja)

### What exists

**STK Push initiation:** `app/api/payments/mpesa/stkpush/route.ts`
1. Validates request (Zod schema).
2. Calls `verifyOrderPayable()` — checks order exists, is not already paid, has a valid amount.
3. Creates a `payments` row (status = `pending`, expiry = 15 min from now).
4. Calls `initiateStkPush()` from `lib/mpesa/stk-push.ts`.
5. Updates the payment row with `MerchantRequestID` and `CheckoutRequestID`.

**Frontend polling:** `components/checkout/MpesaPaymentForm.tsx`
- Polls `GET /api/payments/[paymentId]` every 3 seconds.
- On success, calls `onSuccess(paymentId)` → checkout page calls `router.push('/checkout/success?orderId=...')`.
- On failure/cancellation, redirects to `/checkout/failure`.

**Webhook callback:** `app/api/payments/mpesa/callback/route.ts`
- Calls `processPaymentCallback()` from `lib/mpesa/db.ts`.
- Fully idempotent (duplicate callbacks return `ResultCode: 0` without re-processing).

**`lib/mpesa/db.ts` — `processPaymentCallback()`** — this is the critical function:
- Determines payment status from `resultCode` via `determinePaymentStatus()`.
- On **SUCCESS**: calls `confirmReservation()` (decrements `onHand`, removes from `reserved`, creates `sale` movement), updates order status to `confirmed`, fires `sendOrderConfirmationEmailAsync()` non-blocking.
- On **FAILED / CANCELLED**: calls `releaseReservation()` (decrements `reserved` only), updates order status to `cancelled`, fires `sendPaymentFailedEmailAsync()` non-blocking.

**Gap (Medium):** `GET /api/payments/[paymentId]/route.ts` returns `{ success: false, status: 'cancelled', error: '...' }` for cancelled/failed payments (HTTP 400). However, the frontend poller in `MpesaPaymentForm.tsx` checks `if (data.success)` to enter the success branch — so `success: false` with a `status` field is handled in the `else` branch. This is fragile: the else branch correctly checks `if (data.status === 'cancelled' || data.status === 'failed')`, so functionally it works, but it is inconsistent design that could break if someone refactors the poller.

---

## 3. Order Confirmation Email

### What exists

**Email service:** `lib/email.ts` using **Resend** + `@react-email/render`.

Four email types are implemented:
- `sendOrderConfirmationEmail()` — renders `components/templates/order-confirmed.tsx`
- `sendOrderShippedEmail()` — renders `components/templates/order-shipped.tsx`
- `sendOrderDeliveredEmail()` — renders `components/templates/order-delivered.tsx`
- `sendPaymentFailedEmail()` — renders `components/templates/payment-failed.tsx`

Each has an async wrapper:
- `sendOrderConfirmationEmailAsync(orderId)` — fetches order + customer + items, checks `emailConfirmationSent` for idempotency, sends email, stamps `emailConfirmationSent` on the order row, logs to `email_logs` table, and retries on failure via `lib/email-retry.ts`.
- `sendPaymentFailedEmailAsync(orderId)` — similar pattern, checks `email_logs` for idempotency.

**Where confirmation email is triggered:**
1. `lib/mpesa/db.ts` → `processPaymentCallback()` → on `SUCCESS` (primary path, via Daraja callback).
2. `app/actions/orders/update-order-status.ts` → `updateOrderStatus()` → on `newStatus === 'confirmed'` (admin manual override path).

**Gap (High):** `emailShippedSent` and `emailDeliveredSent` columns exist on the `orders` table (schema.ts lines 219–220) for idempotency, but are **never written**. The `updateOrderStatus` action sends shipped/delivered emails directly (not via async wrappers), has no idempotency check, and does not record to `email_logs`. If the admin accidentally marks an order shipped twice, the customer gets two shipping emails.

---

## 4. Inventory Management

### What exists

**Schema:** `drizzle/src/db/inventory-schema.ts`
- `inventory_locations` — supports multiple locations; code `MAIN` is the default.
- `inventory_levels` — `onHand`, `reserved`, `reorderPoint`, `reorderQuantity` per variant+location.
- `inventory_movements` — immutable audit ledger (types: purchase, sale, return, restock, adjustment, damage, loss, transfer_in, transfer_out).
- `inventory_reservations` + `inventory_reservation_items` — temporary holds during checkout.

**Service:** `lib/inventory/service.ts`
- `reserveInventory()` — atomic single-`UPDATE` check-and-increment on `reserved`; rolls back the reservation row if any item fails.
- `confirmReservation()` — decrements both `reserved` and `onHand`, inserts `sale` movement.
- `releaseReservation()` — decrements `reserved` only (no stock change), marks reservation `released`.
- `expireReservations()` — finds `active` reservations past `expiresAt`, calls `releaseReservation()`, marks `expired`. **This function exists but there is no cron job, scheduled worker, or API route calling it.** Expired reservations will hold reserved counts indefinitely unless this is wired up.
- `adjustInventory()`, `returnInventory()` — admin operations.

**Admin inventory UI:** `app/(admin)/admin-dashboard/inventory/` — fully functional CRUD for viewing, editing stock, restocking, and creating new SKUs. All operations persist to the database.

**Admin inventory API:** `app/api/admin/inventory/adjust/route.ts`
- Validates fields, looks up location, calls `adjustInventory()`.
- **Gap (High):** The auth guard is commented out: `// TODO: Add authentication/authorization check`. Any unauthenticated request can adjust inventory.

**Integration point (confirmed working):**
- `create-order.ts` calls `reserveInventory()` → items with `variantId` get reserved.
- `processPaymentCallback()` (success) calls `confirmReservation()` → `onHand` decremented.
- `processPaymentCallback()` (failure) calls `releaseReservation()` → `reserved` decremented.

**Gap (note):** Items in a cart that have no `variantId` are **silently skipped** during reservation. If such products exist, they can be oversold. The inventory action `getInventoryItems()` auto-creates a variant for any product that lacks one, which mitigates this in the admin context, but a product created without going through the admin inventory flow could still lack a variant at order time.

---

## 5. Order Lifecycle & Status Transitions

### What exists

**State machine:** `lib/order-status.ts`

```
pending → confirmed | cancelled
confirmed → processing | cancelled
processing → shipped | cancelled
shipped → delivered
delivered → refunded
cancelled → (terminal)
refunded → (terminal)
```

**Admin update paths:**
1. `PATCH /api/orders` (bulk) — `app/api/orders/route.ts` — updates DB but **does not send emails**.
2. `app/actions/orders/update-order-status.ts` — `updateOrderStatus()` — updates DB **and** triggers emails for `confirmed`, `cancelled`, `shipped`, `delivered`.

**Gap (High):** The admin order detail page (`app/(admin)/admin-dashboard/orders/[orderId]/page.tsx`) calls `PATCH /api/orders` (the bulk endpoint) when the admin updates a single order's status from the detail view. This path does **not** call `updateOrderStatus()` and therefore does **not** send any email notifications. Only the correct server action sends emails.

**Customer-facing order tracking:** No dedicated customer order tracking page was found under `app/(shop)/account/orders/`. The schema supports it (`orders.trackingNumber`, `orders.carrier`) but the UI page doesn't exist yet.

---

## 6. Webhooks

### What exists

- `POST /api/payments/mpesa/callback` — the only webhook endpoint.
- Validates Daraja callback structure via `isValidCallback()`.
- Processes idempotently via `processPaymentCallback()`.
- Returns `{ ResultCode: '0', ResultDesc: '...' }` to Daraja regardless of internal error, ensuring Daraja does not retry on duplicate callbacks.
- `MPESA_CALLBACK_URL` is configured in `.env`.

**No Stripe webhook handler exists**, even though `stripe` and `@stripe/react-stripe-js` are installed as dependencies. There is no `app/api/webhooks/stripe/` route. The app currently only supports M-Pesa payments despite having Stripe libraries installed.

---

## 7. Environment Variables

From `.env`:
- `DATABASE_URL` — NeonDB (Postgres serverless)
- `RESEND_API_KEY`, `EMAIL_FROM`, `DEV_EMAIL_OVERRIDE` — Resend email
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` — NextAuth v4
- `R2_*`, `S3_*` — Cloudflare R2 for image uploads
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — Redis (cart sessions)
- `MPESA_ENV`, `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`, `MPESA_CALLBACK_URL` — Daraja API

No Stripe keys are in `.env` despite the Stripe SDK being installed.

---

## 8. Debug Instrumentation in Production Code

Several route handlers and components contain `fetch('http://127.0.0.1:7357/ingest/...')` calls embedded in `#region agent log` blocks:
- `app/api/payments/mpesa/callback/route.ts` (2 calls)
- `lib/mpesa/db.ts` — `processPaymentCallback()` (1 call)
- `app/api/payments/mpesa/stkpush/route.ts` (3 calls)
- `components/checkout/MpesaPaymentForm.tsx` (2 calls)
- `app/(shop)/checkout/page.tsx` (1 call)

These are silent in production (`.catch(()=>{})` swallows errors) but are dead weight that should be removed before any code review or deployment audit.

---

## 9. What Is Missing or Incomplete

### Critical
1. **Cart not cleared after successful payment** — `clearCart()` exists in `app/actions/cart/clear-cart.ts` but is never called after payment success. Fix: call it inside `sendOrderConfirmationEmailAsync` or in the `handlePaymentSuccess` handler in checkout, after redirect.

### High
2. **Admin order detail status updates skip email notifications** — The detail page (`[orderId]/page.tsx`) uses `PATCH /api/orders` (bulk endpoint). Fix: update the page to call the `updateOrderStatus` server action directly, or add email triggering to the bulk PATCH handler.

3. **`emailShippedSent` / `emailDeliveredSent` never stamped** — `updateOrderStatus` sends shipped/delivered emails but doesn't write idempotency timestamps or log to `email_logs`. Fix: add `await db.update(orders).set({ emailShippedSent: new Date() })` and `logEmailSend()` calls mirroring the confirmation email pattern.

4. **Admin inventory adjustment API has no auth** — `app/api/admin/inventory/adjust/route.ts` allows unauthenticated stock changes. Fix: add NextAuth session check; reject if `role !== 'admin'`.

5. **No cron/worker for `expireReservations()`** — Reservations that expire (customer abandons checkout) hold `reserved` counts permanently. Fix: create a cron job (Next.js Route Handler + Vercel Cron or a separate worker) calling `expireReservations()` every few minutes.

### Medium
6. **`checkPaymentStatus` server action has no session auth** — `userId = undefined` comment is intentional placeholder. Fix: read `userId` from `getServerSession()`.

7. **Items without `variantId` skipped in inventory reservation** — silent oversell risk. Fix: either enforce that all products have variants (already partially handled by `getInventoryItems()` auto-creating variants), or log/error on items missing variantId at order creation time.

8. **No customer order tracking page** — the schema supports it (`trackingNumber`, `carrier`) but `app/(shop)/account/orders/` doesn't exist.

### Low
9. **Debug instrumentation in production** — remove all `#region agent log` fetch blocks from route handlers and components.

10. **Stripe SDK installed but unused** — either wire up Stripe as a second payment method or remove the dependency to reduce bundle size.

11. **`app/api/send/route.ts`** — hardcoded test email (`samuelwaithumbi6@gmail.com`) left in the codebase; this endpoint should be removed or locked down.

---

## 10. Complete Flow Diagram (as-built)

```
Customer adds items to cart (Redis)
           │
           ▼
    /checkout (page.tsx)
    Step 1: Shipping form
    Step 2: [useEffect] createOrderFromCart()
           │
           ├── INSERT orders (status=pending)
           ├── INSERT order_items
           └── reserveInventory()  ← atomic UPDATE on inventory_levels.reserved
                      │
                      ▼
           MpesaPaymentForm renders
           Customer enters phone number
                      │
                      ▼
           POST /api/payments/mpesa/stkpush
           ├── verifyOrderPayable()
           ├── createPayment() (status=pending)
           ├── initiateStkPush() → Daraja API
           └── updatePaymentWithStkPushIdentifiers()
                      │
                      ├─────────────────────────────────────┐
                      │                                     │
              Frontend polls                      Daraja sends callback
              GET /api/payments/[id]              POST /api/payments/mpesa/callback
              every 3s                                      │
                      │                           processPaymentCallback()
                      │                                     │
                      │                    ┌────────────────┴─────────────────┐
                      │                 SUCCESS                           FAIL/CANCEL
                      │                    │                                   │
                      │           confirmReservation()              releaseReservation()
                      │           onHand--, reserved--              reserved-- only
                      │           INSERT sale movement
                      │           UPDATE orders status=confirmed    UPDATE orders status=cancelled
                      │           sendOrderConfirmationEmailAsync() sendPaymentFailedEmailAsync()
                      │           [stamps emailConfirmationSent]    [logs to email_logs]
                      │                    │                                   │
              ◄────── poll detects         │                         /checkout/failure
                  status=success           │                         updatePaymentStatus()
                      │                   │                          (marks pending payments cancelled)
              router.push(/checkout/success?orderId=...)
              [CART NOT CLEARED ← BUG]
                      │
                      ▼
             Admin dashboard /admin-dashboard/orders
             Admin updates status: processing → shipped → delivered
             updateOrderStatus() [server action path — emails triggered]
             OR PATCH /api/orders [bulk path — NO emails ← BUG]
                      │
                      ├─ status=shipped  → sendOrderShippedEmail() [no idempotency stamp ← BUG]
                      └─ status=delivered → sendOrderDeliveredEmail() [no idempotency stamp ← BUG]
```

---

## Recommended Fixes (in priority order)

1. **Clear cart on payment success** — in `lib/mpesa/db.ts → processPaymentCallback()` after updating order to `confirmed`, dynamically import `clearCart` from `app/actions/cart/clear-cart.ts` and call it. Alternatively call it inside `sendOrderConfirmationEmailAsync` to keep the callback lean.

2. **Fix admin order detail page to use `updateOrderStatus`** — replace the `fetch('/api/orders', { method: 'PATCH' })` call in `app/(admin)/admin-dashboard/orders/[orderId]/page.tsx` with a direct call to the `updateOrderStatus` server action.

3. **Add idempotency stamps for shipped/delivered emails** — in `app/actions/orders/update-order-status.ts`, after sending `sendOrderShippedEmail`, write `emailShippedSent: new Date()` to the orders row and log to `email_logs`. Same for delivered.

4. **Add auth to inventory adjust API** — uncomment and complete the auth guard in `app/api/admin/inventory/adjust/route.ts`.

5. **Wire up `expireReservations()`** — create `app/api/cron/expire-reservations/route.ts` as a Vercel Cron (or equivalent) calling `expireReservations()` every 5 minutes.

6. **Add session auth to payment status routes** — pass actual `userId` from NextAuth session in `app/api/payments/[paymentId]/route.ts` and `app/actions/payments/check-payment-status.ts`.

7. **Remove debug instrumentation** — delete all `#region agent log` / `fetch('http://127.0.0.1:7357/...')` blocks from the 5 affected files.

8. **Build customer order tracking page** — create `app/(shop)/account/orders/page.tsx` to let logged-in customers view their order status and tracking numbers.

9. **Remove or secure `app/api/send/route.ts`** — the hardcoded test email endpoint should not remain in production.
