import { NextRequest, NextResponse } from 'next/server';
import { createTicket, getTickets } from '@/lib/event-ticket-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ticket = await createTicket({
      eventId: body.eventId,
      ticketTypeId: body.ticketTypeId,
      buyerName: body.buyerName,
      buyerEmail: body.buyerEmail,
      buyerPhone: body.buyerPhone,
      circleName: body.circleName || body.circle || undefined,
      guestMessage: body.guestMessage || body.note || undefined,
      quantity: Number(body.quantity || 1),
    });

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('Failed to create ticket', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create ticket' }, { status: 400 });
  }
}

export async function GET() {
  const tickets = await getTickets();
  return NextResponse.json({ tickets });
}
