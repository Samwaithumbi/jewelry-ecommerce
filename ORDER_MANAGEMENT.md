# Order Management System Documentation

## Overview

The Order Management System provides a complete backend and frontend solution for managing customer orders, including order status tracking, email notifications, and admin/customer interfaces.

## Features

- **Order Status State Machine** - Valid transitions between order statuses
- **Admin Order Management** - List, filter, search, bulk update, and view order details
- **Customer Order Portal** - Order history and detailed order tracking
- **Transactional Emails** - Order confirmation, shipped, and delivered email templates
- **Tracking Integration** - Support for multiple carriers (FedEx, UPS, DHL, USPS)

## Database Schema

### Orders Table
```sql
- id: UUID (primary key)
- order_number: String (unique)
- user_id: UUID (nullable, for guest orders)
- status: Enum (pending, confirmed, processing, shipped, delivered, cancelled, refunded)
- subtotal_cents: Integer
- shipping_cents: Integer (nullable)
- tax_cents: Integer (nullable)
- total_cents: Integer
- stripe_payment_intent_id: String
- shipping_address: JSONB
- tracking_number: String (nullable)
- carrier: String (nullable)
- created_at: Timestamp
- shipped_at: Timestamp (nullable)
- delivered_at: Timestamp (nullable)
```

### Order Items Table
```sql
- id: UUID (primary key)
- order_id: UUID (foreign key)
- product_id: UUID
- variant_id: UUID (nullable)
- qty: Integer
- price_cents: Integer
- engraving_text: String (nullable)
```

## Order Status State Machine

### Valid Transitions

```
pending → confirmed → processing → shipped → delivered
         ↓           ↓
      cancelled   cancelled
```

**Rules:**
- Orders can only move forward in the workflow
- Cancellation is allowed from: pending, confirmed, processing
- Refunded is a terminal state (manually set)
- Once delivered, status cannot be changed

### Status Helper Functions

Located in `lib/order-status.ts`:

```typescript
import { 
  OrderStatus, 
  isValidStatusTransition, 
  getStatusLabel, 
  getStatusColor,
  getNextValidStatuses 
} from '@/lib/order-status';

// Check if a transition is valid
isValidStatusTransition('pending', 'confirmed') // true
isValidStatusTransition('shipped', 'pending') // false

// Get human-readable label
getStatusLabel('shipped') // 'Shipped'

// Get UI color class
getStatusColor('shipped') // 'bg-indigo-100 text-indigo-800'

// Get next valid statuses for a dropdown
getNextValidStatuses('confirmed') // ['processing', 'cancelled']
```

## API Endpoints

### GET /api/orders

List orders with filtering and pagination.

**Query Parameters:**
- `status` (optional) - Filter by order status
- `search` (optional) - Search by order number or address
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20)
- `sortBy` (optional) - Sort column (default: createdAt)
- `sortOrder` (optional) - Sort direction: asc/desc (default: desc)

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "id": "uuid",
      "orderNumber": "ORD-12345",
      "status": "confirmed",
      "totalCents": 10000,
      "shippingAddress": { ... },
      "trackingNumber": null,
      "carrier": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "shippedAt": null,
      "deliveredAt": null,
      "userId": "uuid",
      "userName": "John Doe",
      "userEmail": "john@example.com"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### PATCH /api/orders

Bulk update order status.

**Request Body:**
```json
{
  "orderIds": ["uuid1", "uuid2"],
  "status": "shipped",
  "trackingNumber": "1234567890",
  "carrier": "FedEx"
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    { "orderId": "uuid1", "success": true },
    { "orderId": "uuid2", "success": false, "error": "Invalid transition" }
  ]
}
```

### GET /api/orders/[orderId]

Get detailed order information with items.

**Response:**
```json
{
  "success": true,
  "order": { ... },
  "items": [
    {
      "id": "uuid",
      "qty": 2,
      "priceCents": 5000,
      "productId": "uuid",
      "productName": "Gold Ring",
      "productSlug": "gold-ring"
    }
  ]
}
```

## Frontend Pages

### Admin Pages

#### Orders List
**Route:** `/admin/admin-dashboard/orders`

Features:
- Status filter dropdown
- Search by order number or address
- Bulk selection with checkboxes
- Bulk status update
- Pagination
- Click to view order details

#### Order Detail
**Route:** `/admin/orders/[orderId]`

Features:
- Order items with pricing
- Customer information
- Shipping address
- Status timeline visualization
- Status update with validation
- Tracking number/carrier input
- Shipping label button
- Track package link

### Customer Pages

#### Order History
**Route:** `/account/orders`

Features:
- List of customer orders
- Status badges with colors
- Tracking links (FedEx, UPS, DHL, USPS)
- Order status guide
- Empty state with CTA

#### Order Detail
**Route:** `/account/orders/[orderId]`

Features:
- Full order details
- Items and pricing breakdown
- Status timeline
- Shipping address
- Package tracking with external links
- Support contact

