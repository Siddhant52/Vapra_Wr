"use server";

import { prisma } from "@/lib/prisma";
import { sendSMS } from "@/lib/sms";

const SERVICE_DUE_DAYS = 90;

// Call this whenever a ServiceRecord is created (hook into wherever that happens now)
export async function scheduleServiceDueReminder(vehicleId, userId) {
  const dueDate = new Date(Date.now() + SERVICE_DUE_DAYS * 24 * 60 * 60 * 1000);

  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { nextServiceDueAt: dueDate },
  });

  return prisma.followUpReminder.create({
    data: {
      vehicleId,
      userId,
      type: "SERVICE_DUE",
      channel: "BOTH",
      scheduledAt: dueDate,
    },
  });
}

// Call this whenever a Booking status flips to COMPLETED
export async function schedulePostServiceCheckIn(vehicleId, userId) {
  const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return prisma.followUpReminder.create({
    data: {
      vehicleId,
      userId,
      type: "POST_SERVICE_CHECKIN",
      channel: "SMS",
      scheduledAt,
    },
  });
}

// Run weekly (or daily) — finds customers inactive 120+ days, creates win-back reminders
export async function scheduleWinBackReminders() {
  const cutoff = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);

  const inactiveVehicles = await prisma.vehicle.findMany({
    where: {
      bookings: {
        none: { status: "COMPLETED", scheduledAt: { gte: cutoff } },
      },
    },
    select: { id: true, ownerId: true },
  });

  const created = [];
  for (const v of inactiveVehicles) {
    const existing = await prisma.followUpReminder.findFirst({
      where: { vehicleId: v.id, type: "WIN_BACK", status: "PENDING" },
    });
    if (!existing) {
      created.push(
        prisma.followUpReminder.create({
          data: {
            vehicleId: v.id,
            userId: v.ownerId,
            type: "WIN_BACK",
            channel: "BOTH",
            scheduledAt: new Date(),
          },
        })
      );
    }
  }

  await Promise.all(created);
  return { created: created.length };
}

const MESSAGES = {
  SERVICE_DUE: "Hi! Your vehicle is due for its next service at Vapra Workshop. Book now: https://vapraworkshop.com/onboarding",
  POST_SERVICE_CHECKIN: "Thanks for choosing Vapra Workshop! How was your recent service? Reply to let us know.",
  WIN_BACK: "We miss you at Vapra Workshop! Book your next service today: https://vapraworkshop.com/onboarding",
};

// Called by the cron route below
export async function processDueReminders() {
  const dueReminders = await prisma.followUpReminder.findMany({
    where: { status: "PENDING", scheduledAt: { lte: new Date() } },
    include: { user: true },
  });

  let sent = 0;
  let failed = 0;

  for (const reminder of dueReminders) {
    try {
      const message = MESSAGES[reminder.type];

      if (reminder.channel === "SMS" || reminder.channel === "BOTH") {
        if (reminder.user.phone) {
          await sendSMS(reminder.user.phone, message);
        }
      }
      // Email channel: wire up your email provider here if you have one.
      // (No existing email-sending helper was found in lib/ — flag if you have one elsewhere.)

      await prisma.followUpReminder.update({
        where: { id: reminder.id },
        data: { status: "SENT", sentAt: new Date() },
      });
      sent++;
    } catch (err) {
      await prisma.followUpReminder.update({
        where: { id: reminder.id },
        data: { status: "FAILED" },
      });
      failed++;
    }
  }

  return { sent, failed, total: dueReminders.length };
}