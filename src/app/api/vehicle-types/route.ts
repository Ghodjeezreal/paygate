import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Attempting to fetch vehicle types...');
    const vehicleTypes = await prisma.vehicleType.findMany();
    console.log('Vehicle types fetched:', vehicleTypes);
    return NextResponse.json(vehicleTypes);
  } catch (error) {
    console.error('Error fetching vehicle types:', error);
    return NextResponse.json({ error: 'Failed to fetch vehicle types', details: String(error) }, { status: 500 });
  }
}
