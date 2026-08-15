import { NextRequest, NextResponse } from 'next/server';
import { checkInTicket, getTicketByReference } from '@/lib/event-ticket-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const reference = body.reference?.trim();
    const checkedInBy = body.checkedInBy?.trim() || 'staff';

    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
    }

    const existing = getTicketByReference(reference);
    if (!existing) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const ticket = checkInTicket(reference, checkedInBy);
    return NextResponse.json({ ticket, success: true });
  } catch (error) {
    console.error('Failed to check in ticket', error);
    return NextResponse.json({ error: 'Failed to check in ticket' }, { status: 500 });
  }
}
