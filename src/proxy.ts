import { NextResponse } from "next/server";
import { auth } from "@/auth";

const NEEDS_AUTH = (pathname: string) =>
  pathname.startsWith("/dashboard") ||
  pathname.startsWith("/onboarding") ||
  /^\/tracks\/[^/]+\/register/.test(pathname) ||
  /^\/tracks\/[^/]+\/week\/\d+\/submit/.test(pathname) ||
  /^\/tracks\/[^/]+\/week-\d+\/submit/.test(pathname);

const NEEDS_ONBOARDING = (pathname: string) =>
  pathname.startsWith("/dashboard") ||
  /^\/tracks\/[^/]+\/register/.test(pathname) ||
  /^\/tracks\/[^/]+\/week\/\d+\/submit/.test(pathname) ||
  /^\/tracks\/[^/]+\/week-\d+\/submit/.test(pathname);

export default auth((req) => {
  const { pathname, search } = req.nextUrl;

  if (!NEEDS_AUTH(pathname)) return NextResponse.next();

  // Not signed in: bounce to /signin with the original target preserved.
  if (!req.auth) {
    const signInUrl = new URL("/signin", req.nextUrl);
    signInUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(signInUrl);
  }

  // Signed in but no csot_users row yet → force onboarding before
  // anything that depends on having a user id.
  const onboarded = Boolean(req.auth.user?.id);
  if (!onboarded && NEEDS_ONBOARDING(pathname)) {
    const onboardUrl = new URL("/onboarding", req.nextUrl);
    onboardUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(onboardUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tracks/:slug/register/:path*",
    "/tracks/:slug/week/:week/submit",
    "/tracks/:slug/week-1/submit",
    "/onboarding/:path*",
  ],
};
