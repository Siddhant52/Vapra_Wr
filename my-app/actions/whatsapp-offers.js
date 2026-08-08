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

export async function uploadSmsBroadcastImage(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const file = formData.get("image");
  if (!file || typeof file === "string") {
    throw new Error("No image was provided");
  }
  if (!file.type || !file.type.startsWith("image/")) {
    throw new Error("File must be an image (JPEG, PNG, etc.)");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be under 5MB");
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("Image uploads aren't configured yet — connect a Vercel Blob store to this project.");
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
    throw new Error("Failed to upload image. Please try again.");
  }
}

/**
 * Admin-only: broadcast a promotional SMS to all customers who have a phone
 * number on file and have not opted out.
 */
export async function sendWhatsAppOfferBroadcast(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const title = (formData.get("title") || "").toString().trim();
  const offerText = (formData.get("offerText") || "").toString().trim();
  const imageUrl = (formData.get("imageUrl") || "").toString().trim();

  if (!offerText) {
    throw new Error("Offer message cannot be empty");
  }
  if (offerText.length > 900) {
    throw new Error("Offer message is too long (max 900 characters)");
  }
  if (title.length > 100) {
    throw new Error("Title is too long (max 100 characters)");
  }

  try {
    const customers = await db.user.findMany({
      where: { role: "CUSTOMER", phone: { not: null }, whatsappOptOut: false },
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
    throw new Error(`Failed to send broadcast: ${error.message}`);
  }
}
