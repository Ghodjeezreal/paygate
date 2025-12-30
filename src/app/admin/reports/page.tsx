'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { TrendingUp, DollarSign, Package, FileText, Calendar } from 'lucide-react';

interface ReportData {
  totalRevenue: number;
  totalEntries: number;
  totalPasses: number;
  passRevenue: number;
  singleEntryRevenue: number;
  byVehicleType: Array<{
    vehicleType: string;
    count: number;
    revenue: number;
  }>;
  byDate: Array<{
    date: string;
    entries: number;
    revenue: number;
  }>;
  recentEntries: Array<{
    id: string;
    residentName: string;
    vehicleType: string;
    amount: number;
    date: string;
    status: string;
  }>;
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [dateRange, setDateRange] = useState('7'); // days
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchReportData();
    }
  }, [dateRange, user]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.push('/login');
        return;
      }
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      router.push('/login');
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/reports?days=${dateRange}`);
      const data = await response.json();
      
      if (response.ok) {
        setReportData(data);
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading || !reportData) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'white', fontSize: '1.5rem' }}>Loading reports...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <Header showBackButton={true} showLogout={true} userFullName={user?.fullName} />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            📊 Reports & Analytics
          </h1>
          <p style={{ color: '#6b7280' }}>
            Revenue insights and entry statistics
          </p>
        </div>

        {/* Date Range Filter */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#1f2937' }}>
            Time Period
          </label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{
              padding: '0.75rem',
              borderRadius: '8px',
              border: '2px solid #e5e7eb',
              fontSize: '1rem',
              width: '200px'
            }}
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
        </div>

        {/* Summary Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '12px',
            padding: '1.5rem',
            color: 'white',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <DollarSign size={24} />
              <span style={{ marginLeft: '0.5rem', fontWeight: '600' }}>Total Revenue</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {formatCurrency(reportData.totalRevenue)}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            borderRadius: '12px',
            padding: '1.5rem',
            color: 'white',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <FileText size={24} />
              <span style={{ marginLeft: '0.5rem', fontWeight: '600' }}>Total Entries</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {reportData.totalEntries}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '12px',
            padding: '1.5rem',
            color: 'white',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <Package size={24} />
              <span style={{ marginLeft: '0.5rem', fontWeight: '600' }}>Pass Packages</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {reportData.totalPasses}
            </div>
            <div style={{ fontSize: '0.875rem', opacity: 0.9, marginTop: '0.5rem' }}>
              Revenue: {formatCurrency(reportData.passRevenue)}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            borderRadius: '12px',
            padding: '1.5rem',
            color: 'white',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <TrendingUp size={24} />
              <span style={{ marginLeft: '0.5rem', fontWeight: '600' }}>Single Entries</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {reportData.totalEntries - (reportData.byVehicleType.reduce((acc, vt) => acc + vt.count, 0) - reportData.totalEntries)}
            </div>
            <div style={{ fontSize: '0.875rem', opacity: 0.9, marginTop: '0.5rem' }}>
              Revenue: {formatCurrency(reportData.singleEntryRevenue)}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Revenue by Vehicle Type */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
              Revenue by Vehicle Type
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reportData.byVehicleType.map((item, index) => {
                const maxRevenue = Math.max(...reportData.byVehicleType.map(v => v.revenue));
                const percentage = (item.revenue / maxRevenue) * 100;
                
                return (
                  <div key={index}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '500', color: '#1f2937' }}>{item.vehicleType}</span>
                      <span style={{ fontWeight: '600', color: '#10b981' }}>{formatCurrency(item.revenue)}</span>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '8px', 
                      background: '#e5e7eb', 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
                        borderRadius: '4px',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      {item.count} entries
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Trend */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
              Daily Trend
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {reportData.byDate.slice(-7).map((item, index) => {
                const maxRevenue = Math.max(...reportData.byDate.map(d => d.revenue));
                const percentage = (item.revenue / maxRevenue) * 100;
                
                return (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '60px', fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
                      {formatDate(item.date)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        width: '100%', 
                        height: '24px', 
                        background: '#e5e7eb', 
                        borderRadius: '4px',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        <div style={{
                          width: `${percentage}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                          borderRadius: '4px',
                          transition: 'width 0.3s',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 0.5rem'
                        }}>
                          <span style={{ fontSize: '0.75rem', color: 'white', fontWeight: '600' }}>
                            {item.entries}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ width: '80px', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>
                      {formatCurrency(item.revenue)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Entries Table */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
            Recent Entries
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>Date</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>Resident</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>Vehicle Type</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>Amount</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.recentEntries.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#1f2937' }}>
                      {formatDate(entry.date)}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#1f2937', fontWeight: '500' }}>
                      {entry.residentName}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                      {entry.vehicleType}
                    </td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: '600', color: '#10b981' }}>
                      {formatCurrency(entry.amount)}
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
      </main>
    </div>
  );
}
