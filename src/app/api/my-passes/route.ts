import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Email or phone number is required' },
        { status: 400 }
      );
    }

    // Build query filter
    const where: any = {
      paymentStatus: 'PAID', // Only show paid passes
    };

    if (email && phone) {
      where.OR = [
        { email: { equals: email, mode: 'insensitive' } },
        { phone }
      ];
    } else if (email) {
      where.email = { equals: email, mode: 'insensitive' };
    } else if (phone) {
      where.phone = phone;
    }

    // Fetch pass purchases with related data
    const passes = await prisma.passPurchase.findMany({
      where,
      include: {
        passPackage: {
          include: {
            vehicleType: true
          }
        },
        entries: {
          include: {
            vehicleType: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ passes });
  } catch (error) {
    console.error('Error fetching passes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch passes' },
      { status: 500 }
    );
  }
}
