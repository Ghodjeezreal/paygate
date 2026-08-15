"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import type { TicketRecord } from '@/lib/event-ticket-store';

function TicketSuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || '';
  const hideHeader = searchParams.get('share') !== null || searchParams.get('hideHeader') === '1';
  const [ticket, setTicket] = useState<TicketRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadTicket = async () => {
      if (!reference) {
        setLoading(false);
        setError('No ticket reference was provided.');
        return;
      }

      try {
        const response = await fetch(`/api/events/tickets/${reference}`);
        if (!response.ok) {
          throw new Error('Ticket not found yet');
        }

        const data = await response.json();
        if (!isMounted) return;

        setTicket(data.ticket || null);
        setError(data.ticket ? null : 'Your registration is still pending approval.');
      } catch (fetchError) {
        if (!isMounted) return;
        setTicket(null);
        setError('Your registration is still being processed. Please refresh in a moment.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTicket();

    return () => {
      isMounted = false;
    };
  }, [reference]);

  if (loading) {
    return <div style={{ padding: 24 }}>Loading your ticket...</div>;
  }

  if (!ticket) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        <Header showBackButton={!hideHeader} hideGlobalHeader={hideHeader} />
        <main style={{ maxWidth: '760px', margin: '0 auto', padding: '24px 16px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }}>
            <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Registration Submitted</h1>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>
              {error || 'Your registration is awaiting admin approval before your email and QR code are sent.'}
            </p>
            <div style={{ marginBottom: '16px', padding: '16px', borderRadius: '12px', backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 600 }}>
              Pending approval from the admin team.
            </div>
          </div>
        </main>
      </div>
    );
  }

  const isApproved = ticket.approvalStatus === 'APPROVED';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <Header showBackButton={!hideHeader} hideGlobalHeader={hideHeader} />
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }}>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>{isApproved ? 'Ticket Confirmed' : 'Registration Submitted'}</h1>
          <p style={{ color: '#6b7280', marginBottom: '20px' }}>
            {isApproved ? 'Show this QR code at the event entrance.' : 'Your registration is awaiting admin approval before your email and QR code are sent.'}
          </p>

          {isApproved ? (
            <div style={{ marginBottom: '16px' }}>
              <img src={ticket.qrCode} alt="Ticket QR" style={{ width: '220px', height: '220px', objectFit: 'contain' }} />
            </div>
          ) : (
            <div style={{ marginBottom: '16px', padding: '16px', borderRadius: '12px', backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 600 }}>
              Pending approval from the admin team.
            </div>
          )}

          <p><strong>Event:</strong> {ticket.eventTitle}</p>
          <p><strong>Ticket:</strong> {ticket.ticketTypeName}</p>
          <p><strong>Reference:</strong> {ticket.reference}</p>
          <p><strong>Status:</strong> {ticket.approvalStatus}</p>
        </div>
      </main>
    </div>
  );
}

export default function TicketSuccessPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading your ticket...</div>}>
      <TicketSuccessContent />
    </Suspense>
  );
}
