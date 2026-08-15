import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'vgc-estate-secret-key-change-in-production'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes
  const isAdminRoute = pathname.startsWith('/admin');
  const isVerifyRoute = pathname.startsWith('/verify');
  const isEventCheckInRoute = pathname.startsWith('/events/check-in');
  const isLoginRoute = pathname.startsWith('/login');

  const token = request.cookies.get('auth-token')?.value;

  if (isLoginRoute && token) {
    try {
      const verified = await jwtVerify(token, SECRET_KEY);
      const role = verified.payload.role as string;

      if (role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else if (role === 'SECURITY') {
        return NextResponse.redirect(new URL('/verify', request.url));
      }
    } catch (error) {
      // Invalid token, continue to login
    }
  }

  if (isAdminRoute || isVerifyRoute || isEventCheckInRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const verified = await jwtVerify(token, SECRET_KEY);
      const role = verified.payload.role as string;

      if (isAdminRoute && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      if ((isVerifyRoute || isEventCheckInRoute) && role !== 'SECURITY' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/verify/:path*',
    '/events/check-in',
    '/login'
  ],
};
