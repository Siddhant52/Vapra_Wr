# Razorpay Payment Integration Setup

This document explains how to set up Razorpay payment processing for the Vapra Workshop service plans.

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_...your_razorpay_key_id...
RAZORPAY_KEY_SECRET=your_razorpay_key_secret...
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret...

# App URL (for production)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Razorpay Dashboard Setup

1. **Create a Razorpay Account**: Go to [razorpay.com](https://razorpay.com) and create an account.

2. **Get API Keys**:
   - In your Razorpay dashboard, go to Settings → API Keys
   - Generate Test API Key ID and Key Secret
   - Set `RAZORPAY_KEY_ID` to the Key ID
   - Set `RAZORPAY_KEY_SECRET` to the Key Secret

3. **Set up Webhooks**:
   - In Razorpay dashboard, go to Settings → Webhooks
   - Click "Add New Webhook"
   - Webhook URL: `https://yourdomain.com/api/checkout/webhook`
   - Active Events: Select `payment.captured`
   - Copy the Webhook Secret and set it as `RAZORPAY_WEBHOOK_SECRET`

## Testing

1. Use Razorpay test card details for testing:
   - Card Number: `4111 1111 1111 1111`
   - Expiry: Any future date (MM/YY)
   - CVV: `123`
   - OTP: `0000` (for test payments)

2. Test the flow:
   - Go to `/pricing` page
   - Click "Pay with Clerk" on any plan
   - Complete payment with test card
   - Should redirect to `/checkout/success`
   - Credits should be added to user account

## Production Deployment

1. Replace test keys with live keys (start with `rzp_live_`)
2. Update webhook endpoint URL to your production domain
3. Test thoroughly with small amounts before going live

## Plan Configuration

Current plans and credit allocations:

- **Basic Service** (₹999): 10 credits
- **Complete Maintenance** (₹1,999): 25 credits
- **Premium Package** (₹4,999): 60 credits

Credits are added to user accounts upon successful payment via webhook.