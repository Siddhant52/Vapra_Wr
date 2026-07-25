"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { clerkUserId: userId } });
  if (!user || user.role !== "ADMIN") throw new Error("Unauthorized");

  return user;
}

// ---------- SEGMENTATION ----------

export async function getCustomersByTag(tag) {
  await requireAdmin();

  const where = tag ? { tags: { has: tag } } : { role: "CUSTOMER" };

  return prisma.user.findMany({
    where: { ...where, role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      tags: true,
      createdAt: true,
      customerBookings: {
        select: { id: true, status: true, scheduledAt: true },
        orderBy: { scheduledAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateCustomerTags(userId, tags) {
  await requireAdmin();

  return prisma.user.update({
    where: { id: userId },
    data: { tags },
  });
}

// Auto-computes segments: frequent (3+ completed bookings in 60 days),
// at-risk (no booking in 90+ days but has booked before)
export async function computeAutoSegments() {
  await requireAdmin();

  const now = new Date();
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: {
      id: true,
      tags: true,
      customerBookings: {
        select: { status: true, scheduledAt: true },
      },
    },
  });

  const updates = [];

  for (const customer of customers) {
    const completed = customer.customerBookings.filter((b) => b.status === "COMPLETED");
    const recentCompleted = completed.filter((b) => b.scheduledAt >= sixtyDaysAgo);
    const lastBooking = completed.sort((a, b) => b.scheduledAt - a.scheduledAt)[0];

    const newTags = new Set(customer.tags.filter((t) => !["frequent", "at-risk"].includes(t)));

    if (recentCompleted.length >= 3) newTags.add("frequent");
    if (lastBooking && lastBooking.scheduledAt < ninetyDaysAgo) newTags.add("at-risk");

    const tagsArray = Array.from(newTags);
    if (JSON.stringify(tagsArray.sort()) !== JSON.stringify([...customer.tags].sort())) {
      updates.push(
        prisma.user.update({
          where: { id: customer.id },
          data: { tags: tagsArray },
        })
      );
    }
  }

  await Promise.all(updates);
  return { updated: updates.length };
}

// ---------- LEAD / PIPELINE ----------

export async function getLeadPipeline() {
  await requireAdmin();

  const requests = await prisma.bookingRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  const grouped = {
    PENDING: [],
    REVIEWED: [],
    ASSIGNED: [],
    COMPLETED: [],
    CANCELLED: [],
    CLOSED: [],
  };

  for (const req of requests) {
    grouped[req.status]?.push(req);
  }

  const total = requests.length;
  const completed = grouped.COMPLETED.length + grouped.CLOSED.length;
  const cancelled = grouped.CANCELLED.length;
  const conversionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0.0";

  return { grouped, total, completed, cancelled, conversionRate };
}

export async function markLeadLost(requestId, lostReason) {
  await requireAdmin();

  return prisma.bookingRequest.update({
    where: { id: requestId },
    data: { status: "CANCELLED", lostReason },
  });
}

// ---------- ANALYTICS ----------

export async function getOwnerAnalytics() {
  await requireAdmin();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    totalCustomers,
    payments,
    bookingsByStatus,
    bookingsByCategory,
    leadPipeline,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.payment.findMany({
      where: { status: "PAID", createdAt: { gte: sixMonthsAgo } },
      select: { amount: true, createdAt: true },
    }),
    prisma.booking.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.booking.findMany({
      select: { service: { select: { category: true, name: true } } },
    }),
    getLeadPipeline(),
  ]);

  // Revenue by month (last 6 months)
  const revenueByMonth = {};
  for (const p of payments) {
    const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, "0")}`;
    revenueByMonth[key] = (revenueByMonth[key] || 0) + p.amount;
  }

  // Repeat customer rate
  const customersWithCompletedCounts = await prisma.booking.groupBy({
    by: ["customerId"],
    where: { status: "COMPLETED" },
    _count: true,
  });
  const repeatCustomers = customersWithCompletedCounts.filter((c) => c._count >= 2).length;
  const repeatRate =
    customersWithCompletedCounts.length > 0
      ? ((repeatCustomers / customersWithCompletedCounts.length) * 100).toFixed(1)
      : "0.0";

  // Most requested service
  const serviceCounts = {};
  for (const b of bookingsByCategory) {
    const name = b.service?.name || "Unknown";
    serviceCounts[name] = (serviceCounts[name] || 0) + 1;
  }
  const topServices = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const atRiskCount = await prisma.user.count({
    where: { role: "CUSTOMER", tags: { has: "at-risk" } },
  });
  const frequentCount = await prisma.user.count({
    where: { role: "CUSTOMER", tags: { has: "frequent" } },
  });

  return {
    totalCustomers,
    revenueByMonth,
    bookingsByStatus,
    topServices,
    repeatRate,
    leadConversionRate: leadPipeline.conversionRate,
    atRiskCount,
    frequentCount,
  };
}