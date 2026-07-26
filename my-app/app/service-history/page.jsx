import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { db } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, IndianRupee, User as UserIcon } from "lucide-react";

export const metadata = {
  title: "Service History - Vapra Workshop",
  description: "View your past appointments, service notes, and payment receipts.",
};

async function getCustomerHistory(clerkUserId) {
  try {
    const customer = await db.user.findUnique({
      where: { clerkUserId },
      select: { id: true },
    });

    if (!customer) {
      return { bookings: [] };
    }

    const bookings = await db.booking.findMany({
      where: { customerId: customer.id },
      orderBy: { scheduledAt: "desc" },
      include: {
        service: { select: { name: true, category: true } },
        vehicle: { select: { brand: true, model: true, registrationNo: true } },
        mechanic: { select: { name: true } },
        serviceRecord: true,
        payments: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            amount: true,
            paymentMethod: true,
            status: true,
            createdAt: true,
            transactionId: true,
          },
        },
      },
    });

    return { bookings };
  } catch (error) {
    console.error("Failed to load customer service history:", error);
    return { bookings: [], error: "Failed to load your service history" };
  }
}

function getStatusBadge(status) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-900/20 border-emerald-900/40 text-emerald-300";
    case "IN_PROGRESS":
      return "bg-sky-900/20 border-sky-900/40 text-sky-300";
    case "CANCELLED":
      return "bg-red-900/20 border-red-900/40 text-red-300";
    default:
      return "bg-amber-900/20 border-amber-900/40 text-amber-300";
  }
}

function getPaymentBadge(status) {
  switch (status) {
    case "PAID":
      return "bg-emerald-900/20 border-emerald-900/40 text-emerald-300";
    case "REFUNDED":
      return "bg-sky-900/20 border-sky-900/40 text-sky-300";
    case "FAILED":
      return "bg-red-900/20 border-red-900/40 text-red-300";
    default:
      return "bg-amber-900/20 border-amber-900/40 text-amber-300";
  }
}

export default async function ServiceHistoryPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { bookings, error } = await getCustomerHistory(userId);

  return (
    <div className="container mx-auto px-3 md:px-4 py-8 md:py-12 space-y-6 md:space-y-8 pt-24 md:pt-28">
      <PageHeader
        title="Service History"
        description="Every past appointment, mechanic's notes, and payment receipt in one place."
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

      {bookings.length === 0 ? (
        <Card className="border-emerald-900/20 bg-emerald-950/10">
          <CardContent className="py-6 md:py-8 text-center space-y-2 md:space-y-3">
            <p className="text-base md:text-lg font-semibold text-white">
              No service history yet
            </p>
            <p className="text-xs md:text-sm text-muted-foreground px-2">
              Once a mechanic completes a booking for you, it&apos;ll show up here with
              full notes and payment details.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 md:space-y-5">
          {bookings.map((booking) => {
            const totalPaid = booking.payments
              .filter((p) => p.status === "PAID")
              .reduce((sum, p) => sum + p.amount, 0);

            return (
              <Card key={booking.id} className="border-orange-900/20">
                <CardHeader className="pb-2 md:pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-2 md:gap-3">
                    <div>
                      <CardTitle className="text-base md:text-lg text-white flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-orange-400 flex-shrink-0" />
                        {booking.service?.name || "Service"}
                      </CardTitle>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">
                        {booking.vehicle?.brand} {booking.vehicle?.model} &middot;{" "}
                        {booking.vehicle?.registrationNo}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge className={getStatusBadge(booking.status)}>
                        {booking.status.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(booking.scheduledAt), "d MMM yyyy")}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4">
                  {booking.mechanic?.name && (
                    <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1.5">
                      <UserIcon className="h-3.5 w-3.5 flex-shrink-0" />
                      Mechanic: <span className="text-white">{booking.mechanic.name}</span>
                    </p>
                  )}

                  {(booking.serviceRecord?.description || booking.notes) && (
                    <div className="rounded-lg bg-muted/20 border border-white/5 p-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Service Notes
                      </p>
                      <p className="text-xs md:text-sm text-gray-200 whitespace-pre-wrap">
                        {booking.serviceRecord?.description || booking.notes}
                      </p>
                    </div>
                  )}

                  {booking.payments.length > 0 && (
                    <div className="rounded-lg border border-white/5 divide-y divide-white/5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide p-3 pb-2 flex items-center gap-1.5">
                        <IndianRupee className="h-3.5 w-3.5" />
                        Payment{booking.payments.length > 1 ? "s" : ""}
                      </p>
                      {booking.payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs md:text-sm"
                        >
                          <div>
                            <span className="text-white font-medium">
                              ₹{payment.amount.toLocaleString()}
                            </span>{" "}
                            <span className="text-muted-foreground">
                              via {payment.paymentMethod}
                            </span>
                            {payment.transactionId && (
                              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                                Txn: {payment.transactionId}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getPaymentBadge(payment.status)}>
                              {payment.status}
                            </Badge>
                            <span className="text-muted-foreground">
                              {format(new Date(payment.createdAt), "d MMM yyyy")}
                            </span>
                          </div>
                        </div>
                      ))}
                      {totalPaid > 0 && (
                        <div className="px-3 py-2 text-xs md:text-sm flex justify-between font-medium">
                          <span className="text-muted-foreground">Total paid</span>
                          <span className="text-emerald-300">
                            ₹{totalPaid.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
