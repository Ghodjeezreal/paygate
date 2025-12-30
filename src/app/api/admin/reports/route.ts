import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all paid entries within date range
    const entries = await prisma.goodsEntry.findMany({
      where: {
        paymentStatus: 'PAID',
        createdAt: {
          gte: startDate
        }
      },
      include: {
        vehicleType: true,
        passPurchase: {
          include: {
            passPackage: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get pass purchases within date range
    const passPurchases = await prisma.passPurchase.findMany({
      where: {
        paymentStatus: 'PAID',
        createdAt: {
          gte: startDate
        }
      },
      include: {
        passPackage: {
          include: {
            vehicleType: true
          }
        }
      }
    });

    // Calculate totals
    const singleEntries = entries.filter(e => !e.passPurchaseId);
    const singleEntryRevenue = singleEntries.reduce((sum, entry) => sum + entry.vehicleType.fee, 0);
    const passRevenue = passPurchases.reduce((sum, purchase) => sum + purchase.passPackage.price, 0);
    const totalRevenue = singleEntryRevenue + passRevenue;

    // Group by vehicle type
    const byVehicleType = Object.values(
      entries.reduce((acc: any, entry) => {
        const type = entry.vehicleType.name;
        if (!acc[type]) {
          acc[type] = {
            vehicleType: type,
            count: 0,
            revenue: 0
          };
        }
        acc[type].count++;
        // Only count revenue for single entries (not pass-based entries)
        if (!entry.passPurchaseId) {
          acc[type].revenue += entry.vehicleType.fee;
        }
        return acc;
      }, {})
    ).sort((a: any, b: any) => b.revenue - a.revenue);

    // Group by date
    const byDate = Object.values(
      entries.reduce((acc: any, entry) => {
        const date = entry.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = {
            date,
            entries: 0,
            revenue: 0
          };
        }
        acc[date].entries++;
        if (!entry.passPurchaseId) {
          acc[date].revenue += entry.vehicleType.fee;
        }
        return acc;
      }, {})
    ).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Add pass purchase revenue to the correct dates
    passPurchases.forEach(purchase => {
      const date = purchase.createdAt.toISOString().split('T')[0];
      const dayData = (byDate as any[]).find(d => d.date === date);
      if (dayData) {
        dayData.revenue += purchase.passPackage.price;
      } else {
        (byDate as any[]).push({
          date,
          entries: 0,
          revenue: purchase.passPackage.price
        });
      }
    });

    // Recent entries for table
    const recentEntries = entries.slice(0, 20).map(entry => ({
      id: entry.id,
      residentName: entry.residentName,
      vehicleType: entry.vehicleType.name,
      amount: entry.passPurchaseId ? 0 : entry.vehicleType.fee,
      date: entry.createdAt.toISOString(),
      status: entry.passStatus === 'VALID' ? 'APPROVED' : entry.passStatus
    }));

    return NextResponse.json({
      totalRevenue,
      totalEntries: entries.length,
      totalPasses: passPurchases.length,
      passRevenue,
      singleEntryRevenue,
      byVehicleType,
      byDate,
      recentEntries
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
}
