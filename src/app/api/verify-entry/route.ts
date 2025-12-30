import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { reference, securityAgent, forceReject, rejectionNote, previewOnly } = await req.json();

    if (!reference) {
      return NextResponse.json({ 
        error: 'Reference is required' 
      }, { status: 400 });
    }

    // Find the goods entry
    const goodsEntry = await prisma.goodsEntry.findUnique({
      where: { paymentReference: reference },
      include: { 
        vehicleType: true,
        verificationLogs: {
          orderBy: { verifiedAt: 'desc' },
          take: 1
        }
      },
    });

    if (!goodsEntry) {
      return NextResponse.json({ 
        error: 'Entry not found',
        allowed: false 
      }, { status: 404 });
    }

    // If preview mode, return entry details without logging
    if (previewOnly) {
      return NextResponse.json({
        entry: {
          residentName: goodsEntry.residentName,
          vendorCompany: goodsEntry.vendorCompany,
          address: goodsEntry.address,
          vehiclePlateNumber: goodsEntry.vehiclePlateNumber,
          vehicleType: goodsEntry.vehicleType.name,
          natureOfGoods: goodsEntry.natureOfGoods,
          paymentStatus: goodsEntry.paymentStatus,
          expiresAt: goodsEntry.expiresAt,
          passStatus: goodsEntry.passStatus,
        }
      });
    }

    if (!securityAgent) {
      return NextResponse.json({ 
        error: 'Security agent name is required' 
      }, { status: 400 });
    }

    // Handle manual rejection
    if (forceReject) {
      const notes = rejectionNote || 'Manually rejected by security - Wrong vehicle or mismatch';
      
      await prisma.verificationLog.create({
        data: {
          goodsEntryId: goodsEntry.id,
          status: 'DENIED',
          notes,
          securityAgent,
        },
      });

      return NextResponse.json({
        allowed: false,
        reason: 'Entry manually rejected by security',
        entry: {
          residentName: goodsEntry.residentName,
          vehiclePlateNumber: goodsEntry.vehiclePlateNumber,
          address: goodsEntry.address,
        }
      });
    }

    // Check if payment is completed
    if (goodsEntry.paymentStatus !== 'PAID') {
      await prisma.verificationLog.create({
        data: {
          goodsEntryId: goodsEntry.id,
          status: 'DENIED',
          notes: 'Payment not completed',
          securityAgent,
        },
      });

      return NextResponse.json({
        allowed: false,
        reason: 'Payment not completed',
        entry: {
          residentName: goodsEntry.residentName,
          vehiclePlateNumber: goodsEntry.vehiclePlateNumber,
          paymentStatus: goodsEntry.paymentStatus,
        }
      });
    }

    // Check if pass has expired
    if (new Date() > new Date(goodsEntry.expiresAt)) {
      await prisma.verificationLog.create({
        data: {
          goodsEntryId: goodsEntry.id,
          status: 'DENIED',
          notes: 'Pass expired',
          securityAgent,
        },
      });

      return NextResponse.json({
        allowed: false,
        reason: 'Pass has expired',
        entry: {
          residentName: goodsEntry.residentName,
          vehiclePlateNumber: goodsEntry.vehiclePlateNumber,
          expiresAt: goodsEntry.expiresAt,
        }
      });
    }

    // Check if pass is already used (optional - remove if multi-use is allowed)
    if (goodsEntry.passStatus === 'USED') {
      await prisma.verificationLog.create({
        data: {
          goodsEntryId: goodsEntry.id,
          status: 'DENIED',
          notes: 'Pass already used',
          securityAgent,
        },
      });

      return NextResponse.json({
        allowed: false,
        reason: 'Pass already used',
        entry: {
          residentName: goodsEntry.residentName,
          vehiclePlateNumber: goodsEntry.vehiclePlateNumber,
          lastVerification: goodsEntry.verificationLogs[0]?.verifiedAt,
        }
      });
    }

    // All checks passed - allow entry
    await prisma.verificationLog.create({
      data: {
        goodsEntryId: goodsEntry.id,
        status: 'ALLOWED',
        notes: 'Entry granted',
        securityAgent,
      },
    });

    // Mark pass as used (comment out if multi-use is allowed)
    await prisma.goodsEntry.update({
      where: { id: goodsEntry.id },
      data: { passStatus: 'USED' },
    });

    return NextResponse.json({
      allowed: true,
      entry: {
        id: goodsEntry.id,
        residentName: goodsEntry.residentName,
        vendorCompany: goodsEntry.vendorCompany,
        address: goodsEntry.address,
        vehiclePlateNumber: goodsEntry.vehiclePlateNumber,
        vehicleType: goodsEntry.vehicleType.name,
        fee: goodsEntry.vehicleType.fee,
        entryDate: goodsEntry.entryDate,
        expiresAt: goodsEntry.expiresAt,
        paymentReference: goodsEntry.paymentReference,
      }
    });

  } catch (error) {
    console.error('Entry verification error:', error);
    return NextResponse.json({ 
      error: 'Failed to verify entry',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
