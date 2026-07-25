import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/sign-out-button";
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

const adminBtnClass =
  "h-7 border-emerald-400 px-2 py-1 text-xs text-emerald-100 hover:border-emerald-300 hover:bg-emerald-500/10 md:h-9 md:px-3 md:text-sm";

export async function HeaderAuthServer() {
  let userId = null;

  try {
    const session = await auth();
    userId = session?.userId ?? null;
  } catch {
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
  const isAdmin = isAllowedAdminEmail(email);

  return (
    <div className="flex items-center gap-1 md:gap-2">
      {isAdmin && (
        <>
          <Link href="/admin" className="inline-flex">
            <Button variant="outline" size="sm" className={adminBtnClass} aria-label="Admin dashboard">
              Dashboard
            </Button>
          </Link>
          <Link href="/admin/manage" className="inline-flex">
            <Button variant="outline" size="sm" className={adminBtnClass} aria-label="Admin manage">
              Manage
            </Button>
          </Link>
        </>
      )}

      <Link
        href={isAdmin ? "/admin" : "/booking-status"}
        className="flex items-center"
        aria-label={isAdmin ? "Admin account" : "Account and bookings"}
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

      <SignOutButton className="hidden h-7 px-2 py-1 text-xs text-gray-300 hover:text-white sm:inline-flex md:h-9 md:px-3 md:text-sm" />
    </div>
  );
}
