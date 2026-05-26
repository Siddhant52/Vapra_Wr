import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  sendSMS,
  smsBookingReviewed,
  smsBookingAssigned,
  smsBookingClosed,
  smsBookingCancelled,
} from "@/lib/sms";

const VALID_STATUSES = ["PENDING", "REVIEWED", "ASSIGNED", "COMPLETED", "CLOSED", "CANCELLED"];

/**
 * PUT /api/booking-request/[requestId]/status/update
 * Update the status of a booking request (admin only)
 */
export async function PUT(req, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin access
    const adminUser = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true, role: true, email: true },
    });

    // Allow admin role OR allow-listed emails
    const { isAllowedAdminEmail } = await import("@/lib/admin-access");
    const isAdmin =
      adminUser?.role === "ADMIN" || isAllowedAdminEmail(adminUser?.email);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Await params in Next.js 16
    const { requestId } = await params;

    if (!requestId) {
      return NextResponse.json({ error: "Missing request ID" }, { status: 400 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Get current booking request
    const bookingRequest = await db.bookingRequest.findUnique({
      where: { id: requestId },
    });

    if (!bookingRequest) {
      return NextResponse.json(
        { error: "Booking request not found" },
        { status: 404 }
      );
    }

    const previousStatus = bookingRequest.status;

    // Update status
    const updated = await db.bookingRequest.update({
      where: { id: requestId },
      data: { status },
    });

    // Send SMS based on status transition
    if (updated.phone) {
      const smsData = {
        customerName: updated.customerName,
        serviceName: updated.serviceName,
        preferredDate: updated.preferredDate,
      };

      if (previousStatus === "PENDING" && status === "REVIEWED") {
        await sendSMS(updated.phone, smsBookingReviewed(smsData));
      } else if (previousStatus === "REVIEWED" && status === "ASSIGNED") {
        await sendSMS(updated.phone, smsBookingAssigned(smsData));
      } else if (status === "COMPLETED" || status === "CLOSED") {
        await sendSMS(updated.phone, smsBookingClosed(smsData));
      } else if (status === "CANCELLED") {
        await sendSMS(updated.phone, smsBookingCancelled(smsData));
      }
    }

    return NextResponse.json(
      {
        success: true,
        request: {
          id: updated.id,
          status: updated.status,
          updatedAt: updated.updatedAt,
        },
      },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
  } catch (error) {
    console.error("Error updating booking status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}