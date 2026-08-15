import { NextResponse } from 'next/server';
import { approveTicket, deleteTicket, getTicketByReference, rejectTicket } from '@/lib/event-ticket-store';

export async function GET(_request: Request, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const ticket = await getTicketByReference(decodeURIComponent(reference));

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  return NextResponse.json({ ticket });
}

export async function POST(request: Request, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const body = await request.json().catch(() => ({}));

  if (body.action === 'approve') {
    const ticket = await approveTicket(decodeURIComponent(reference));
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, ticket });
  }

  if (body.action === 'reject') {
    const ticket = await rejectTicket(decodeURIComponent(reference));
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, ticket });
  }

  return NextResponse.json({ error: 'Action is required' }, { status: 400 });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const deletedTicket = await deleteTicket(decodeURIComponent(reference));

  if (!deletedTicket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, ticket: deletedTicket });
}
