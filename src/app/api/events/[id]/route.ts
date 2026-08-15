import { NextResponse } from 'next/server';
import { deleteEvent, getEventById, getEventByShareSlug, updateEvent } from '@/lib/event-ticket-store';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const event = (await getEventById(id)) || (await getEventByShareSlug(id));

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Failed to load event by id:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load event' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const event = await updateEvent(id, {
      title: body.title,
      description: body.description,
      venue: body.venue,
      date: body.date,
      image: body.image,
      colors: Array.isArray(body.colors) ? body.colors : (body.color ? [body.color] : undefined),
      circleOptions: Array.isArray(body.circleOptions) ? body.circleOptions : undefined,
      shareSlug: body.shareSlug,
      status: body.status,
      eventType: body.eventType,
      heroHeading: body.heroHeading,
      heroSubheading: body.heroSubheading,
      heroAge: body.heroAge,
      heroHeadingFont: body.heroHeadingFont,
      heroSubheadingFont: body.heroSubheadingFont,
      heroAgeFont: body.heroAgeFont,
      heroText: body.heroText,
      invitationMessage: body.invitationMessage,
      dressCode: body.dressCode,
      admits: body.admits,
      venueNote: body.venueNote,
      familyNote: body.familyNote,
      ctaText: body.ctaText,
      isTicketless: body.isTicketless ?? undefined,
      ticketTypes: Array.isArray(body.ticketTypes) ? body.ticketTypes : undefined,
    });

    return NextResponse.json({ event });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update event';
    const status = message === 'Event not found' ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = await deleteEvent(id);

  if (!deleted) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
