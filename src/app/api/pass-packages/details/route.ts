import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const reference = searchParams.get('ref');

    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
    }

    const purchase = await prisma.passPurchase.findUnique({
      where: { paymentReference: reference },
      include: {
        passPackage: {
          include: {
            vehicleType: true
          }
        }
      }
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    return NextResponse.json({ purchase });
  } catch (error) {
    console.error('Failed to fetch purchase:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase details' },
      { status: 500 }
    );
  }
}
