import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const packages = await prisma.passPackage.findMany({
      include: {
        vehicleType: true
      },
      orderBy: {
        price: 'asc'
      }
    });

    return NextResponse.json({ packages });
  } catch (error) {
    console.error('Failed to fetch pass packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pass packages' },
      { status: 500 }
    );
  }
}
