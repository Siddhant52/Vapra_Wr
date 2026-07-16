import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { isAllowedAdminEmail } from "@/lib/admin-access";

function SignedOutActions() {
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

export async function HeaderAuthServer() {
  let userId = null;

  try {
    const session = await auth();
    userId = session?.userId ?? null;
  } catch {
    // auth() throws when clerkMiddleware did not run (e.g. static asset 404s).
    // Fall back to signed-out UI instead of crashing the page.
    return <SignedOutActions />;
  }

  if (!userId) {
    return <SignedOutActions />;
  }

  let user = null;
  try {
    user = await currentUser();
  } catch {
    return <SignedOutActions />;
  }

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
