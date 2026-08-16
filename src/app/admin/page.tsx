"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { LayoutDashboard, Search, CheckCircle, Clock, XCircle, Loader2, Eye, X } from "lucide-react";

interface Entry {
  id: string;
  residentName: string;
  vendorCompany: string;
  address: string;
  vehiclePlateNumber: string;
  natureOfGoods: string;
  paymentReference: string;
  paymentStatus: string;
  passStatus: string;
  entryDate: string;
  expiresAt: string;
  createdAt: string;
  vehicleType: {
    name: string;
    fee: number;
  };
  verificationLogs: Array<{
    status: string;
    verifiedAt: string;
    securityAgent: string;
    notes: string | null;
  }>;
}

interface Stats {
  total: number;
  paid: number;
  pending: number;
  verified: number;
}

interface VehicleTypeOption {
  id: string;
  name: string;
  fee: number;
}

export default function AdminDashboard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, paid: 0, pending: 0, verified: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);
  const [userFullName, setUserFullName] = useState('');
  const [vehicleTypes, setVehicleTypes] = useState<VehicleTypeOption[]>([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [eventRegistrations, setEventRegistrations] = useState<Array<{
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
  }>>([]);

  useEffect(() => {
    fetchUser();
    fetchVehicleTypes();
  }, []);

  const fetchVehicleTypes = async () => {
    try {
      const response = await fetch('/api/vehicle-types');
      if (response.ok) {
        const data = await response.json();
        setVehicleTypes(data.vehicleTypes);
      }
    } catch (error) {
      console.error('Failed to fetch vehicle types:', error);
    }
  };

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUserFullName(data.user.fullName);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (searchTerm) params.append('search', searchTerm);
      if (selectedVehicleType !== 'all') params.append('vehicleType', selectedVehicleType);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`/api/admin/entries?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setEntries(data.entries);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch entries:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm, selectedVehicleType, dateFrom, dateTo]);

  const fetchEventRegistrations = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/event-tickets');
      const data = await response.json();
      if (response.ok) {
        setEventRegistrations(data.tickets || []);
      }
    } catch (error) {
      console.error('Failed to fetch event registrations:', error);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
    fetchEventRegistrations();
  }, [fetchEntries, fetchEventRegistrations]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEntries();
  };

  const handleEventRegistrationAction = async (reference: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/events/tickets/${encodeURIComponent(reference)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        await fetchEventRegistrations();
      }
    } catch (error) {
      console.error(`Failed to ${action} event registration:`, error);
    }
  };

  const exportToCSV = () => {
    // Prepare CSV data
    const headers = ['Date', 'Reference', 'Resident Name', 'Vendor Company', 'Address', 'Vehicle Type', 'Plate Number', 'Fee', 'Payment Status', 'Pass Status'];
    const rows = entries.map(entry => [
      new Date(entry.createdAt).toLocaleString(),
      entry.paymentReference,
      entry.residentName,
      entry.vendorCompany,
      entry.address,
      entry.vehicleType.name,
      entry.vehiclePlateNumber,
      entry.vehicleType.fee.toString(),
      entry.paymentStatus,
      entry.passStatus
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vgc-entries-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .desktop-table {
            display: none !important;
          }
          .mobile-cards {
            display: block !important;
          }
          .modal-content {
            max-height: 95vh !important;
            margin: 8px !important;
          }
        }
        @media (min-width: 769px) {
          .desktop-table {
            display: block !important;
          }
          .mobile-cards {
            display: none !important;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        <Header showLogout={true} userFullName={userFullName} />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Header */}
        <div style={{ 
          background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)', 
          borderRadius: '16px', 
          padding: '20px', 
          color: 'white', 
          marginBottom: '24px',
          boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.3)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '10px', display: 'flex' }}>
                <LayoutDashboard style={{ width: '24px', height: '24px' }} />
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                Admin Dashboard
              </h1>
            </div>
            <p style={{ fontSize: '13px', opacity: 0.9, margin: 0 }}>
              Manage and monitor all goods entries
            </p>
            <a
              href="/admin/reports"
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                border: '1px solid rgba(255,255,255,0.3)',
                alignSelf: 'flex-start'
              }}
            >
              📊 Reports
            </a>
            <Link
              href="/admin/events"
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                border: '1px solid rgba(255,255,255,0.3)',
                alignSelf: 'flex-start',
                marginLeft: '8px'
              }}
            >
              🎟️ Events
            </Link>
            <Link
              href="/admin/approvals"
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                border: '1px solid rgba(255,255,255,0.3)',
                alignSelf: 'flex-start',
                marginLeft: '8px'
              }}
            >
              ✅ Approvals
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
          gap: '12px', 
          marginBottom: '20px' 
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Total</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827' }}>{stats.total}</div>
          </div>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Paid</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>{stats.paid}</div>
          </div>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Pending</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.pending}</div>
          </div>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '12px', 
            padding: '16px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>Verified</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.verified}</div>
          </div>
        </div>

        {/* Event Approvals */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.08em', color: '#6b7280', textTransform: 'uppercase', marginBottom: '4px' }}>
                Event approvals
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#111827', margin: 0 }}>Pending registrations</h2>
            </div>
            <div style={{
              backgroundColor: '#f3f4f6',
              borderRadius: '999px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: '700',
              color: '#374151'
            }}>
              {eventRegistrations.length} awaiting review
            </div>
          </div>

          {eventRegistrations.length === 0 ? (
            <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '12px', color: '#6b7280', textAlign: 'center' }}>
              No event registrations are waiting for approval.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {eventRegistrations.map((registration) => (
                <div key={registration.id} style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '16px',
                  backgroundColor: '#fafafa',
                  display: 'grid',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {registration.eventTitle}
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#111827', marginTop: '4px' }}>
                        {registration.buyerName}
                      </div>
                    </div>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '999px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontWeight: '700',
                      backgroundColor: registration.approvalStatus === 'APPROVED' ? '#d1fae5' : registration.approvalStatus === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                      color: registration.approvalStatus === 'APPROVED' ? '#047857' : registration.approvalStatus === 'REJECTED' ? '#b91c1c' : '#b45309'
                    }}>
                      {registration.approvalStatus}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', color: '#374151', fontSize: '14px' }}>
                    <div>
                      <div><strong>Email:</strong> {registration.buyerEmail}</div>
                      {registration.buyerPhone ? <div style={{ marginTop: '4px' }}><strong>Phone:</strong> {registration.buyerPhone}</div> : null}
                      {registration.circleName ? <div style={{ marginTop: '4px' }}><strong>Circle:</strong> {registration.circleName}</div> : null}
                      {registration.guestMessage ? <div style={{ marginTop: '4px' }}><strong>Message:</strong> {registration.guestMessage}</div> : null}
                    </div>
                    <div><strong>Ticket:</strong> {registration.ticketTypeName}</div>
                    <div><strong>Reference:</strong> <span style={{ fontFamily: 'monospace' }}>{registration.reference}</span></div>
                    <div><strong>Purchased:</strong> {new Date(registration.purchasedAt).toLocaleString()}</div>
                  </div>

                  {registration.approvalStatus !== 'APPROVED' && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleEventRegistrationAction(registration.reference, 'approve')}
                        style={{
                          backgroundColor: '#059669',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '10px 14px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEventRegistrationAction(registration.reference, 'reject')}
                        style={{
                          backgroundColor: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '10px 14px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filters & Search */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '16px', 
          padding: '20px', 
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <button
              onClick={() => setFilter('all')}
              style={{
                flex: '1',
                minWidth: '80px',
                padding: '10px 16px',
                borderRadius: '8px',
                border: filter === 'all' ? '2px solid #7c3aed' : '1px solid #e5e7eb',
                backgroundColor: filter === 'all' ? '#ede9fe' : 'white',
                color: filter === 'all' ? '#7c3aed' : '#6b7280',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              All
            </button>
            <button
              onClick={() => setFilter('paid')}
              style={{
                flex: '1',
                minWidth: '80px',
                padding: '10px 16px',
                borderRadius: '8px',
                border: filter === 'paid' ? '2px solid #10b981' : '1px solid #e5e7eb',
                backgroundColor: filter === 'paid' ? '#d1fae5' : 'white',
                color: filter === 'paid' ? '#10b981' : '#6b7280',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Paid
            </button>
            <button
              onClick={() => setFilter('pending')}
              style={{
                flex: '1',
                minWidth: '80px',
                padding: '10px 16px',
                borderRadius: '8px',
                border: filter === 'pending' ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                backgroundColor: filter === 'pending' ? '#fef3c7' : 'white',
                color: filter === 'pending' ? '#f59e0b' : '#6b7280',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Pending
            </button>
          </div>

          {/* Advanced Filters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>
                Vehicle Type
              </label>
              <select
                value={selectedVehicleType}
                onChange={(e) => setSelectedVehicleType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px'
                }}
              >
                <option value="all">All Vehicle Types</option>
                {vehicleTypes && vehicleTypes.map(vt => (
                  <option key={vt.id} value={vt.id}>{vt.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>
                Date From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '6px' }}>
                Date To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          {/* Search Bar and Export */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '200px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                width: '20px',
                height: '20px',
                color: '#6b7280'
              }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, vehicle, or reference..."
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 44px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#7c3aed',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Search
            </button>
          </form>

          <button
            onClick={exportToCSV}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#10b981',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            📥 Export CSV
          </button>
        </div>
        </div>

        {/* Entries Table */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '16px', 
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center' }}>
              <Loader2 style={{ 
                width: '48px', 
                height: '48px', 
                margin: '0 auto', 
                animation: 'spin 1s linear infinite', 
                color: '#7c3aed' 
              }} />
              <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading entries...</p>
            </div>
          ) : entries.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
              No entries found
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div style={{ display: 'block' }} className="mobile-cards">
                {entries.map((entry) => (
                  <div key={entry.id} style={{ 
                    padding: '16px', 
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>
                          {entry.residentName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>
                          {entry.paymentReference}
                        </div>
                      </div>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor: entry.paymentStatus === 'PAID' ? '#d1fae5' : '#fef3c7',
                        color: entry.paymentStatus === 'PAID' ? '#10b981' : '#f59e0b'
                      }}>
                        {entry.paymentStatus === 'PAID' ? (
                          <CheckCircle style={{ width: '12px', height: '12px' }} />
                        ) : (
                          <Clock style={{ width: '12px', height: '12px' }} />
                        )}
                        {entry.paymentStatus}
                      </span>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px' }}>Vehicle</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{entry.vehiclePlateNumber}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px' }}>Type</div>
                        <div style={{ fontSize: '13px', color: '#111827' }}>{entry.vehicleType.name}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px' }}>Amount</div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>₦{entry.vehicleType.fee.toLocaleString()}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#6b7280', marginBottom: '2px' }}>Date</div>
                        <div style={{ fontSize: '13px', color: '#111827' }}>{new Date(entry.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>

                    {entry.vendorCompany && (
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                        Company: {entry.vendorCompany}
                      </div>
                    )}

                    {entry.verificationLogs.length > 0 && (
                      <div style={{
                        fontSize: '11px',
                        color: entry.verificationLogs[0].status === 'ALLOWED' ? '#10b981' : '#ef4444',
                        marginBottom: '8px',
                        padding: '4px 8px',
                        backgroundColor: entry.verificationLogs[0].status === 'ALLOWED' ? '#d1fae5' : '#fee2e2',
                        borderRadius: '4px',
                        width: 'fit-content'
                      }}>
                        {entry.verificationLogs[0].status} by {entry.verificationLogs[0].securityAgent}
                      </div>
                    )}
                    
                    <button
                      onClick={() => setSelectedEntry(entry)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #7c3aed',
                        backgroundColor: 'white',
                        color: '#7c3aed',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Eye style={{ width: '14px', height: '14px' }} />
                      View Details
                    </button>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div style={{ overflowX: 'auto', display: 'none' }} className="desktop-table">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>Reference</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>Resident</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>Vehicle</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>Type</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>Amount</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#111827', fontFamily: 'monospace' }}>
                        {entry.paymentReference}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>{entry.residentName}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{entry.vendorCompany}</div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                        {entry.vehiclePlateNumber}
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#6b7280' }}>
                        {entry.vehicleType.name}
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                        ₦{entry.vehicleType.fee.toLocaleString()}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: entry.paymentStatus === 'PAID' ? '#d1fae5' : '#fef3c7',
                            color: entry.paymentStatus === 'PAID' ? '#10b981' : '#f59e0b',
                            width: 'fit-content'
                          }}>
                            {entry.paymentStatus === 'PAID' ? (
                              <CheckCircle style={{ width: '14px', height: '14px' }} />
                            ) : (
                              <Clock style={{ width: '14px', height: '14px' }} />
                            )}
                            {entry.paymentStatus}
                          </span>
                          {entry.verificationLogs.length > 0 && (
                            <span style={{
                              fontSize: '11px',
                              color: entry.verificationLogs[0].status === 'ALLOWED' ? '#10b981' : '#ef4444'
                            }}>
                              {entry.verificationLogs[0].status} by {entry.verificationLogs[0].securityAgent}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#6b7280' }}>
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <button
                          onClick={() => setSelectedEntry(entry)}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #7c3aed',
                            backgroundColor: 'white',
                            color: '#7c3aed',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Eye style={{ width: '14px', height: '14px' }} />
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>

        {/* Details Modal */}
        {selectedEntry && (
          <div 
            onClick={() => setSelectedEntry(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              zIndex: 1000
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
              }}
              className="modal-content"
            >
              {/* Modal Header */}
              <div style={{
                padding: '16px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'sticky',
                top: 0,
                backgroundColor: 'white',
                zIndex: 1
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  Entry Details
                </h2>
                <button
                  onClick={() => setSelectedEntry(null)}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#f3f4f6',
                    cursor: 'pointer',
                    display: 'flex'
                  }}
                >
                  <X style={{ width: '20px', height: '20px', color: '#6b7280' }} />
                </button>
              </div>

              {/* Modal Content */}
              <div style={{ padding: '16px' }}>
                {/* Entry Information */}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase' }}>
                    Entry Information
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>Payment Reference</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827', fontFamily: 'monospace', wordBreak: 'break-all' }}>{selectedEntry.paymentReference}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>Resident Name</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{selectedEntry.residentName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>Vendor/Company</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{selectedEntry.vendorCompany}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>Address</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827', textAlign: 'right' }}>{selectedEntry.address}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>Vehicle Plate</span>
                      <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#059669' }}>{selectedEntry.vehiclePlateNumber}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>Vehicle Type</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{selectedEntry.vehicleType.name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>Nature of Goods</span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{selectedEntry.natureOfGoods}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6', flexWrap: 'wrap', gap: '4px' }}>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>Amount Paid</span>
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>₦{selectedEntry.vehicleType.fee.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>Payment Status</span>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: selectedEntry.paymentStatus === 'PAID' ? '#d1fae5' : '#fef3c7',
                        color: selectedEntry.paymentStatus === 'PAID' ? '#10b981' : '#f59e0b'
                      }}>
                        {selectedEntry.paymentStatus}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>Created</span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                        {new Date(selectedEntry.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>Expires</span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                        {new Date(selectedEntry.expiresAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verification Logs */}
                {selectedEntry.verificationLogs.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase' }}>
                      Verification History ({selectedEntry.verificationLogs.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedEntry.verificationLogs.map((log, index) => (
                        <div 
                          key={index}
                          style={{
                            padding: '12px',
                            borderRadius: '10px',
                            backgroundColor: log.status === 'ALLOWED' ? '#ecfdf5' : '#fef2f2',
                            border: `1px solid ${log.status === 'ALLOWED' ? '#10b981' : '#ef4444'}`
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            {log.status === 'ALLOWED' ? (
                              <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />
                            ) : (
                              <XCircle style={{ width: '16px', height: '16px', color: '#ef4444' }} />
                            )}
                            <span style={{ 
                              fontSize: '13px', 
                              fontWeight: 'bold', 
                              color: log.status === 'ALLOWED' ? '#047857' : '#dc2626'
                            }}>
                              {log.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                            <strong>Security Agent:</strong> {log.securityAgent}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: log.notes ? '6px' : '0' }}>
                            <strong>Time:</strong> {new Date(log.verifiedAt).toLocaleString()}
                          </div>
                          {log.notes && (
                            <div style={{
                              marginTop: '6px',
                              padding: '10px',
                              borderRadius: '8px',
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb'
                            }}>
                              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', marginBottom: '4px' }}>
                                NOTES:
                              </div>
                              <div style={{ fontSize: '12px', color: '#111827', fontStyle: 'italic' }}>
                                &quot;{log.notes}&quot;
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEntry.verificationLogs.length === 0 && (
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: '#f9fafb',
                    borderRadius: '10px',
                    color: '#6b7280',
                    fontSize: '13px'
                  }}>
                    No verification logs yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
    </>
  );
}
