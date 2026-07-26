"use server";

import { db } from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { isAllowedAdminEmail } from "@/lib/admin-access";

/**
 * Verifies if current user has admin role
 */
export async function verifyAdmin() {
  const { userId } = await auth();

  if (!userId) {
    return false;
  }

  try {
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
    if (isAllowedAdminEmail(email)) return true;

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    return user?.role === "ADMIN";
  } catch (error) {
    console.error("Failed to verify admin:", error);
    return false;
  }
}

/**
 * Admin creates a new mechanic directly (no verification needed)
 */
export async function createMechanic(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const name = formData.get("name");
  const phone = formData.get("phone") || null;
  const aadhar = formData.get("aadhar") || null;
  const specialty = formData.get("specialty") || null;
  const experience = formData.get("experience");

  if (!name) {
    throw new Error("Name is required");
  }

  try {
    const mechanicClerkId = `admin-created-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    // Generate a unique placeholder email since DB requires it
    const placeholderEmail = `mechanic-${mechanicClerkId}@vapra.internal`;

    const user = await db.user.create({
      data: {
        email: placeholderEmail,
        clerkUserId: mechanicClerkId,
        name,
        phone: phone || null,
        aadhar: aadhar || null,
        role: "MECHANIC",
        specialty: specialty || null,
        experience: experience ? parseInt(experience) : 0,
      },
    });

    revalidatePath("/admin");
    return { success: true, mechanic: user };
  } catch (error) {
    console.error("Failed to create mechanic:", error);
    throw new Error(`Failed to create mechanic: ${error.message}`);
  }
}

/**
 * Gets all mechanics
 */
export async function getAllMechanics() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { mechanics: [] };

  try {
    const mechanics = await db.user.findMany({
      where: { role: "MECHANIC" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        aadhar: true,
        specialty: true,
        experience: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return { mechanics };
  } catch (error) {
    console.error("Failed to fetch mechanics:", error);
    return { mechanics: [], error: "Database unavailable" };
  }
}

/**
 * Gets mechanics with their work status
 */
export async function getMechanicsWithWorkStatus() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return { mechanics: [] };

  try {
    const mechanics = await db.user.findMany({
      where: { role: "MECHANIC" },
      include: {
        mechanicBookings: {
          where: {
            status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          },
          include: {
            vehicle: {
              select: { brand: true, model: true, registrationNo: true },
            },
            service: {
              select: { name: true, basePrice: true },
            },
            customer: {
              select: { name: true, email: true },
            },
          },
          orderBy: { scheduledAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const mechanicsWithStats = mechanics.map((mechanic) => ({
      ...mechanic,
      activeJobs: mechanic.mechanicBookings.length,
      scheduledCount: mechanic.mechanicBookings.filter((b) => b.status === "SCHEDULED").length,
      inProgressCount: mechanic.mechanicBookings.filter((b) => b.status === "IN_PROGRESS").length,
    }));

    return { mechanics: mechanicsWithStats };
  } catch (error) {
    console.error("Failed to fetch mechanics with work status:", error);
    return { mechanics: [], error: "Database unavailable" };
  }
}

/**
 * Approve or set verification status for mechanic
 */
export async function setMechanicVerification(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const mechanicId = formData.get("mechanicId");
  const status = formData.get("status");

  if (!mechanicId || !["PENDING", "VERIFIED", "REJECTED"].includes(status)) {
    throw new Error("Invalid mechanic status");
  }

  try {
    await db.user.update({
      where: { id: mechanicId },
      data: { verificationStatus: status },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/manage");
    return { success: true };
  } catch (error) {
    console.error("Failed to set mechanic verification status:", error);
    throw new Error(`Failed to set mechanic verification: ${error.message}`);
  }
}

/**
 * Updates mechanic details
 */
export async function updateMechanicDetails(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const mechanicId = formData.get("mechanicId");
  const name = formData.get("name");
  const specialty = formData.get("specialty");
  const experience = formData.get("experience");

  if (!mechanicId) throw new Error("Mechanic ID is required");

  try {
    await db.user.update({
      where: { id: mechanicId },
      data: {
        ...(name && { name }),
        ...(specialty && { specialty }),
        ...(experience && { experience: parseInt(experience) }),
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update mechanic:", error);
    throw new Error(`Failed to update mechanic: ${error.message}`);
  }
}

/**
 * Removes a mechanic (sets role back to CUSTOMER)
 */
export async function removeMechanic(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const mechanicId = formData.get("mechanicId");
  if (!mechanicId) throw new Error("Mechanic ID is required");

  try {
    await db.user.update({
      where: { id: mechanicId },
      data: {
        role: "CUSTOMER",
        specialty: null,
        experience: 0,
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to remove mechanic:", error);
    throw new Error(`Failed to remove mechanic: ${error.message}`);
  }
}

export async function getAllBookings() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  try {
    const bookings = await db.booking.findMany({
      orderBy: { scheduledAt: "desc" },
      include: {
        customer: { select: { name: true, email: true } },
        mechanic: { select: { name: true, specialty: true } },
        service: { select: { name: true, basePrice: true } },
        vehicle: { select: { brand: true, model: true, registrationNo: true } },
      },
      take: 50,
    });

    return { bookings };
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    throw new Error("Failed to fetch bookings");
  }
}

export async function updateBookingStatus(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");

  const bookingId = formData.get("bookingId");
  const status = formData.get("status");

  if (!bookingId || !status) throw new Error("Missing booking ID or status");
  if (!["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(status)) {
    throw new Error("Invalid status");
  }

  try {
    await db.booking.update({
      where: { id: bookingId },
      data: { status },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update booking status:", error);
    throw new Error("Failed to update booking status");
  }
}

/**
 * Mark attendance for a mechanic
 */
export async function markMechanicAttendance(formData) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) throw new Error("Unauthorized");
  if (!db.mechanicAttendance) {
    throw new Error(
      "Attendance model is not available yet. Run `npx prisma migrate dev` and `npx prisma generate`, then restart the server."
    );
  }

  const mechanicId = formData.get("mechanicId");
  const dateValue = formData.get("date");
  const status = formData.get("status");
  const note = formData.get("note");

  if (!mechanicId || !dateValue || !["PRESENT", "ABSENT"].includes(status)) {
    throw new Error("Invalid attendance details");
  }

  const parsedDate = new Date(`${dateValue}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime())) throw new Error("Invalid attendance date");

  try {
    const { userId } = await auth();
    const admin = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true },
    });

    await db.mechanicAttendance.upsert({
      where: {
        mechanicId_date: { mechanicId, date: parsedDate },
      },
      update: {
        status,
        note: note ? String(note) : null,
        markedById: admin?.id || null,
      },
      create: {
        mechanicId,
        date: parsedDate,
        status,
        note: note ? String(note) : null,
        markedById: admin?.id || null,
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to mark mechanic attendance:", error);
    throw new Error(`Failed to mark attendance: ${error.message}`);
  }
}