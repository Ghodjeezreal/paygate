"use client";

import { Header } from "@/components/header";
import { Truck, AlertTriangle, FileText, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  const services = [
    {
      id: "goods-entry",
      title: "Goods Entry",
      description: "Vehicle entry passes with instant verification",
      icon: Truck,
      href: "/goods-entry",
      color: "#3b82f6",
      available: true,
    },
    {
      id: "vandalism",
      title: "Vandalism Bill",
      description: "Property damage and vandalism fines",
      icon: AlertTriangle,
      href: "/vandalism",
      color: "#f97316",
      available: false,
    },
    {
      id: "other-bills",
      title: "Other Bills",
      description: "Miscellaneous estate bills and charges",
      icon: FileText,
      href: "/other-bills",
      color: "#22c55e",
      available: false,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <Header centerLogo={true} />
      
      <main style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Hero Section */}
        <div style={{ 
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
          borderRadius: '20px', 
          padding: '32px 24px', 
          color: 'white', 
          marginBottom: '24px',
          boxShadow: '0 20px 40px -10px rgba(59, 130, 246, 0.4)',
          textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', lineHeight: '1.2' }}>
            VGC Estate Payments
          </h1>
          <p style={{ fontSize: '15px', opacity: 0.95, margin: '0 0 20px 0' }}>
            Fast, secure, and convenient payment solutions for residents
          </p>
          
          {/* Payment Methods */}
          <div style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.15)', 
            borderRadius: '12px', 
            padding: '12px 16px',
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '11px', opacity: 0.9, margin: '0 0 10px 0', fontWeight: '500' }}>
              🔒 Secure Payment • We Accept
            </p>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <div style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                borderRadius: '6px', 
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '32px'
              }}>
                <Image 
                  src="/icons/mastercard.png" 
                  alt="Mastercard" 
                  width={40} 
                  height={24}
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <div style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                borderRadius: '6px', 
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '32px'
              }}>
                <Image 
                  src="/icons/visa.png" 
                  alt="Visa" 
                  width={40} 
                  height={24}
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <div style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                borderRadius: '6px', 
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '32px'
              }}>
                <Image 
                  src="/icons/verve.png" 
                  alt="Verve" 
                  width={40} 
                  height={24}
                  style={{ objectFit: 'contain' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Services Title */}
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '16px', paddingLeft: '4px' }}>Payment Services</h2>

        {/* Service Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {services.map((service) => {
            const Icon = service.icon;
            const CardContent = (
              <div 
                style={{ 
                  backgroundColor: service.color, 
                  borderRadius: '16px', 
                  padding: '20px', 
                  color: 'white',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                  opacity: service.available ? 1 : 0.6
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '10px', display: 'flex' }}>
                    <Icon style={{ width: '24px', height: '24px' }} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 'bold', fontSize: '18px', margin: 0 }}>{service.title}</h3>
                    {!service.available && (
                      <span style={{ 
                        display: 'inline-block', 
                        marginTop: '4px', 
                        padding: '2px 8px', 
                        backgroundColor: 'rgba(255,255,255,0.2)', 
                        borderRadius: '9999px', 
                        fontSize: '11px', 
                        fontWeight: '500' 
                      }}>
                        COMING SOON
                      </span>
                    )}
                  </div>
                </div>
                
                <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '16px' }}>
                  {service.description}
                </p>

                {service.available && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>Get Started</span>
                    <ChevronRight style={{ width: '20px', height: '20px' }} />
                  </div>
                )}
              </div>
            );

            return service.available ? (
              <Link key={service.id} href={service.href} style={{ textDecoration: 'none' }}>
                {CardContent}
              </Link>
            ) : (
              <div key={service.id}>
                {CardContent}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: '32px', 
          textAlign: 'center',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <p style={{ fontSize: '13px', color: '#9ca3af', margin: '0 0 4px 0' }}>
            Your payment information is encrypted and secure
          </p>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, fontWeight: '500' }}>
            Need help? Contact VGC Estate Administration
          </p>
        </div>
      </main>
    </div>
  );
}
