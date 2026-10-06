# Production-Ready Email Notification Plan
## Post-Payment Confirmation Customer Communications

### Executive Summary
This document outlines a comprehensive, production-ready plan for email notifications sent to customers after payment confirmation. The plan ensures timely, accurate, and professional communication throughout the order lifecycle.

---

## 1. Current State Analysis

### Existing Infrastructure
- **Email Provider**: Resend (configured in `lib/email.ts`)
- **Email Templates**: 
  - Order Confirmed (`components/templates/order-confirmed.tsx`)
  - Order Shipped (`components/templates/order-shipped.tsx`)
  - Order Delivered (`components/templates/order-delivered.tsx`)
- **Payment Flow**: M-PESA STK Push with callback handling
- **Order Status Updates**: Server action for status transitions

### Identified Gaps
1. **Missing Integration**: Email sending not triggered in payment callback flow
2. **Incomplete Data**: Order items not fetched for email templates (TODO comments exist)
3. **No Logging**: Email send failures not tracked or retried
4. **Missing Templates**: Payment failed email not implemented
5. **Hardcoded URLs**: Store URLs hardcoded in templates
6. **No Idempotency**: Risk of duplicate emails on callback retries

---

## 2. Email Notification Triggers

### 2.1 Immediate Notifications (Payment Confirmation)

**Trigger**: M-PESA callback with successful payment (resultCode: '0')
**Timing**: Within 1-2 seconds of callback receipt
**Email**: Order Confirmation Email

**Flow**:
```
M-PESA Callback → processPaymentCallback() → Update order to 'confirmed' 
→ Fetch order details → Send order confirmation email
```

**Implementation Location**: `lib/mpesa/db.ts` - `processPaymentCallback()` function

### 2.2 Delayed Notifications (Order Lifecycle)

**Trigger**: Manual/admin status updates
**Timing**: On status change
**Emails**:
- Order Shipped Email (status: 'shipped')
- Order Delivered Email (status: 'delivered')

**Implementation Location**: `app/actions/orders/update-order-status.ts`

### 2.3 Failure Notifications

**Trigger**: Payment failure or cancellation
**Timing**: Immediately on failed callback
**Email**: Payment Failed Email (NEW)

**Implementation Location**: `lib/mpesa/db.ts` - `processPaymentCallback()` function

---

## 3. Email Templates Requirements

### 3.1 Order Confirmation Email (Existing - Enhancement Needed)

**Current Status**: Template exists, needs data integration

**Required Data**:
- Customer name and email
- Order number and date
- Order items (name, quantity, price, product image)
- Order summary (subtotal, shipping, tax, total)
- Shipping address
- Payment method (M-PESA)
- M-PESA receipt number
- Store URL (dynamic from env)
- Account/orders URL (dynamic from env)

**Enhancements Needed**:
- Add M-PESA receipt number display
- Add product images to order items
- Make URLs dynamic via environment variables
- Add estimated delivery timeline
- Add customer support contact info

### 3.2 Order Shipped Email (Existing - Enhancement Needed)

**Current Status**: Template exists, needs data integration

**Required Data**:
- Customer name and email
- Order number
- Tracking number
- Carrier name
- Tracking URL (carrier-specific)
- Estimated delivery date
- Order items summary

**Enhancements Needed**:
- Fetch order items
- Dynamic tracking URL generation based on carrier
- Add carrier logo if available

### 3.3 Order Delivered Email (Existing - Enhancement Needed)

**Current Status**: Template exists, needs data integration

**Required Data**:
- Customer name and email
- Order number
- Delivery date
- Order items summary

**Enhancements Needed**:
- Fetch order items
- Add review request link
- Add loyalty points earned notification

### 3.4 Payment Failed Email (NEW - Required)

**Purpose**: Notify customer when payment fails

**Required Data**:
- Customer name and email
- Order number
- Failure reason
- Retry instructions
- Alternative payment methods
- Support contact

**Template Location**: `components/templates/payment-failed.tsx`

---

## 4. Data Fetching Strategy

### 4.1 Order Items Fetching

**Current Issue**: Email templates have empty items array

**Solution**: Create helper function to fetch order items

**Implementation**:
```typescript
// lib/order-items.ts
export async function getOrderItems(orderId: string) {
  const items = await db
    .select({
      id: orderItems.id,
      productName: products.name,
      productSlug: products.slug,
      quantity: orderItems.quantity,
      priceCents: orderItems.priceCents,
      imageUrl: products.imageUrl,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));
  
  return items.map(item => ({
    name: item.productName,
    quantity: item.quantity,
    price: `$${(item.priceCents / 100).toFixed(2)}`,
    imageUrl: item.imageUrl,
  }));
}
```

