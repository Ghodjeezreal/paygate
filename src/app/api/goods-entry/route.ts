import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      residentName,
      vendorCompany,
      address,
      vehiclePlateNumber,
      vehicleTypeId,
      usePass,
      passReference,
    } = body;

    if (!residentName || !vendorCompany || !address || !vehiclePlateNumber || !vehicleTypeId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const vehicleType = await prisma.vehicleType.findUnique({ 
      where: { id: parseInt(vehicleTypeId) } 
    });
    
    if (!vehicleType) {
      return NextResponse.json({ error: 'Invalid vehicle type' }, { status: 400 });
    }

    // If using pass, validate and deduct entry
    let passPurchaseId = null;
    if (usePass && passReference) {
      const passPurchase = await prisma.passPurchase.findUnique({
        where: { paymentReference: passReference },
        include: {
          passPackage: {
            include: {
              vehicleType: true
            }
          }
        }
      });

      if (!passPurchase) {
        return NextResponse.json({ error: 'Pass not found' }, { status: 404 });
      }

      if (passPurchase.paymentStatus !== 'PAID') {
        return NextResponse.json({ error: 'Pass payment not completed' }, { status: 400 });
      }

      if (passPurchase.remainingEntries <= 0) {
        return NextResponse.json({ error: 'No entries remaining on this pass' }, { status: 400 });
      }

      // Check if vehicle type matches
      if (passPurchase.passPackage.vehicleTypeId !== parseInt(vehicleTypeId)) {
        return NextResponse.json({ 
          error: `This pass is only valid for ${passPurchase.passPackage.vehicleType.name}` 
        }, { status: 400 });
      }

      passPurchaseId = passPurchase.id;

      // Deduct one entry from the pass
      await prisma.passPurchase.update({
        where: { id: passPurchase.id },
        data: {
          remainingEntries: passPurchase.remainingEntries - 1
        }
      });
    }

    // Generate 7-digit random number
    const randomNumber = Math.floor(1000000 + Math.random() * 9000000);
    const paymentReference = `VGC${randomNumber}`;
    const entryDate = new Date();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Pass expires after 24 hours

    const goodsEntry = await prisma.goodsEntry.create({
      data: {
        residentName,
        vendorCompany,
        address,
        vehiclePlateNumber: vehiclePlateNumber.toUpperCase(),
        natureOfGoods: 'Goods Delivery', // Default value
        entryDate,
        vehicleTypeId: parseInt(vehicleTypeId),
        paymentReference,
        expiresAt,
        paymentStatus: usePass ? 'PAID' : 'PENDING', // Mark as PAID if using pass
        passPurchaseId: passPurchaseId,
      },
    });

    // If using pass, return success immediately
    if (usePass) {
      return NextResponse.json({
        id: goodsEntry.id,
        paymentReference: goodsEntry.paymentReference,
        usedPass: true,
        message: 'Entry created successfully using pass'
      }, { status: 201 });
    }

    // Return entry details with payment info
    return NextResponse.json({
      id: goodsEntry.id,
      paymentReference: goodsEntry.paymentReference,
      amount: vehicleType.fee * 100, // Paystack expects amount in kobo (multiply by 100)
      fee: vehicleType.fee,
      vehicleType: vehicleType.name,
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create goods entry:', error);
    return NextResponse.json({ 
      error: 'Failed to create goods entry', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
