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
      return NextResponse.json({ 
        valid: false,
        error: 'Pass not found' 
      }, { status: 404 });
    }

    if (purchase.paymentStatus !== 'PAID') {
      return NextResponse.json({ 
        valid: false,
        error: 'Pass payment not completed' 
      }, { status: 400 });
    }

    if (purchase.remainingEntries <= 0) {
      return NextResponse.json({ 
        valid: false,
        error: 'No entries remaining on this pass' 
      }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      purchase
    });
  } catch (error) {
    console.error('Failed to check pass:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to check pass' },
      { status: 500 }
    );
  }
}
