"use client";

import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import type { TicketRecord } from '@/lib/event-ticket-store';

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<TicketRecord[]>([]);

  useEffect(() => {
    const loadTickets = async () => {
      const response = await fetch('/api/events/tickets');
      const data = await response.json();
      setTickets(data.tickets || []);
    };

    loadTickets();
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <Header showBackButton={true} />
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>My Tickets</h1>
        <p style={{ color: '#6b7280', marginBottom: '20px' }}>Manage your purchased tickets and their current status.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tickets.map((ticket) => (
            <div key={ticket.id} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{ticket.eventTitle}</div>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>{ticket.ticketTypeName}</div>
                  <div style={{ color: '#6b7280', fontSize: '14px' }}>Ref: {ticket.reference}</div>
                </div>
                <div style={{ textAlign: 'right', color: '#2563eb', fontWeight: 700 }}>{ticket.status}</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
