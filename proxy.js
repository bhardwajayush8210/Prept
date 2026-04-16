import arcjet, { detectBot, shield } from "@arcjet/next";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
  "/appointments(.*)",
  "/explore(.*)",
  "/dashboard(.*)",
  "/onboarding(.*)",
]);

const isWebhookRoute = createRouteMatcher(["/api/webhooks/stream(.*)"]);

// ✅ Routes that should never trigger the onboarding redirect
const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);
const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
    }),
  ],
});

export default clerkMiddleware(async (auth, req) => {
  if (!isWebhookRoute(req)) {
    const decision = await aj.protect(req);
    if (decision.isDenied()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { userId, sessionClaims, redirectToSignIn } = await auth();

  // Not logged in + protected route → sign in
  if (!userId && isProtectedRoute(req)) {
    return redirectToSignIn();
  }

  // ✅ Logged in but onboarding not done → send to /onboarding
  // (skip if already on a public route or already on /onboarding)
  if (
    userId &&
    !sessionClaims?.metadata?.onboardingComplete &&
    !isOnboardingRoute(req) &&
    !isPublicRoute(req)
  ) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // ✅ Onboarding done but trying to visit /onboarding again → redirect away
  if (
    userId &&
    sessionClaims?.metadata?.onboardingComplete &&
    isOnboardingRoute(req)
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
