"use server";

import { put } from "@vercel/blob";
import { db } from "@/lib/prisma";
import { verifyAdmin } from "@/actions/admin";
import { sendWhatsApp, sendWhatsAppImage, whatsappOffer } from "@/lib/whatsapp";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Returns basic stats about how many customers can currently receive a
 * WhatsApp broadcast (i.e. have a phone number on file and haven't opted out).
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
    console.error("Failed to fetch WhatsApp audience stats:", error);
    return { totalCustomers: 0, reachableCustomers: 0, optedOutCustomers: 0 };
  }
}

/**
 * Admin-only: upload a promo image (a photo, banner, or graphic picked from
 * the admin's device) so it can be attached to a broadcast post. WhatsApp
 * requires a public HTTPS URL for images, so we store it in Vercel Blob and
 * return that URL.
 */
export async function uploadWhatsAppBroadcastImage(formData) {
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
    throw new Error(
      "Image uploads aren't configured yet — connect a Vercel Blob store to this project (adds BLOB_READ_WRITE_TOKEN automatically)."
    );
  }

  try {
    const safeName = file.name?.replace(/[^a-zA-Z0-9.\-_]/g, "-") || "image";
    const blob = await put(`whatsapp-broadcasts/${Date.now()}-${safeName}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return { url: blob.url };
  } catch (error) {
    console.error("Failed to upload WhatsApp broadcast image:", error);
    throw new Error("Failed to upload image. Please try again.");
  }
}

/**
 * Admin-only: broadcast a promotional WhatsApp post (optional title, body
 * text, optional image) to all customers who have a phone number on file
 * and have not opted out via "STOP".
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

    // Send sequentially in small batches to stay within provider rate limits.
    const BATCH_SIZE = 10;
    for (let i = 0; i < customers.length; i += BATCH_SIZE) {
      const batch = customers.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map((customer) => {
          const caption = whatsappOffer({ customerName: customer.name, title, offerText });
          return imageUrl
            ? sendWhatsAppImage(customer.phone, imageUrl, caption)
            : sendWhatsApp(customer.phone, caption);
        })
      );
      results.forEach((r) => (r ? sent++ : failed++));
    }

    return { success: true, sent, failed, total: customers.length };
  } catch (error) {
    console.error("Failed to send WhatsApp offer broadcast:", error);
    throw new Error(`Failed to send broadcast: ${error.message}`);
  }
}
