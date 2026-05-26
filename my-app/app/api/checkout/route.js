import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
const razorpay = razorpayKeyId && razorpayKeySecret ? new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
}) : null;

const PLANS = {
  basic: {
    name: "Basic Service",
    description: "Single service repair package",
    amount: 99900, // Amount in paisa (₹999 = 99900 paisa)
  },
  standard: {
    name: "Complete Maintenance",
    description: "Most popular for regular maintenance",
    amount: 199900, // ₹1999 = 199900 paisa
  },
  premium: {
    name: "Premium Package",
    description: "Fleet or specialized services",
    amount: 499900, // ₹4999 = 499900 paisa
  },
};

export async function POST(request) {
  if (!razorpay) {
    return NextResponse.json(
      { message: "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment." },
      { status: 500 }
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized. Please sign in to continue." }, { status: 401 });
  }

  const body = await request.json();
  const planId = body?.planId;
  const plan = PLANS[planId];

  if (!plan) {
    return NextResponse.json({ message: "Invalid plan selected." }, { status: 400 });
  }

  const clerkUser = await currentUser();
  const customerEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;
  const customerName = `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim();

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const options = {
      amount: plan.amount, // amount in paisa
      currency: "INR",
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: {
        planId: planId,
        userId: userId,
        customerEmail: customerEmail || "",
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planName: plan.name,
      key: razorpayKeyId,
    });
  } catch (error) {
    console.error("Order creation failed:", error);
    return NextResponse.json(
      { message: "Unable to create payment order. Please try again." },
      { status: 500 }
    );
  }
}
