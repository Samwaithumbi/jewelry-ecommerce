# Environment Variables for Email Notifications

Add these variables to your `.env` file:

```bash
# Email Configuration
RESEND_API_KEY=your_resend_api_key_here
RESEND_FROM_EMAIL=noreply@maisondoree.com
RESEND_ADMIN_EMAIL=admin@maisondoree.com

# Store Configuration
NEXT_PUBLIC_APP_URL=https://maisondoree.com
NEXT_PUBLIC_STORE_NAME=Maison Dorée

# Email Retry Configuration
EMAIL_MAX_RETRIES=4
EMAIL_RETRY_DELAY_MS=60000
```

## Variable Descriptions

### RESEND_API_KEY
Your Resend API key for sending emails. Get this from [resend.com](https://resend.com).

### RESEND_FROM_EMAIL
The email address from which emails will be sent. Should be a verified domain in Resend.

### RESEND_ADMIN_EMAIL
Admin email address to receive notifications about email failures.

### NEXT_PUBLIC_APP_URL
Your store's public URL. Used in email links and CTAs.

### NEXT_PUBLIC_STORE_NAME
Your store name. Used in email headers and branding.

### EMAIL_MAX_RETRIES
Maximum number of retry attempts for failed emails. Default: 4

### EMAIL_RETRY_DELAY_MS
Base delay for email retry in milliseconds (exponential backoff). Default: 60000 (1 minute)
