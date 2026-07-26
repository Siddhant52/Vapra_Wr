import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { db } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, Calendar } from "lucide-react";

export const metadata = {
  title: "Service History - Vapra Workshop",
  description: "View every past and current booking request, and its status.",
};

// Same source of truth as /appointments (db.bookingRequest) — this is the
// system that's actually populated by the app today. There is currently no
// separate mechanic-notes or payment table wired up to bookings, so this
// page reflects exactly what's tracked: the request lifecycle.
async function getCustomerHistory(clerkUserId) {
  try {
    const customer = await db.user.findUnique({
      where: { clerkUserId },
      select: { id: true },
    });

    if (!customer) {
      return { requests: [] };
    }

    const requests = await db.bookingRequest.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        serviceName: true,
        vehicleInfo: true,
        issueDescription: true,
        preferredDate: true,
        preferredTimeSlot: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { requests };
  } catch (error) {
    console.error("Failed to load customer service history:", error);
    return { requests: [], error: "Failed to load your service history" };
  }
}

function getStatusMeta(status) {
  switch (status) {
    case "PENDING":
      return { label: "Pending review", badgeClass: "bg-amber-900/20 border-amber-900/40 text-amber-300" };
    case "REVIEWED":
      return { label: "Reviewed", badgeClass: "bg-sky-900/20 border-sky-900/40 text-sky-300" };
    case "ASSIGNED":
      return { label: "Assigned to mechanic", badgeClass: "bg-emerald-900/20 border-emerald-900/40 text-emerald-300" };
    case "COMPLETED":
      return { label: "Completed", badgeClass: "bg-emerald-900/20 border-emerald-900/40 text-emerald-300" };
    case "CLOSED":
      return { label: "Closed", badgeClass: "bg-muted/30 border-muted/40 text-muted-foreground" };
    case "CANCELLED":
      return { label: "Cancelled", badgeClass: "bg-red-900/20 border-red-900/40 text-red-300" };
    default:
      return { label: status || "Unknown", badgeClass: "bg-muted/30 border-muted/40 text-muted-foreground" };
  }
}

export default async function ServiceHistoryPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { requests, error } = await getCustomerHistory(userId);

  return (
    <div className="container mx-auto px-3 md:px-4 py-8 md:py-12 space-y-6 md:space-y-8 pt-24 md:pt-28">
      <PageHeader
        title="Service History"
        description="Every booking request you've made and where it stands, oldest to newest."
      />

      {error && (
        <Card className="border-red-900/40 bg-red-950/20">
          <CardContent className="py-3 md:py-4">
            <p className="text-xs md:text-sm text-red-200">
              We couldn&apos;t load your service history right now. Please try again in
              a moment.
            </p>
          </CardContent>
        </Card>
      )}

      {requests.length === 0 ? (
        <Card className="border-emerald-900/20 bg-emerald-950/10">
          <CardContent className="py-6 md:py-8 text-center space-y-2 md:space-y-3">
            <p className="text-base md:text-lg font-semibold text-white">
              No service history yet
            </p>
            <p className="text-xs md:text-sm text-muted-foreground px-2">
              Once you submit a booking request, it&apos;ll show up here and track
              through review, assignment, and completion.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 md:space-y-5">
          {requests.map((request) => {
            const meta = getStatusMeta(request.status);
            return (
              <Card key={request.id} className="border-orange-900/20">
                <CardHeader className="pb-2 md:pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-2 md:gap-3">
                    <div>
                      <CardTitle className="text-base md:text-lg text-white flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-orange-400 flex-shrink-0" />
                        {request.serviceName}
                      </CardTitle>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">
                        {request.vehicleInfo}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge className={meta.badgeClass}>{meta.label}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(request.preferredDate), "d MMM yyyy")}
                        {request.preferredTimeSlot ? ` · ${request.preferredTimeSlot}` : ""}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {request.issueDescription && (
                    <div className="rounded-lg bg-muted/20 border border-white/5 p-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        What you reported
                      </p>
                      <p className="text-xs md:text-sm text-gray-200 whitespace-pre-wrap">
                        {request.issueDescription}
                      </p>
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground/70">
                    Requested {format(new Date(request.createdAt), "d MMM yyyy")}
                    {request.updatedAt && request.updatedAt !== request.createdAt
                      ? ` · Last updated ${format(new Date(request.updatedAt), "d MMM yyyy")}`
                      : ""}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}