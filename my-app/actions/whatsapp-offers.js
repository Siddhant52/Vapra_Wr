"use server";

import { put } from "@vercel/blob";
import { db } from "@/lib/prisma";
import { verifyAdmin } from "@/actions/admin";
import { buildSmsOfferMessage, sendSMS } from "@/lib/sms";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/**
 * Returns basic stats about how many customers can currently receive an SMS
 * broadcast (i.e. have a phone number on file and haven't opted out).
 */
export async function getWhatsAppAudienceStats() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { totalCustomers: 0, reachableCustomers: 0, optedOutCustomers: 0 };

  try {
    const [totalCustomers, reachableCustomers, optedOutCustomers] = await Promise.all([
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.user.count({
        where: { role: "CUSTOMER", phone: { not: null }, whatsappOptOut: false },
      }),
      db.user.count({ where: { role: "CUSTOMER", whatsappOptOut: true } }),
    ]);
    return { totalCustomers, reachableCustomers, optedOutCustomers };
  } catch (error) {
    console.error("Failed to fetch SMS audience stats:", error);
    return { totalCustomers: 0, reachableCustomers: 0, optedOutCustomers: 0 };
  }
}

/**
 * Returns the actual list of customers who can currently receive a
 * broadcast (phone on file, not opted out), so the admin can pick specific
 * recipients instead of only sending to everyone.
 */
export async function getBroadcastableCustomers() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return [];

  try {
    const customers = await db.user.findMany({
      where: { role: "CUSTOMER", phone: { not: null }, whatsappOptOut: false },
      select: { id: true, name: true, phone: true },
      orderBy: { name: "asc" },
    });
    return customers;
  } catch (error) {
    console.error("Failed to fetch broadcastable customers:", error);
    return [];
  }
}

export async function uploadSmsBroadcastImage(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Unauthorized" };

  const file = formData.get("image");
  if (!file || typeof file === "string") {
    return { error: "No image was provided" };
  }
  if (!file.type || !file.type.startsWith("image/")) {
    return { error: "File must be an image (JPEG, PNG, etc.)" };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "Image must be under 5MB" };
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error(
      "[SMS broadcast upload] BLOB_READ_WRITE_TOKEN is not set — connect a Vercel Blob store to this project (Vercel dashboard → Storage → Blob) and add the token to your environment variables."
    );
    return { error: "Image uploads aren't configured yet — connect a Vercel Blob store to this project." };
  }

  try {
    const safeName = file.name?.replace(/[^a-zA-Z0-9.\-_]/g, "-") || "image";
    const blob = await put(`sms-broadcasts/${Date.now()}-${safeName}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return { url: blob.url };
  } catch (error) {
    console.error("Failed to upload SMS broadcast image:", error);
    return { error: "Failed to upload image. Please try again." };
  }
}

/**
 * Admin-only: send a promotional SMS either to a specific list of selected
 * customers, or to every reachable customer (phone on file, not opted out).
 *
 * formData:
 *   - title, offerText, imageUrl: message content (same as before)
 *   - mode: "all" | "selected"
 *   - customerIds: JSON-stringified array of user IDs, required when mode is "selected"
 */
export async function sendWhatsAppOfferBroadcast(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { error: "Unauthorized" };

  const title = (formData.get("title") || "").toString().trim();
  const offerText = (formData.get("offerText") || "").toString().trim();
  const imageUrl = (formData.get("imageUrl") || "").toString().trim();
  const mode = (formData.get("mode") || "all").toString();
  const customerIdsRaw = (formData.get("customerIds") || "[]").toString();

  if (!offerText) {
    return { error: "Offer message cannot be empty" };
  }
  if (offerText.length > 900) {
    return { error: "Offer message is too long (max 900 characters)" };
  }
  if (title.length > 100) {
    return { error: "Title is too long (max 100 characters)" };
  }

  let customerIds = [];
  if (mode === "selected") {
    try {
      customerIds = JSON.parse(customerIdsRaw);
    } catch {
      return { error: "Invalid recipient selection" };
    }
    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      return { error: "Select at least one customer, or choose \"Broadcast to All\"." };
    }
  }

  try {
    const where =
      mode === "selected"
        ? { id: { in: customerIds }, role: "CUSTOMER", phone: { not: null }, whatsappOptOut: false }
        : { role: "CUSTOMER", phone: { not: null }, whatsappOptOut: false };

    const customers = await db.user.findMany({
      where,
      select: { name: true, phone: true },
    });

    if (customers.length === 0) {
      return { success: true, sent: 0, failed: 0, total: 0 };
    }

    let sent = 0;
    let failed = 0;

    const BATCH_SIZE = 10;
    for (let i = 0; i < customers.length; i += BATCH_SIZE) {
      const batch = customers.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map((customer) => {
          const message = buildSmsOfferMessage({ customerName: customer.name, title, offerText, imageUrl });
          return sendSMS(customer.phone, message);
        })
      );
      results.forEach((result) => (result ? sent++ : failed++));
    }

    return { success: true, sent, failed, total: customers.length };
  } catch (error) {
    console.error("Failed to send SMS offer broadcast:", error);
    return { error: `Failed to send broadcast: ${error.message}` };
  }
}
