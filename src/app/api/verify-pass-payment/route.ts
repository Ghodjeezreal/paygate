import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendEmail, getPassPurchaseEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { reference, paystackReference } = await req.json();

    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
    }

    // Find the pass purchase
    const purchase = await prisma.passPurchase.findUnique({
      where: { paymentReference: reference },
      include: { passPackage: true }
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    // Verify payment with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${paystackReference || reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();

    if (verifyData.status && verifyData.data.status === 'success') {
      // Update purchase status
      const updatedPurchase = await prisma.passPurchase.update({
        where: { id: purchase.id },
        data: { paymentStatus: 'PAID' },
        include: {
          passPackage: {
            include: {
              vehicleType: true
            }
          }
        }
      });

      // Send confirmation email
      if (updatedPurchase.residentEmail) {
        try {
          const regularPrice = updatedPurchase.passPackage.vehicleType.fee * updatedPurchase.passPackage.entries;
          
          await sendEmail({
            to: updatedPurchase.residentEmail,
            subject: 'VGC Estate - Pass Package Purchase Confirmation',
            html: getPassPurchaseEmail({
              residentName: updatedPurchase.residentName,
              paymentReference: updatedPurchase.paymentReference,
              packageName: updatedPurchase.passPackage.name,
              totalEntries: updatedPurchase.passPackage.entries,
              remainingEntries: updatedPurchase.remainingEntries,
              price: updatedPurchase.passPackage.price,
              discount: updatedPurchase.passPackage.discount,
              vehicleType: updatedPurchase.passPackage.vehicleType.name,
              regularPrice: regularPrice,
            }),
          });
        } catch (emailError) {
          console.error('Failed to send pass purchase confirmation email:', emailError);
          // Continue even if email fails
        }
      }

      return NextResponse.json({
        verified: true,
        purchase: {
          id: purchase.id,
          reference: purchase.paymentReference,
          residentName: purchase.residentName,
          entries: purchase.remainingEntries,
          packageName: purchase.passPackage.name
        }
      });
    } else {
      return NextResponse.json({
        verified: false,
        error: 'Payment not successful'
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Payment verification failed:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
