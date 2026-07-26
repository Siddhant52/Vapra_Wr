import { Vonage } from "@vonage/server-sdk";
import { Channels } from "@vonage/messages";

// Vonage's Messages API defaults to the PRODUCTION host (api.nexmo.com).
// A fresh Vonage account that's only set up on the Messages API Sandbox
// (dashboard shows "messages-sandbox.nexmo.com") needs this overridden,
// or every send silently fails because the sandbox sender/recipient
// numbers aren't recognized on production.
//
// Set VONAGE_WHATSAPP_API_HOST="https://api.nexmo.com" once you have an
// approved production WhatsApp Business sender.
const WHATSAPP_API_HOST =
  process.env.VONAGE_WHATSAPP_API_HOST || "https://messages-sandbox.nexmo.com";

const vonage = new Vonage(
  {
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET,
  },
  {
    apiHost: WHATSAPP_API_HOST,
  }
);

// The Vonage WhatsApp-enabled sender number (Business API / Sandbox number),
// e.g. "14157386102" — NOT the same as your SMS "from" name.
const WHATSAPP_FROM = process.env.VONAGE_WHATSAPP_NUMBER;

/**
 * Format Indian phone number to international format (no +, no spaces)
 * e.g. 9876543210 -> 919876543210
 */
function formatPhone(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("91") && cleaned.length === 12) return cleaned;
  if (cleaned.length === 10) return `91${cleaned}`;
  return cleaned;
}

/**
 * Send a WhatsApp text message to a single phone number.
 * Fails silently (logs only) so a WhatsApp outage never blocks a booking flow.
 */
export async function sendWhatsApp(phone, message) {
  const to = formatPhone(phone);

  if (!to) {
    console.error("[WhatsApp] Invalid phone number:", phone);
    return null;
  }

  if (!process.env.VONAGE_API_KEY || !process.env.VONAGE_API_SECRET || !WHATSAPP_FROM) {
    console.warn(
      "[WhatsApp] Vonage WhatsApp not configured (missing VONAGE_API_KEY / VONAGE_API_SECRET / VONAGE_WHATSAPP_NUMBER). Skipping."
    );
    return null;
  }

  try {
    const result = await vonage.messages.send({
      messageType: "text",
      channel: Channels.WHATSAPP,
      text: message,
      to,
      from: WHATSAPP_FROM,
    });
    console.log("[WhatsApp] Sent:", result.messageUUID);
    return result;
  } catch (error) {
    const detail = error?.response?.data || error?.response?.body || error?.body;
    console.error(
      "[WhatsApp] Send failed for",
      to,
      "-",
      error?.response?.status || error?.message,
      detail ? JSON.stringify(detail) : "(no response body captured)"
    );
    return null;
  }
}

/**
 * Send the same WhatsApp message to every configured admin/owner number.
 * Set ADMIN_WHATSAPP_NUMBERS in .env as a comma-separated list, e.g.
 * ADMIN_WHATSAPP_NUMBERS="919876543210,919812345678"
 */
export async function sendWhatsAppToAdmins(message) {
  const raw = process.env.ADMIN_WHATSAPP_NUMBERS || "";
  const numbers = raw
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

  if (numbers.length === 0) {
    console.warn("[WhatsApp] No ADMIN_WHATSAPP_NUMBERS configured. Skipping admin alert.");
    return [];
  }

  const results = await Promise.all(numbers.map((n) => sendWhatsApp(n, message)));
  return results;
}

// ─── WhatsApp Templates ─────────────────────────────────────────────────────

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Sent to the ADMIN/OWNER whenever a customer creates a new booking request.
 * This is the "booking details land straight in my WhatsApp" notification.
 */
export function whatsappNewBookingAlert({
  requestId,
  customerName,
  phone,
  email,
  serviceName,
  vehicleInfo,
  issueDescription,
  preferredDate,
  preferredTimeSlot,
}) {
  const shortId = requestId ? requestId.slice(0, 8).toUpperCase() : "N/A";
  const lines = [
    `🔧 *New Booking Request* — VAP-${shortId}`,
    ``,
    `*Service:* ${serviceName}`,
    `*Customer:* ${customerName || "Guest"}`,
    `*Phone:* ${phone}`,
  ];
  if (email) lines.push(`*Email:* ${email}`);
  lines.push(
    `*Vehicle:* ${vehicleInfo}`,
    `*Issue:* ${issueDescription}`,
    `*Preferred Date:* ${formatDate(preferredDate)}${preferredTimeSlot ? ` (${preferredTimeSlot})` : ""}`,
    ``,
    `Open the admin panel to review and assign a mechanic.`
  );
  return lines.join("\n");
}

export function whatsappBookingCreated({ customerName, serviceName, preferredDate, requestId }) {
  const name = customerName || "there";
  return `Hi ${name}! 👋 Your booking request for *${serviceName}* on ${formatDate(
    preferredDate
  )} has been received at Vapra Workshop. Request ID: VAP-${requestId.slice(0, 8).toUpperCase()}. We'll review it shortly.`;
}

export function whatsappBookingReviewed({ customerName, serviceName }) {
  const name = customerName || "there";
  return `Hi ${name}! Your request for *${serviceName}* at Vapra Workshop has been reviewed. We'll assign a mechanic shortly. 🔧`;
}

export function whatsappBookingAssigned({ customerName, serviceName, preferredDate }) {
  const name = customerName || "there";
  return `Great news, ${name}! A mechanic has been assigned for your *${serviceName}* service on ${formatDate(
    preferredDate
  )}. See you soon at Vapra Workshop! ✅`;
}

export function whatsappBookingClosed({ customerName, serviceName }) {
  const name = customerName || "there";
  return `Hi ${name}, your *${serviceName}* service at Vapra Workshop is complete. Thank you for choosing us! 🙏 Reply if you need anything else.`;
}

export function whatsappBookingCancelled({ customerName, serviceName }) {
  const name = customerName || "there";
  return `Hi ${name}, your booking for *${serviceName}* at Vapra Workshop has been cancelled. Contact us anytime if you'd like to reschedule.`;
}

export function whatsappServiceDueReminder({ customerName }) {
  const name = customerName || "there";
  return `Hi ${name}! 🚗 Your vehicle is due for its next service at Vapra Workshop. Book now: https://vapraworkshop.com/onboarding`;
}

export function whatsappPostServiceCheckIn({ customerName }) {
  const name = customerName || "there";
  return `Hi ${name}! Thanks for choosing Vapra Workshop. How did your recent service go? Reply and let us know 😊`;
}

export function whatsappWinBack({ customerName }) {
  const name = customerName || "there";
  return `We miss you, ${name}! 🚗 It's been a while — book your next service at Vapra Workshop today: https://vapraworkshop.com/onboarding`;
}

/**
 * Free-form promotional/offer message, used by the admin broadcast tool.
 */
export function whatsappOffer({ customerName, offerText }) {
  const name = customerName || "there";
  return `Hi ${name}! 🎉 ${offerText}\n\n— Team Vapra Workshop`;
}