### 4.2 Customer Data Fetching

**Current Implementation**: Already exists in `update-order-status.ts`

**Enhancement**: Extract to reusable helper function

```typescript
// lib/customer-data.ts
export async function getCustomerData(orderId: string) {
  const order = await getOrderById(orderId);
  
  if (order.userId) {
    const user = await db.select().from(users).where(eq(users.id, order.userId)).limit(1);
    return {
      email: user[0].email,
      name: user[0].name || 'Customer',
    };
  }
  
  // Guest order
  const address = order.shippingAddress as any;
  return {
    email: address?.email || '',
    name: address?.name || 'Customer',
  };
}
```

---

## 5. Integration Implementation Plan

### 5.1 Phase 1: Core Integration (High Priority)

**Task 1.1**: Create order items fetching helper
- File: `lib/order-items.ts`
- Function: `getOrderItems(orderId: string)`
- Tests: Unit tests for data fetching

**Task 1.2**: Integrate email sending into payment callback
- File: `lib/mpesa/db.ts`
- Function: `processPaymentCallback()`
- Change: After successful payment update, trigger email send
- Idempotency: Check if email already sent before sending

**Task 1.3**: Update email templates with dynamic URLs
- Files: All email templates
- Change: Replace hardcoded URLs with `process.env.NEXT_PUBLIC_APP_URL`
- Environment variables: Add to `.env.example`

**Task 1.4**: Fix order items in update-order-status
- File: `app/actions/orders/update-order-status.ts`
- Change: Fetch order items for all email sends
- Remove TODO comments

### 5.2 Phase 2: Failure Handling (High Priority)

**Task 2.1**: Create payment failed email template
- File: `components/templates/payment-failed.tsx`
- Content: Failure notification with retry options

**Task 2.2**: Add payment failed email to lib/email.ts
- File: `lib/email.ts`
- Function: `sendPaymentFailedEmail()`
- Integration: Call in payment callback on failure

**Task 2.3**: Add email logging
- File: `lib/email-logging.ts`
- Table: Create `email_logs` table in schema
- Fields: id, orderId, type, status, error, sentAt, retryCount
- Purpose: Track all email sends for debugging

### 5.3 Phase 3: Reliability & Monitoring (Medium Priority)

**Task 3.1**: Implement retry logic
- File: `lib/email.ts`
- Strategy: Exponential backoff (1min, 5min, 15min, 1hr)
- Max retries: 4 attempts
- Queue: Use background job or simple setTimeout

**Task 3.2**: Add email status tracking
- File: Update order schema
- Field: `emailConfirmationSent`, `emailShippedSent`, `emailDeliveredSent`
- Purpose: Prevent duplicate emails

**Task 3.3**: Add admin notification for email failures
- File: `lib/email.ts`
- Recipient: Admin email from env
- Trigger: After max retries exhausted
- Content: Order details and error message

### 5.4 Phase 4: Enhancements (Low Priority)

**Task 4.1**: Add product images to confirmation email
- File: `components/templates/order-confirmed.tsx`
- Change: Display product thumbnail in order items

**Task 4.2**: Add review request to delivered email
- File: `components/templates/order-delivered.tsx`
- Change: Add CTA for product review

**Task 4.3**: Add loyalty points notification
- File: `components/templates/order-delivered.tsx`
- Change: Display points earned from order

---

## 6. Environment Variables Required

Add to `.env` and `.env.example`:

```bash
# Email Configuration
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@maisondoree.com
RESEND_ADMIN_EMAIL=admin@maisondoree.com

# Store Configuration
NEXT_PUBLIC_APP_URL=https://maisondoree.com
NEXT_PUBLIC_STORE_NAME=Maison Dorée

# Email Retry Configuration
EMAIL_MAX_RETRIES=4
EMAIL_RETRY_DELAY_MS=60000
```

---

## 7. Database Schema Changes

### 7.1 Email Logs Table

