"use server";

import { db } from "@/lib/prisma";
import { verifyAdmin } from "@/actions/admin";
import { sendWhatsApp, whatsappOffer } from "@/lib/whatsapp";

/**
 * Returns basic stats about how many customers can currently receive a
 * WhatsApp broadcast (i.e. have a phone number on file).
 */
export async function getWhatsAppAudienceStats() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { totalCustomers: 0, reachableCustomers: 0 };

  try {
    const [totalCustomers, reachableCustomers] = await Promise.all([
      db.user.count({ where: { role: "CUSTOMER" } }),
      db.user.count({ where: { role: "CUSTOMER", phone: { not: null } } }),
    ]);
    return { totalCustomers, reachableCustomers };
  } catch (error) {
    console.error("Failed to fetch WhatsApp audience stats:", error);
    return { totalCustomers: 0, reachableCustomers: 0 };
  }
}

/**
 * Admin-only: broadcast a promotional WhatsApp message to all customers
 * who have a phone number on file. Used for offers/promotions.
 */
export async function sendWhatsAppOfferBroadcast(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const offerText = (formData.get("offerText") || "").toString().trim();
  if (!offerText) {
    throw new Error("Offer message cannot be empty");
  }
  if (offerText.length > 1000) {
    throw new Error("Offer message is too long (max 1000 characters)");
  }

  try {
    const customers = await db.user.findMany({
      where: { role: "CUSTOMER", phone: { not: null } },
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
        batch.map((customer) =>
          sendWhatsApp(
            customer.phone,
            whatsappOffer({ customerName: customer.name, offerText })
          )
        )
      );
      results.forEach((r) => (r ? sent++ : failed++));
    }

    return { success: true, sent, failed, total: customers.length };
  } catch (error) {
    console.error("Failed to send WhatsApp offer broadcast:", error);
    throw new Error(`Failed to send broadcast: ${error.message}`);
  }
}
