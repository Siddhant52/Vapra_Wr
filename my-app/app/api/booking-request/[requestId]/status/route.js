import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/booking-request/[requestId]/status
 * Fetch the current status of a booking request for live updates
 */
export async function GET(req, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Await params in Next.js 16
    const { requestId } = await params;

    if (!requestId) {
      return NextResponse.json(
        { error: "Missing request ID" },
        { status: 400 }
      );
    }

    // Get the booking request
    const bookingRequest = await db.bookingRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        status: true,
        customerId: true,
        customer: {
          select: { clerkUserId: true },
        },
      },
    });

    if (!bookingRequest) {
      return NextResponse.json(
        { error: "Booking request not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    const customer = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true },
    });

    if (bookingRequest.customerId !== customer?.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        id: bookingRequest.id,
        status: bookingRequest.status,
        timestamp: new Date(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching booking status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}