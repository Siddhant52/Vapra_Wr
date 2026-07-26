import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { last10Digits, sendWhatsApp } from "@/lib/whatsapp";

/**
 * POST /api/whatsapp/inbound
 *
 * Set this URL as the "Inbound Message URL" on your Vonage Messages API
 * application (Vonage Dashboard → your Application → Capabilities →
 * Messages → Inbound URL), e.g.
 * https://vapraworkshop.com/api/whatsapp/inbound
 *
 * Vonage POSTs every inbound WhatsApp message here. We only care about
 * customers texting "STOP" (to opt out of promo broadcasts) or "START"
 * (to opt back in). Everything else is ignored — this does not affect
 * normal booking flows.
 */
export async function POST(req) {
  try {
    const body = await req.json();

    // Vonage's inbound payload nests the sender under `from`, which can be
    // either a plain string or an object like { type: "whatsapp", number }.
    const fromNumber =
      typeof body.from === "string" ? body.from : body.from?.number;

    // Message text can appear at a few different places depending on
    // message_type / API version.
    const text = (body.text || body.message?.content?.text || "").toString().trim();

    if (!fromNumber || !text) {
      // Not a text message we care about (e.g. delivery receipt) - ack and exit.
      return NextResponse.json({ ok: true });
    }

    const keyword = text.toLowerCase();
    const digits = last10Digits(fromNumber);

    if (!digits) {
      return NextResponse.json({ ok: true });
    }

    if (keyword === "stop" || keyword === "unsubscribe") {
      const result = await db.user.updateMany({
        where: { role: "CUSTOMER", phone: { endsWith: digits } },
        data: { whatsappOptOut: true },
      });
      if (result.count > 0) {
        await sendWhatsApp(
          fromNumber,
          "You've been unsubscribed from Vapra Workshop offers. Reply START anytime to opt back in."
        );
      }
    } else if (keyword === "start" || keyword === "subscribe") {
      const result = await db.user.updateMany({
        where: { role: "CUSTOMER", phone: { endsWith: digits } },
        data: { whatsappOptOut: false },
      });
      if (result.count > 0) {
        await sendWhatsApp(
          fromNumber,
          "You're subscribed to Vapra Workshop offers again. Reply STOP anytime to opt out."
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[WhatsApp inbound] Failed to process webhook:", error);
    // Always 200 so Vonage doesn't retry-storm us on a transient error.
    return NextResponse.json({ ok: true });
  }
}
