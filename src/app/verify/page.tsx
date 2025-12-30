"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Shield, CheckCircle, XCircle, Loader2, Camera, Keyboard } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface VerificationResult {
  allowed: boolean;
  reason?: string;
  entry?: {
    residentName: string;
    vendorCompany?: string;
    address?: string;
    vehiclePlateNumber: string;
    vehicleType?: string;
    fee?: number;
    expiresAt?: string;
    paymentReference?: string;
    paymentStatus?: string;
  };
}

export default function SecurityVerificationPage() {
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('manual');
  const [reference, setReference] = useState("");
  const [securityAgent, setSecurityAgent] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [entryPreview, setEntryPreview] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");
  const [userFullName, setUserFullName] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQRData, setOfflineQRData] = useState<any>(null);

  useEffect(() => {
    fetchUser();
    checkApiStatus();
    
    const interval = setInterval(checkApiStatus, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  const checkApiStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('/api/health', { 
        signal: controller.signal,
        cache: 'no-store'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setIsOnline(true);
      } else {
        setIsOnline(false);
      }
    } catch (error) {
      console.log('Health check failed:', error);
      setIsOnline(false);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUserFullName(data.user.fullName);
        // Don't auto-fill security agent name - let them enter it manually
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  useEffect(() => {
    if (scanMode === 'camera') {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(onScanSuccess, onScanError);

      return () => {
        scanner.clear();
      };
    }
  }, [scanMode]);

  const onScanSuccess = (decodedText: string) => {
    try {
      // Try to parse QR code JSON data
      const data = JSON.parse(decodedText);
      
      // Check if QR contains full entry data (offline mode)
      if (data.resident && data.expires) {
        setOfflineQRData(data);
        setReference(data.ref || data.paymentReference || decodedText);
        // Show offline preview immediately
        showOfflinePreview(data);
      } else {
        setReference(data.ref || data.paymentReference || decodedText);
      }
      setScanMode('manual');
    } catch {
      // If not JSON, treat as plain reference
      setReference(decodedText);
      setScanMode('manual');
    }
  };

  const showOfflinePreview = (qrData: any) => {
    const now = new Date();
    const expiresAt = new Date(qrData.expires);
    const isExpired = now > expiresAt;
    
    setEntryPreview({
      success: !isExpired,
      entry: {
        id: qrData.id,
        paymentReference: qrData.ref,
        residentName: qrData.resident,
        vendorCompany: qrData.vendor,
        address: qrData.address,
        vehiclePlateNumber: qrData.plate,
        vehicleType: { name: qrData.vehicleType },
        fee: qrData.fee,
        paymentStatus: qrData.status,
        expiresAt: qrData.expires,
        passStatus: qrData.passStatus
      },
      isExpired,
      offline: true
    });
  };

  const onScanError = (error: any) => {
    // Ignore scan errors (too noisy)
  };

  const fetchEntryPreview = async () => {
    if (!reference.trim() || !securityAgent.trim()) {
      alert('Please enter reference and your name');
      return;
    }

    setLoadingPreview(true);
    setEntryPreview(null);

    try {
      const response = await fetch("/api/verify-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          reference: reference.trim(), 
          securityAgent: securityAgent.trim(),
          previewOnly: true
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.entry) {
        setEntryPreview(data);
      } else {
        alert(data.error || 'Entry not found');
        setEntryPreview(null);
      }
    } catch (error) {
      console.error("Failed to fetch entry:", error);
      alert("Failed to fetch entry details. Please try again.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleApprove = async () => {
    setVerifying(true);

    try {
      // If offline and QR data available, allow offline approval
      if (!isOnline && offlineQRData) {
        const now = new Date();
        const expiresAt = new Date(offlineQRData.expires);
        
        if (now > expiresAt) {
          setResult({
            allowed: false,
            reason: 'This entry has expired'
          });
        } else if (offlineQRData.status !== 'PAID') {
          setResult({
            allowed: false,
            reason: 'Payment not confirmed'
          });
        } else {
          // Store offline approval for later sync
          const offlineApproval = {
            reference: offlineQRData.ref,
            securityAgent: securityAgent.trim(),
            timestamp: new Date().toISOString(),
            plate: offlineQRData.plate
          };
          
          // Save to localStorage for sync when online
          const pending = JSON.parse(localStorage.getItem('pendingApprovals') || '[]');
          pending.push(offlineApproval);
          localStorage.setItem('pendingApprovals', JSON.stringify(pending));
          
          setResult({
            allowed: true,
            entry: entryPreview.entry
          });
        }
        setEntryPreview(null);
        setVerifying(false);
        return;
      }

      const response = await fetch("/api/verify-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          reference: reference.trim(), 
          securityAgent: securityAgent.trim(),
          approve: true
        }),
      });

      const data = await response.json();
      setResult(data);
      setEntryPreview(null);
    } catch (error) {
      console.error("Approval failed:", error);
      alert("Approval failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionNote.trim()) {
      alert('Please enter a reason for rejection');
      return;
    }

    setVerifying(true);

    try {
      const response = await fetch("/api/verify-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          reference: reference.trim(), 
          securityAgent: securityAgent.trim(),
          forceReject: true,
          rejectionNote: rejectionNote.trim()
        }),
      });

      const data = await response.json();
      setResult(data);
      setEntryPreview(null);
      setRejectionNote("");
    } catch (error) {
      console.error("Rejection failed:", error);
      alert("Rejection failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const resetVerification = () => {
    setResult(null);
    setEntryPreview(null);
    setReference("");
    setRejectionNote("");
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <Header showLogout={true} userFullName={userFullName} />

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Online/Offline Status Indicator */}
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          zIndex: 1000,
          padding: '8px 16px',
          borderRadius: '20px',
          backgroundColor: isOnline ? '#10b981' : '#f59e0b',
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'white'
          }} />
          {isOnline ? 'Online' : 'Offline Mode'}
        </div>

        {/* Header */}
        <div style={{ 
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', 
          borderRadius: '16px', 
          padding: '24px', 
          color: 'white', 
          marginBottom: '24px',
          boxShadow: '0 10px 25px -5px rgba(5, 150, 105, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '10px', display: 'flex' }}>
              <Shield style={{ width: '28px', height: '28px' }} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
              Security Verification
            </h1>
          </div>
          <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>
            Scan or enter pass reference to verify entry
            {!isOnline && ' (Offline: Scan QR code only)'}
          </p>
        </div>

        {!result ? (
          <>
            {/* Security Agent Name */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '16px', 
              padding: '20px', 
              marginBottom: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
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
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Mode Toggle */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              marginBottom: '16px' 
            }}>
              <button
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
                  gap: '8px'
                }}
              >
                <Keyboard style={{ width: '20px', height: '20px' }} />
                Manual Entry
              </button>
              <button
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
                  gap: '8px'
                }}
              >
                <Camera style={{ width: '20px', height: '20px' }} />
                Scan QR
              </button>
            </div>

            {scanMode === 'camera' ? (
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '16px', 
                padding: '20px', 
                marginBottom: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div id="qr-reader" style={{ width: '100%' }}></div>
              </div>
            ) : !entryPreview ? (
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '16px', 
                padding: '20px', 
                marginBottom: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                  Payment Reference
                </label>
                <input
                  type="text"
                  required
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g., VGC1234567"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                    fontSize: '16px',
                    outline: 'none',
                    marginBottom: '16px',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={fetchEntryPreview}
                  disabled={loadingPreview || !reference.trim() || !securityAgent.trim()}
                  style={{
                    width: '100%',
                    padding: '16px',
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
                    gap: '8px'
                  }}
                >
                  {loadingPreview ? (
                    <>
                      <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Shield style={{ width: '20px', height: '20px' }} />
                      Check Entry
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '16px', 
                padding: '24px', 
                marginBottom: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                {entryPreview.offline && (
                  <div style={{
                    marginBottom: '16px',
                    padding: '12px 16px',
                    backgroundColor: '#fef3c7',
                    border: '1px solid #f59e0b',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#92400e',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}>
                    ⚠️ Offline Mode - Verifying from QR Code Data
                  </div>
                )}
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
                  Entry Details - Verify Information
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Resident</span>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{entryPreview.entry?.residentName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Vendor</span>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{entryPreview.entry?.vendorCompany}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Address</span>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827', textAlign: 'right' }}>{entryPreview.entry?.address}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Vehicle Plate</span>
                    <span style={{ fontWeight: '600', fontSize: '18px', color: '#059669' }}>{entryPreview.entry?.vehiclePlateNumber}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Vehicle Type</span>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>
                      {typeof entryPreview.entry?.vehicleType === 'string' 
                        ? entryPreview.entry?.vehicleType 
                        : entryPreview.entry?.vehicleType?.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Expires</span>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>
                      {new Date(entryPreview.entry?.expiresAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Rejection Note */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                    Rejection Reason (if rejecting)
                  </label>
                  <input
                    type="text"
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    placeholder="e.g., Wrong vehicle, plate mismatch, expired..."
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#f9fafb',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={handleApprove}
                    disabled={verifying}
                    style={{
                      flex: 1,
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
                      gap: '8px'
                    }}
                  >
                    {verifying ? (
                      <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <>
                        <CheckCircle style={{ width: '20px', height: '20px' }} />
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={verifying}
                    style={{
                      flex: 1,
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
                      gap: '8px'
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
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '16px', 
            padding: '24px', 
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}>
            {/* Result Header */}
            <div style={{
              textAlign: 'center',
              padding: '24px',
              borderRadius: '12px',
              backgroundColor: result.allowed ? '#ecfdf5' : '#fef2f2',
              marginBottom: '24px'
            }}>
              {result.allowed ? (
                <>
                  <CheckCircle style={{ 
                    width: '64px', 
                    height: '64px', 
                    margin: '0 auto 16px',
                    color: '#059669'
                  }} />
                  <h2 style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: '#059669',
                    margin: '0 0 8px 0'
                  }}>
                    ENTRY ALLOWED
                  </h2>
                  <p style={{ color: '#047857', margin: 0 }}>
                    Pass verified successfully
                  </p>
                </>
              ) : (
                <>
                  <XCircle style={{ 
                    width: '64px', 
                    height: '64px', 
                    margin: '0 auto 16px',
                    color: '#dc2626'
                  }} />
                  <h2 style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: '#dc2626',
                    margin: '0 0 8px 0'
                  }}>
                    ENTRY DENIED
                  </h2>
                  <p style={{ color: '#b91c1c', margin: 0, fontWeight: 'bold' }}>
                    {result.reason}
                  </p>
                </>
              )}
            </div>

            {/* Entry Details */}
            {result.entry && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
                  Entry Details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {result.entry.residentName && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      <span style={{ color: '#6b7280', fontSize: '14px' }}>Resident</span>
                      <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{result.entry.residentName}</span>
                    </div>
                  )}
                  {result.entry.vendorCompany && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      <span style={{ color: '#6b7280', fontSize: '14px' }}>Vendor</span>
                      <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{result.entry.vendorCompany}</span>
                    </div>
                  )}
                  {result.entry.address && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      <span style={{ color: '#6b7280', fontSize: '14px' }}>Address</span>
                      <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827', textAlign: 'right' }}>{result.entry.address}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Vehicle</span>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{result.entry.vehiclePlateNumber}</span>
                  </div>
                  {result.entry.vehicleType && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      <span style={{ color: '#6b7280', fontSize: '14px' }}>Type</span>
                      <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{result.entry.vehicleType}</span>
                    </div>
                  )}
                  {result.entry.expiresAt && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      <span style={{ color: '#6b7280', fontSize: '14px' }}>Expires</span>
                      <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>
                        {new Date(result.entry.expiresAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Verified By</span>
                    <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{securityAgent}</span>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={resetVerification}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  color: '#3b82f6',
                  backgroundColor: 'white',
                  border: '2px solid #3b82f6',
                  cursor: 'pointer'
                }}
              >
                Verify Another Entry
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
