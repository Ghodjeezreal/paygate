"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { Package, CheckCircle, Loader2, Zap } from "lucide-react";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

interface PassPackage {
  id: string;
  name: string;
  entries: number;
  price: number;
  discount: number;
  vehicleType: {
    id: number;
    name: string;
    fee: number;
  };
}

export default function PassPackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<PassPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    residentName: "",
    residentEmail: "",
    residentPhone: "",
    packageId: "",
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch("/api/pass-packages");
      const data = await response.json();
      
      if (response.ok) {
        setPackages(data.packages);
      } else {
        alert("Failed to load pass packages");
      }
    } catch (error) {
      console.error("Failed to fetch packages:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/pass-packages/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Initialize Paystack payment
        const handler = window.PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          email: formData.residentEmail,
          amount: data.amount * 100, // Convert to kobo
          currency: "NGN",
          ref: data.reference,
          metadata: {
            custom_fields: [
              {
                display_name: "Resident Name",
                variable_name: "resident_name",
                value: formData.residentName,
              },
              {
                display_name: "Package",
                variable_name: "package_name",
                value: data.packageName,
              },
            ],
          },
          callback: async (response: any) => {
            // Verify payment
            const verifyResponse = await fetch("/api/verify-pass-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                reference: data.reference,
                paystackReference: response.reference 
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyResponse.ok && verifyData.verified) {
              router.push(`/pass-success?ref=${data.reference}`);
            } else {
              alert("Payment verification failed. Please contact support.");
            }
          },
          onClose: () => {
            setSubmitting(false);
            alert("Payment cancelled");
          },
        });

        handler.openIframe();
      } else {
        alert(data.error || "Failed to create purchase");
        setSubmitting(false);
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert("An error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  const selectedPackage = packages.find(p => p.id === formData.packageId);
  const regularPrice = selectedPackage ? selectedPackage.vehicleType.fee * selectedPackage.entries : 0;

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <Header showBackButton={true} />

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Header */}
        <div style={{ 
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
          borderRadius: '16px', 
          padding: '24px', 
          color: 'white', 
          marginBottom: '24px',
          boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '10px', display: 'flex' }}>
              <Package style={{ width: '28px', height: '28px' }} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
              Pass Packages
            </h1>
          </div>
          <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>
            Buy multiple entries and save money
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <Loader2 style={{ 
              width: '48px', 
              height: '48px', 
              margin: '0 auto', 
              animation: 'spin 1s linear infinite', 
              color: '#f59e0b' 
            }} />
            <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading packages...</p>
          </div>
        ) : (
          <>
            {/* Available Packages */}
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
                Available Packages
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {packages.map((pkg) => {
                  const regularPrice = pkg.vehicleType.fee * pkg.entries;
                  const savings = regularPrice - pkg.price;
                  
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setFormData({ ...formData, packageId: pkg.id })}
                      style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '20px',
                        border: formData.packageId === pkg.id ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                        cursor: 'pointer',
                        boxShadow: formData.packageId === pkg.id ? '0 4px 6px -1px rgba(245, 158, 11, 0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
                        position: 'relative',
                        transition: 'all 0.2s'
                      }}
                    >
                      {pkg.discount >= 25 && (
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          backgroundColor: '#dc2626',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Zap style={{ width: '12px', height: '12px' }} />
                          BEST VALUE
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          backgroundColor: formData.packageId === pkg.id ? '#fef3c7' : '#f3f4f6',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Package style={{ 
                            width: '24px', 
                            height: '24px', 
                            color: formData.packageId === pkg.id ? '#f59e0b' : '#6b7280' 
                          }} />
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', margin: '0 0 4px 0' }}>
                            {pkg.entries} Entry Pass - {pkg.vehicleType.name}
                          </h3>
                          <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                            ₦{pkg.vehicleType.fee.toLocaleString()} per entry
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                              ₦{pkg.price.toLocaleString()}
                            </span>
                            <span style={{ 
                              fontSize: '16px', 
                              color: '#9ca3af', 
                              textDecoration: 'line-through' 
                            }}>
                              ₦{regularPrice.toLocaleString()}
                            </span>
                          </div>
                          
                          <div style={{ 
                            fontSize: '13px', 
                            color: '#059669', 
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <CheckCircle style={{ width: '14px', height: '14px' }} />
                            Save ₦{savings.toLocaleString()} ({pkg.discount}% discount)
                          </div>
                        </div>
                        
                        {formData.packageId === pkg.id && (
                          <CheckCircle style={{ 
                            width: '24px', 
                            height: '24px', 
                            color: '#f59e0b',
                            flexShrink: 0
                          }} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Purchase Form */}
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '16px', 
              padding: '24px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '20px' }}>
                Buyer Information
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                    Resident Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.residentName}
                    onChange={(e) => setFormData({ ...formData, residentName: e.target.value })}
                    style={inputStyle}
                    placeholder="Enter your full name"
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.residentEmail}
                    onChange={(e) => setFormData({ ...formData, residentEmail: e.target.value })}
                    style={inputStyle}
                    placeholder="your.email@example.com"
                  />
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.residentPhone}
                    onChange={(e) => setFormData({ ...formData, residentPhone: e.target.value })}
                    style={inputStyle}
                    placeholder="080XXXXXXXX"
                  />
                </div>

                {selectedPackage && (
                  <div style={{ 
                    backgroundColor: '#fef3c7', 
                    borderRadius: '16px', 
                    padding: '20px', 
                    marginBottom: '24px' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#92400e' }}>
                        Total Amount
                      </span>
                      <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>
                        ₦{selectedPackage.price.toLocaleString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#92400e', margin: '8px 0 0 0' }}>
                      {selectedPackage.entries} entries • Savings: ₦{(regularPrice - selectedPackage.price).toLocaleString()}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !formData.packageId}
                  style={{ 
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: submitting || !formData.packageId ? 'not-allowed' : 'pointer',
                    opacity: submitting || !formData.packageId ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Package style={{ width: '20px', height: '20px' }} />
                      Purchase Pass Package
                    </>
                  )}
                </button>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
