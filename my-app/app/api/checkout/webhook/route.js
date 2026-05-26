import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";
import { db } from "@/lib/prisma";

const razorpayWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

const PLAN_CREDITS = {
  basic: 10,     // Basic Service: 10 credits
  standard: 25,  // Complete Maintenance: 25 credits
  premium: 60,   // Premium Package: 60 credits
};

export async function POST(request) {
  if (!razorpayWebhookSecret) {
    console.error("Razorpay webhook secret not configured");
    return NextResponse.json({ message: "Webhook not configured" }, { status: 500 });
  }

  const body = await request.text();
  const sig = headers().get("x-razorpay-signature");

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac("sha256", razorpayWebhookSecret)
    .update(body)
    .digest("hex");

  if (sig !== expectedSignature) {
    console.error("Webhook signature verification failed");
    return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);

  // Handle payment success
  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    const orderId = payment.order_id;
    const notes = payment.notes || {};

    try {
      const planId = notes.planId || "standard"; // fallback
      const creditsToAdd = PLAN_CREDITS[planId] || 25; // default to standard

      // Find user by userId from notes
      const userId = notes.userId;
      if (!userId) {
        console.error("No userId in payment notes");
        return NextResponse.json({ message: "No userId in payment" }, { status: 400 });
      }

      const user = await db.user.findUnique({
        where: { clerkUserId: userId },
      });

      if (!user) {
        console.error("User not found for clerkUserId:", userId);
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }

      // Check if this payment was already processed
      const existingTransaction = await db.creditTransaction.findFirst({
        where: {
          userId: user.id,
          type: "CREDIT_PURCHASE",
          note: {
            contains: `Order: ${orderId}`,
          },
        },
      });

      if (existingTransaction) {
        console.log("Payment already processed for order:", orderId);
        return NextResponse.json({ message: "Already processed" }, { status: 200 });
      }

      // Add credits transactionally
      await db.$transaction(async (tx) => {
        await tx.creditTransaction.create({
          data: {
            userId: user.id,
            amount: creditsToAdd,
            type: "CREDIT_PURCHASE",
            note: `${planId} plan purchase - ${creditsToAdd} credits (Order: ${orderId})`,
          },
        });

        await tx.user.update({
          where: { id: user.id },
          data: { credits: { increment: creditsToAdd } },
        });
      });

      console.log(`Added ${creditsToAdd} credits to user ${user.id} for ${planId} plan (Order: ${orderId})`);
    } catch (error) {
      console.error("Error processing payment:", error);
      return NextResponse.json({ message: "Error processing payment" }, { status: 500 });
    }
  }

  return NextResponse.json({ status: "ok" });
}