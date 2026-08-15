export type TicketStatus = 'valid' | 'used' | 'cancelled';

export function normalizeTicketStatus(status?: string | null): TicketStatus {
  if (status === 'used' || status === 'cancelled') return status;
  return 'valid';
}

export function canCheckIn(status?: string | null): boolean {
  return normalizeTicketStatus(status) === 'valid';
}

export function createTicketReference(eventId: string, ticketType: string): string {
  void eventId;
  void ticketType;
  const code = Math.random().toString(36).slice(2, 12).toUpperCase();
  return code.slice(0, 10).padEnd(10, 'X');
}
