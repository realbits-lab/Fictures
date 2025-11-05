// Middleware for Next.js
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default auth((req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Block /test routes in production
  if (pathname.startsWith('/test')) {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      // Return 404 in production to hide existence of test routes
      return NextResponse.rewrite(new URL('/404', req.url));
    }
  }

  // Continue with auth middleware for other routes
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
