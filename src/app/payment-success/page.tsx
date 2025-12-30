"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/header";
import { CheckCircle, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";

interface EntryData {
  id: string;
  residentName: string;
  vendorCompany: string;
  vehiclePlateNumber: string;
  vehicleType: string;
  fee: number;
  paymentReference: string;
  expiresAt: string;
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("ref");
  const [loading, setLoading] = useState(true);
  const [entryData, setEntryData] = useState<EntryData | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    if (reference) {
      verifyAndFetchEntry();
    }
  }, [reference]);

  const verifyAndFetchEntry = async () => {
    try {
      const response = await fetch("/api/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });

      const data = await response.json();

      if (data.success) {
        setEntryData(data.entry);
        // Generate QR code with full entry data for offline verification
        const qrData = JSON.stringify({
          id: data.entry.id,
          ref: data.entry.paymentReference,
          plate: data.entry.vehiclePlateNumber,
          resident: data.entry.residentName,
          vendor: data.entry.vendorCompany,
          address: data.entry.address,
          vehicleType: data.entry.vehicleType?.name,
          fee: data.entry.vehicleType?.fee,
          status: data.entry.paymentStatus,
          expires: data.entry.expiresAt,
          passStatus: data.entry.passStatus
        });
        const qrUrl = await QRCode.toDataURL(qrData, { width: 300 });
        setQrCodeUrl(qrUrl);
      }
    } catch (error) {
      console.error("Failed to verify payment:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPass = () => {
    if (!qrCodeUrl || !entryData) return;

    const link = document.createElement('a');
    link.download = `VGC-Pass-${entryData.vehiclePlateNumber}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        <Header showBackButton={false} />
        <main style={{ maxWidth: '600px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
          <Loader2 style={{ width: '48px', height: '48px', margin: '0 auto', animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
          <p style={{ marginTop: '16px', color: '#6b7280' }}>Verifying payment...</p>
        </main>
      </div>
    );
  }

  if (!entryData) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        <Header showBackButton={false} />
        <main style={{ maxWidth: '600px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
          <p style={{ color: '#ef4444', fontSize: '18px', fontWeight: 'bold' }}>Payment verification failed</p>
          <Link href="/" style={{ color: '#3b82f6', marginTop: '16px', display: 'inline-block' }}>
            Return to Home
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <Header showBackButton={false} />

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Success Header */}
        <div style={{
          backgroundColor: '#10b981',
          borderRadius: '16px',
          padding: '32px 24px',
          color: 'white',
          textAlign: 'center',
          marginBottom: '24px',
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3)'
        }}>
          <CheckCircle style={{ width: '64px', height: '64px', margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            Payment Successful!
          </h1>
          <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>
            Your entry pass has been generated
          </p>
        </div>

        {/* QR Code Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '16px',
          textAlign: 'center',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
            Your Entry Pass
          </h2>
          {qrCodeUrl && (
            <img 
              src={qrCodeUrl} 
              alt="Entry Pass QR Code" 
              style={{ 
                width: '300px', 
                height: '300px', 
                margin: '0 auto',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: '12px'
              }} 
            />
          )}
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px' }}>
            Show this QR code at the gate for entry
          </p>
        </div>

        {/* Entry Details Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '16px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
            Entry Details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>Reference</span>
              <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{entryData.paymentReference}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>Resident Name</span>
              <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{entryData.residentName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>Vehicle Plate</span>
              <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{entryData.vehiclePlateNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>Vehicle Type</span>
              <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{entryData.vehicleType}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>Amount Paid</span>
              <span style={{ fontWeight: '600', fontSize: '14px', color: '#10b981' }}>₦{entryData.fee.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280', fontSize: '14px' }}>Valid Until</span>
              <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>
                {new Date(entryData.expiresAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <button
            onClick={downloadPass}
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '16px',
              color: 'white',
              backgroundColor: '#3b82f6',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
            }}
          >
            <Download style={{ width: '20px', height: '20px' }} />
            Download QR Code
          </button>
          
          <a
            href="https://testvgcpora.vercel.app"
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '16px',
              color: '#3b82f6',
              backgroundColor: 'white',
              border: '2px solid #3b82f6',
              textDecoration: 'none',
              textAlign: 'center',
              boxSizing: 'border-box',
              display: 'block'
            }}
          >
            Back to Home
          </a>
        </div>
      </main>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        <Header showBackButton={false} />
        <main style={{ maxWidth: '600px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
          <Loader2 style={{ width: '48px', height: '48px', margin: '0 auto', animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
          <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading...</p>
        </main>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
