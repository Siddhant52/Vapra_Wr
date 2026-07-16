import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const publicApiPrefixes = ["/api/create-order", "/api/verify-payment", "/api/checkout"];

function isPublicRoute(req) {
  const pathname = req?.nextUrl?.pathname || "";
  return publicApiPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  const { userId } = await auth();

  if (!userId && req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Run on all app routes so auth() in layouts/components always sees Clerk context.
    // Skip only Next internals and optimized image endpoint.
    "/((?!_next/static|_next/image|.*\\..*$).*)",
    "/(api|trpc)(.*)",
  ],
};
