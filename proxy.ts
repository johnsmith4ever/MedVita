/**
 * proxy.ts — Route protection for MedVita
 *
 * NOTE: This project intentionally uses proxy.ts instead of middleware.ts to
 * avoid a known conflict between Next.js 15/16 edge runtime and Clerk's
 * middleware. Clerk's clerkMiddleware() is wired here and re-exported as the
 * Next.js middleware export.
 *
 * Public routes: landing page (/), sign-in (/sign-in), and static assets.
 * Everything else (including /app/**) requires an authenticated Clerk session.
 */
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',            // Landing page — unauthenticated visitors land here
  '/sign-in(.*)', // Clerk-hosted sign-in page
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
    // Skip Next.js internals and all static files unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
