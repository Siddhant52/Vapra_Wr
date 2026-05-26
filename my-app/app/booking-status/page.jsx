import CustomerBookingStatusClient from "./status-client";
import { auth } from "@clerk/nextjs/server";

export const metadata = {
  title: "Booking Status - Vapra Workshop",
  description: "Track current and previous booking requests.",
};

export default async function BookingStatusPage({ searchParams }) {
  const { userId } = await auth();
  const params = await searchParams;
  const newBookingId = params?.newBooking || "";
  const initialAccessCode = params?.accessCode || "";

  return (
    <div className="container mx-auto px-4 py-10">
      <CustomerBookingStatusClient
        isSignedIn={!!userId}
        initialAccessCode={initialAccessCode}
        highlightRequestId={newBookingId}
      />
    </div>
  );
}
