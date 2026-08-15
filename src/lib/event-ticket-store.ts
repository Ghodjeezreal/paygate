import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { sendEmail, getEventRegistrationApprovedEmail, buildQrEmailAttachment } from '@/lib/email';
import { createTicketReference, normalizeTicketStatus, type TicketStatus } from '@/lib/event-tickets';

export interface TicketTypeOption {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export type EventType = 'funeral' | 'birthday' | 'corporate' | 'general';

export interface EventItem {
  id: string;
  title: string;
  description: string;
  venue: string;
  date: string;
  image: string;
  colors: string[];
  circleOptions: string[];
  color?: string;
  shareSlug?: string;
  status: string;
  eventType?: EventType;
  heroHeading?: string;
  heroSubheading?: string;
  heroAge?: string;
  heroHeadingFont?: string;
  heroSubheadingFont?: string;
  heroAgeFont?: string;
  heroText?: string;
  invitationMessage?: string;
  dressCode?: string;
  admits?: string;
  venueNote?: string;
  familyNote?: string;
  ctaText?: string;
  isTicketless?: boolean;
  ticketTypes: TicketTypeOption[];
}

export interface CreateEventInput {
  title: string;
  description: string;
  venue: string;
  date: string;
  image?: string;
  color?: string;
  colors?: string[];
  circleOptions?: string[];
  shareSlug?: string;
  status?: string;
  eventType?: EventType;
  heroHeading?: string;
  heroSubheading?: string;
  heroAge?: string;
  heroHeadingFont?: string;
  heroSubheadingFont?: string;
  heroAgeFont?: string;
  heroText?: string;
  invitationMessage?: string;
  dressCode?: string;
  admits?: string;
  venueNote?: string;
  familyNote?: string;
  ctaText?: string;
  isTicketless?: boolean;
  ticketTypes: TicketTypeOption[];
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  venue?: string;
  date?: string;
  image?: string;
  color?: string;
  colors?: string[];
  circleOptions?: string[];
  shareSlug?: string;
  status?: string;
  eventType?: EventType;
  heroHeading?: string;
  heroSubheading?: string;
  heroAge?: string;
  heroHeadingFont?: string;
  heroSubheadingFont?: string;
  heroAgeFont?: string;
  heroText?: string;
  invitationMessage?: string;
  dressCode?: string;
  admits?: string;
  venueNote?: string;
  familyNote?: string;
  ctaText?: string;
  isTicketless?: boolean;
  ticketTypes?: TicketTypeOption[];
}

export type TicketApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TicketRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  ticketTypeId: string;
  ticketTypeName: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  quantity: number;
  amount: number;
  approvalStatus: TicketApprovalStatus;
  status: TicketStatus;
  reference: string;
  qrCode: string;
  qrPayload: string;
  purchasedAt: string;
  checkedInAt?: string;
  checkedInBy?: string;
}

const seedEvents: EventItem[] = [
  {
    id: 'concert-1',
    title: 'City Lights Concert',
    description: 'An evening of music, lights, and premium vibes.',
    venue: 'Maitama Hall',
    date: '2026-09-18T19:00:00.000Z',
    image: '/icons/mastercard.png',
    colors: ['#c8a047'],
    circleOptions: ['Family', 'Friends of the Family', 'Church Family'],
    color: '#c8a047',
    status: 'published',
    ticketTypes: [
      { id: 'vip', name: 'VIP', price: 15000, quantity: 200 },
      { id: 'regular', name: 'Regular', price: 5000, quantity: 500 },
    ],
  },
  {
    id: 'summit-1',
    title: 'Tech & Growth Summit',
    description: 'A one-day gathering for founders, creators, and builders.',
    venue: 'Abuja Innovation Hub',
    date: '2026-10-02T09:00:00.000Z',
    image: '/icons/visa.png',
    colors: ['#2f2454'],
    circleOptions: ['Family', 'Friends of the Family', 'Church Family'],
    color: '#2f2454',
    status: 'published',
    ticketTypes: [
      { id: 'standard', name: 'Standard', price: 3000, quantity: 250 },
      { id: 'premium', name: 'Premium', price: 8000, quantity: 100 },
    ],
  },
];

function normalizeEventType(value?: EventType): EventType {
  return value === 'funeral' || value === 'birthday' || value === 'corporate' ? value : 'general';
}

function normalizeEventColor(value?: string | null): string {
  const candidate = typeof value === 'string' ? value.trim() : '';
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(candidate) ? candidate : '#c8a047';
}

function normalizeEventColors(value: unknown): string[] {
  const fallback = ['#c8a047'];

  if (Array.isArray(value)) {
    const normalized = value
      .map((entry) => normalizeEventColor(typeof entry === 'string' ? entry : null))
      .filter((entry, index, array) => array.indexOf(entry) === index);
    return normalized.length ? normalized.slice(0, 3) : fallback;
  }

  if (typeof value === 'string') {
    return [normalizeEventColor(value)];
  }

  return fallback;
}

