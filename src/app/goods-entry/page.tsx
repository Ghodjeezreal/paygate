"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Truck, CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface VehicleType {
  id: string;
  name: string;
  fee: number;
}

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export default function GoodsEntryPage() {
  const router = useRouter();
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'single' | 'pass'>('single');
  const [passReference, setPassReference] = useState("");
  const [passDetails, setPassDetails] = useState<any>(null);
  const [checkingPass, setCheckingPass] = useState(false);
  const [formData, setFormData] = useState({
    residentName: "",
    residentEmail: "",
    residentPhone: "",
    vendorCompany: "",
    address: "",
    vehiclePlateNumber: "",
    vehicleTypeId: "",
  });
  const [selectedFee, setSelectedFee] = useState(0);

  useEffect(() => {
    fetchVehicleTypes();
  }, []);

  const fetchVehicleTypes = async () => {
    try {
      const response = await fetch("/api/vehicle-types");
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch vehicle types');
      }
      
      setVehicleTypes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch vehicle types:", error);
      setVehicleTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleTypeChange = (typeId: string) => {
    setFormData({ ...formData, vehicleTypeId: typeId });
    const selected = vehicleTypes.find((type) => type.id === typeId);
    setSelectedFee(selected?.fee || 0);
  };

  const checkPassReference = async () => {
    if (!passReference.trim()) {
      alert('Please enter a pass reference');
      return;
    }

    setCheckingPass(true);
    try {
      const response = await fetch(`/api/pass-packages/check?ref=${passReference}`);
      const data = await response.json();

      if (response.ok && data.valid) {
        setPassDetails(data.purchase);
        setFormData({ 
          ...formData, 
          residentName: data.purchase.residentName 
        });
        alert(`Pass found! ${data.purchase.remainingEntries} entries remaining`);
      } else {
        alert(data.error || 'Invalid pass reference');
        setPassDetails(null);
      }
    } catch (error) {
      console.error('Failed to check pass:', error);
      alert('Failed to check pass reference');
      setPassDetails(null);
    } finally {
      setCheckingPass(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // If using pass, validate and create entry directly
      if (paymentMethod === 'pass') {
        if (!passDetails) {
          alert('Please check your pass reference first');
          setSubmitting(false);
          return;
        }

        const response = await fetch("/api/goods-entry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            usePass: true,
            passReference: passReference
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create entry');
        }

        // Redirect to success page
        router.push(`/payment-success?ref=${data.paymentReference}`);
        return;
      }

      // Original single payment flow
      // Create the goods entry
      const response = await fetch("/api/goods-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create entry');
      }

      // Initialize Paystack payment
      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: `${formData.residentName.toLowerCase().replace(/\s+/g, '.')}@vgcestate.com`,
        amount: data.amount, // Amount in kobo
        currency: 'NGN',
        ref: data.paymentReference,
        metadata: {
          custom_fields: [
            {
              display_name: "Resident Name",
              variable_name: "resident_name",
              value: formData.residentName
            },
            {
              display_name: "Vehicle Plate",
              variable_name: "vehicle_plate",
              value: formData.vehiclePlateNumber
            }
          ]
        },
        onClose: () => {
          setSubmitting(false);
          alert('Payment cancelled');
        },
        callback: (response: any) => {
          // Verify payment
          fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference: response.reference }),
          })
          .then(res => res.json())
          .then(verifyData => {
            if (verifyData.success) {
              router.push(`/payment-success?ref=${response.reference}`);
            } else {
              alert('Payment verification failed');
              setSubmitting(false);
            }
          })
          .catch(err => {
            console.error('Verification error:', err);
            alert('Payment verification failed');
            setSubmitting(false);
          });
        }
      });

      handler.openIframe();
    } catch (error) {
      console.error("Failed to process payment:", error);
      alert(error instanceof Error ? error.message : "Failed to process payment. Please try again.");
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    fontSize: '16px',
    outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <Header showBackButton={true} />

      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Page Header Card */}
        <div style={{ 
          backgroundColor: '#3b82f6', 
          borderRadius: '16px', 
          padding: '24px', 
          color: 'white', 
          marginBottom: '24px',
          boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '10px', display: 'flex' }}>
              <Truck style={{ width: '28px', height: '28px' }} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
              Goods Entry Payment
            </h1>
          </div>
          <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>
            Complete the form to proceed with payment
          </p>
        </div>

        {/* Quick Links */}
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          padding: '16px', 
          marginBottom: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <a 
            href="/my-passes" 
            style={{ 
              flex: 1,
              minWidth: '140px',
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            📋 View My Passes
          </a>
          <a 
            href="/pass-packages" 
            style={{ 
              flex: 1,
              minWidth: '140px',
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            💰 Buy Pass Package
          </a>
        </div>

        {/* Form Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden', marginBottom: '24px' }}>
          <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Payment Method Selection */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                Payment Method
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('single');
                    setPassDetails(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '12px',
                    border: paymentMethod === 'single' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                    backgroundColor: paymentMethod === 'single' ? '#eff6ff' : 'white',
                    color: paymentMethod === 'single' ? '#1e40af' : '#6b7280',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Single Payment
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pass')}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '12px',
                    border: paymentMethod === 'pass' ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                    backgroundColor: paymentMethod === 'pass' ? '#fef3c7' : 'white',
                    color: paymentMethod === 'pass' ? '#92400e' : '#6b7280',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Use Pass
                </button>
              </div>
            </div>

            {/* Pass Reference (if using pass) */}
            {paymentMethod === 'pass' && (
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                  Pass Reference
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={passReference}
                    onChange={(e) => setPassReference(e.target.value.toUpperCase())}
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="e.g., PKG1234567"
                  />
                  <button
                    type="button"
                    onClick={checkPassReference}
                    disabled={checkingPass}
                    style={{
                      padding: '14px 20px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      fontWeight: 'bold',
                      cursor: checkingPass ? 'not-allowed' : 'pointer',
                      opacity: checkingPass ? 0.5 : 1,
                      fontSize: '14px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {checkingPass ? 'Checking...' : 'Check'}
                  </button>
                </div>
                {passDetails && (
                  <div style={{
                    marginTop: '8px',
                    padding: '12px',
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #10b981',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#047857'
                  }}>
                    ✓ Valid pass • {passDetails.remainingEntries} entries remaining • {passDetails.passPackage.vehicleType.name}
                  </div>
                )}
              </div>
            )}

            {/* Resident Name */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                Resident Name
              </label>
              <input
                type="text"
                required
                value={formData.residentName}
                onChange={(e) => setFormData({ ...formData, residentName: e.target.value })}
                style={inputStyle}
                placeholder="Enter resident name"
                disabled={paymentMethod === 'pass' && !!passDetails}
              />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.residentEmail}
                onChange={(e) => setFormData({ ...formData, residentEmail: e.target.value })}
                style={inputStyle}
                placeholder="Enter email address"
              />
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Payment confirmation will be sent to this email
              </p>
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                Phone Number
              </label>
              <input
                type="tel"
                required
                value={formData.residentPhone}
                onChange={(e) => setFormData({ ...formData, residentPhone: e.target.value })}
                style={inputStyle}
                placeholder="Enter phone number"
              />
            </div>

            {/* Vendor Company */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                Vendor/Company Name
              </label>
              <input
                type="text"
                required
                value={formData.vendorCompany}
                onChange={(e) => setFormData({ ...formData, vendorCompany: e.target.value })}
                style={inputStyle}
                placeholder="Enter vendor or company name"
              />
            </div>

            {/* Address */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                Address
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                style={inputStyle}
                placeholder="Enter delivery address"
              />
            </div>

            {/* Vehicle Plate Number */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                Vehicle Plate Number
              </label>
              <input
                type="text"
                required
                value={formData.vehiclePlateNumber}
                onChange={(e) => setFormData({ ...formData, vehiclePlateNumber: e.target.value.toUpperCase() })}
                style={{ ...inputStyle, textTransform: 'uppercase' }}
                placeholder="e.g., ABC123XY"
              />
            </div>

            {/* Vehicle Type */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                Vehicle Type
              </label>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
                  <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                  <span>Loading vehicle types...</span>
                </div>
              ) : (
                <>
                  <select
                    required
                    value={formData.vehicleTypeId}
                    onChange={(e) => handleVehicleTypeChange(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Select vehicle type</option>
                    {vehicleTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} - ₦{type.fee.toLocaleString()}
                      </option>
                    ))}
                  </select>
                  <div style={{
                    marginTop: '8px',
                    padding: '12px',
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fbbf24',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#92400e',
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>⚠️</span>
                    <span>
                      <strong>Warning:</strong> Select the correct vehicle type. Security will verify your vehicle at the gate. 
                      Wrong information will result in entry denial and no refund.
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Fee Display */}
            {selectedFee > 0 && (
              <div style={{ 
                backgroundColor: paymentMethod === 'pass' ? '#f59e0b' : '#22c55e', 
                borderRadius: '16px', 
                padding: '20px', 
                color: 'white' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500', opacity: 0.9 }}>
                    {paymentMethod === 'pass' ? 'Entry Cost' : 'Amount to Pay'}
                  </span>
                  <span style={{ fontSize: '28px', fontWeight: 'bold' }}>
                    {paymentMethod === 'pass' && passDetails ? 'FREE' : `₦${selectedFee.toLocaleString()}`}
                  </span>
                </div>
                <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>
                  {paymentMethod === 'pass' && passDetails 
                    ? `Using pass entry • ${passDetails.remainingEntries - 1} will remain`
                    : 'Valid for 24 hours from payment confirmation'}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !formData.vehicleTypeId || (paymentMethod === 'pass' && !passDetails)}
              style={{ 
                width: '100%', 
                padding: '16px 24px', 
                borderRadius: '12px', 
                fontWeight: 'bold', 
                fontSize: '16px',
                color: 'white', 
                backgroundColor: paymentMethod === 'pass' ? '#f59e0b' : '#3b82f6',
                border: 'none',
                cursor: submitting || !formData.vehicleTypeId || (paymentMethod === 'pass' && !passDetails) ? 'not-allowed' : 'pointer',
                opacity: submitting || !formData.vehicleTypeId ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.3)'
              }}
            >
              {submitting ? (
                <>
                  <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle style={{ width: '20px', height: '20px' }} />
                  {paymentMethod === 'pass' ? 'Book Entry with Pass' : 'Proceed to Payment'}
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
