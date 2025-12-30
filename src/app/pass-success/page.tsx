"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { CheckCircle, Package, Loader2, Home } from "lucide-react";

function PassSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reference = searchParams.get("ref");
  const [loading, setLoading] = useState(true);
  const [purchase, setPurchase] = useState<any>(null);

  useEffect(() => {
    if (reference) {
      fetchPurchase();
    }
  }, [reference]);

  const fetchPurchase = async () => {
    try {
      const response = await fetch(`/api/pass-packages/details?ref=${reference}`);
      const data = await response.json();
      
      if (response.ok) {
        setPurchase(data.purchase);
      }
    } catch (error) {
      console.error('Failed to fetch purchase:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <Loader2 style={{ 
          width: '48px', 
          height: '48px', 
          margin: '0 auto', 
          animation: 'spin 1s linear infinite', 
          color: '#f59e0b' 
        }} />
        <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading purchase details...</p>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div style={{ textAlign: 'center', padding: '60px' }}>
        <p style={{ color: '#ef4444' }}>Purchase not found</p>
      </div>
    );
  }

  return (
    <>
      {/* Success Header */}
      <div style={{
        textAlign: 'center',
        padding: '32px 24px',
        borderRadius: '16px',
        backgroundColor: '#ecfdf5',
        marginBottom: '24px'
      }}>
        <CheckCircle style={{ 
          width: '64px', 
          height: '64px', 
          margin: '0 auto 16px',
          color: '#059669'
        }} />
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          color: '#047857',
          margin: '0 0 8px 0'
        }}>
          Pass Purchase Successful!
        </h1>
        <p style={{ color: '#065f46', fontSize: '16px', margin: 0 }}>
          Your pass package has been activated
        </p>
      </div>

      {/* Purchase Details */}
      <div style={{ 
        backgroundColor: 'white', 
        borderRadius: '16px', 
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #f3f4f6' }}>
          <Package style={{ width: '24px', height: '24px', color: '#f59e0b' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            Purchase Details
          </h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>Reference</span>
            <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827', fontFamily: 'monospace' }}>{purchase.paymentReference}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>Resident Name</span>
            <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{purchase.residentName}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>Package</span>
            <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{purchase.passPackage.name}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>Vehicle Type</span>
            <span style={{ fontWeight: '600', fontSize: '14px', color: '#111827' }}>{purchase.passPackage.vehicleType.name}</span>
          </div>
          
          <div style={{ 
            backgroundColor: '#fef3c7', 
            borderRadius: '12px', 
            padding: '16px',
            border: '1px solid #fbbf24'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#92400e' }}>Available Entries</span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{purchase.remainingEntries}</span>
            </div>
            <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>
              Use these entries when booking goods delivery
            </p>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#6b7280', fontSize: '14px' }}>Amount Paid</span>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>₦{purchase.passPackage.price.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div style={{
        backgroundColor: '#eff6ff',
        border: '1px solid #3b82f6',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e40af', marginBottom: '8px' }}>
          How to Use Your Pass
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#1e3a8a' }}>
          <li style={{ marginBottom: '4px' }}>Go to "Book Goods Entry" on the homepage</li>
          <li style={{ marginBottom: '4px' }}>Enter your details and select "Use Pass Entry"</li>
          <li style={{ marginBottom: '4px' }}>Your reference: <strong>{purchase.paymentReference}</strong></li>
          <li>Each booking will deduct one entry from your pass</li>
        </ul>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => router.push("/my-passes")}
          style={{
            flex: 1,
            padding: '16px',
            borderRadius: '12px',
            border: '2px solid #f59e0b',
            backgroundColor: 'white',
            color: '#f59e0b',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Package style={{ width: '20px', height: '20px' }} />
          My Passes
        </button>
        
        <button
          onClick={() => router.push("/")}
          style={{
            flex: 1,
            padding: '16px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Home style={{ width: '20px', height: '20px' }} />
          Home
        </button>
      </div>
    </>
  );
}

export default function PassSuccessPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <Header showBackButton={true} />
      
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
        <Suspense fallback={
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <Loader2 style={{ 
              width: '48px', 
              height: '48px', 
              margin: '0 auto', 
              animation: 'spin 1s linear infinite', 
              color: '#f59e0b' 
            }} />
          </div>
        }>
          <PassSuccessContent />
        </Suspense>
      </main>
    </div>
  );
}
