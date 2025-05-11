import { clerkMiddleware } from '@clerk/nextjs/server';

// Define an array of public routes with proper regex patterns
const publicRoutes = [
  '/',
  '/login(.*)', // Use regex pattern for login and all its sub-routes
  '/sign-up(.*)', // Use regex pattern for sign-up and all its sub-routes
  '/api/webhook(.*)',
  '/api/auth/linkedin(.*)', // Allow LinkedIn auth routes
  '/__clerk(.*)', // Allow Clerk's internal routes
];

export default clerkMiddleware({
  // @ts-expect-error - Clerk types are not properly exported
  publicRoutes
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};