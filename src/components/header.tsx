"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut } from "lucide-react";
import { useToast } from "./toast-provider";
import { useState } from "react";

interface HeaderProps {
  showBackButton?: boolean;
  showLogout?: boolean;
  userFullName?: string;
  centerLogo?: boolean;
}

export function Header({ showBackButton = false, showLogout = false, userFullName, centerLogo = false }: HeaderProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        showToast("Logged out successfully", "success");
        setTimeout(() => {
          router.push("/login");
        }, 500);
      } else {
        showToast("Logout failed. Please try again.", "error");
      }
    } catch (error) {
      showToast("An error occurred during logout", "error");
    }
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    handleLogout();
  };

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .header-container {
            height: auto !important;
            padding: 12px 0 !important;
          }
          .header-logo {
            width: 32px !important;
            height: 32px !important;
          }
          .header-title {
            font-size: 16px !important;
          }
          .header-welcome {
            display: none !important;
          }
          .header-logout-text {
            display: none !important;
          }
          .header-logout-btn {
            padding: 8px !important;
            min-width: auto !important;
          }
          .header-back-text {
            display: none !important;
          }
        }
      `}</style>
      <header style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 16px' }}>
        <div className="header-container" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: centerLogo ? 'center' : 'space-between', height: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="header-logo" style={{ width: '40px', height: '40px', position: 'relative' }}>
              <Image
                src="/logo.png"
                alt="VGC Logo"
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
            <div>
              <h1 className="header-title" style={{ fontSize: '20px', fontWeight: 'bold', color: '#0033A0', margin: 0 }}>
                VGC Pay
              </h1>
            </div>
          </div>
          {!centerLogo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {userFullName && (
              <span className="header-welcome" style={{ fontSize: '14px', color: '#6b7280' }}>
                Welcome, <strong>{userFullName}</strong>
              </span>
            )}
            {showLogout && (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="header-logout-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#dc2626',
                  backgroundColor: 'white',
                  border: '1px solid #dc2626',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                <LogOut style={{ width: '16px', height: '16px' }} />
                <span className="header-logout-text">Logout</span>
              </button>
            )}
            {showBackButton && (
              <Link
                href="/"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  color: '#4b5563', 
                  textDecoration: 'none',
                  fontWeight: '500',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <ArrowLeft style={{ width: '20px', height: '20px' }} />
                <span className="header-back-text">Back</span>
              </Link>
            )}
          </div>
          )}
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          onClick={() => setShowLogoutConfirm(false)}
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
            zIndex: 10000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              maxWidth: '400px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <LogOut style={{ width: '28px', height: '28px', color: '#dc2626' }} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: '0 0 8px' }}>
                Confirm Logout
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                Are you sure you want to logout? You will need to login again to access your account.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white',
                  color: '#6b7280',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
