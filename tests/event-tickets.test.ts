import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { normalizeTicketStatus, canCheckIn, createTicketReference } from '../src/lib/event-tickets';
import { createEvent, createTicket, getTicketByReference, updateEvent } from '../src/lib/event-ticket-store';

describe('event ticket helpers', () => {
  it('normalizes unknown status to valid', () => {
    assert.equal(normalizeTicketStatus('UNKNOWN'), 'valid');
  });

  it('allows check-in only for valid tickets', () => {
    assert.equal(canCheckIn('valid'), true);
    assert.equal(canCheckIn('used'), false);
  });

  it('creates a compact 10-character ticket reference format', () => {
    const ref = createTicketReference('event-1', 'vip');
    assert.equal(ref.length, 10);
    assert.match(ref, /^[A-Z0-9]{10}$/);
  });

  it('allows funeral-style events without ticket types', async () => {
    const event = await createEvent({
      title: 'Funeral Service',
      description: 'A memorial service for family and friends.',
      venue: 'Grace Chapel',
      date: '2026-12-15T10:00:00.000Z',
      status: 'published',
      isTicketless: true,
      ticketTypes: [],
    });

    assert.equal(event.isTicketless, true);
    assert.deepEqual(event.ticketTypes, []);
  });

  it('stores custom hero font settings for admin editing', async () => {
    const event = await createEvent({
      title: 'Birthday Celebration',
      description: 'An elegant evening with family and friends.',
      venue: 'The Pavilion',
      date: '2026-12-20T18:30:00.000Z',
      status: 'published',
      heroHeading: 'Birthday',
      heroSubheading: 'Celebration',
      heroAge: '50',
      heroHeadingFont: 'Georgia',
      heroSubheadingFont: 'Arial',
      heroAgeFont: 'Times New Roman',
      ticketTypes: [{ id: 'general', name: 'General', price: 5000, quantity: 100 }],
    });

    assert.equal(event.heroHeadingFont, 'Georgia');
    assert.equal(event.heroSubheadingFont, 'Arial');
    assert.equal(event.heroAgeFont, 'Times New Roman');
  });

  it('stores a custom color for the event color-of-day circle', async () => {
    const event = await createEvent({
      title: 'Color Day Event',
      description: 'A custom-themed gathering with a chosen accent color.',
      venue: 'Sunset Hall',
      date: '2026-12-25T18:00:00.000Z',
      status: 'published',
      color: '#ff7a59',
      ticketTypes: [{ id: 'general', name: 'General', price: 5000, quantity: 120 }],
    });

    assert.equal(event.color, '#ff7a59');
  });

  it('stores event-specific RSVP circle options', async () => {
    const event = await createEvent({
      title: 'Family Tribute',
      description: 'A memorial gathering with different response circles.',
      venue: 'Green Valley Hall',
      date: '2026-12-30T15:00:00.000Z',
      status: 'published',
      circleOptions: ['Family', 'Friends of the Family', 'Church Family'],
      ticketTypes: [{ id: 'general', name: 'General', price: 0, quantity: 200 }],
    });

    assert.deepEqual(event.circleOptions, ['Family', 'Friends of the Family', 'Church Family']);
  });

  it('creates event registrations in pending approval status before QR delivery', async () => {
    const event = await createEvent({
      title: 'Approval Gate Event',
      description: 'A gathering that waits for admin approval before sending the ticket.',
      venue: 'City Hall',
      date: '2027-01-10T18:00:00.000Z',
      status: 'published',
      ticketTypes: [{ id: 'general', name: 'General', price: 0, quantity: 50 }],
    });

    const ticket = await createTicket({
      eventId: event.id,
      ticketTypeId: 'general',
      buyerName: 'Ada Lovelace',
      buyerEmail: 'ada@example.com',
      quantity: 1,
    });

    assert.equal(ticket.approvalStatus, 'PENDING');
    assert.equal(ticket.qrCode, '');
  });

  it('persists created ticket registrations so the success page can recover them after approval', async () => {
    const event = await createEvent({
      title: 'Persisted Invite Event',
      description: 'Invitees must still be findable after a reload.',
      venue: 'The Garden',
      date: '2027-02-15T18:00:00.000Z',
      status: 'published',
      ticketTypes: [{ id: 'general', name: 'General', price: 0, quantity: 50 }],
    });

    const ticket = await createTicket({
      eventId: event.id,
      ticketTypeId: 'general',
      buyerName: 'Grace Hopper',
      buyerEmail: 'grace@example.com',
      quantity: 1,
    });

    const byReference = await getTicketByReference(ticket.reference);
    assert.ok(byReference);
    assert.equal(byReference?.reference, ticket.reference);
    assert.equal(byReference?.buyerEmail, 'grace@example.com');
  });

  it('stores the invitee phone number with the registration so it can appear in admin lists', async () => {
    const event = await createEvent({
      title: 'Phone Capture Event',
      description: 'The admin list should show contact details under the email.',
      venue: 'Aso Hall',
      date: '2027-03-12T18:00:00.000Z',
      status: 'published',
      ticketTypes: [{ id: 'general', name: 'General', price: 0, quantity: 30 }],
    });

    const ticket = await createTicket({
      eventId: event.id,
      ticketTypeId: 'general',
      buyerName: 'Margaret Hamilton',
      buyerEmail: 'margaret@example.com',
      buyerPhone: '+2348000000001',
      quantity: 1,
    });

    assert.equal(ticket.buyerPhone, '+2348000000001');
    const persisted = await getTicketByReference(ticket.reference);
    assert.equal(persisted?.buyerPhone, '+2348000000001');
  });

  it('allows ticket registration using a custom share slug instead of the event id', async () => {
    const event = await createEvent({
      title: 'Custom Link Event',
      description: 'This event is being registered from a custom share link.',
      venue: 'Lakeside Hall',
      date: '2027-04-10T18:30:00.000Z',
      status: 'published',
      shareSlug: 'custom-link-event',
      ticketTypes: [{ id: 'vip', name: 'VIP', price: 0, quantity: 25 }],
    });

    const ticket = await createTicket({
      eventId: event.shareSlug || event.id,
      ticketTypeId: 'vip',
      buyerName: 'Alan Turing',
      buyerEmail: 'alan@example.com',
      quantity: 1,
    });

    assert.equal(ticket.eventId, event.id);
    assert.equal(ticket.approvalStatus, 'PENDING');
  });

  it('keeps the current share slug when an event is edited without changing it', async () => {
    const event = await createEvent({
      title: 'Stable Link Event',
      description: 'The URL should remain stable while content is updated.',
      venue: 'North Hall',
      date: '2027-05-12T18:00:00.000Z',
      status: 'published',
      shareSlug: 'stable-link-event',
      ticketTypes: [{ id: 'general', name: 'General', price: 0, quantity: 40 }],
    });

    const updated = await updateEvent(event.id, {
      title: 'Stable Link Event Updated',
      description: 'The URL should remain stable while content is updated.',
      venue: 'North Hall',
      date: '2027-05-12T18:00:00.000Z',
      image: event.image,
      colors: event.colors,
      circleOptions: event.circleOptions,
      shareSlug: event.shareSlug,
      status: event.status,
      ticketTypes: event.ticketTypes,
    });

    assert.equal(updated.shareSlug, 'stable-link-event');
    assert.equal(updated.title, 'Stable Link Event Updated');
  });
});
