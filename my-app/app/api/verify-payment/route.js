import crypto from "crypto";
import { NextResponse } from "next/server";

const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json(
      { success: false, message: "Missing payment verification fields." },
      { status: 400 }
    );
  }

  if (!razorpayKeySecret) {
    return NextResponse.json(
      { success: false, message: "Razorpay secret not configured." },
      { status: 500 }
    );
  }

  const generatedSignature = crypto
    .createHmac("sha256", razorpayKeySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(generatedSignature);
  const receivedBuffer = Buffer.from(razorpay_signature);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return NextResponse.json(
      { success: false, message: "Signature mismatch." },
      { status: 400 }
    );
  }

  const isValid = crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

  if (!isValid) {
    return NextResponse.json(
      { success: false, message: "Signature mismatch." },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, message: "Payment verified successfully." });
}
