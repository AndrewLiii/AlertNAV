import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  const userEmail = request.cookies.get('user_email')?.value;
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isAuthAPI = request.nextUrl.pathname.startsWith('/api/auth');

  // If user is not logged in and not on login page or auth API, redirect to login
  if (!userEmail && !isLoginPage && !isAuthAPI) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is logged in and on login page, redirect to home
  if (userEmail && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
