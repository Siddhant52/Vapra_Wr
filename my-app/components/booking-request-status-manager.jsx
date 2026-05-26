"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";
import { ChevronRight, Loader2 } from "lucide-react";

/**
 * Booking Request Status Manager for Admin
 * Allows admins to move booking requests through the checkpoint workflow
 */
export default function BookingRequestStatusManager({ requests: initialRequests }) {
  const [requests, setRequests] = useState(initialRequests || []);
  const [updatingId, setUpdatingId] = useState(null);

  const statuses = ["PENDING", "REVIEWED", "ASSIGNED", "COMPLETED", "CLOSED"];

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-amber-900/40 border-amber-500/60 text-amber-200";
      case "REVIEWED":
        return "bg-sky-900/40 border-sky-500/60 text-sky-200";
      case "ASSIGNED":
        return "bg-emerald-900/40 border-emerald-500/60 text-emerald-200";
      case "COMPLETED":
        return "bg-green-900/40 border-green-500/60 text-green-200";
      case "CLOSED":
        return "bg-slate-900/60 border-slate-600/70 text-slate-300";
      default:
        return "bg-muted/30 border-muted/40 text-muted-foreground";
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: "Pending Review",
      REVIEWED: "Reviewed",
      ASSIGNED: "Assigned",
      COMPLETED: "Completed",
      CLOSED: "Closed",
    };
    return labels[status] || status;
  };

  const updateStatus = async (requestId, newStatus) => {
    setUpdatingId(requestId);

    try {
      const response = await fetch(`/api/booking-request/${requestId}/status/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update status");
      }

      const data = await response.json();

      // Update local state
      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: newStatus, updatedAt: new Date() } : req
        )
      );

      toast.success(`Status updated to ${getStatusLabel(newStatus)}`);
    } catch (error) {
      toast.error(error.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const getNextStatus = (currentStatus) => {
    const currentIndex = statuses.indexOf(currentStatus);
    return currentIndex < statuses.length - 1 ? statuses[currentIndex + 1] : null;
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {requests.map((request) => {
          const nextStatus = getNextStatus(request.status);
          const isUpdating = updatingId === request.id;

          return (
            <Card key={request.id} className="bg-slate-900/50 border-slate-700/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold text-white">
                      {request.serviceName || "Service Request"}
                    </CardTitle>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <p>
                        <span className="font-medium text-slate-300">Customer:</span> {request.email || "N/A"}
                      </p>
                      <p>
                        <span className="font-medium text-slate-300">Vehicle:</span>{" "}
                        {request.vehicleInfo || "N/A"}
                      </p>
                      <p>
                        <span className="font-medium text-slate-300">Requested:</span>{" "}
                        {format(new Date(request.createdAt), "PPp")}
                      </p>
                      {request.preferredDate && (
                        <p>
                          <span className="font-medium text-slate-300">Preferred Date:</span>{" "}
                          {format(new Date(request.preferredDate), "PP")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <Badge
                      variant="outline"
                      className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusColor(
                        request.status
                      )}`}
                    >
                      {getStatusLabel(request.status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              {request.issueDescription && (
                <CardContent className="pb-3 pt-0">
                  <p className="text-xs text-gray-300 bg-slate-800/50 p-2 rounded">
                    <span className="font-medium">Issue:</span> {request.issueDescription}
                  </p>
                </CardContent>
              )}

              {/* Status Progression Buttons */}
              {nextStatus && request.status !== "CLOSED" && (
                <CardContent className="pt-0 pb-4 flex gap-2">
                  <Button
                    onClick={() => updateStatus(request.id, nextStatus)}
                    disabled={isUpdating}
                    className="flex-1 bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-100 border border-emerald-600/40"
                    size="sm"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-3.5 w-3.5 mr-1" />
                        Move to {getStatusLabel(nextStatus)}
                      </>
                    )}
                  </Button>

                  {/* Shortcut buttons to other statuses */}
                  <div className="flex gap-1">
                    {statuses
                      .slice(statuses.indexOf(request.status) + 2)
                      .map((status) => (
                        <Button
                          key={status}
                          onClick={() => updateStatus(request.id, status)}
                          disabled={isUpdating}
                          variant="outline"
                          size="sm"
                          className="text-xs px-2 h-8 border-slate-600/40"
                          title={`Jump to ${getStatusLabel(status)}`}
                        >
                          {getStatusLabel(status).split(" ")[0]}
                        </Button>
                      ))}
                  </div>
                </CardContent>
              )}

              {request.status === "CLOSED" && (
                <CardContent className="pt-0 pb-4">
                  <div className="text-xs text-slate-400 text-center py-2 bg-slate-800/30 rounded">
                    Request is closed - no further updates available
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {requests.length === 0 && (
        <Card className="bg-slate-900/50 border-slate-700/50">
          <CardContent className="py-12 text-center">
            <p className="text-slate-400">No booking requests to manage</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
