# WhatsApp CRM Setup

This adds WhatsApp notifications on top of your existing Vonage SMS setup. It reuses your existing `VONAGE_API_KEY` / `VONAGE_API_SECRET`, so most of the work is just enabling WhatsApp on your Vonage account and adding two new environment variables.

## What you get

1. **New booking → straight to your WhatsApp.** Whenever a customer submits a booking request, the full details (customer name, phone, vehicle info, issue description, preferred date) are sent to your WhatsApp number(s) immediately.
2. **Customer WhatsApp updates.** Customers automatically get a WhatsApp message when their booking is created, reviewed, assigned to a mechanic, completed, or cancelled — in addition to the existing SMS.
3. **Reminders over WhatsApp.** The existing follow-up reminder system (service-due, post-service check-in, win-back) now sends over WhatsApp.
4. **Offer broadcasts.** A new "WhatsApp" tab in the admin panel lets you write a one-off promotional message and send it to every customer with a phone number on file.

## 1. Enable WhatsApp on Vonage

1. Log in to the [Vonage API Dashboard](https://dashboard.nexmo.com/).
2. Go to **Messages API → Sandbox** (for testing) or set up a **WhatsApp Business Account** (for production — required before you can message customers who haven't opted in first).
   - **Sandbox mode**: free, but each recipient must first send a join code to Vonage's sandbox WhatsApp number before they can receive messages from you. Good for testing with your own phone.
   - **Production**: requires WhatsApp Business API approval through Vonage, a registered business, and pre-approved message templates for anything sent outside a 24-hour customer-initiated conversation window (this is a WhatsApp platform rule, not a Vonage one).
3. Note the **WhatsApp-enabled sender number** shown in your dashboard (e.g. `14157386102`). This is different from your SMS sender ID (`VapraWS`).

## 2. Add environment variables

Add these to your `.env` (and to your Vercel project's Environment Variables):

```dotenv
# The Vonage WhatsApp-enabled sender number (no + or spaces)
VONAGE_WHATSAPP_NUMBER=14157386102

# Comma-separated list of admin/owner WhatsApp numbers that should receive
# new-booking alerts. Use international format without + or spaces.
ADMIN_WHATSAPP_NUMBERS=919876543210,919812345678
```

Your existing `VONAGE_API_KEY` and `VONAGE_API_SECRET` are reused — no changes needed there.

**Important (sandbox mode only):** each number in `ADMIN_WHATSAPP_NUMBERS`, and any customer you expect to message, must first message the Vonage sandbox number with the join code shown in your dashboard. Until they do, messages to that number will silently fail (check your server logs for `[WhatsApp] Send failed`).

## 3. Apply the database migration

A migration adding `WHATSAPP` as a reminder channel has already been created at:
```
prisma/migrations/20260725140000_add_whatsapp_reminder_channel/migration.sql
```

Apply it:
```bash
npx prisma migrate dev
```
(Or `npx prisma migrate deploy` in production/CI.)

## 4. Where things live in the code

| What | File |
|---|---|
| WhatsApp sending + message templates | `lib/whatsapp.js` |
| New booking → admin WhatsApp alert | `actions/bookingRequest.js` (`createServiceRequest`) |
| Status-change → customer WhatsApp | `actions/bookingRequest.js` (`updateServiceRequestStatus`) and `app/api/booking-request/[requestId]/status/update/route.js` |
| Automated reminders over WhatsApp | `actions/reminders.js` (`processDueReminders`) |
| Offer broadcast (admin-only) | `actions/whatsapp-offers.js` |
| Admin "WhatsApp" tab UI | `app/(main)/admin/components/whatsapp-broadcast.jsx` |

## 5. Testing

1. Set `ADMIN_WHATSAPP_NUMBERS` to your own phone number and join the Vonage sandbox from that number.
2. Submit a test booking request from `/booking-request`.
3. You should receive a WhatsApp message with the booking details within a few seconds, and the customer's phone (if also joined to the sandbox) should get a confirmation.
4. Go to `/admin` → **WhatsApp** tab to try the offer broadcast tool.

If a message doesn't arrive, check your server logs for lines starting with `[WhatsApp]` — they'll tell you whether it's a missing env var, an unjoined sandbox number, or a Vonage API error.
