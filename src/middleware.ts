import { auth } from '@/lib/auth';

export default auth((req) => {
  // The middleware logic is handled in the auth config
});

export const config = {
  // Match all paths except static files and API routes that don't need auth
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};