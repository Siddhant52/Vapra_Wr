import { Vonage } from "@vonage/server-sdk";
import { Channels } from "@vonage/messages";

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET,
});

const FROM = process.env.VONAGE_FROM || "VapraWS";

/**
 * Format Indian phone number to international format
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
 * Send SMS to a phone number
 */
export async function sendSMS(phone, message) {
  console.log("=== SMS DEBUG ===");
  console.log("Phone:", phone);
  console.log("API Key loaded:", !!process.env.VONAGE_API_KEY);
  console.log("API Secret loaded:", !!process.env.VONAGE_API_SECRET);

  const to = formatPhone(phone);
  console.log("Formatted phone:", to);

  if (!to) {
    console.error("Invalid phone number:", phone);
    return;
  }

  if (!process.env.VONAGE_API_KEY || !process.env.VONAGE_API_SECRET) {
    console.warn("Vonage credentials not configured. Skipping SMS.");
    return;
  }

  try {
    const result = await vonage.messages.send({
      messageType: "text",
      channel: Channels.SMS,
      text: message,
      to,
      from: FROM,
    });
    console.log("SMS sent successfully:", result.messageUUID);
    return result;
  } catch (error) {
    console.error("SMS failed:", error?.message);
    console.error("SMS error details:", JSON.stringify(error, null, 2));
  }
}

// ─── SMS Templates ────────────────────────────────────────────────────────────

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://vapraworkshop.com")
  );
}

export function smsBookingCreated({ customerName, serviceName, preferredDate, requestId }) {
  const name = customerName || "Customer";
  const date = new Date(preferredDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const trackingLink = `${getBaseUrl()}/booking-status?accessCode=VAP-${requestId}`;
  return `Hi ${name}, your booking request for ${serviceName} on ${date} has been received at Vapra Workshop. Your request ID is VAP-${requestId.slice(0, 8).toUpperCase()}. Track your booking status here: ${trackingLink}`;
}

export function smsBookingReviewed({ customerName, serviceName }) {
  const name = customerName || "Customer";
  return `Hi ${name}, your booking request for ${serviceName} at Vapra Workshop has been reviewed by our team. We will assign a mechanic shortly. Stay tuned!`;
}

export function smsBookingAssigned({ customerName, serviceName, preferredDate }) {
  const name = customerName || "Customer";
  const date = new Date(preferredDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return `Hi ${name}, great news! A mechanic has been assigned for your ${serviceName} service on ${date} at Vapra Workshop. See you soon!`;
}

export function smsBookingClosed({ customerName, serviceName }) {
  const name = customerName || "Customer";
  return `Hi ${name}, your service request for ${serviceName} at Vapra Workshop has been completed and closed. Thank you for choosing us! For any queries, contact us.`;
}

export function smsBookingCancelled({ customerName, serviceName }) {
  const name = customerName || "Customer";
  return `Hi ${name}, your booking request for ${serviceName} at Vapra Workshop has been cancelled. Please contact us if you need help rescheduling.`;
}