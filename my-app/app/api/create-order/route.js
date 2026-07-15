import { NextResponse } from "next/server";
import Razorpay from "razorpay";

function getRazorpayClient() {
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!razorpayKeyId || !razorpayKeySecret) {
    return null;
  }

  return new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
  });
}

function getRazorpayErrorMessage(error) {
  if (error?.error?.description) {
    return error.error.description;
  }

  if (error?.message) {
    return error.message;
  }

  return "Unable to create payment order. Please try again.";
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const amount = Number(body?.amount);
    const currency = body?.currency || "INR";
    const receipt = body?.receipt || `receipt_${Date.now()}`;

    if (!Number.isFinite(amount) || amount < 100) {
      return NextResponse.json(
        { message: "Amount must be at least 100 paise." },
        { status: 400 }
      );
    }

    if (!receipt) {
      return NextResponse.json(
        { message: "Receipt is required." },
        { status: 400 }
      );
    }

    const razorpay = getRazorpayClient();

    if (!razorpay) {
      return NextResponse.json(
        {
          message:
            "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.",
        },
        { status: 500 }
      );
    }

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      notes: {
        source: "standard-web-checkout",
      },
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    const description = getRazorpayErrorMessage(error);
    const isAuthFailure = /authentication/i.test(description);
    const status = error?.statusCode === 401 || isAuthFailure ? 401 : 500;
    const message = isAuthFailure
      ? "Razorpay authentication failed. Verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the server environment."
      : description;

    return NextResponse.json(
      {
        message,
      },
      { status }
    );
  }
}
