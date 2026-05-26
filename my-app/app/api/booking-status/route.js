import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";

export async function GET(req) {
  try {
    const { userId } = await auth();
    const url = new URL(req.url);
    const accessCode = (url.searchParams.get("accessCode") || "").trim();

    let where = null;

    if (userId) {
      const customer = await db.user.findUnique({
        where: { clerkUserId: userId },
        select: { id: true },
      });
      if (customer?.id) {
        where = { customerId: customer.id };
      }
    }

    if (!where) {
      if (!accessCode) {
        return NextResponse.json(
          { error: "Tracking code is required for guest bookings." },
          { status: 400 }
        );
      }

      // Handle both VAP-uuid and raw uuid formats
      // DO NOT uppercase — UUIDs are case-sensitive in PostgreSQL
      const normalized = accessCode.trim();
      const requestId = normalized.toUpperCase().startsWith("VAP-")
        ? normalized.slice(4) // slice after "VAP-" keeping original case
        : normalized;

      where = {
        id: requestId,
      };
    }

    const requests = await db.bookingRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        serviceName: true,
        vehicleInfo: true,
        issueDescription: true,
        preferredDate: true,
        preferredTimeSlot: true,
        status: true,
        createdAt: true,
        customerName: true,
        phone: true,
      },
      take: userId ? 50 : 1,
    });

    return NextResponse.json(
      { requests },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Failed to fetch booking status list:", error);
    return NextResponse.json(
      { error: "Failed to load booking requests" },
      { status: 500 }
    );
  }
}