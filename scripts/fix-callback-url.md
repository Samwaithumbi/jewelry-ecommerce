# Fix M-PESA Callback URL Issue

## Problem
Safaricom Daraja cannot send payment callbacks to your local development server because:
- Your callback URL is likely set to `http://localhost:3000/...`
- This is not accessible from the internet
- Daraja requires a publicly accessible HTTPS URL

## Solution: Use ngrok

### Step 1: Install ngrok
Download ngrok from https://ngrok.com/download

### Step 2: Start ngrok tunnel
Open a new terminal and run:
```bash
ngrok http 3000
```

This will give you a public URL like:
```
https://abc123.ngrok-free.app
```

### Step 3: Update your .env file
Update the MPESA_CALLBACK_URL to use your ngrok URL:

```env
MPESA_CALLBACK_URL=https://abc123.ngrok-free.app/api/payments/mpesa/callback
```

Replace `abc123.ngrok-free.app` with your actual ngrok URL from step 2.

### Step 4: Restart your dev server
Stop the current dev server and restart it:
```bash
pnpm dev
```

### Step 5: Test the payment flow
1. Initiate a new STK Push payment
2. Pay on your phone
3. The callback should now reach your server via ngrok
4. Payment status should update to "success"

## Alternative: Use a production server
If you have a production server with a public domain:
1. Deploy your app to production
2. Set MPESA_CALLBACK_URL to your production domain
3. Ensure the URL is HTTPS

## Verification
After fixing the callback URL, you can test by:
1. Initiating a payment
2. Paying on your phone
3. Checking the payment status in the database
4. The status should change from "pending" to "success" automatically

## Common Issues

### ngrok free tier limitations
- Free ngrok URLs change each time you restart ngrok
- You'll need to update your .env file each time
- Consider upgrading to ngrok paid tier for a fixed URL

### Firewall blocking
- Ensure your firewall allows ngrok to run
- Port 3000 must be accessible locally

### HTTPS requirement
- Daraja requires HTTPS for callbacks in production
- ngrok provides HTTPS automatically
- For production, you'll need an SSL certificate
