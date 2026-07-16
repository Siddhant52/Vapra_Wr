import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { isAllowedAdminEmail } from "@/lib/admin-access";

export async function HeaderAuthServer() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="flex items-center gap-1">
        <Link href="/sign-in">
          <Button
            variant="secondary"
            size="sm"
            className="h-7 px-2 py-1 text-xs md:h-9 md:px-3 md:text-sm"
          >
            Sign In
          </Button>
        </Link>
        <Link href="/sign-up">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 py-1 text-xs md:h-9 md:px-3 md:text-sm"
          >
            Sign Up
          </Button>
        </Link>
      </div>
    );
  }

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress;
  const allowListed = isAllowedAdminEmail(email);

  return (
    <div className="flex items-center gap-1">
      {allowListed && (
        <Link href="/admin" className="hidden sm:inline-flex">
          <Button
            variant="outline"
            size="sm"
            className="h-7 border-emerald-400 px-2 py-1 text-xs text-emerald-100 hover:border-emerald-300 hover:bg-emerald-500/10 md:h-9 md:px-3 md:text-sm"
            aria-label="Go to admin dashboard"
          >
            Admin
          </Button>
        </Link>
      )}

      <Link
        href="/booking-status"
        className="flex items-center"
        aria-label="Account and bookings"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user?.imageUrl || "/logo-single2.png"}
          alt=""
          className="h-7 w-7 rounded-full border border-emerald-500/30 object-cover md:h-10 md:w-10"
          width={40}
          height={40}
        />
      </Link>
    </div>
  );
}
