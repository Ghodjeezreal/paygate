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
  const isLoginRoute = pathname.startsWith('/login');

  // Get auth token
  const token = request.cookies.get('auth-token')?.value;

  // If accessing login page and already authenticated, redirect to appropriate dashboard
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

  // Check if route requires authentication
  if (isAdminRoute || isVerifyRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const verified = await jwtVerify(token, SECRET_KEY);
      const role = verified.payload.role as string;

      // Check role-based access
      if (isAdminRoute && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      if (isVerifyRoute && role !== 'SECURITY' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (error) {
      // Invalid token
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*', 
    '/verify/:path*', 
    '/login'
  ],
};