```typescript
// drizzle/src/db/schema.ts
export const emailLogs = pgTable('email_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id),
  type: text('type').notNull(), // 'confirmation', 'shipped', 'delivered', 'failed'
  status: text('status').notNull(), // 'sent', 'failed', 'retrying'
  to: text('to').notNull(),
  error: text('error'),
  sentAt: timestamp('sent_at'),
  retryCount: integer('retry_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### 7.2 Order Email Flags

```typescript
// Add to orders table
emailConfirmationSent: timestamp('email_confirmation_sent'),
emailShippedSent: timestamp('email_shipped_sent'),
emailDeliveredSent: timestamp('email_delivered_sent'),
```

---

## 8. Error Handling Strategy

### 8.1 Email Send Failures

**Immediate Action**: Log error to email_logs table
**Retry**: Exponential backoff with max 4 retries
**Fallback**: Notify admin after max retries
**User Impact**: Order still processes, email is non-blocking

### 8.2 Data Fetching Failures

**Action**: Skip email send, log error
**Retry**: No retry (data issue won't resolve)
**Notification**: Alert admin via email logs
**Fallback**: Send simplified email without missing data

### 8.3 Template Rendering Failures

**Action**: Log error, send fallback plain text email
**Fallback**: Basic email with order number and support contact
**Notification**: Alert admin for template fix

---

## 9. Testing Strategy

### 9.1 Unit Tests

- Order items fetching
- Customer data fetching
- Email template rendering
- Email logging functions

### 9.2 Integration Tests

- Payment callback → email send flow
- Order status update → email send flow
- Retry logic
- Idempotency (duplicate callbacks)

### 9.3 End-to-End Tests

- Full payment flow with email verification
- Email delivery to test inbox
- Template rendering in multiple email clients

### 9.4 Manual Testing Checklist

- [ ] Order confirmation email received after payment
- [ ] Email contains correct order items
- [ ] Email contains M-PESA receipt number
- [ ] Links in email work correctly
- [ ] Order shipped email sent with tracking
- [ ] Order delivered email sent
- [ ] Payment failed email sent on failure
- [ ] Retry logic works on temporary failures
- [ ] No duplicate emails on callback retry

---

## 10. Monitoring & Alerts

### 10.1 Metrics to Track

- Email send success rate
- Email delivery rate (via Resend dashboard)
- Average email send time
- Email retry rate
- Template rendering errors

### 10.2 Alerts

- Email success rate < 95%
- Email send time > 5 seconds
- More than 10 consecutive failures
- Resend API quota exceeded

### 10.3 Dashboard

- Email logs table query interface
- Daily email volume chart
- Failure rate by email type
- Recent errors list

---

## 11. Security Considerations

### 11.1 Data Privacy

- No sensitive payment data in emails
- Mask partial credit card if used (not applicable for M-PESA)
- Use HTTPS for all email links

### 11.2 Anti-Abuse

- Rate limit email sends per order
- Validate email addresses before sending
- Use SPF/DKIM/DMARC for domain authentication

### 11.3 Callback Security

- Validate M-PESA callback signatures
- Idempotency to prevent duplicate emails
- Log all callback processing

---

## 12. Performance Considerations

### 12.1 Async Email Sending

- Send emails asynchronously after order update
- Don't block payment callback on email send
- Use background job queue for high volume

### 12.2 Template Caching

- Cache rendered templates
- Reuse for similar orders
- Invalidate on template changes

### 12.3 Batch Processing

- For bulk operations (e.g., admin updates), batch email sends
- Respect Resend API rate limits

---

## 13. Implementation Timeline

### Week 1: Core Integration
- Day 1-2: Create order items fetching helper
- Day 3-4: Integrate email into payment callback
- Day 5: Update templates with dynamic URLs

### Week 2: Data Integration
- Day 1-2: Fix order items in update-order-status
- Day 3-4: Create payment failed email template
- Day 5: Testing and bug fixes

### Week 3: Reliability
- Day 1-2: Add email logging table
- Day 3-4: Implement retry logic
- Day 5: Admin notification system

### Week 4: Testing & Deployment
- Day 1-2: Unit and integration tests
- Day 3: Manual testing
- Day 4: Staging deployment
- Day 5: Production deployment

---

## 14. Rollout Strategy

### 14.1 Staging Environment
- Deploy to staging first
- Test with real payment callbacks
- Verify email delivery
- Monitor for 1 week

### 14.2 Canary Deployment
- Enable for 10% of orders
- Monitor email success rate
- Check for errors
- Gradually increase to 100%

### 14.3 Rollback Plan
- Feature flag to disable email sending
- Revert to manual email sending if needed
- Database migration rollback if schema issues

---

## 15. Success Criteria

- **Email Success Rate**: > 98%
- **Email Delivery Time**: < 5 seconds from trigger
- **Duplicate Email Rate**: < 0.1%
- **Template Rendering Errors**: 0
- **Customer Satisfaction**: No complaints about missing emails

---

## 16. Maintenance

### 16.1 Regular Tasks
- Monitor email logs weekly
- Update templates for seasonal promotions
- Review Resend quota usage monthly
- Test email delivery quarterly

### 16.2 Template Updates
- Update store branding as needed
- Add new email types for new features
- A/B test subject lines and content

### 16.3 Documentation
- Keep this plan updated
- Document any new email types
- Maintain runbook for common issues

---

## Appendix A: Code Examples

### A.1 Updated processPaymentCallback with Email

```typescript
export async function processPaymentCallback(callbackData: ExtractedCallbackData) {
  const payment = await getPaymentByCheckoutRequestId(callbackData.checkoutRequestId);
  
  if (!payment) {
    throw new PaymentNotFoundError(callbackData.checkoutRequestId);
  }
  
  // Idempotency check
  if (payment.status === PaymentStatus.SUCCESS) {
    throw new DuplicateCallbackError(callbackData.checkoutRequestId);
  }
  
  const status = callbackData.resultCode === '0' 
    ? PaymentStatus.SUCCESS 
    : callbackData.resultCode === '1032' || callbackData.resultCode === '1037'
    ? PaymentStatus.CANCELLED
    : PaymentStatus.FAILED;
  
  const transactionDate = formatTransactionDate(callbackData.transactionDate);
  
  // Update payment
  const updatedPayment = await db
    .update(payments)
    .set({
      status,
      mpesaReceiptNumber: callbackData.mpesaReceiptNumber,
      resultCode: callbackData.resultCode,
      resultDescription: callbackData.resultDescription,
      transactionDate: transactionDate ? new Date(transactionDate) : null,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id))
    .returning();
  
  // If payment successful, update order and send email
  if (status === PaymentStatus.SUCCESS) {
    await db
      .update(orders)
      .set({
        status: 'confirmed' as any,
      })
      .where(eq(orders.id, payment.orderId));
    
    // Send confirmation email (async, non-blocking)
    sendOrderConfirmationEmailAsync(payment.orderId).catch(error => {
      console.error('Failed to send confirmation email:', error);
    });
  }
  
  // If payment failed, send failure email
  if (status === PaymentStatus.FAILED || status === PaymentStatus.CANCELLED) {
    sendPaymentFailedEmailAsync(payment.orderId, callbackData.resultDescription).catch(error => {
      console.error('Failed to send payment failed email:', error);
    });
  }
  
  return updatedPayment[0];
}
```

### A.2 Async Email Send Function

```typescript
async function sendOrderConfirmationEmailAsync(orderId: string) {
  try {
    const order = await getOrderById(orderId);
    const customer = await getCustomerData(orderId);
    const items = await getOrderItems(orderId);
    
    // Check if already sent
    if (order.emailConfirmationSent) {
      console.log('Confirmation email already sent for order:', orderId);
      return;
    }
    
    const result = await sendOrderConfirmationEmail({
      customerName: customer.name,
      customerEmail: customer.email,
      orderNumber: order.orderNumber,
      orderDate: order.createdAt.toISOString().split('T')[0],
      items,
      subtotal: (order.subtotalCents / 100).toFixed(2),
      shipping: ((order.shippingCents || 0) / 100).toFixed(2),
      tax: ((order.taxCents || 0) / 100).toFixed(2),
      total: (order.totalCents / 100).toFixed(2),
      shippingAddress: order.shippingAddress as any,
    });
    
    if (result.success) {
      // Update order with email sent timestamp
      await db
        .update(orders)
        .set({ emailConfirmationSent: new Date() })
        .where(eq(orders.id, orderId));
      
      // Log email send
      await logEmailSend({
        orderId,
        type: 'confirmation',
        status: 'sent',
        to: customer.email,
      });
    }
  } catch (error) {
    await logEmailSend({
      orderId,
      type: 'confirmation',
      status: 'failed',
      to: customer.email,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
```

---

## Conclusion

This plan provides a comprehensive roadmap for implementing production-ready email notifications after payment confirmation. The phased approach ensures core functionality is delivered first, with reliability and monitoring added incrementally. All identified gaps are addressed with specific implementation details and success criteria.
