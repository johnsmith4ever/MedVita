/**
 * middleware.ts — Clerk route protection for MedVita
 *
 * NOTE: The prompt referenced proxy.ts to avoid a known Next.js 16 / Clerk
 * middleware conflict. In Next.js 15 (which this project uses), the file must
 * be named middleware.ts for the framework to pick it up as middleware.
 * The protection logic lives here; proxy.ts is kept as a reference/stub.
 *
 * Public routes: / (landing), /sign-in, static assets.
 * Everything else (/app/**) requires an authenticated Clerk session.
 */
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',             // Landing page — unauthenticated visitors land here
  '/sign-in(.*)', // Clerk-hosted sign-in
  '/api/health',  // Optional health-check probe
  '/sitemap.xml', // Must be public so search engines can read it
  '/robots.txt',  // Must be public so search engines can read it
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
