"use server";

import { randomUUID } from "crypto";
import { db } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { verifyAdmin } from "@/actions/admin";
import {
  sendSMS,
  smsBookingCreated,
  smsBookingReviewed,
  smsBookingAssigned,
  smsBookingClosed,
  smsBookingCancelled,
} from "@/lib/sms";
import {
  sendWhatsApp,
  sendWhatsAppToAdmins,
  whatsappNewBookingAlert,
  whatsappBookingCreated,
  whatsappBookingReviewed,
  whatsappBookingAssigned,
  whatsappBookingClosed,
  whatsappBookingCancelled,
} from "@/lib/whatsapp";

/**
 * Create service request (customer → admin review)
 */
export async function createServiceRequest(formData) {
  const { userId } = await auth();

  const serviceName = formData.get("serviceName");
  const vehicleInfo = formData.get("vehicleInfo");
  const issueDescription = formData.get("issueDescription");
  const preferredDateRaw = formData.get("preferredDate");
  const preferredTimeSlot = formData.get("preferredTimeSlot");
  const phone = formData.get("phone");
  const email = formData.get("email");

  if (!serviceName || !vehicleInfo || !issueDescription || !preferredDateRaw || !phone) {
    throw new Error("Missing required fields");
  }

  const preferredDate = new Date(preferredDateRaw);
  if (Number.isNaN(preferredDate.getTime())) {
    throw new Error("Invalid date");
  }

  let customer = null;
  let customerName = null;
  let customerEmail = email || null;

  if (userId) {
    const clerkUser = await currentUser();
    if (clerkUser) {
      customerEmail = customerEmail || clerkUser.emailAddresses[0]?.emailAddress || null;
      customerName = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || null;

      customer = await db.user.findUnique({
        where: { clerkUserId: userId },
        select: { id: true, name: true, email: true, phone: true },
      });
    }
  }

  try {
    console.debug("createServiceRequest input", {
      userId,
      serviceName,
      vehicleInfo,
      issueDescription,
      preferredDateRaw,
      preferredTimeSlot,
      phone,
      email,
      customerId: customer?.id ?? null,
      customerName,
      customerEmail,
    });

    const request = await db.bookingRequest.create({
      data: {
        id: randomUUID(),
        customerId: customer?.id ?? null,
        serviceName,
        vehicleInfo,
        issueDescription,
        preferredDate,
        preferredTimeSlot,
        phone,
        email: customerEmail,
        customerName,
        status: "PENDING",
      },
    });

    // Send SMS confirmation to customer
    await sendSMS(
      phone,
      smsBookingCreated({
        customerName,
        serviceName,
        preferredDate,
        requestId: request.id,
      })
    );

    // Send WhatsApp confirmation to customer
    await sendWhatsApp(
      phone,
      whatsappBookingCreated({
        customerName,
        serviceName,
        preferredDate,
        requestId: request.id,
      })
    );

    // Send full booking details to the admin/owner's WhatsApp
    await sendWhatsAppToAdmins(
      whatsappNewBookingAlert({
        requestId: request.id,
        customerName,
        phone,
        email: customerEmail,
        serviceName,
        vehicleInfo,
        issueDescription,
        preferredDate,
        preferredTimeSlot,
      })
    );

    revalidatePath("/services/request");
    revalidatePath("/admin");

    const guestTrackingCode = !customer?.id ? `VAP-${request.id}` : null;
    return { success: true, requestId: request.id, guestTrackingCode };
  } catch (error) {
    console.error("Service request failed:", error);
    throw new Error(`Failed to create request: ${error.message || String(error)}`);
  }
}

/**
 * Get all service requests (admin only)
 */
export async function getServiceRequests() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { requests: [] };

  try {
    const requests = await db.bookingRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return { requests };
  } catch (error) {
    console.error("Requests fetch failed:", error);
    return { requests: [] };
  }
}

/**
 * Update service request status (admin only) + send SMS
 */
export async function updateServiceRequestStatus(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const requestId = formData.get("requestId");
  const status = formData.get("status");

  if (!requestId || !["PENDING", "REVIEWED", "ASSIGNED", "COMPLETED", "CLOSED", "CANCELLED"].includes(status)) {
    throw new Error("Invalid input");
  }

  try {
    // Get current request to check previous status
    const currentRequest = await db.bookingRequest.findUnique({
      where: { id: requestId },
    });

    if (!currentRequest) {
      throw new Error("Request not found");
    }

    const previousStatus = currentRequest.status;

    const updated = await db.bookingRequest.update({
      where: { id: requestId },
      data: { status },
    });

    // Send SMS based on specific status transitions
    if (updated.phone) {
      const smsData = {
        customerName: updated.customerName,
        serviceName: updated.serviceName,
        preferredDate: updated.preferredDate,
      };

      // Send SMS + WhatsApp only for specific transitions
      if (previousStatus === "PENDING" && status === "REVIEWED") {
        await sendSMS(updated.phone, smsBookingReviewed(smsData));
        await sendWhatsApp(updated.phone, whatsappBookingReviewed(smsData));
      } else if (previousStatus === "REVIEWED" && status === "ASSIGNED") {
        await sendSMS(updated.phone, smsBookingAssigned(smsData));
        await sendWhatsApp(updated.phone, whatsappBookingAssigned(smsData));
      } else if (status === "COMPLETED") {
        await sendSMS(updated.phone, smsBookingClosed(smsData));
        await sendWhatsApp(updated.phone, whatsappBookingClosed(smsData));
      } else if (status === "CLOSED") {
        await sendSMS(updated.phone, smsBookingClosed(smsData));
        await sendWhatsApp(updated.phone, whatsappBookingClosed(smsData));
      } else if (status === "CANCELLED") {
        await sendSMS(updated.phone, smsBookingCancelled(smsData));
        await sendWhatsApp(updated.phone, whatsappBookingCancelled(smsData));
      }
    }

    revalidatePath("/admin");
    return { success: true, request: updated };
  } catch (error) {
    console.error("Status update failed:", error);
    throw new Error("Failed to update status");
  }
}

/**
 * Cancel own service request
 */
export async function cancelOwnServiceRequest(formData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const requestId = formData.get("requestId");
  if (!requestId) throw new Error("Missing request ID");

  try {
    const customer = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true },
    });

    if (!customer) throw new Error("Customer not found");

    const request = await db.bookingRequest.findFirst({
      where: {
        id: requestId,
        customerId: customer.id,
        status: { in: ["PENDING"] },
      },
    });

    if (!request) throw new Error("Cannot cancel this request");

    await db.bookingRequest.update({
      where: { id: requestId },
      data: { status: "CANCELLED" },
    });

    // Send cancellation SMS + WhatsApp
    if (request.phone) {
      await sendSMS(
        request.phone,
        smsBookingCancelled({
          customerName: request.customerName,
          serviceName: request.serviceName,
        })
      );
      await sendWhatsApp(
        request.phone,
        whatsappBookingCancelled({
          customerName: request.customerName,
          serviceName: request.serviceName,
        })
      );
    }

    revalidatePath("/services");
    return { success: true };
  } catch (error) {
    console.error("Cancel failed:", error);
    throw new Error(error.message);
  }
}

export {
  createServiceRequest as createBookingRequest,
  cancelOwnServiceRequest as cancelOwnBookingRequest,
};