"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { CheckCircle, Clock3, ShieldCheck, ArrowLeft } from 'lucide-react';

interface EventApprovalRow {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  circleName?: string;
  guestMessage?: string;
  eventTitle: string;
  ticketTypeName: string;
  reference: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  purchasedAt: string;
}

export default function AdminApprovalsPage() {
  const [rows, setRows] = useState<EventApprovalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFullName, setUserFullName] = useState('');

  const fetchRows = async () => {
    try {
      const response = await fetch('/api/admin/event-tickets?status=ALL');
      const data = await response.json();
      setRows((data.tickets || []).sort((a: EventApprovalRow, b: EventApprovalRow) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime()));
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();

    const loadUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          setUserFullName(data.user?.fullName || '');
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    loadUser();
  }, []);

  const handleAction = async (reference: string, action: 'approve' | 'reject' | 'delete') => {
    const nextStatus = action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : null;

    if (nextStatus) {
      setRows((current) => current.map((row) => row.reference === reference ? { ...row, approvalStatus: nextStatus } : row));
    } else {
      setRows((current) => current.filter((row) => row.reference !== reference));
    }

    try {
      const response = await fetch(`/api/events/tickets/${encodeURIComponent(reference)}`, {
        method: action === 'delete' ? 'DELETE' : 'POST',
        headers: action === 'delete' ? undefined : { 'Content-Type': 'application/json' },
        body: action === 'delete' ? undefined : JSON.stringify({ action }),
      });

      if (!response.ok) {
        await fetchRows();
      } else {
        await fetchRows();
      }
    } catch (error) {
      console.error(`Failed to ${action} event registration:`, error);
      await fetchRows();
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <Header showLogout userFullName={userFullName} />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Admin</div>
            <h1 style={{ margin: '8px 0 0', fontSize: '30px', color: '#111827' }}>Approval History</h1>
          </div>
          <Link
            href="/admin"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '10px',
              backgroundColor: '#fff',
              color: '#111827',
              border: '1px solid #e5e7eb',
              fontWeight: '700',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft style={{ width: 18, height: 18 }} />
            Back to Dashboard
          </Link>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '50px', textAlign: 'center', color: '#6b7280' }}>Loading approvals...</div>
          ) : rows.length === 0 ? (
            <div style={{ padding: '50px', textAlign: 'center', color: '#6b7280' }}>No invitees found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ textAlign: 'left', padding: '16px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Guest</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Event</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Ticket</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Reference</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '16px', fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '16px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: '700', color: '#111827' }}>{row.buyerName}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{row.buyerEmail}</div>
                        {row.buyerPhone ? <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{row.buyerPhone}</div> : null}
                        {row.circleName ? <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Circle: {row.circleName}</div> : null}
                        {row.guestMessage ? <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Message: {row.guestMessage}</div> : null}
                      </td>
                      <td style={{ padding: '16px', color: '#111827', fontWeight: '600' }}>{row.eventTitle}</td>
                      <td style={{ padding: '16px', color: '#111827' }}>{row.ticketTypeName}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: '700',
                          backgroundColor:
                            row.approvalStatus === 'APPROVED' ? '#dcfce7' :
                            row.approvalStatus === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                          color:
                            row.approvalStatus === 'APPROVED' ? '#166534' :
                            row.approvalStatus === 'REJECTED' ? '#991b1b' : '#92400e'
                        }}>
                          {row.approvalStatus === 'APPROVED' ? <ShieldCheck style={{ width: 14, height: 14 }} /> : row.approvalStatus === 'REJECTED' ? <Clock3 style={{ width: 14, height: 14 }} /> : <Clock3 style={{ width: 14, height: 14 }} />}
                          {row.approvalStatus}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontFamily: 'monospace', color: '#111827' }}>{row.reference}</td>
                      <td style={{ padding: '16px', color: '#374151' }}>{new Date(row.purchasedAt).toLocaleString()}</td>
                      <td style={{ padding: '16px' }}>
                        {row.approvalStatus !== 'APPROVED' && (
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={() => handleAction(row.reference, 'approve')}
                              style={{
                                backgroundColor: '#059669',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAction(row.reference, 'reject')}
                              style={{
                                backgroundColor: '#dc2626',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAction(row.reference, 'delete')}
                              style={{
                                backgroundColor: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                        {row.approvalStatus === 'APPROVED' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#166534', fontWeight: '700', flexWrap: 'wrap' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <CheckCircle style={{ width: 18, height: 18 }} />
                              Approved
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAction(row.reference, 'delete')}
                              style={{
                                backgroundColor: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
