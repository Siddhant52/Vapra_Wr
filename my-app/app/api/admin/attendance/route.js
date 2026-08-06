import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { isAllowedAdminEmail } from "@/lib/admin-access";
import { listAttendanceRecords, upsertAttendanceRecord } from "@/lib/attendance-store";

async function verifyAdminAccess() {
  const { userId } = await auth();
  if (!userId) {
    return  {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      adminUser: null,
    };
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress;

  const adminUser = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true, role: true },
  });

  const hasAdminAccess =
    adminUser?.role === "ADMIN" || isAllowedAdminEmail(email);

  if (!hasAdminAccess) {
    return {
      error: NextResponse.json(
        { error: "Forbidden - Admin access required!" },
        { status: 403 }
      ),
      adminUser: null,
    };
  }

  return { error: null, adminUser };
}

function getRangeDates(range, from, to) {
  let startDate = new Date();
  let endDate = new Date();

  if (range === "lastmonth") {
    startDate.setMonth(startDate.getMonth() - 1);
  } else if (range === "last2months") {
    startDate.setMonth(startDate.getMonth() - 2);
  } else if (range === "last3months") {
    startDate.setMonth(startDate.getMonth() - 3);
  } else if (range === "currentMonth") {
    startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (range === "custom" && from && to) {
    startDate = new Date(`${from}T00:00:00.000Z`);
    endDate = new Date(`${to}T23:59:59.999Z`);
  } else {
    startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error("Invalid date range");
  }
  if (startDate > endDate) {
    throw new Error("Start date must be before end date");
  }
  return { startDate, endDate };
}

export async function GET(req) {
  try {
    const { error } = await verifyAdminAccess();
    if (error) return error;

    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");
    const range = url.searchParams.get("range") || "currentMonth";
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    if (dateParam) {
      const targetDate = new Date(`${dateParam}T00:00:00.000Z`);
      if (Number.isNaN(targetDate.getTime())) {
        return NextResponse.json({ error: "Invalid date" }, { status: 400 });
      }

      let records = [];
      if (db.mechanicAttendance) {
        records = await db.mechanicAttendance.findMany({
          where: { date: targetDate },
          select: {
            id: true,
            mechanicId: true,
            status: true,
            date: true,
            updatedAt: true,
          },
        });
      } else {
        records = listAttendanceRecords({
          startDate: targetDate,
          endDate: targetDate,
        }).map((item) => ({
          id: item.id,
          mechanicId: item.mechanicId,
          status: item.status,
          date: item.date,
          updatedAt: item.updatedAt,
        }));
      }

      return NextResponse.json(
        { records },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const { startDate, endDate } = getRangeDates(range, from, to);

    let records = [];
    if (db.mechanicAttendance) {
      records = await db.mechanicAttendance.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        select: {
          id: true,
          mechanicId: true,
          status: true,
          date: true,
          updatedAt: true,
        },
      });
    } else {
      records = listAttendanceRecords({
        startDate,
        endDate,
      }).map((item) => ({
        id: item.id,
        mechanicId: item.mechanicId,
        status: item.status,
        date: item.date,
        updatedAt: item.updatedAt,
      }));
    }

    return NextResponse.json(
      { records },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Attendance GET API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const { error, adminUser } = await verifyAdminAccess();
    if (error) return error;

    const body = await req.json();
    const { mechanicId, date, status, note } = body || {};

    if (!mechanicId || !date || !["PRESENT", "HALF_DAY", "ABSENT"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid attendance details" },
        { status: 400 }
      );
    }

    const parsedDate = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    if (db.mechanicAttendance) {
      await db.mechanicAttendance.upsert({
        where: {
          mechanicId_date: {
            mechanicId,
            date: parsedDate,
          },
        },
        update: {
          status,
          note: note ? String(note) : null,
          markedById: adminUser?.id || null,
        },
        create: {
          mechanicId,
          date: parsedDate,
          status,
          note: note ? String(note) : null,
          markedById: adminUser?.id || null,
        },
      });
    } else {
      upsertAttendanceRecord({
        mechanicId,
        date: parsedDate,
        status,
        note: note ? String(note) : null,
        markedById: adminUser?.id || null,
      });
    }

    return NextResponse.json(
      { success: true },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Attendance API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