function normalizeCircleOptions(value: unknown): string[] {
  const fallback = ['Family', 'Friends of the Family', 'Church Family'];

  if (!Array.isArray(value)) {
    return fallback;
  }

  const cleaned = value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0)
    .filter((entry, index, array) => array.indexOf(entry) === index);

  return cleaned.length ? cleaned : fallback;
}

function normalizeShareSlug(value?: string | null): string | undefined {
  const candidate = (value ?? '').trim();
  if (!candidate) {
    return undefined;
  }

  return candidate
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || undefined;
}

async function generateUniqueShareSlug(value?: string | null): Promise<string | undefined> {
  const base = normalizeShareSlug(value);
  if (!base) {
    return undefined;
  }

  const makeCandidate = (suffix: string) => {
    const trimmedBase = base.slice(0, Math.max(1, 60 - suffix.length - 1));
    return `${trimmedBase}-${suffix}`.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  };

  let candidate = base;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const existing = await prisma.event.findUnique({ where: { shareSlug: candidate } });
    if (!existing) {
      return candidate;
    }

    const suffix = `${attempt + 1}-${Math.random().toString(36).slice(2, 7)}`;
    candidate = makeCandidate(suffix);
  }

  return `${base}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || undefined;
}

function getDefaultEventContent(eventType: EventType) {
  if (eventType === 'funeral') {
    return {
      heroText: 'Join us to honour and celebrate a life well lived.',
      invitationMessage: 'We are gathering with love, gratitude, and remembrance to honour the life of our beloved family member. Your presence is a comfort and a blessing.',
      dressCode: 'Black or dark formal attire',
      admits: 'This invitation admits one guest',
      venueNote: 'The service will begin promptly at the scheduled time. Kindly arrive early and be seated before the ceremony begins.',
      familyNote: 'With love, from the family',
      ctaText: 'Respond to the invitation ->',
    };
  }

  if (eventType === 'birthday') {
    return {
      heroText: 'Come celebrate a joyful day filled with laughter, music, and memories.',
      invitationMessage: 'We would be delighted to celebrate this special day with family and friends. Your presence will make the moment even more unforgettable.',
      dressCode: 'Smart casual or festive attire',
      admits: 'This invite admits one guest',
      venueNote: 'Please arrive a little early to enjoy the welcome drinks and get settled before the celebration begins.',
      familyNote: 'With love, from the host',
      ctaText: 'Join the celebration ->',
    };
  }

  if (eventType === 'corporate') {
    return {
      heroText: 'An evening of ideas, connections, and meaningful conversations.',
      invitationMessage: 'We warmly invite you to a corporate gathering designed to connect leaders, partners, and changemakers in a relaxed and inspiring environment.',
      dressCode: 'Business casual or formal corporate attire',
      admits: 'This invite admits one guest',
      venueNote: 'Check-in opens 30 minutes before the event. Kindly arrive early to network and settle in.',
      familyNote: 'With appreciation, from the organising team',
      ctaText: 'RSVP for the event ->',
    };
  }

  return {
    heroText: 'Come celebrate with us',
    invitationMessage: 'We would be honored to share this beautiful day with you. Your presence is the gift.',
    dressCode: 'Cool and calm',
    admits: 'This invite admits one',
    venueNote: 'Venue details provided at check-in confirmation',
    familyNote: 'With love, from the family',
    ctaText: 'Respond to the invitation ->',
  };
}

function normalizeTicketTypes(ticketTypes: TicketTypeOption[] | undefined, isTicketless?: boolean): TicketTypeOption[] {
  if (isTicketless) {
    return [];
  }

  if (!Array.isArray(ticketTypes)) {
    return [];
  }

  return ticketTypes.map((type) => ({
    id: String(type.id ?? '').trim(),
    name: String(type.name ?? '').trim(),
    price: Number(type.price ?? 0),
    quantity: Number(type.quantity ?? 0),
  }));
}

function normalizeStoredTicketTypes(value: unknown): TicketTypeOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((type) => {
    if (!type || typeof type !== 'object') {
      return { id: '', name: '', price: 0, quantity: 0 };
    }

    const record = type as Record<string, unknown>;
    return {
      id: String(record.id ?? '').trim(),
      name: String(record.name ?? '').trim(),
      price: Number(record.price ?? 0),
      quantity: Number(record.quantity ?? 0),
    };
  }).filter((type) => type.id || type.name);
}

function toEventItem(record: {
  id: string;
  title: string;
  description: string;
  venue: string;
  date: Date | string;
  image: string | null;
  color?: string | null;
  colors?: unknown;
  circleOptions?: unknown;
  status: string | null;
  eventType?: string | null;
  heroHeading?: string | null;
  heroSubheading?: string | null;
  heroAge?: string | null;
  heroHeadingFont?: string | null;
  heroSubheadingFont?: string | null;
  heroAgeFont?: string | null;
  heroText?: string | null;
  invitationMessage?: string | null;
  dressCode?: string | null;
  admits?: string | null;
  venueNote?: string | null;
  familyNote?: string | null;
  ctaText?: string | null;
  isTicketless?: boolean | null;
  ticketTypes?: unknown;
}): EventItem {
  const nextColors = normalizeEventColors(record.colors ?? (record.color ? [record.color] : []));

  return {
    id: record.id,
    title: record.title,
    description: record.description,
    venue: record.venue,
    date: record.date instanceof Date ? record.date.toISOString() : new Date(record.date).toISOString(),
    image: record.image || '/icons/mastercard.png',
    colors: nextColors,
    circleOptions: normalizeCircleOptions(record.circleOptions ?? ['Family', 'Friends of the Family', 'Church Family']),
    color: nextColors[0] || '#c8a047',
    shareSlug: normalizeShareSlug((record as { shareSlug?: string | null }).shareSlug) || undefined,
    status: record.status || 'published',
    eventType: normalizeEventType(record.eventType as EventType | undefined),
    heroHeading: record.heroHeading || undefined,
    heroSubheading: record.heroSubheading || undefined,
    heroAge: record.heroAge || undefined,
    heroHeadingFont: record.heroHeadingFont || 'Georgia',
    heroSubheadingFont: record.heroSubheadingFont || 'Georgia',
    heroAgeFont: record.heroAgeFont || 'Georgia',
    heroText: record.heroText || undefined,
    invitationMessage: record.invitationMessage || undefined,
    dressCode: record.dressCode || undefined,
    admits: record.admits || undefined,
    venueNote: record.venueNote || undefined,
    familyNote: record.familyNote || undefined,
    ctaText: record.ctaText || undefined,
    isTicketless: Boolean(record.isTicketless),
    ticketTypes: normalizeStoredTicketTypes(record.ticketTypes),
  };
}

export async function getEvents(): Promise<EventItem[]> {
  const rows = await prisma.event.findMany({ orderBy: { createdAt: 'desc' } });
  return rows.map(toEventItem);
}

export async function createEvent(input: CreateEventInput): Promise<EventItem> {
  if (!input.title?.trim()) {
    throw new Error('Title is required');
  }

  if (!input.description?.trim()) {
    throw new Error('Description is required');
  }

  if (!input.venue?.trim()) {
    throw new Error('Venue is required');
  }

  if (!input.date) {
    throw new Error('Date is required');
  }

  const isTicketless = Boolean(input.isTicketless);
  const ticketTypes = normalizeTicketTypes(input.ticketTypes, isTicketless);
  const eventType = normalizeEventType(input.eventType);
  const colors = normalizeEventColors(input.colors ?? (input.color ? [input.color] : ['#c8a047']));
  const circleOptions = normalizeCircleOptions(input.circleOptions ?? ['Family', 'Friends of the Family', 'Church Family']);
  const explicitShareSlug = normalizeShareSlug(input.shareSlug);
  const shareSlug = explicitShareSlug ? await generateUniqueShareSlug(explicitShareSlug) : await generateUniqueShareSlug(input.title);
  const defaults = getDefaultEventContent(eventType);

  if (!isTicketless && ticketTypes.length === 0) {
    throw new Error('At least one ticket type is required');
  }

  const created = await prisma.event.create({
    data: {
      title: input.title.trim(),
      description: input.description.trim(),
      venue: input.venue.trim(),
      date: new Date(input.date),
      image: input.image?.trim() || '/icons/mastercard.png',
      colors,
      circleOptions,
      shareSlug,
      status: input.status?.trim() || 'published',
      eventType,
      heroHeading: input.heroHeading?.trim() || input.title.trim(),
      heroSubheading: input.heroSubheading?.trim() || '',
      heroAge: input.heroAge?.trim() || '',
      heroHeadingFont: input.heroHeadingFont?.trim() || 'Georgia',
      heroSubheadingFont: input.heroSubheadingFont?.trim() || 'Georgia',
      heroAgeFont: input.heroAgeFont?.trim() || 'Georgia',
      heroText: input.heroText?.trim() || defaults.heroText,
      invitationMessage: input.invitationMessage?.trim() || defaults.invitationMessage,
      dressCode: input.dressCode?.trim() || defaults.dressCode,
      admits: input.admits?.trim() || defaults.admits,
      venueNote: input.venueNote?.trim() || defaults.venueNote,
      familyNote: input.familyNote?.trim() || defaults.familyNote,
      ctaText: input.ctaText?.trim() || defaults.ctaText,
      isTicketless,
      ticketTypes: ticketTypes as unknown as Prisma.InputJsonValue,
    },
  });

  return toEventItem(created);
}

export async function updateEvent(id: string, input: UpdateEventInput): Promise<EventItem> {
  const current = await prisma.event.findUnique({ where: { id } });
  if (!current) {
    throw new Error('Event not found');
  }

  const isTicketless = input.isTicketless ?? current.isTicketless ?? false;
  const eventType = normalizeEventType(input.eventType ?? (current.eventType as EventType | undefined) ?? 'general');
  const defaults = getDefaultEventContent(eventType);
  const nextTicketTypes = normalizeTicketTypes(input.ticketTypes ?? normalizeStoredTicketTypes(current.ticketTypes), isTicketless);
  const nextColors = normalizeEventColors(input.colors ?? (input.color ? [input.color] : current.colors ?? ['#c8a047']));
  const nextCircleOptions = normalizeCircleOptions(input.circleOptions ?? current.circleOptions ?? ['Family', 'Friends of the Family', 'Church Family']);
  const nextShareSlug = (() => {
    if (input.shareSlug !== undefined) {
      const explicit = normalizeShareSlug(input.shareSlug);
      return explicit ? generateUniqueShareSlug(explicit) : undefined;
    }

    return normalizeShareSlug(current.shareSlug) ?? undefined;
  })();
  const resolvedNextShareSlug = await nextShareSlug;
  const next: EventItem = {
    ...toEventItem(current),
    title: input.title?.trim() || current.title,
    description: input.description?.trim() || current.description,
    venue: input.venue?.trim() || current.venue,
    date: input.date ? new Date(input.date).toISOString() : new Date(current.date).toISOString(),
    image: input.image?.trim() || current.image || '/icons/mastercard.png',
    colors: nextColors,
    circleOptions: nextCircleOptions,
    color: nextColors[0],
    shareSlug: resolvedNextShareSlug,
    status: input.status?.trim() || current.status || 'published',
    eventType,
    heroHeading: input.heroHeading?.trim() ?? current.heroHeading ?? current.title,
    heroSubheading: input.heroSubheading?.trim() ?? current.heroSubheading ?? '',
    heroAge: input.heroAge?.trim() ?? current.heroAge ?? '',
    heroHeadingFont: input.heroHeadingFont?.trim() ?? current.heroHeadingFont ?? 'Georgia',
    heroSubheadingFont: input.heroSubheadingFont?.trim() ?? current.heroSubheadingFont ?? 'Georgia',
    heroAgeFont: input.heroAgeFont?.trim() ?? current.heroAgeFont ?? 'Georgia',
    heroText: input.heroText?.trim() ?? current.heroText ?? defaults.heroText,
    invitationMessage: input.invitationMessage?.trim() ?? current.invitationMessage ?? defaults.invitationMessage,
    dressCode: input.dressCode?.trim() ?? current.dressCode ?? defaults.dressCode,
    admits: input.admits?.trim() ?? current.admits ?? defaults.admits,
    venueNote: input.venueNote?.trim() ?? current.venueNote ?? defaults.venueNote,
    familyNote: input.familyNote?.trim() ?? current.familyNote ?? defaults.familyNote,
    ctaText: input.ctaText?.trim() ?? current.ctaText ?? defaults.ctaText,
    isTicketless,
    ticketTypes: nextTicketTypes,
  };

  if (!next.title) {
    throw new Error('Title is required');
  }
  if (!next.description) {
    throw new Error('Description is required');
  }
  if (!next.venue) {
    throw new Error('Venue is required');
  }
  if (!next.isTicketless && !next.ticketTypes.length) {
    throw new Error('At least one ticket type is required');
  }

  const updated = await prisma.event.update({
    where: { id },
    data: {
      title: next.title,
      description: next.description,
      venue: next.venue,
      date: new Date(next.date),
      image: next.image,
      colors: next.colors,
      circleOptions: next.circleOptions,
      shareSlug: resolvedNextShareSlug,
      status: next.status,
      eventType: next.eventType,
      heroHeading: next.heroHeading,
      heroSubheading: next.heroSubheading,
      heroAge: next.heroAge,
      heroHeadingFont: next.heroHeadingFont,
      heroSubheadingFont: next.heroSubheadingFont,
      heroAgeFont: next.heroAgeFont,
      heroText: next.heroText,
      invitationMessage: next.invitationMessage,
      dressCode: next.dressCode,
      admits: next.admits,
      venueNote: next.venueNote,
      familyNote: next.familyNote,
      ctaText: next.ctaText,
      isTicketless: next.isTicketless,
      ticketTypes: next.ticketTypes as unknown as Prisma.InputJsonValue,
    },
  });

  return toEventItem(updated);
}

export async function deleteEvent(id: string): Promise<boolean> {
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) {
    return false;
  }

  await prisma.event.delete({ where: { id } });
  return true;
}

export async function getEventById(id: string): Promise<EventItem | null> {
  const event = await prisma.event.findUnique({ where: { id } });
  return event ? toEventItem(event) : null;
}

export async function getEventByShareSlug(shareSlug: string): Promise<EventItem | null> {
  const event = await prisma.event.findUnique({ where: { shareSlug } });
  return event ? toEventItem(event) : null;
}

const ticketStorePath = path.join(process.cwd(), 'data', 'event-tickets.json');
const globalTicketStore = globalThis as typeof globalThis & {
  __vgcTicketStore?: TicketRecord[];
};

function getMemoryTicketStore(): TicketRecord[] {
  if (!globalTicketStore.__vgcTicketStore) {
    globalTicketStore.__vgcTicketStore = [];
  }

  return globalTicketStore.__vgcTicketStore;
}

function canUseFileStore(): boolean {
  try {
    const directory = path.dirname(ticketStorePath);
    fs.mkdirSync(directory, { recursive: true });
    if (!fs.existsSync(ticketStorePath)) {
      fs.writeFileSync(ticketStorePath, '[]', 'utf8');
    }
    return true;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === 'EROFS' || code === 'EACCES' || code === 'EPERM') {
      return false;
    }

    throw error;
  }
}

function readTicketStore(): TicketRecord[] {
  const memoryStore = getMemoryTicketStore();

  try {
    if (!canUseFileStore()) {
      return [...memoryStore];
    }

    const raw = fs.readFileSync(ticketStorePath, 'utf8').trim();
    if (!raw) {
      return [...memoryStore];
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      memoryStore.splice(0, memoryStore.length, ...parsed);
      return parsed;
    }

    return [...memoryStore];
  } catch (error) {
    console.error('Failed to read event ticket store:', error);
    return [...memoryStore];
  }
}

function writeTicketStore(nextTickets: TicketRecord[]) {
  const memoryStore = getMemoryTicketStore();
  memoryStore.splice(0, memoryStore.length, ...nextTickets);

  try {
    if (!canUseFileStore()) {
      return;
    }

    fs.writeFileSync(ticketStorePath, JSON.stringify(nextTickets, null, 2), 'utf8');
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === 'EROFS' || code === 'EACCES' || code === 'EPERM') {
      return;
    }

    throw error;
  }
}

function toTicketRecord(record: {
  id: string;
  eventId: string;
  eventTitle: string;
  ticketTypeId: string;
  ticketTypeName: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string | null;
  quantity: number;
  amount: number;
  approvalStatus: string;
  status: string;
  reference: string;
  qrCode: string | null;
  qrPayload: string;
  purchasedAt: Date;
  checkedInAt: Date | null;
  checkedInBy: string | null;
}): TicketRecord {
  return {
    id: record.id,
    eventId: record.eventId,
    eventTitle: record.eventTitle,
    ticketTypeId: record.ticketTypeId,
    ticketTypeName: record.ticketTypeName,
    buyerName: record.buyerName,
    buyerEmail: record.buyerEmail,
    buyerPhone: record.buyerPhone || undefined,
    quantity: Number(record.quantity || 1),
    amount: Number(record.amount || 0),
    approvalStatus: (record.approvalStatus === 'APPROVED' || record.approvalStatus === 'REJECTED' ? record.approvalStatus : 'PENDING') as TicketApprovalStatus,
    status: normalizeTicketStatus(record.status),
    reference: record.reference,
    qrCode: record.qrCode || '',
    qrPayload: record.qrPayload,
    purchasedAt: record.purchasedAt.toISOString(),
    checkedInAt: record.checkedInAt ? record.checkedInAt.toISOString() : undefined,
    checkedInBy: record.checkedInBy || undefined,
  };
}

export async function getTickets(): Promise<TicketRecord[]> {
  try {
    const rows = await prisma.eventTicket.findMany({ orderBy: { purchasedAt: 'desc' } });
    return rows.map((row) => toTicketRecord({
      id: row.id,
      eventId: row.eventId,
      eventTitle: row.eventTitle,
      ticketTypeId: row.ticketTypeId,
      ticketTypeName: row.ticketTypeName,
      buyerName: row.buyerName,
      buyerEmail: row.buyerEmail,
      buyerPhone: row.buyerPhone,
      quantity: row.quantity,
      amount: row.amount,
      approvalStatus: row.approvalStatus,
      status: row.status,
      reference: row.reference,
      qrCode: row.qrCode,
      qrPayload: row.qrPayload,
      purchasedAt: row.purchasedAt,
      checkedInAt: row.checkedInAt,
      checkedInBy: row.checkedInBy,
    }));
  } catch (error) {
    console.error('Failed to load event tickets from Prisma; falling back to local store:', error);
    return readTicketStore().map((ticket) => ({ ...ticket }));
  }
}

export async function createTicket(input: {
  eventId: string;
  ticketTypeId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  quantity: number;
}): Promise<TicketRecord> {
  const event = (await getEventById(input.eventId)) || (await getEventByShareSlug(input.eventId));
  if (!event) {
    throw new Error('Event not found');
  }

  const normalizedTicketTypeId = input.ticketTypeId || 'ticketless';
  const isTicketless = Boolean(event.isTicketless || !event.ticketTypes.length);

  if (isTicketless) {
    const reference = createTicketReference(event.id, normalizedTicketTypeId);
    const qrPayload = JSON.stringify({ type: 'event-ticket', reference, eventId: event.id, ticketTypeId: normalizedTicketTypeId, ticketless: true });

    const ticket: TicketRecord = {
      id: crypto.randomUUID(),
      eventId: event.id,
      eventTitle: event.title,
      ticketTypeId: normalizedTicketTypeId,
      ticketTypeName: 'Invitation',
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail,
      buyerPhone: input.buyerPhone || '',
      quantity: input.quantity,
      amount: 0,
      approvalStatus: 'PENDING',
      status: 'valid',
      reference,
      qrCode: '',
      qrPayload,
      purchasedAt: new Date().toISOString(),
    };

    try {
      const saved = await prisma.eventTicket.create({
        data: {
          eventId: ticket.eventId,
          eventTitle: ticket.eventTitle,
          ticketTypeId: ticket.ticketTypeId,
          ticketTypeName: ticket.ticketTypeName,
          buyerName: ticket.buyerName,
          buyerEmail: ticket.buyerEmail,
          buyerPhone: ticket.buyerPhone || null,
          quantity: ticket.quantity,
          amount: ticket.amount,
          approvalStatus: ticket.approvalStatus,
          status: ticket.status,
          reference: ticket.reference,
          qrCode: ticket.qrCode,
          qrPayload: ticket.qrPayload,
          purchasedAt: new Date(ticket.purchasedAt),
        },
      });
      return toTicketRecord({
        id: saved.id,
        eventId: saved.eventId,
        eventTitle: saved.eventTitle,
        ticketTypeId: saved.ticketTypeId,
        ticketTypeName: saved.ticketTypeName,
        buyerName: saved.buyerName,
        buyerEmail: saved.buyerEmail,
        buyerPhone: saved.buyerPhone,
        quantity: saved.quantity,
        amount: saved.amount,
        approvalStatus: saved.approvalStatus,
        status: saved.status,
        reference: saved.reference,
        qrCode: saved.qrCode,
        qrPayload: saved.qrPayload,
        purchasedAt: saved.purchasedAt,
        checkedInAt: saved.checkedInAt,
        checkedInBy: saved.checkedInBy,
      });
    } catch (error) {
      console.error('Failed to save ticket to Prisma; falling back to local store:', error);
      const allTickets = readTicketStore();
      allTickets.push(ticket);
      writeTicketStore(allTickets);
      return { ...ticket };
    }
  }

  const ticketType = event.ticketTypes.find((item) => item.id === normalizedTicketTypeId);
  if (!ticketType) {
    throw new Error('Ticket type not found');
  }

  const amount = ticketType.price * input.quantity;
  const reference = createTicketReference(event.id, ticketType.id);
  const qrPayload = JSON.stringify({ type: 'event-ticket', reference, eventId: event.id, ticketTypeId: ticketType.id });

  const ticket: TicketRecord = {
    id: crypto.randomUUID(),
    eventId: event.id,
    eventTitle: event.title,
    ticketTypeId: ticketType.id,
    ticketTypeName: ticketType.name,
    buyerName: input.buyerName,
    buyerEmail: input.buyerEmail,
    buyerPhone: input.buyerPhone || '',
    quantity: input.quantity,
    amount,
    approvalStatus: 'PENDING',
    status: 'valid',
    reference,
    qrCode: '',
    qrPayload,
    purchasedAt: new Date().toISOString(),
  };

  try {
    const saved = await prisma.eventTicket.create({
      data: {
        eventId: ticket.eventId,
        eventTitle: ticket.eventTitle,
        ticketTypeId: ticket.ticketTypeId,
        ticketTypeName: ticket.ticketTypeName,
        buyerName: ticket.buyerName,
        buyerEmail: ticket.buyerEmail,
        buyerPhone: ticket.buyerPhone || null,
        quantity: ticket.quantity,
        amount: ticket.amount,
        approvalStatus: ticket.approvalStatus,
        status: ticket.status,
        reference: ticket.reference,
        qrCode: ticket.qrCode,
        qrPayload: ticket.qrPayload,
        purchasedAt: new Date(ticket.purchasedAt),
      },
    });
    return toTicketRecord({
      id: saved.id,
      eventId: saved.eventId,
      eventTitle: saved.eventTitle,
      ticketTypeId: saved.ticketTypeId,
      ticketTypeName: saved.ticketTypeName,
      buyerName: saved.buyerName,
      buyerEmail: saved.buyerEmail,
      buyerPhone: saved.buyerPhone,
      quantity: saved.quantity,
      amount: saved.amount,
      approvalStatus: saved.approvalStatus,
      status: saved.status,
      reference: saved.reference,
      qrCode: saved.qrCode,
      qrPayload: saved.qrPayload,
      purchasedAt: saved.purchasedAt,
      checkedInAt: saved.checkedInAt,
      checkedInBy: saved.checkedInBy,
    });
  } catch (error) {
    console.error('Failed to save ticket to Prisma; falling back to local store:', error);
    const allTickets = readTicketStore();
    allTickets.push(ticket);
    writeTicketStore(allTickets);
    return { ...ticket };
  }
}

export async function getTicketByReference(reference: string): Promise<TicketRecord | null> {
  try {
    const row = await prisma.eventTicket.findUnique({ where: { reference } });
    if (!row) {
      return null;
    }

    return toTicketRecord({
      id: row.id,
      eventId: row.eventId,
      eventTitle: row.eventTitle,
      ticketTypeId: row.ticketTypeId,
      ticketTypeName: row.ticketTypeName,
      buyerName: row.buyerName,
      buyerEmail: row.buyerEmail,
      buyerPhone: row.buyerPhone,
      quantity: row.quantity,
      amount: row.amount,
      approvalStatus: row.approvalStatus,
      status: row.status,
      reference: row.reference,
      qrCode: row.qrCode,
      qrPayload: row.qrPayload,
      purchasedAt: row.purchasedAt,
      checkedInAt: row.checkedInAt,
      checkedInBy: row.checkedInBy,
    });
  } catch (error) {
    console.error('Failed to read ticket from Prisma; falling back to local store:', error);
    return readTicketStore().find((ticket) => ticket.reference === reference) || null;
  }
}

export async function deleteTicket(reference: string): Promise<TicketRecord | null> {
  try {
    const existing = await prisma.eventTicket.findUnique({ where: { reference } });
    if (!existing) {
      return null;
    }

    const deleted = await prisma.eventTicket.delete({ where: { id: existing.id } });
    return toTicketRecord({
      id: deleted.id,
      eventId: deleted.eventId,
      eventTitle: deleted.eventTitle,
      ticketTypeId: deleted.ticketTypeId,
      ticketTypeName: deleted.ticketTypeName,
      buyerName: deleted.buyerName,
      buyerEmail: deleted.buyerEmail,
      buyerPhone: deleted.buyerPhone,
      quantity: deleted.quantity,
      amount: deleted.amount,
      approvalStatus: deleted.approvalStatus,
      status: deleted.status,
      reference: deleted.reference,
      qrCode: deleted.qrCode,
      qrPayload: deleted.qrPayload,
      purchasedAt: deleted.purchasedAt,
      checkedInAt: deleted.checkedInAt,
      checkedInBy: deleted.checkedInBy,
    });
  } catch (error) {
    console.error('Failed to delete ticket in Prisma; falling back to local store:', error);
    const allTickets = readTicketStore();
    const index = allTickets.findIndex((ticket) => ticket.reference === reference);

    if (index < 0) {
      return null;
    }

    const [removedTicket] = allTickets.splice(index, 1);
    writeTicketStore(allTickets);
    return removedTicket;
  }
}

export async function approveTicket(reference: string): Promise<TicketRecord | null> {
  const ticket = await getTicketByReference(reference);
  if (!ticket) {
    return null;
  }

  if (ticket.approvalStatus === 'APPROVED') {
    return { ...ticket };
  }

  try {
    const qrCode = await QRCode.toDataURL(ticket.qrPayload);
    const updated = await prisma.eventTicket.update({
      where: { reference },
      data: {
        approvalStatus: 'APPROVED',
        qrCode,
        status: 'valid',
      },
    });

    const result = toTicketRecord({
      id: updated.id,
      eventId: updated.eventId,
      eventTitle: updated.eventTitle,
      ticketTypeId: updated.ticketTypeId,
      ticketTypeName: updated.ticketTypeName,
      buyerName: updated.buyerName,
      buyerEmail: updated.buyerEmail,
      buyerPhone: updated.buyerPhone,
      quantity: updated.quantity,
      amount: updated.amount,
      approvalStatus: updated.approvalStatus,
      status: updated.status,
      reference: updated.reference,
      qrCode: updated.qrCode,
      qrPayload: updated.qrPayload,
      purchasedAt: updated.purchasedAt,
      checkedInAt: updated.checkedInAt,
      checkedInBy: updated.checkedInBy,
    });

    if (result.buyerEmail) {
      try {
        const qrAttachment = buildQrEmailAttachment(result.qrCode, 'event-qr.png', 'event-qr');

        await sendEmail({
          to: result.buyerEmail,
          subject: 'Your Event Registration Has Been Approved',
          html: getEventRegistrationApprovedEmail({
            buyerName: result.buyerName,
            eventTitle: result.eventTitle,
            ticketTypeName: result.ticketTypeName,
            reference: result.reference,
            qrCode: result.qrCode,
          }),
          attachments: qrAttachment ? [qrAttachment] : undefined,
        });
      } catch (error) {
        console.error('Failed to send approved event registration email:', error);
      }
    }

    return result;
  } catch (error) {
    console.error('Failed to approve ticket in Prisma; falling back to local store:', error);
    const qrCode = await QRCode.toDataURL(ticket.qrPayload);
    const updated: TicketRecord = {
      ...ticket,
      approvalStatus: 'APPROVED',
      qrCode,
      status: 'valid',
    };

    const allTickets = readTicketStore();
    const index = allTickets.findIndex((item) => item.id === ticket.id);
    if (index >= 0) {
      allTickets[index] = updated;
      writeTicketStore(allTickets);
    }

    if (updated.buyerEmail) {
      try {
        const qrAttachment = buildQrEmailAttachment(updated.qrCode, 'event-qr.png', 'event-qr');

        await sendEmail({
          to: updated.buyerEmail,
          subject: 'Your Event Registration Has Been Approved',
          html: getEventRegistrationApprovedEmail({
            buyerName: updated.buyerName,
            eventTitle: updated.eventTitle,
            ticketTypeName: updated.ticketTypeName,
            reference: updated.reference,
            qrCode: updated.qrCode,
          }),
          attachments: qrAttachment ? [qrAttachment] : undefined,
        });
      } catch (emailError) {
        console.error('Failed to send approved event registration email:', emailError);
      }
    }

    return updated;
  }
}

export async function rejectTicket(reference: string): Promise<TicketRecord | null> {
  const ticket = await getTicketByReference(reference);
  if (!ticket) {
    return null;
  }

  try {
    const updated = await prisma.eventTicket.update({
      where: { reference },
      data: {
        approvalStatus: 'REJECTED',
        qrCode: '',
        status: 'cancelled',
      },
    });

    return toTicketRecord({
      id: updated.id,
      eventId: updated.eventId,
      eventTitle: updated.eventTitle,
      ticketTypeId: updated.ticketTypeId,
      ticketTypeName: updated.ticketTypeName,
      buyerName: updated.buyerName,
      buyerEmail: updated.buyerEmail,
      buyerPhone: updated.buyerPhone,
      quantity: updated.quantity,
      amount: updated.amount,
      approvalStatus: updated.approvalStatus,
      status: updated.status,
      reference: updated.reference,
      qrCode: updated.qrCode,
      qrPayload: updated.qrPayload,
      purchasedAt: updated.purchasedAt,
      checkedInAt: updated.checkedInAt,
      checkedInBy: updated.checkedInBy,
    });
  } catch (error) {
    console.error('Failed to reject ticket in Prisma; falling back to local store:', error);
    const updated: TicketRecord = {
      ...ticket,
      approvalStatus: 'REJECTED',
      qrCode: '',
      status: 'cancelled',
    };

    const allTickets = readTicketStore();
    const index = allTickets.findIndex((item) => item.id === ticket.id);
    if (index >= 0) {
      allTickets[index] = updated;
      writeTicketStore(allTickets);
    }

    return updated;
  }
}

export async function checkInTicket(reference: string, checkedInBy: string): Promise<TicketRecord | null> {
  const ticket = await getTicketByReference(reference);
  if (!ticket) {
    return null;
  }

  if (ticket.approvalStatus !== 'APPROVED') {
    return { ...ticket, status: 'cancelled' as TicketStatus };
  }

  const status = normalizeTicketStatus(ticket.status);
  if (status !== 'valid') {
    return { ...ticket, status: 'used' };
  }

  try {
    const updated = await prisma.eventTicket.update({
      where: { reference },
      data: {
        status: 'used',
        checkedInAt: new Date(),
        checkedInBy,
      },
    });

    return toTicketRecord({
      id: updated.id,
      eventId: updated.eventId,
      eventTitle: updated.eventTitle,
      ticketTypeId: updated.ticketTypeId,
      ticketTypeName: updated.ticketTypeName,
      buyerName: updated.buyerName,
      buyerEmail: updated.buyerEmail,
      buyerPhone: updated.buyerPhone,
      quantity: updated.quantity,
      amount: updated.amount,
      approvalStatus: updated.approvalStatus,
      status: updated.status,
      reference: updated.reference,
      qrCode: updated.qrCode,
      qrPayload: updated.qrPayload,
      purchasedAt: updated.purchasedAt,
      checkedInAt: updated.checkedInAt,
      checkedInBy: updated.checkedInBy,
    });
  } catch (error) {
    console.error('Failed to check in ticket in Prisma; falling back to local store:', error);
    const updated = {
      ...ticket,
      status: 'used' as TicketStatus,
      checkedInAt: new Date().toISOString(),
      checkedInBy,
    };

    const allTickets = readTicketStore();
    const index = allTickets.findIndex((item) => item.id === ticket.id);
    if (index >= 0) {
      allTickets[index] = updated;
      writeTicketStore(allTickets);
    }

    return updated;
  }
}
