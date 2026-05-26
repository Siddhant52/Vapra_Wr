import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { isAllowedAdminEmail } from "@/lib/admin-access";
import { listAttendanceRecords, upsertAttendanceRecord } from "@/lib/attendance-store";

async function verifyAdminAccess() {
  const { userId } = await auth();
  if (!userId) {
    return {
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
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      ),
      adminUser: null,
    };
  }

  return { error: null, adminUser };
}

export async function GET(req) {
  try {
    const { error } = await verifyAdminAccess();
    if (error) return error;

    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");
    const targetDate = dateParam
      ? new Date(`${dateParam}T00:00:00.000Z`)
      : new Date();

    if (Number.isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    targetDate.setUTCHours(0, 0, 0, 0);

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
  } catch (error) {
    console.error("Attendance GET API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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

    if (!mechanicId || !date || !["PRESENT", "ABSENT"].includes(status)) {
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
