import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const vehicleType = searchParams.get('vehicleType');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build filter conditions
    const where: any = {};

    if (status && status !== 'all') {
      where.paymentStatus = status.toUpperCase();
    }

    if (vehicleType && vehicleType !== 'all') {
      where.vehicleTypeId = parseInt(vehicleType);
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    if (search) {
      where.OR = [
        { residentName: { contains: search, mode: 'insensitive' } },
        { vendorCompany: { contains: search, mode: 'insensitive' } },
        { vehiclePlateNumber: { contains: search, mode: 'insensitive' } },
        { paymentReference: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch entries with filters
    const entries = await prisma.goodsEntry.findMany({
      where,
      include: {
        vehicleType: true,
        verificationLogs: {
          orderBy: { verifiedAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to last 100 entries
    });

    // Get statistics
    const stats = {
      total: await prisma.goodsEntry.count(),
      paid: await prisma.goodsEntry.count({ where: { paymentStatus: 'PAID' } }),
      pending: await prisma.goodsEntry.count({ where: { paymentStatus: 'PENDING' } }),
      verified: await prisma.goodsEntry.count({ where: { passStatus: 'USED' } }),
    };

    return NextResponse.json({
      entries,
      stats
    });
  } catch (error) {
    console.error('Failed to fetch entries:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch entries',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