## Email Templates

### Order Confirmation
**Template:** `components/templates/order-confirmed.tsx`

Triggered when: Order status changes to `confirmed`

Includes:
- Order number and date
- Item list with quantities and prices
- Order summary (subtotal, shipping, tax, total)
- Shipping address

### Order Shipped
**Template:** `components/templates/order-shipped.tsx`

Triggered when: Order status changes to `shipped`

Includes:
- Order number
- Tracking number and carrier
- Estimated delivery
- Item preview
- Track package CTA

### Order Delivered
**Template:** `components/templates/order-delivered.tsx`

Triggered when: Order status changes to `delivered`

Includes:
- Order number and delivery date
- Items delivered
- Jewelry care tips
- Review CTA

## Email Service

Located in `lib/email.ts`:

```typescript
import {
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail
} from '@/lib/email';

// Send order confirmation
await sendOrderConfirmationEmail({
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  orderNumber: 'ORD-12345',
  orderDate: '2024-01-01',
  items: [...],
  subtotal: '100.00',
  shipping: '10.00',
  tax: '8.00',
  total: '118.00',
  shippingAddress: {...}
});
```

## Server Actions

### Update Order Status
**File:** `app/actions/orders/update-order-status.ts`

Updates a single order status with validation and email triggers.

```typescript
import { updateOrderStatus } from '@/app/actions/orders/update-order-status';

await updateOrderStatus({
  orderId: 'uuid',
  status: 'shipped',
  trackingNumber: '1234567890',
  carrier: 'FedEx'
});
```

## Environment Variables

Add to `.env`:

```env
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourstore.com

# App URL for links
NEXT_PUBLIC_APP_URL=https://yourstore.com
```

## Tracking URLs

The system automatically generates tracking URLs for these carriers:

- **FedEx:** `https://www.fedex.com/fedextrack/?trknbr={trackingNumber}`
- **UPS:** `https://www.ups.com/track?tracknum={trackingNumber}`
- **DHL:** `https://www.dhl.com/en/express/tracking.html?tracking-id={trackingNumber}`
- **USPS:** `https://tools.usps.com/go/TrackConfirmAction?tLabels={trackingNumber}`

For other carriers, falls back to Google search.

## Usage Examples

### Creating an Order

Orders are created through the checkout process in `app/actions/checkout/create-order.ts`:

```typescript
const order = await createOrder({
  userId: session.user.id,
  items: cartItems,
  shippingAddress: address,
  paymentIntentId: pi.id
});
```

### Updating Order Status (Admin)

```typescript
// Via API
await fetch('/api/orders', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderIds: ['uuid'],
    status: 'shipped',
    trackingNumber: '1234567890',
    carrier: 'FedEx'
  })
});

// Via server action
await updateOrderStatus({
  orderId: 'uuid',
  status: 'shipped',
  trackingNumber: '1234567890',
  carrier: 'FedEx'
});
```

### Fetching Customer Orders

```typescript
const response = await fetch('/api/orders');
const data = await response.json();
console.log(data.orders);
```

## Status Colors

| Status | Color Class |
|--------|-------------|
| Pending | `bg-yellow-100 text-yellow-800` |
| Confirmed | `bg-blue-100 text-blue-800` |
| Processing | `bg-purple-100 text-purple-800` |
| Shipped | `bg-indigo-100 text-indigo-800` |
| Delivered | `bg-green-100 text-green-800` |
| Cancelled | `bg-red-100 text-red-800` |
| Refunded | `bg-gray-100 text-gray-800` |

## File Structure

```
lib/
├── order-status.ts          # Status state machine and helpers
├── email.ts                 # Email sending service
└── db.ts                    # Database connection

components/templates/
├── order-confirmed.tsx      # Confirmation email template
├── order-shipped.tsx        # Shipped email template
└── order-delivered.tsx      # Delivered email template

app/
├── actions/orders/
│   └── update-order-status.ts  # Status update server action
├── api/orders/
│   ├── route.ts              # List and bulk update API
│   └── [orderId]/route.ts    # Single order API
├── (admin)/
│   ├── admin-dashboard/orders/page.tsx  # Admin orders list
│   └── orders/[orderId]/page.tsx        # Admin order detail
└── (shop)/account/orders/
    ├── page.tsx              # Customer order history
    └── [orderId]/page.tsx    # Customer order detail
```

## Testing

To test the order management system:

1. **Create a test order** through the checkout flow
2. **View in admin** at `/admin/admin-dashboard/orders`
3. **Update status** using the bulk update or detail page
4. **Check emails** in Resend dashboard
5. **View customer portal** at `/account/orders`

## Notes

- Orders can be created without a user account (guest orders)
- Email sending requires valid Resend API key
- Status transitions are validated to prevent invalid state changes
- Tracking numbers are required when marking orders as shipped
- The system uses cents for all monetary values to avoid floating point errors
