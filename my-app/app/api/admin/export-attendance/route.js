import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { verifyAdmin } from "@/actions/admin";
import { listAttendanceRecords } from "@/lib/attendance-store";
import { calculateSalaryEstimates } from "@/lib/salary-estimation";
import * as XLSX from "xlsx";

function getRangeDates(range, from, to) {
  let startDate = new Date();
  let endDate = new Date();

  if (range === "lastweek") {
    startDate.setDate(startDate.getDate() - 7);
  } else if (range === "lastmonth") {
    startDate.setMonth(startDate.getMonth() - 1);
  } else if (range === "last2months") {
    startDate.setMonth(startDate.getMonth() - 2);
  } else if (range === "last3months") {
    startDate.setMonth(startDate.getMonth() - 3);
  } else if (range === "custom" && from && to) {
    startDate = new Date(`${from}T00:00:00.000Z`);
    endDate = new Date(`${to}T23:59:59.999Z`);
  } else {
    startDate.setDate(startDate.getDate() - 1);
  }

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error("Invalid date range");
  }
  if (startDate > endDate) {
    throw new Error("Start date must be before end date");
  }
  return { startDate, endDate };
}

export async function GET(request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const url = new URL(request.url);
    const range = url.searchParams.get("range") || "lastmonth";
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const dailyWage = Number(url.searchParams.get("dailyWage") || 800);
    const { startDate, endDate } = getRangeDates(range, from, to);

    let records = [];
    if (db.mechanicAttendance) {
      records = await db.mechanicAttendance.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        include: {
          mechanic: { select: { id: true, name: true, email: true, specialty: true } },
        },
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      });
    } else {
      const fallback = listAttendanceRecords({ startDate, endDate });
      const ids = [...new Set(fallback.map((item) => item.mechanicId))];
      const mechanics = ids.length
        ? await db.user.findMany({
            where: { id: { in: ids } },
            select: { id: true, name: true, email: true, specialty: true },
          })
        : [];
      const map = new Map(mechanics.map((m) => [m.id, m]));
      records = fallback.map((item) => ({
        ...item,
        mechanic: map.get(item.mechanicId) || null,
      }));
    }

    const mechanics = await db.user.findMany({
      where: { role: "MECHANIC" },
      select: { id: true, name: true, specialty: true },
      orderBy: { name: "asc" },
    });

    const rows = records.map((r) => ({
      ID: r.id || "",
      MechanicID: r.mechanicId || "",
      Name: r.mechanic?.name || "",
      Email: r.mechanic?.email || "",
      Specialty: r.mechanic?.specialty || "",
      Date: r.date ? new Date(r.date).toISOString().slice(0, 10) : "",
      Status: r.status || "",
      Note: r.note || "",
      MarkedBy: r.markedById || "",
      CreatedAt: r.createdAt ? new Date(r.createdAt).toISOString() : "",
      UpdatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : "",
    }));

    const startDateStr = from || startDate.toISOString().slice(0, 10);
    const endDateStr = to || endDate.toISOString().slice(0, 10);

    const salaryRows = calculateSalaryEstimates({
      mechanics,
      records,
      dailyWage,
      startDate: startDateStr,
      endDate: endDateStr,
    }).map((estimate) => ({
      MechanicName: estimate.name,
      Specialty: estimate.specialty,
      FullDays: estimate.fullDays,
      HalfDays: estimate.halfDays,
      AbsentDays: estimate.absentDays,
      DailyWage: estimate.dailyWage,
      EstimatedSalary: estimate.estimatedSalary,
    }));

    const workbook = XLSX.utils.book_new();
    const attendanceSheet = XLSX.utils.json_to_sheet(rows);
    const salarySheet = XLSX.utils.json_to_sheet(salaryRows);
    XLSX.utils.book_append_sheet(workbook, attendanceSheet, "Attendance");
    XLSX.utils.book_append_sheet(workbook, salarySheet, "Salary Estimation");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=attendance-${range}-${Date.now()}.xlsx`,
      },
    });
  } catch (error) {
    return new NextResponse(error.message || "Failed to export attendance", {
      status: 400,
    });
  }
}
