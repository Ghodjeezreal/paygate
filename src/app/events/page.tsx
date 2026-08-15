"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import type { EventItem } from '@/lib/event-ticket-store';

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetch('/api/events');
        const data = await response.json();
        setEvents(data.events || []);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0f172a 0%, #111827 28%, #f8fafc 28%, #f8fafc 100%)' }}>
      <Header showBackButton={true} />
      <main style={{ maxWidth: '980px', margin: '0 auto', padding: '24px 16px 40px' }}>
        <section
          style={{
            borderRadius: '24px',
            padding: '30px 24px',
            background: 'radial-gradient(circle at top right, #f59e0b 0%, #7c2d12 38%, #111827 75%)',
            boxShadow: '0 24px 40px -18px rgba(17,24,39,0.55)',
            marginBottom: '22px',
            color: '#f9fafb',
          }}
        >
          <div style={{ fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.85, marginBottom: '10px' }}>
            Celebrate with us
          </div>
          <h1 style={{ fontSize: '40px', lineHeight: 1.06, margin: '0 0 12px', fontWeight: 700 }}>
            Invitation Events
          </h1>
          <p style={{ margin: '0 0 18px', maxWidth: '660px', color: '#e5e7eb', fontSize: '16px' }}>
            Discover meaningful gatherings, read each invitation, and reserve your place in a few steps.
          </p>
          <div style={{ display: 'inline-flex', borderRadius: '999px', padding: '8px 14px', backgroundColor: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.22)', fontSize: '13px', fontWeight: 600 }}>
            {loading ? 'Loading events...' : `${events.length} invitation${events.length === 1 ? '' : 's'} available`}
          </div>
        </section>

        <div style={{ display: 'grid', gap: '14px' }}>
          {events.map((event) => {
            const start = new Date(event.date);
            return (
              <Link key={event.id} href={`/events/${event.id}`} style={{ textDecoration: 'none' }}>
                <article
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '20px',
                    padding: '20px',
                    boxShadow: '0 10px 24px rgba(15,23,42,0.08)',
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ maxWidth: '620px' }}>
                      <h2 style={{ margin: '0 0 8px', fontSize: '24px', color: '#111827' }}>{event.title}</h2>
                      <p style={{ margin: '0 0 10px', color: '#4b5563', lineHeight: 1.5 }}>{event.description}</p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', padding: '5px 10px', borderRadius: '999px', backgroundColor: '#fff7ed', color: '#b45309', border: '1px solid #fed7aa' }}>
                          {start.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span style={{ fontSize: '12px', padding: '5px 10px', borderRadius: '999px', backgroundColor: '#ecfeff', color: '#155e75', border: '1px solid #a5f3fc' }}>
                          {event.venue}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>{event.isTicketless || event.ticketTypes.length === 0 ? 'Invitation type' : 'Ticket types'}</div>
                      <div style={{ fontSize: '24px', color: '#111827', fontWeight: 700 }}>{event.isTicketless || event.ticketTypes.length === 0 ? 0 : event.ticketTypes.length}</div>
                      <div style={{ marginTop: '12px', fontSize: '13px', fontWeight: 700, color: '#1d4ed8' }}>
                        {event.isTicketless || event.ticketTypes.length === 0 ? 'Open invitation ->' : 'Open invitation ->'}
                      </div>
                    </div>
                  </div>
              </article>
            </Link>
          );
          })}

          {!loading && events.length === 0 && (
            <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', textAlign: 'center', color: '#6b7280', border: '1px solid #e5e7eb' }}>
              No published events right now.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
