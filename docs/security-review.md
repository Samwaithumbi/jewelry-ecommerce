# Lumina Jewels — Application Security Review & Threat Model

**Audit Date:** October 29, 2026  
**Standards:** OWASP Top 10 Web Application Security Risks, ASVS (Application Security Verification Standard)  

---

## 1. Executive Summary

This document details the defensive application security review conducted on the Lumina Jewels codebase. The review encompasses broken access control, injection vulnerabilities, authentication and session management, file uploads, third-party payment callbacks, and sensitive data protection.

---

## 2. Threat Modeling & Vulnerability Findings

### SEC-01: Public Unauthenticated Debug Endpoint with Mutation Capability
- **Location:** `app/api/debug/embeddings/route.ts`
- **Severity:** **Critical (CVSS 9.1)**
- **Attack Vector:** An unauthenticated remote attacker issues a GET request to `/api/debug/embeddings?reindex=true`.
- **Impact:** 
  1. Triggers asynchronous bulk vector embedding reindexing for all active products via third-party Voyage AI API, draining API credits and causing financial loss or service disruption.
  2. Executes DDL statements `CREATE EXTENSION IF NOT EXISTS pg_trgm;` directly against Neon PostgreSQL.
  3. Dumps active product data and internal database column information.
- **Remediation:** Remove public exposure. Require `requireAdminSession` or disable the debug route in production mode.

### SEC-02: Information Disclosure on Guest Orders (IDOR)
- **Location:** `app/api/orders/[orderId]/route.ts`
- **Severity:** **High (CVSS 7.5)**
- **Attack Vector:** An attacker discovers or generates an order UUID that was placed by a guest (`order.userId === null`).
- **Impact:** The API route checks `if (order.userId && order.userId !== sessionUserId && !isAdmin)`. Because `order.userId` is null, the check succeeds, returning full customer name, delivery address, phone number, and email.
- **Remediation:** For orders without a `userId`, require a guest session match (`guest_session` cookie) or an order lookup verification token.

### SEC-03: IP Header Spoofing on Safaricom Callback Allowlist
- **Location:** `app/api/payments/mpesa/callback/route.ts`
- **Severity:** **High (CVSS 7.2)**
- **Attack Vector:** An attacker sends a forged `X-Forwarded-For: 196.201.214.1` header along with a malicious callback payload.
- **Impact:** The code inspects the first element of `X-Forwarded-For` (`split(',')[0]`). When behind a proxy that prepends or appends headers, trusting the leftmost header allows bypass of the Safaricom IP whitelist.
- **Remediation:** In production on Vercel, read `request.headers.get('x-real-ip')` or extract the trusted client IP. Ensure that ResultCode 0 callback processing still strictly requires matching `CheckoutRequestID`, matching amount, and cross-checks the Daraja query API.

### SEC-04: Hardcoded Developer Email in Transactional Email Fallback
- **Location:** `lib/emails/email.ts`
- **Severity:** **Medium (CVSS 6.5)**
- **Attack Vector:** A customer completes an order without an email or with empty email input.
- **Impact:** The email dispatcher routes the customer's order confirmation to `samuelwaithumbi6@gmail.com`, leaking customer order details to a personal developer account.
- **Remediation:** Disallow hardcoded developer email in production. Throw a validation error if the recipient is invalid.

### SEC-05: Unrestricted Cart Input Quantities in Server Actions
- **Location:** `app/actions/cart/add-to-cart.ts`, `app/actions/cart/update-qty.ts`
- **Severity:** **Medium (CVSS 5.3)**
- **Attack Vector:** An attacker calls `addToCart` or `updateQty` with negative, fractional, or arbitrarily large numbers (e.g. `qty: -50` or `qty: 1e9`).
- **Impact:** Corrupts Redis cart state, potentially causing downstream issues during checkout or cart rendering.
- **Remediation:** Enforce server-side integer bounds: `Number.isInteger(qty) && qty >= 1 && qty <= 100`.

---

## 3. Defense-in-Depth Verification

| Control Area | Implementation Status | Verification Evidence |
| :--- | :--- | :--- |
| **SQL Injection** | **PROTECTED** | All database operations use Drizzle ORM parameterized queries; raw SQL interpolations use `sql` template tags with parameter binding. |
| **Cross-Site Scripting (XSS)** | **PROTECTED** | React automatic JSX escaping in all templates; strict CSP and secure HTTP headers configured in `next.config.ts`. |
| **Password Storage** | **PROTECTED** | PBKDF2 with SHA-512, 100,000 iterations, unique 16-byte random cryptographic salts per user (`lib/password.ts`). |
| **Admin Route Authorization** | **PROTECTED** | `AdminLayout` and admin server actions (`lib/auth-guard.ts:requireAdminSession`) query PostgreSQL directly to verify `users.role === 'admin'`, preventing forged JWT claims. |
| **File Upload Security** | **PROTECTED** | R2 upload endpoint (`app/api/upload/route.ts`) checks admin session, validates MIME types against an allowlist, inspects file magic bytes (JPEG, PNG, WebP, GIF), limits size to 10MB, and generates random UUID object keys. |
| **M-Pesa Amount Tampering** | **PROTECTED** | STK Push calculates payable amount from server-authoritative database records (`orders.totalCents`), never from client input. Callback amount is cross-checked in whole KSh against database expected values (`lib/mpesa/db.ts:252-268`). |
| **Double-Payment Lock** | **PROTECTED** | Upstash Redis distributed lock (`order:${orderId}:paying`) with 30s TTL prevents concurrent duplicate STK Push requests. |

---

## 4. Remediation Verification

All security findings identified above are resolved in the production readiness remediation phase and verified via automated regression tests in `tests/production-regression.test.ts`.
