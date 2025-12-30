import { jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'vgc-estate-secret-key-change-in-production'
);

export interface AuthUser {
  userId: string;
  username: string;
  role: 'ADMIN' | 'SECURITY';
  fullName: string;
}

export async function verifyAuth(req: NextRequest): Promise<AuthUser | null> {
  try {
    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    const verified = await jwtVerify(token, SECRET_KEY);
    return verified.payload as unknown as AuthUser;
  } catch (error) {
    console.error('Auth verification failed:', error);
    return null;
  }
}

export async function requireAuth(req: NextRequest, allowedRoles?: ('ADMIN' | 'SECURITY')[]): Promise<AuthUser> {
  const user = await verifyAuth(req);

  if (!user) {
    throw new Error('Unauthorized');
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error('Forbidden');
  }

  return user;
}
