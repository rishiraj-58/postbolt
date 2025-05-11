import { NextRequest, NextResponse } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = ['/', '/api/webhook'];

// Custom middleware function
export default function middleware(req: NextRequest) {
  // Skip authentication for public routes
  const url = req.nextUrl.pathname;
  if (publicRoutes.includes(url)) {
    return NextResponse.next();
  }
  
  // Continue to next middleware
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(html?|css|js|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};