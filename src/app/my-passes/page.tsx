'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';

interface GoodsEntry {
  id: string;
  residentName: string;
  vehicleType: {
    name: string;
    price: number;
  };
  createdAt: string;
  status: string;
}

interface PassPurchase {
  id: string;
  residentName: string;
  email: string;
  phone: string;
  paymentReference: string;
  paymentStatus: string;
  remainingEntries: number;
  createdAt: string;
  passPackage: {
    name: string;
    entries: number;
    price: number;
    discount: number;
    vehicleType: {
      name: string;
      price: number;
    };
  };
  entries: GoodsEntry[];
}

export default function MyPassesPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [passes, setPasses] = useState<PassPurchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email && !phone) {
      setError('Please enter either email or phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams();
      if (email) params.append('email', email);
      if (phone) params.append('phone', phone);

      const response = await fetch(`/api/my-passes?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch passes');
      }

      setPasses(data.passes);
      setSearched(true);
    } catch (err: any) {
      setError(err.message);
      setPasses([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Header showBackButton={true} />
      
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
            My Passes
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'rgba(255, 255, 255, 0.9)' }}>
            View your purchased passes and usage history
          </p>
        </div>

        {/* Search Form */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
        }}>
          <form onSubmit={handleSearch}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#1f2937' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#1f2937' }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '1rem',
                background: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#991b1b',
                marginBottom: '1rem'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.125rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => {
                if (!loading) e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {loading ? 'Searching...' : 'Search My Passes'}
            </button>
          </form>
        </div>

        {/* Results */}
        {searched && passes.length === 0 && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.5rem' }}>
              No Passes Found
            </h3>
            <p style={{ color: '#6b7280' }}>
              No pass purchases found with the provided information.
            </p>
          </div>
        )}

        {/* Pass Cards */}
        {passes.map((pass) => {
          const usedEntries = pass.passPackage.entries - pass.remainingEntries;
          const isPaid = pass.paymentStatus === 'PAID';
          const isExpired = pass.remainingEntries === 0;

          return (
            <div
              key={pass.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                marginBottom: '1.5rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                border: isExpired ? '2px solid #e5e7eb' : '2px solid #f97316',
                opacity: isExpired ? 0.7 : 1
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.25rem' }}>
                    {pass.passPackage.name}
                  </h3>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    Reference: <span style={{ fontWeight: '600', color: '#f97316' }}>{pass.paymentReference}</span>
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    background: isExpired ? '#e5e7eb' : (isPaid ? '#dcfce7' : '#fef3c7'),
                    color: isExpired ? '#6b7280' : (isPaid ? '#166534' : '#92400e'),
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    marginBottom: '0.5rem'
                  }}>
                    {isExpired ? 'EXPIRED' : (isPaid ? 'ACTIVE' : 'PENDING')}
                  </div>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                    Purchased: {formatDate(pass.createdAt)}
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                marginBottom: '1.5rem',
                padding: '1.5rem',
                background: '#f9fafb',
                borderRadius: '8px'
              }}>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Vehicle Type</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                    {pass.passPackage.vehicleType.name}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Total Entries</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                    {pass.passPackage.entries} entries
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Used</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#f97316' }}>
                    {usedEntries} entries
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Remaining</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: '600', color: isExpired ? '#6b7280' : '#16a34a' }}>
                    {pass.remainingEntries} entries
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Amount Paid</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                    {formatPrice(pass.passPackage.price)}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>Discount</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: '600', color: '#16a34a' }}>
                    {pass.passPackage.discount}% OFF
                  </p>
                </div>
              </div>

              {/* Usage History */}
              {pass.entries.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
                    Usage History ({pass.entries.length})
                  </h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>Date</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>Resident</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pass.entries.map((entry) => (
                          <tr key={entry.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#1f2937' }}>
                              {formatDate(entry.createdAt)}
                            </td>
                            <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#1f2937' }}>
                              {entry.residentName}
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                background: entry.status === 'APPROVED' ? '#dcfce7' : 
                                           entry.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                                color: entry.status === 'APPROVED' ? '#166534' : 
                                       entry.status === 'REJECTED' ? '#991b1b' : '#92400e'
                              }}>
                                {entry.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {pass.entries.length === 0 && isPaid && (
                <div style={{
                  padding: '2rem',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  No entries used yet. Use this pass when booking your next goods entry!
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
