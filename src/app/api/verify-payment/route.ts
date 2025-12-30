import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail, getPaymentConfirmationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { reference } = await req.json();

    if (!reference) {
      return NextResponse.json({ error: 'Payment reference is required' }, { status: 400 });
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const paystackData = await paystackResponse.json();

    if (!paystackData.status || paystackData.data.status !== 'success') {
      return NextResponse.json({ 
        error: 'Payment verification failed',
        details: paystackData.message 
      }, { status: 400 });
    }

    // Update the goods entry payment status
    const goodsEntry = await prisma.goodsEntry.update({
      where: { paymentReference: reference },
      data: { 
        paymentStatus: 'PAID',
      },
      include: {
        vehicleType: true,
      },
    });

    // Send confirmation email to resident
    if (goodsEntry.residentEmail) {
      try {
        await sendEmail({
          to: goodsEntry.residentEmail,
          subject: 'VGC Estate - Payment Confirmation',
          html: getPaymentConfirmationEmail({
            residentName: goodsEntry.residentName,
            paymentReference: goodsEntry.paymentReference,
            vehicleType: goodsEntry.vehicleType.name,
            fee: goodsEntry.vehicleType.fee,
            vendorCompany: goodsEntry.vendorCompany,
            vehiclePlateNumber: goodsEntry.vehiclePlateNumber,
            entryDate: goodsEntry.entryDate.toISOString(),
            qrCode: goodsEntry.qrCode || '',
          }),
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Continue even if email fails
      }
    }

    return NextResponse.json({
      success: true,
      entry: {
        id: goodsEntry.id,
        residentName: goodsEntry.residentName,
        vendorCompany: goodsEntry.vendorCompany,
        vehiclePlateNumber: goodsEntry.vehiclePlateNumber,
        vehicleType: goodsEntry.vehicleType.name,
        fee: goodsEntry.vehicleType.fee,
        paymentReference: goodsEntry.paymentReference,
        expiresAt: goodsEntry.expiresAt,
      },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ 
      error: 'Failed to verify payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
