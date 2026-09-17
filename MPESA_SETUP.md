# M-PESA Daraja Integration Setup

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# M-PESA Daraja Configuration
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_SHORTCODE=your_shortcode_here
MPESA_PASSKEY=your_passkey_here
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/mpesa/callback
MPESA_ENV=sandbox
```

## Environment Variables Explained

### Required Variables

- **MPESA_CONSUMER_KEY**: Your Daraja consumer key from the Safaricom developer portal
- **MPESA_CONSUMER_SECRET**: Your Daraja consumer secret from the Safaricom developer portal
- **MPESA_SHORTCODE**: Your Paybill number or Till number
- **MPESA_PASSKEY**: Your Lipa na M-PESA passkey from the Safaricom developer portal
- **MPESA_CALLBACK_URL**: The URL where Daraja will send payment callbacks
- **MPESA_ENV**: Either `sandbox` for testing or `production` for live payments

### Sandbox vs Production

**Sandbox Environment:**
- Use for testing and development
- Get credentials from: https://developer.safaricom.co.ke/
- Callback URL can use ngrok or similar tunneling service
- No real money is transferred

**Production Environment:**
- Use for live payments
- Get production credentials from Safaricom
- Callback URL must be HTTPS and publicly accessible
- Real money is transferred

## Getting Daraja Credentials

### Sandbox Credentials

1. Go to https://developer.safaricom.co.ke/
2. Sign up or log in
3. Create a new app
4. Copy the Consumer Key and Consumer Secret
5. Go to Test Credentials
6. Copy the Lipa na M-PESA Shortcode and Passkey

### Production Credentials

1. Contact Safaricom business support
2. Apply for production access
3. Provide your business details
4. Receive production credentials
5. Configure your callback URL in the Daraja portal

## Callback URL Configuration

The callback URL must be:
- Publicly accessible
- HTTPS (required for production)
- Able to receive POST requests from Safaricom

**For local development:**
Use a tunneling service like ngrok:
```bash
ngrok http 3000
```

Then set your callback URL to:
```
MPESA_CALLBACK_URL=https://your-ngrok-url.ngrok-free.app/api/payments/mpesa/callback
```

**For production:**
Set your callback URL to your production domain:
```
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/mpesa/callback
```

## Database Migration

The payment table has been added to your Drizzle schema. To apply the migration:

```bash
pnpm drizzle-kit push
```

This will create the `payments` table with the following structure:
- `id` (UUID, primary key)
- `order_id` (UUID, foreign key to orders)
- `provider` (varchar, e.g., 'mpesa')
- `amount` (integer, in cents)
- `phone_number` (varchar)
- `status` (enum: pending, success, failed, cancelled)
- `merchant_request_id` (varchar)
- `checkout_request_id` (varchar, unique)
- `mpesa_receipt_number` (varchar)
- `result_code` (varchar)
- `result_description` (text)
- `transaction_date` (timestamp)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Testing Phone Number Normalization

Run the phone number normalization tests:

```bash
npx tsx lib/mpesa/phone.test.ts
```

This will test:
- Valid phone number formats (07, 01, +254, 254)
- Invalid phone numbers
- Phone number masking
- Carrier detection

## API Endpoints

### Initiate STK Push
```
POST /api/payments/mpesa/stkpush
Content-Type: application/json

{
  "orderId": "uuid",
  "phoneNumber": "0712345678"
}
```

Response:
```json
{
  "success": true,
  "paymentId": "uuid",
  "checkoutRequestId": "ws_CO_...",
  "merchantRequestId": "..."
}
```

### Payment Status
```
GET /api/payments/[paymentId]
```

Response:
```json
{
  "success": true,
  "status": "pending",
  "amount": 450000,
  "mpesaReceiptNumber": null
}
```

### Callback Endpoint
```
POST /api/payments/mpesa/callback
```

This endpoint receives callbacks from Safaricom Daraja.

## Using the M-PESA Payment Form

Import and use the `MpesaPaymentForm` component in your checkout page:

```tsx
import { MpesaPaymentForm } from '@/components/checkout/MpesaPaymentForm';

function CheckoutPage() {
  return (
    <MpesaPaymentForm
      orderId="order-uuid"
      amountCents={450000}
      onSuccess={(paymentId) => {
        console.log('Payment successful:', paymentId);
      }}
      onFailure={(error) => {
        console.error('Payment failed:', error);
      }}
    />
  );
}
```

## Payment Flow

1. Customer enters phone number
2. Frontend calls STK Push API
3. Backend validates order and phone number
4. Backend creates pending payment record
5. Backend sends STK Push to Daraja
6. Customer receives M-PESA prompt on phone
7. Customer enters M-PESA PIN
8. Daraja processes transaction
9. Daraja sends callback to your server
10. Backend processes callback (idempotent)
11. Backend updates payment status
12. Backend updates order status if successful
13. Frontend polls for payment status
14. Customer sees success/failure message

## Security Considerations

- Never expose M-PESA credentials to the client
- Never use `NEXT_PUBLIC_` prefix for M-PESA environment variables
- Always validate phone numbers on the server
- Always retrieve payment amounts from the database
- Never trust payment status from the frontend
- Use HTTPS for callback URLs in production
- Implement rate limiting on STK Push endpoint
- Log all payment operations for audit trail
- Never log sensitive credentials or PINs

## Troubleshooting

### STK Push not appearing
- Check phone number format
- Verify callback URL is accessible
- Check Daraja credentials are correct
- Ensure MPESA_ENV is set correctly

### Callback not received
- Verify callback URL is publicly accessible
- Check ngrok tunnel if using local development
- Ensure callback URL is HTTPS in production
- Check server logs for callback errors

### Payment remains pending
- Check if callback was received
- Verify callback processing logic
- Check database for payment record
- Consider callback timeout (5 minutes)

### Invalid credentials error
- Verify Consumer Key and Secret
- Check Shortcode and Passkey
- Ensure correct environment (sandbox/production)
- Regenerate credentials if needed

### 401 Unauthorized
- Check Consumer Key and Secret
- Verify OAuth token generation
- Check if credentials are expired

## Common Daraja Result Codes

- **0**: Success
- **1032**: Request cancelled by user
- **1037**: Timeout (user didn't enter PIN)
- **2001**: Invalid initiator/shortcode
- **2002**: Invalid credentials
- **1036**: Insufficient funds

## Production Deployment Checklist

- [ ] Switch MPESA_ENV to `production`
- [ ] Use production Daraja credentials
- [ ] Set HTTPS callback URL
- [ ] Test callback endpoint accessibility
- [ ] Enable server-side authentication
- [ ] Implement rate limiting
- [ ] Set up monitoring and logging
- [ ] Test complete payment flow
- [ ] Configure error alerts
- [ ] Set up database backups
- [ ] Review security settings
- [ ] Test with small amounts first

## Support

For Daraja API issues:
- Documentation: https://developer.safaricom.co.ke/
- Support: contact@safaricom.co.ke

For integration issues:
- Check server logs
- Verify environment variables
- Test phone number normalization
- Check database connection
- Review callback processing
