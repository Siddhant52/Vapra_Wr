"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Clock } from "lucide-react";

export default function BookingStatusTracker({ requestId, initialStatus }) {
  const [status, setStatus] = useState(initialStatus);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const checkpoints = [
    {
      id: "PENDING",
      label: "Booking Submitted",
      description: "Your request has been received",
    },
    {
      id: "REVIEWED",
      label: "Under Review",
      description: "Our team is reviewing your request",
    },
    {
      id: "ASSIGNED",
      label: "Mechanic Assigned",
      description: "A mechanic has been assigned to your service",
    },
    {
      id: "COMPLETED",
      label: "Service Completed",
      description: "Your service has been completed",
    },
    {
      id: "CLOSED",
      label: "Request Closed",
      description: "All done! Thanks for using our service",
    },
  ];

  useEffect(() => {
    // Don't poll if no requestId
    if (!requestId) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/booking-request/${requestId}/status`, {
          cache: "no-store",
        });

        // Silently skip if unauthorized or error — don't crash
        if (!response.ok) return;

        const data = await response.json();
        if (data?.status && data.status !== status) {
          setStatus(data.status);
          setLastUpdated(new Date());
        }
      } catch (error) {
        // Silently ignore network errors
      }
    };

    // Poll every 10 seconds instead of 5 to reduce load
    const interval = setInterval(pollStatus, 10000);
    return () => clearInterval(interval);
  }, [requestId, status]);

  const currentCheckpointIndex = checkpoints.findIndex((cp) => cp.id === status);

  const getCheckpointState = (index) => {
    if (index < currentCheckpointIndex) return "completed";
    if (index === currentCheckpointIndex) return "current";
    return "pending";
  };

  const getCheckpointIcon = (state) => {
    if (state === "completed") return <CheckCircle2 className="h-8 w-8 text-emerald-400" />;
    if (state === "current") return <Clock className="h-8 w-8 text-amber-400 animate-spin" style={{ animationDuration: "2s" }} />;
    return <Circle className="h-8 w-8 text-slate-600" />;
  };

  return (
    <div className="mt-6 pt-6 border-t border-emerald-900/40 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
            Live Tracking
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-300 font-medium">Live</span>
        </div>
      </div>

      {/* Checkpoints */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-linear-to-b from-emerald-500/50 via-emerald-600/30 to-slate-700/30" />
        <div className="space-y-6">
          {checkpoints.map((checkpoint, index) => {
            const state = getCheckpointState(index);
            const isCompleted = state === "completed";
            const isCurrent = state === "current";

            return (
              <div key={checkpoint.id} className="relative flex gap-4">
                <div className="relative z-10 pt-1">
                  {getCheckpointIcon(state)}
                </div>
                <div className={`flex-1 rounded-lg p-3 transition-all duration-300 ${
                  isCompleted
                    ? "bg-emerald-900/20 border border-emerald-500/30"
                    : isCurrent
                    ? "bg-amber-900/20 border border-amber-500/40 shadow-lg shadow-amber-900/30"
                    : "bg-slate-900/20 border border-slate-700/30"
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${
                        isCompleted ? "text-emerald-300" : isCurrent ? "text-amber-200" : "text-slate-400"
                      }`}>
                        {checkpoint.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {checkpoint.description}
                      </p>
                    </div>
                    {isCurrent && <span className="text-xs font-semibold text-amber-300 whitespace-nowrap">In Progress</span>}
                    {isCompleted && <span className="text-xs font-semibold text-emerald-300 whitespace-nowrap">Complete</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {status === "CLOSED" && (
        <div className="mt-6 rounded-lg bg-emerald-900/20 border border-emerald-500/40 p-4 flex gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-200">Request Complete</p>
            <p className="text-xs text-emerald-100/70 mt-1">
              Thank you for using Vapra Workshop! We appreciate your business.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}