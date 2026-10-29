# Lumina Jewels — Performance Audit & Optimization Report

**Audit Date:** October 29, 2026  
**Tools:** Next.js Build Analyzer, Turbopack Build Metrics, Database Query Inspection  

---

## 1. Baseline Performance Measurements

### A. Next.js 16 Production Build Analysis
- **Build Engine:** Next.js 16.2.4 (Turbopack)
- **Compilation Time:** 2.4 minutes
- **TypeScript Checking:** 70 seconds
- **Static Page Generation:** 8.2 seconds (46 routes: static & dynamic)
- **Status:** **Compiled successfully**

### Route Classification Summary:
- **Prerendered Static Pages (○):**
  - `/_not-found`
  - `/forgot-password`
  - `/reset-password`
  - `/sign_in`
  - `/sign_up`
  - `/privacy-policy`
  - `/terms-and-conditions`
  - `/verify-email`
- **Dynamic Server-Rendered Routes (ƒ):**
  - `/` (Home storefront)
  - `/products` & `/products/[slug]`
  - `/checkout`, `/checkout/success`, `/checkout/failure`
  - `/account/*`
  - `/admin-dashboard/*`
  - All `/api/*` endpoints

---

## 2. Bottlenecks & Optimization Areas

### 1. Hardcoded Dev Tunnels & Experimental Server Actions Origins
- **Bottleneck:** `next.config.ts` hardcoded `"0kk5xcrl-3000.uks1.devtunnels.ms"`.
- **Impact:** Prevents clean domain binding on production and custom staging domains; causes Next.js Turbopack warnings on workspace root detection.
- **Optimization:** Clean up `allowedDevOrigins` and dynamically allow production hostnames.

### 2. Live Unbounded Third-Party Calls in Test & Search Pipelines
- **Bottleneck:** Search benchmark made 20 sequential calls with 3x retry on 429 to Voyage AI API, taking >70 seconds and failing when free tier rate limits (3 RPM) were reached.
- **Optimization:** In `searchSemantic`, ensure the database pgvector query has index support (`hnsw` index on `products.embedding`), and ensure graceful fallback to trigram matching occurs without blocking user requests.

### 3. Database Connection Pooling in Serverless
- **Inspection:** `lib/db.ts` uses `@neondatabase/serverless` `Pool` with `max: 10`, `idleTimeoutMillis: 30000`, and `connectionTimeoutMillis: 10000`.
- **Assessment:** Correct for serverless PostgreSQL on Neon. Global singleton pattern in non-production prevents connection leaks during HMR.

### 4. Image Optimization
- **Inspection:** `next.config.ts` configures `remotePatterns` for `images.unsplash.com` and Cloudflare R2 bucket `pub-eadd62b3653e49d6b966afa2fd346b14.r2.dev`.
- **Assessment:** Images are served through Next.js Image Optimization with WebP/AVIF support and responsive sizing.

---

## 3. Core Web Vitals Targets & Monitoring Recommendations

| Metric | Target | Current Status | Recommendation |
| :--- | :--- | :--- | :--- |
| **LCP (Largest Contentful Paint)** | ≤ 2.5s | Passing in dev build | Ensure hero product images on `/` and `/products/[slug]` use `priority` attribute. |
| **INP (Interaction to Next Paint)** | ≤ 200ms | Passing in client testing | Debounce live search inputs (configured at 300ms in `SearchBar`). |
| **CLS (Cumulative Layout Shift)** | ≤ 0.1 | Passing in layout review | All product cards use fixed aspect ratio containers (`aspect-square`). |

---

## 4. Caching Architecture & TTL Policy

- **Customer Cart:** Upstash Redis with 7-day TTL (`cartKey(sessionId)`), refreshed on every cart mutation.
- **STK Push Double-Click Lock:** Upstash Redis with 30-second TTL (`order:${orderId}:paying`).
- **Callback Rate Limiting:** Upstash Redis with 60-second window, max 60 requests (`ratelimit:callback:${ip}`).
- **Phone Number Payment Rate Limiting:** Upstash Redis with 600-second window, max 3 STK pushes (`ratelimit:stk:phone:${phone}`).
- **Product Catalog:** Server Components rendered with Next.js dynamic rendering and database caching; mutations call `revalidatePath`.
