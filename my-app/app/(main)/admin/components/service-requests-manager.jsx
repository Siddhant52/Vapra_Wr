"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateServiceRequestStatus } from "@/actions/bookingRequest";
import useFetch from "@/hooks/use-fetch";
import { format } from "date-fns";
import { toast } from "sonner";

const statusVariants = {
  PENDING: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  REVIEWED: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  ASSIGNED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  COMPLETED: "bg-emerald-700/20 text-emerald-200 border-emerald-700/30",
  CLOSED: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  CANCELLED: "bg-red-500/20 text-red-300 border-red-500/30",
};

export function ServiceRequestsManager({ requests = [] }) {
  const [localRequests, setLocalRequests] = useState(requests);
  const [range, setRange] = useState("lastday");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { loading, fn: submitStatusUpdate } = useFetch(updateServiceRequestStatus);

  const statusActions = useMemo(
    () => [
      { label: "Pending", value: "PENDING" },
      { label: "Review", value: "REVIEWED" },
      { label: "Assign", value: "ASSIGNED" },
      { label: "Close", value: "CLOSED" },
    ],
    []
  );

  const handleStatusChange = async (requestId, status) => {
    if (loading) return;
    try {
      const formData = new FormData();
      formData.append("requestId", requestId);
      formData.append("status", status);
      const result = await submitStatusUpdate(formData);
      if (result?.success) {
        setLocalRequests((prev) =>
          prev.map((req) => (req.id === requestId ? { ...req, status } : req))
        );
        toast.success(`Status updated to ${status}`);
      }
    } catch (error) {
      toast.error(error?.message || "Could not update status");
    }
  };

  const downloadServiceRequests = () => {
    const url = new URL("/api/admin/export-service-requests", window.location.origin);
    url.searchParams.set("range", range);
    if (range === "custom") {
      if (fromDate) url.searchParams.set("from", fromDate);
      if (toDate) url.searchParams.set("to", toDate);
    }
    window.open(url.toString(), "_blank");
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Filter + Download */}
      <div className="flex flex-col gap-3 p-3 md:p-4 rounded-2xl border border-white/10 bg-white/5">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs md:text-sm text-slate-300">Range</label>
          <select
            className="rounded-lg border border-white/20 bg-slate-900 px-2 py-1 text-white text-xs md:text-sm"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="lastday">Last Day</option>
            <option value="lastweek">Last Week</option>
            <option value="lastmonth">Last Month</option>
            <option value="custom">Custom</option>
          </select>
          <button
            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs md:text-sm font-semibold text-white hover:bg-emerald-400"
            onClick={downloadServiceRequests}
          >
            Download CSV
          </button>
        </div>
        {range === "custom" && (
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1">
              <label className="text-xs text-slate-300">From</label>
              <input
                type="date"
                className="rounded-lg border border-white/20 bg-slate-900 px-2 py-1 text-white text-xs"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1">
              <label className="text-xs text-slate-300">To</label>
              <input
                type="date"
                className="rounded-lg border border-white/20 bg-slate-900 px-2 py-1 text-white text-xs"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Requests */}
      {localRequests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center text-slate-300 text-sm">
          No service requests available
        </div>
      ) : (
        localRequests.map((req) => (
          <div key={req.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="min-w-0">
                <h3 className="text-base md:text-xl font-semibold text-white truncate">{req.serviceName}</h3>
                <p className="text-slate-300 text-xs md:text-sm mt-0.5">{req.vehicleInfo}</p>
              </div>
              <Badge className={`${statusVariants[req.status] || statusVariants.PENDING} text-xs shrink-0`}>
                {req.status}
              </Badge>
            </div>

            {/* Details */}
            <div className="space-y-1 mb-3">
              <p className="text-slate-300 text-xs md:text-sm">"{req.issueDescription}"</p>
              <p className="text-xs text-slate-400">
                📅 {format(new Date(req.preferredDate), "PPP")}
                {req.preferredTimeSlot ? ` @ ${req.preferredTimeSlot}` : ""}
              </p>
              <p className="text-xs text-slate-400">
                {req.customerName ? `👤 ${req.customerName} • ` : ""}
                {req.customerId ? "Registered" : "Guest"} • {req.phone}
              </p>
              {req.email && (
                <p className="text-xs text-slate-400 truncate">✉️ {req.email}</p>
              )}
              <p className="text-xs text-slate-400">
                🕐 {format(new Date(req.createdAt), "MMM d, yyyy h:mm a")}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {statusActions.map((action) => (
                <Button
                  key={`${req.id}-${action.value}`}
                  size="sm"
                  variant={req.status === action.value ? "secondary" : "outline"}
                  className="text-xs h-7 px-2 md:h-9 md:px-3 md:text-sm"
                  onClick={() => handleStatusChange(req.id, action.value)}
                  disabled={loading || req.status === "CLOSED" || req.status === "CANCELLED"}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}