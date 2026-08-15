import { NextRequest, NextResponse } from 'next/server';
import { checkInTicket, getTicketByReference, rejectTicket } from '@/lib/event-ticket-store';

export async function POST(req: NextRequest) {
  try {
    const { reference, securityAgent, forceReject, rejectionNote, previewOnly } = await req.json();

    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 });
    }

    const ticket = getTicketByReference(String(reference).trim());
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found', allowed: false }, { status: 404 });
    }

    if (previewOnly) {
      return NextResponse.json({
        ticket: {
          eventTitle: ticket.eventTitle,
          ticketTypeName: ticket.ticketTypeName,
          buyerName: ticket.buyerName,
          buyerEmail: ticket.buyerEmail,
          reference: ticket.reference,
          approvalStatus: ticket.approvalStatus,
          status: ticket.status,
          qrCode: ticket.qrCode,
          purchasedAt: ticket.purchasedAt,
        },
      });
    }

    if (!securityAgent) {
      return NextResponse.json({ error: 'Security agent name is required' }, { status: 400 });
    }

    if (forceReject) {
      const rejectedTicket = rejectTicket(ticket.reference);
      return NextResponse.json({
        allowed: false,
        reason: rejectionNote || 'Ticket manually rejected by security',
        ticket: rejectedTicket ? {
          eventTitle: rejectedTicket.eventTitle,
          ticketTypeName: rejectedTicket.ticketTypeName,
          buyerName: rejectedTicket.buyerName,
          reference: rejectedTicket.reference,
          approvalStatus: rejectedTicket.approvalStatus,
          status: rejectedTicket.status,
        } : null,
      });
    }

    if (ticket.approvalStatus !== 'APPROVED') {
      return NextResponse.json({
        allowed: false,
        reason: 'Ticket has not been approved yet',
        ticket: {
          eventTitle: ticket.eventTitle,
          ticketTypeName: ticket.ticketTypeName,
          buyerName: ticket.buyerName,
          reference: ticket.reference,
          approvalStatus: ticket.approvalStatus,
          status: ticket.status,
        },
      });
    }

    if (ticket.status === 'cancelled') {
      return NextResponse.json({
        allowed: false,
        reason: 'Ticket was rejected',
        ticket: {
          eventTitle: ticket.eventTitle,
          ticketTypeName: ticket.ticketTypeName,
          buyerName: ticket.buyerName,
          reference: ticket.reference,
          approvalStatus: ticket.approvalStatus,
          status: ticket.status,
        },
      });
    }

    if (ticket.status === 'used') {
      return NextResponse.json({
        allowed: false,
        reason: 'Ticket has already been checked in',
        ticket: {
          eventTitle: ticket.eventTitle,
          ticketTypeName: ticket.ticketTypeName,
          buyerName: ticket.buyerName,
          reference: ticket.reference,
          approvalStatus: ticket.approvalStatus,
          status: ticket.status,
        },
      });
    }

    const checkedIn = checkInTicket(ticket.reference, securityAgent.trim());
    return NextResponse.json({
      allowed: true,
      ticket: checkedIn ? {
        eventTitle: checkedIn.eventTitle,
        ticketTypeName: checkedIn.ticketTypeName,
        buyerName: checkedIn.buyerName,
        reference: checkedIn.reference,
        approvalStatus: checkedIn.approvalStatus,
        status: checkedIn.status,
        checkedInAt: checkedIn.checkedInAt,
        checkedInBy: checkedIn.checkedInBy,
      } : null,
    });
  } catch (error) {
    console.error('Failed to verify event ticket:', error);
    return NextResponse.json({ error: 'Failed to verify event ticket', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
