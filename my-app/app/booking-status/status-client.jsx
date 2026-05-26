"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BookingStatusTracker from "@/components/booking-status-tracker";

function getStatusMeta(status) {
  switch (status) {
    case "PENDING":
      return { label: "Pending", className: "bg-amber-500/20 text-amber-300 border-amber-500/40" };
    case "REVIEWED":
      return { label: "Reviewed", className: "bg-sky-500/20 text-sky-300 border-sky-500/40" };
    case "ASSIGNED":
      return { label: "Assigned", className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };
    case "COMPLETED":
      return { label: "Completed", className: "bg-emerald-700/20 text-emerald-200 border-emerald-700/40" };
    case "CLOSED":
      return { label: "Closed", className: "bg-slate-500/20 text-slate-300 border-slate-500/40" };
    default:
      return { label: status || "Unknown", className: "bg-slate-500/20 text-slate-300 border-slate-500/40" };
  }
}

export default function CustomerBookingStatusClient({
  isSignedIn = false,
  initialAccessCode = "",
  highlightRequestId = "",
}) {
  const [accessCode, setAccessCode] = useState(initialAccessCode);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizedAccessCode = useMemo(() => accessCode.trim(), [accessCode]);

  const fetchRequests = async (targetAccessCode) => {
    const cleaned = (targetAccessCode || "").trim();
    if (!isSignedIn && !cleaned) {
      setRequests([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const url = new URL("/api/booking-status", window.location.origin);
      if (!isSignedIn) {
        url.searchParams.set("accessCode", cleaned);
      }
      const response = await fetch(url.toString(), { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result?.error || "Failed to load requests");
      setRequests(result?.requests || []);
    } catch (err) {
      setError(err?.message || "Failed to load requests");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchRequests("");
      return;
    }

    if (initialAccessCode) {
      fetchRequests(initialAccessCode);
    }
  }, [initialAccessCode, isSignedIn]);

  useEffect(() => {
    if (isSignedIn || initialAccessCode) return;
    try {
      const savedCode = window.localStorage.getItem("vapra_guest_tracking_code") || "";
      if (savedCode) {
        setAccessCode(savedCode);
        fetchRequests(savedCode);
      }
    } catch {
      // Ignore localStorage access errors
    }
  }, [initialAccessCode, isSignedIn]);

  useEffect(() => {
    if (!highlightRequestId) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`request-${highlightRequestId}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
    return () => clearTimeout(timer);
  }, [highlightRequestId, requests]);

  const onSubmit = (e) => {
    e.preventDefault();
    fetchRequests(normalizedAccessCode);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Booking Status"
        description={
          isSignedIn
            ? "View current and previous booking requests linked to your account."
            : "Enter your guest tracking code to view your booking request status."
        }
      />

      {!isSignedIn && (
        <Card className="border-emerald-900/30">
          <CardContent className="pt-6 space-y-3">
            <form onSubmit={onSubmit} className="flex flex-col md:flex-row gap-3">
              <Input
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter guest tracking code (e.g. VAP-xxxxx)"
                className="bg-slate-900 border-emerald-900/30"
              />
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Checking..." : "Check Status"}
              </Button>
            </form>
            <p className="text-xs text-slate-400">
              This code is shown after guest booking submission. Keep it safe for future tracking.
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-900/40 bg-red-950/20">
          <CardContent className="py-4 text-sm text-red-200">{error}</CardContent>
        </Card>
      )}

      {!loading && !isSignedIn && normalizedAccessCode && requests.length === 0 && !error && (
        <Card className="border-slate-800/60 bg-slate-950/30">
          <CardContent className="py-6 text-sm text-slate-300 text-center">
            No booking requests found for this tracking code.
          </CardContent>
        </Card>
      )}

      <div className="space-y-5">
        {requests.map((req) => {
          const statusMeta = getStatusMeta(req.status);
          const highlighted = req.id === highlightRequestId;
          return (
            <Card
              key={req.id}
              id={`request-${req.id}`}
              className={`border-emerald-900/30 bg-slate-950/40 ${highlighted ? "ring-2 ring-emerald-400" : ""}`}
            >
              <CardHeader className="pb-2 flex flex-row justify-between items-start">
                <div>
                  <CardTitle className="text-white text-base">{req.serviceName}</CardTitle>
                  <p className="text-xs text-slate-400 mt-1">
                    Created {format(new Date(req.createdAt), "PP p")}
                  </p>
                </div>
                <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-slate-300">{req.vehicleInfo}</p>
                <p className="text-xs text-slate-400">Issue: {req.issueDescription}</p>
                {req.preferredDate && (
                  <p className="text-xs text-slate-400">
                    Preferred: {format(new Date(req.preferredDate), "PPP")}
                    {req.preferredTimeSlot ? ` @ ${req.preferredTimeSlot}` : ""}
                  </p>
                )}
                <BookingStatusTracker requestId={req.id} initialStatus={req.status} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
