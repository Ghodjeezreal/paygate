"use client";

import { useEffect, useState } from 'react';
import { Camera, CheckCircle, Keyboard, Loader2, Shield, XCircle } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Header } from '@/components/header';

interface VerificationResult {
  allowed: boolean;
  reason?: string;
  ticket?: {
    buyerName: string;
    eventTitle: string;
    ticketTypeName: string;
    reference: string;
    status: string;
    approvalStatus?: string;
  };
}

export default function EventSecurityCheckInPage() {
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('manual');
  const [reference, setReference] = useState('');
  const [securityAgent, setSecurityAgent] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [userFullName, setUserFullName] = useState('');

  useEffect(() => {
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

  useEffect(() => {
    if (scanMode !== 'camera') {
      return;
    }

    const scanner = new Html5QrcodeScanner(
      'event-qr-reader',
      { fps: 10, qrbox: { width: 260, height: 260 } },
      false,
    );

    scanner.render((decodedText: string) => {
      try {
        const data = JSON.parse(decodedText);
        setReference(data.reference || data.ref || decodedText);
      } catch {
        setReference(decodedText);
      }
      setScanMode('manual');
    }, () => undefined);

    return () => {
      scanner.clear();
    };
  }, [scanMode]);

  const fetchPreview = async () => {
    if (!reference.trim() || !securityAgent.trim()) {
      alert('Please enter the ticket reference and your name');
      return;
    }

    setLoadingPreview(true);
    setPreview(null);

    try {
      const response = await fetch('/api/events/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: reference.trim(),
          securityAgent: securityAgent.trim(),
          previewOnly: true,
        }),
      });

      const data = await response.json();

      if (response.ok && data.ticket) {
        setPreview(data);
      } else {
        alert(data.error || 'Ticket not found');
      }
    } catch (error) {
      console.error('Failed to fetch ticket preview:', error);
      alert('Failed to load ticket details. Please try again.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleApprove = async () => {
    if (!reference.trim() || !securityAgent.trim()) {
      alert('Please enter the ticket reference and your name');
      return;
    }

    setVerifying(true);

    try {
      const response = await fetch('/api/events/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: reference.trim(),
          securityAgent: securityAgent.trim(),
          approve: true,
        }),
      });

      const data = await response.json();
      setResult(data);
      setPreview(null);
    } catch (error) {
      console.error('Approval failed:', error);
      alert('Approval failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleReject = async () => {
    if (!reference.trim() || !securityAgent.trim()) {
      alert('Please enter the ticket reference and your name');
      return;
    }

    if (!rejectionNote.trim()) {
      alert('Please enter a rejection reason');
      return;
    }

    setVerifying(true);

    try {
      const response = await fetch('/api/events/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: reference.trim(),
          securityAgent: securityAgent.trim(),
          forceReject: true,
          rejectionNote: rejectionNote.trim(),
        }),
      });

      const data = await response.json();
      setResult(data);
      setPreview(null);
      setRejectionNote('');
    } catch (error) {
      console.error('Rejection failed:', error);
      alert('Rejection failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const resetVerification = () => {
    setResult(null);
    setPreview(null);
    setReference('');
    setRejectionNote('');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <Header showLogout userFullName={userFullName} />

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            marginBottom: '24px',
            boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '10px', display: 'flex' }}>
              <Shield style={{ width: '28px', height: '28px' }} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Event Security Verification</h1>
          </div>
          <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>Scan or enter a ticket reference to verify access</p>
        </div>

        {!result ? (
          <>
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              }}
            >
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                Your Name (Security Agent)
              </label>
              <input
                type="text"
                required
                value={securityAgent}
                onChange={(e) => setSecurityAgent(e.target.value)}
                placeholder="Enter your name"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#f9fafb',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setScanMode('manual')}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: scanMode === 'manual' ? '2px solid #059669' : '1px solid #e5e7eb',
                  backgroundColor: scanMode === 'manual' ? '#ecfdf5' : 'white',
                  color: scanMode === 'manual' ? '#059669' : '#6b7280',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Keyboard style={{ width: '20px', height: '20px' }} />
                Manual Entry
              </button>
              <button
                type="button"
                onClick={() => setScanMode('camera')}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  border: scanMode === 'camera' ? '2px solid #059669' : '1px solid #e5e7eb',
                  backgroundColor: scanMode === 'camera' ? '#ecfdf5' : 'white',
                  color: scanMode === 'camera' ? '#059669' : '#6b7280',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Camera style={{ width: '20px', height: '20px' }} />
                Scan QR
              </button>
            </div>

            {scanMode === 'camera' ? (
              <div
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '16px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                }}
              >
                <div id="event-qr-reader" style={{ width: '100%' }} />
              </div>
            ) : !preview ? (
              <div
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '16px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                }}
              >
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                  Ticket Reference
                </label>
                <input
                  type="text"
                  required
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Enter ticket reference"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                    fontSize: '16px',
                    outline: 'none',
                    marginBottom: '16px',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={fetchPreview}
                  disabled={loadingPreview || !reference.trim() || !securityAgent.trim()}
                  style={{
                    width: '100%',
                    minHeight: '56px',
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: 'white',
                    backgroundColor: '#059669',
                    border: 'none',
                    cursor: loadingPreview || !reference.trim() || !securityAgent.trim() ? 'not-allowed' : 'pointer',
                    opacity: loadingPreview || !reference.trim() || !securityAgent.trim() ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {loadingPreview ? (
                    <Loader2 style={{ width: '22px', height: '22px', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <>
                      <Shield style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                      Check Ticket
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  marginBottom: '16px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
                  Ticket Details - Inspect Information
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Guest</span>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{preview.ticket?.buyerName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Event</span>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{preview.ticket?.eventTitle}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Ticket</span>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{preview.ticket?.ticketTypeName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Approval</span>
                    <span
                      style={{
                        fontWeight: '700',
                        fontSize: '14px',
                        color: preview.ticket?.approvalStatus === 'APPROVED' ? '#16a34a' : '#d97706',
                      }}
                    >
                      {preview.ticket?.approvalStatus}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Reference</span>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>{preview.ticket?.reference}</span>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                    Rejection Reason (if rejecting)
                  </label>
                  <input
                    type="text"
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    placeholder="Wrong ticket, duplicate entry, etc."
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#f9fafb',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={verifying}
                    style={{
                      flex: 1,
                      minHeight: '54px',
                      padding: '16px',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      color: 'white',
                      backgroundColor: '#059669',
                      border: 'none',
                      cursor: verifying ? 'not-allowed' : 'pointer',
                      opacity: verifying ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    {verifying ? (
                      <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <>
                        <CheckCircle style={{ width: '20px', height: '20px' }} />
                        Allow entry
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={verifying}
                    style={{
                      flex: 1,
                      minHeight: '54px',
                      padding: '16px',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      color: 'white',
                      backgroundColor: '#dc2626',
                      border: 'none',
                      cursor: verifying ? 'not-allowed' : 'pointer',
                      opacity: verifying ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    {verifying ? (
                      <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <>
                        <XCircle style={{ width: '20px', height: '20px' }} />
                        Reject
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                borderRadius: '12px',
                backgroundColor: result.allowed ? '#ecfdf5' : '#fef2f2',
                marginBottom: '24px',
              }}
            >
              {result.allowed ? (
                <>
                  <CheckCircle style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: '#059669' }} />
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669', margin: '0 0 8px 0' }}>ENTRY ALLOWED</h2>
                  <p style={{ color: '#047857', margin: 0 }}>Ticket validated successfully</p>
                </>
              ) : (
                <>
                  <XCircle style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: '#dc2626' }} />
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626', margin: '0 0 8px 0' }}>ENTRY DENIED</h2>
                  <p style={{ color: '#b91c1c', margin: 0, fontWeight: 'bold' }}>{result.reason}</p>
                </>
              )}
            </div>

            {result.ticket && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>Ticket Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Guest</span>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{result.ticket.buyerName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Event</span>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{result.ticket.eventTitle}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Ticket</span>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{result.ticket.ticketTypeName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Status</span>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{result.ticket.status}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Reference</span>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#111827' }}>{result.ticket.reference}</span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={resetVerification}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '16px',
                color: '#059669',
                backgroundColor: 'white',
                border: '2px solid #059669',
                cursor: 'pointer',
              }}
            >
              Verify Another Ticket
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
