import { NextResponse } from 'next/server';
import { getTickets } from '@/lib/event-ticket-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status')?.toUpperCase();

  let tickets = await getTickets();

  if (statusFilter && statusFilter !== 'ALL') {
    tickets = tickets.filter((ticket) => ticket.approvalStatus === statusFilter);
  } else if (!statusFilter) {
    tickets = tickets.filter((ticket) => ticket.approvalStatus === 'PENDING' || ticket.approvalStatus === 'REJECTED');
  }

  tickets = tickets.sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());

  return NextResponse.json({ tickets });
}
