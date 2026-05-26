"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function toDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function readResponsePayload(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

export function AttendanceManager({ mechanics, attendanceEnabled }) {
  const [selectedDate, setSelectedDate] = useState(toDateInputValue());
  const [statusMap, setStatusMap] = useState(() =>
    Object.fromEntries(
      mechanics.map((mechanic) => [mechanic.id, mechanic.attendanceStatus || null])
    )
  );
  const [exportRange, setExportRange] = useState("lastmonth");
  const [exportFromDate, setExportFromDate] = useState("");
  const [exportToDate, setExportToDate] = useState("");
  const [pendingKey, setPendingKey] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const syncDateStatus = async () => {
      try {
        const url = new URL("/api/admin/attendance", window.location.origin);
        url.searchParams.set("date", selectedDate);
        const response = await fetch(url.toString(), { cache: "no-store" });
        const result = await readResponsePayload(response);
        if (!response.ok) {
          throw new Error(result?.error || "Failed to load attendance status");
        }

        const next = {};
        for (const mechanic of mechanics) {
          next[mechanic.id] = null;
        }
        for (const item of result?.records || []) {
          next[item.mechanicId] = item.status;
        }
        setStatusMap(next);
      } catch (error) {
        console.error("Failed to sync attendance by date:", error);
        setErrorMessage(error?.message || "Failed to load attendance status");
      }
    };

    syncDateStatus();
  }, [selectedDate, mechanics]);

  const mechanicsWithStatus = useMemo(
    () =>
      mechanics.map((mechanic) => ({
        ...mechanic,
        attendanceStatus: statusMap[mechanic.id] || null,
      })),
    [mechanics, statusMap]
  );

  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let unmarked = 0;

    for (const mechanic of mechanicsWithStatus) {
      if (mechanic.attendanceStatus === "PRESENT") present += 1;
      else if (mechanic.attendanceStatus === "ABSENT") absent += 1;
      else unmarked += 1;
    }

    return { present, absent, unmarked };
  }, [mechanicsWithStatus]);

  const handleMark = (mechanicId, status) => {
    setPendingKey(`${mechanicId}-${status}`);
    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/attendance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mechanicId,
            date: selectedDate,
            status,
          }),
        });

        const result = await readResponsePayload(response);
        if (!response.ok) {
          throw new Error(result?.error || "Failed to mark attendance");
        }

        setErrorMessage("");
        setStatusMap((prev) => ({
          ...prev,
          [mechanicId]: status,
        }));
      } catch (error) {
        console.error("Attendance update failed:", error);
        setErrorMessage(error?.message || "Failed to mark attendance");
      } finally {
        setPendingKey("");
      }
    });
  };

  const downloadAttendance = () => {
    const url = new URL("/api/admin/export-attendance", window.location.origin);
    url.searchParams.set("range", exportRange);
    if (exportRange === "custom") {
      if (!exportFromDate || !exportToDate) {
        setErrorMessage("Please select both custom date range values for export.");
        return;
      }
      url.searchParams.set("from", exportFromDate);
      url.searchParams.set("to", exportToDate);
    }
    window.open(url.toString(), "_blank");
  };

  return (
    <div className="space-y-6">
      {!attendanceEnabled && (
        <div className="rounded-2xl border border-amber-600/30 bg-amber-950/30 p-4 text-sm text-amber-200">
          Attendance is configured in code but not ready in Prisma Client yet. Run{" "}
          <code>npx prisma migrate dev</code>, then <code>npx prisma generate</code>, and restart the server.
        </div>
      )}
      {errorMessage && (
        <div className="rounded-2xl border border-red-600/30 bg-red-950/30 p-4 text-sm text-red-200">
          {errorMessage}
        </div>
      )}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white">Mechanic Attendance</h3>
            <p className="text-sm text-slate-300">
              Mark daily attendance for mechanics on{" "}
              <span className="text-emerald-300">{format(new Date(`${selectedDate}T00:00:00`), "PPP")}</span>.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="attendance-date" className="text-sm text-slate-200">
              Date
            </label>
            <input
              id="attendance-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-md border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
            Present: {stats.present}
          </Badge>
          <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
            Absent: {stats.absent}
          </Badge>
          <Badge className="bg-slate-500/20 text-slate-200 border-slate-500/30">
            Unmarked: {stats.unmarked}
          </Badge>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select
              value={exportRange}
              onChange={(e) => setExportRange(e.target.value)}
              className="rounded-md border border-white/20 bg-slate-900 px-2 py-1 text-sm text-white"
            >
              <option value="lastmonth">Last Month</option>
              <option value="last2months">Last 2 Months</option>
              <option value="last3months">Last 3 Months</option>
              <option value="custom">Custom</option>
            </select>
            {exportRange === "custom" && (
              <>
                <input
                  type="date"
                  value={exportFromDate}
                  onChange={(e) => setExportFromDate(e.target.value)}
                  className="rounded-md border border-white/20 bg-slate-900 px-2 py-1 text-sm text-white"
                />
                <input
                  type="date"
                  value={exportToDate}
                  onChange={(e) => setExportToDate(e.target.value)}
                  className="rounded-md border border-white/20 bg-slate-900 px-2 py-1 text-sm text-white"
                />
              </>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={downloadAttendance}
          >
            Download Attendance Excel
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left py-4 px-6 font-bold text-white">Mechanic</th>
              <th className="text-left py-4 px-6 font-bold text-white">Specialty</th>
              <th className="text-left py-4 px-6 font-bold text-white">Current Status</th>
              <th className="text-left py-4 px-6 font-bold text-white">Action</th>
            </tr>
          </thead>
          <tbody>
            {mechanicsWithStatus.map((mechanic) => (
              <tr key={mechanic.id} className="border-b border-white/5 hover:bg-white/10 transition-colors">
                <td className="py-4 px-6 font-semibold text-white">{mechanic.name || "Unnamed mechanic"}</td>
                <td className="py-4 px-6 text-slate-300">{mechanic.specialty || "N/A"}</td>
                <td className="py-4 px-6">
                  {mechanic.attendanceStatus === "PRESENT" ? (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">PRESENT</Badge>
                  ) : mechanic.attendanceStatus === "ABSENT" ? (
                    <Badge className="bg-red-500/20 text-red-300 border-red-500/30">ABSENT</Badge>
                  ) : (
                    <Badge className="bg-slate-500/20 text-slate-200 border-slate-500/30">UNMARKED</Badge>
                  )}
                </td>
                <td className="py-4 px-6">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled={isPending}
                      onClick={() => handleMark(mechanic.id, "PRESENT")}
                    >
                      {pendingKey === `${mechanic.id}-PRESENT` ? "Saving..." : "Mark Present"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={isPending}
                      onClick={() => handleMark(mechanic.id, "ABSENT")}
                    >
                      {pendingKey === `${mechanic.id}-ABSENT` ? "Saving..." : "Mark Absent"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
