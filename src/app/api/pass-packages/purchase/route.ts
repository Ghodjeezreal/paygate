import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { residentName, residentEmail, residentPhone, packageId } = await req.json();

    if (!residentName || !residentEmail || !residentPhone || !packageId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Get package details
    const passPackage = await prisma.passPackage.findUnique({
      where: { id: packageId },
      include: { vehicleType: true }
    });

    if (!passPackage) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Generate payment reference
    const randomNumber = Math.floor(1000000 + Math.random() * 9000000);
    const paymentReference = `PKG${randomNumber}`;

    // Create pass purchase
    const purchase = await prisma.passPurchase.create({
      data: {
        residentName,
        residentEmail,
        residentPhone,
        passPackageId: packageId,
        remainingEntries: passPackage.entries,
        paymentStatus: 'PENDING',
        paymentReference,
      },
    });

    return NextResponse.json({
      success: true,
      reference: paymentReference,
      amount: passPackage.price,
      packageName: passPackage.name,
      purchaseId: purchase.id
    });
  } catch (error) {
    console.error('Purchase creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create purchase' },
      { status: 500 }
    );
  }
}
