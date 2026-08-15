import { NextResponse } from 'next/server';
import { createEvent, getEvents } from '@/lib/event-ticket-store';

export async function GET() {
  try {
    const events = await getEvents();
    return NextResponse.json({ events });
  } catch (error) {
    console.error('Failed to load events:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load events' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const event = await createEvent({
      title: body.title,
      description: body.description,
      venue: body.venue,
      date: body.date,
      image: body.image,
      colors: Array.isArray(body.colors) ? body.colors : (body.color ? [body.color] : ['#c8a047']),
      circleOptions: Array.isArray(body.circleOptions) ? body.circleOptions : ['Family', 'Friends of the Family', 'Church Family'],
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
      isTicketless: Boolean(body.isTicketless),
      ticketTypes: Array.isArray(body.ticketTypes) ? body.ticketTypes : [],
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create event' },
      { status: 400 }
    );
  }
}
