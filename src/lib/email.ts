import nodemailer from 'nodemailer';

// Create transporter with SMTP configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"VGC Estate Payments" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log('Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

// Email template for goods entry payment confirmation
export function getPaymentConfirmationEmail(data: {
  residentName: string;
  paymentReference: string;
  vehicleType: string;
  fee: number;
  vendorCompany: string;
  vehiclePlateNumber: string;
  entryDate: string;
  qrCode: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .label { font-weight: 600; color: #6b7280; }
        .value { color: #111827; }
        .qr-code { text-align: center; margin: 20px 0; padding: 20px; background: white; border-radius: 8px; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px; }
        .success-badge { background: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: 600; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Payment Successful!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">VGC Estate Goods Entry</p>
        </div>
        
        <div class="content">
          <div style="text-align: center; margin-bottom: 20px;">
            <span class="success-badge">✓ PAYMENT CONFIRMED</span>
          </div>
          
          <h2 style="color: #111827; margin-bottom: 20px;">Entry Details</h2>
          
          <div class="detail-row">
            <span class="label">Payment Reference</span>
            <span class="value" style="font-weight: 600; color: #3b82f6;">${data.paymentReference}</span>
          </div>
          
          <div class="detail-row">
            <span class="label">Resident Name</span>
            <span class="value">${data.residentName}</span>
          </div>
          
          <div class="detail-row">
            <span class="label">Vendor Company</span>
            <span class="value">${data.vendorCompany}</span>
          </div>
          
          <div class="detail-row">
            <span class="label">Vehicle Type</span>
            <span class="value">${data.vehicleType}</span>
          </div>
          
          <div class="detail-row">
            <span class="label">Vehicle Plate Number</span>
            <span class="value">${data.vehiclePlateNumber}</span>
          </div>
          
          <div class="detail-row">
            <span class="label">Entry Date</span>
            <span class="value">${new Date(data.entryDate).toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
          
          <div class="detail-row" style="border-bottom: none;">
            <span class="label">Amount Paid</span>
            <span class="value" style="font-weight: 700; color: #16a34a; font-size: 18px;">₦${data.fee.toLocaleString()}</span>
          </div>
          
          <div class="qr-code">
            <h3 style="margin-top: 0;">Entry Pass QR Code</h3>
            <img src="${data.qrCode}" alt="QR Code" style="max-width: 200px;" />
            <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;">
              Show this QR code at the security gate for verification
            </p>
          </div>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 20px; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;">
              <strong>Important:</strong> Please present this QR code to security personnel upon arrival. 
              The pass will be verified before entry is granted.
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated email from VGC Estate Payment System.</p>
          <p>For assistance, please contact estate administration.</p>
          <p style="margin-top: 20px; font-size: 12px;">© 2025 VGC Estate. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Email template for pass package purchase confirmation
export function getPassPurchaseEmail(data: {
  residentName: string;
  paymentReference: string;
  packageName: string;
  totalEntries: number;
  remainingEntries: number;
  price: number;
  discount: number;
  vehicleType: string;
  regularPrice: number;
}) {
  const savings = data.regularPrice - data.price;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .label { font-weight: 600; color: #6b7280; }
        .value { color: #111827; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px; }
        .success-badge { background: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: 600; margin: 10px 0; }
        .savings-highlight { background: #dcfce7; color: #166534; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Pass Package Purchased!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">VGC Estate Multi-Entry Pass</p>
        </div>
        
        <div class="content">
          <div style="text-align: center; margin-bottom: 20px;">
            <span class="success-badge">✓ PAYMENT CONFIRMED</span>
          </div>
          
          <h2 style="color: #111827; margin-bottom: 20px;">Pass Package Details</h2>
          
          <div class="detail-row">
            <span class="label">Pass Reference</span>
            <span class="value" style="font-weight: 600; color: #f59e0b;">${data.paymentReference}</span>
          </div>
          
          <div class="detail-row">
            <span class="label">Resident Name</span>
            <span class="value">${data.residentName}</span>
          </div>
          
          <div class="detail-row">
            <span class="label">Package</span>
            <span class="value">${data.packageName}</span>
          </div>
          
          <div class="detail-row">
            <span class="label">Vehicle Type</span>
            <span class="value">${data.vehicleType}</span>
          </div>
          
          <div class="detail-row">
            <span class="label">Total Entries</span>
            <span class="value">${data.totalEntries} entries</span>
          </div>
          
          <div class="detail-row">
            <span class="label">Remaining Entries</span>
            <span class="value" style="font-weight: 600; color: #16a34a;">${data.remainingEntries} entries</span>
          </div>
          
          <div class="detail-row">
            <span class="label">Discount</span>
            <span class="value" style="color: #16a34a;">${data.discount}% OFF</span>
          </div>
          
          <div class="detail-row" style="border-bottom: none;">
            <span class="label">Amount Paid</span>
            <span class="value" style="font-weight: 700; color: #16a34a; font-size: 18px;">₦${data.price.toLocaleString()}</span>
          </div>
          
          <div class="savings-highlight">
            <h3 style="margin: 0 0 10px 0; color: #166534;">You Saved ₦${savings.toLocaleString()}!</h3>
            <p style="margin: 0; font-size: 14px;">Regular price: ₦${data.regularPrice.toLocaleString()}</p>
          </div>
          
          <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin-top: 20px; border-radius: 4px;">
            <h4 style="margin: 0 0 10px 0; color: #1e40af;">How to Use Your Pass:</h4>
            <ol style="margin: 0; padding-left: 20px; color: #1e3a8a;">
              <li>Go to Goods Entry page</li>
              <li>Select "Use Pass" as payment method</li>
              <li>Enter your pass reference: <strong>${data.paymentReference}</strong></li>
              <li>Complete the booking - no additional payment needed!</li>
            </ol>
          </div>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-top: 20px; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;">
              <strong>Important:</strong> Keep this pass reference safe. You'll need it to use your prepaid entries.
              View your pass history anytime from the "My Passes" page.
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated email from VGC Estate Payment System.</p>
          <p>For assistance, please contact estate administration.</p>
          <p style="margin-top: 20px; font-size: 12px;">© 2025 VGC Estate. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Email template for admin notification (new entry pending verification)
export function getAdminNotificationEmail(data: {
  residentName: string;
  paymentReference: string;
  vehicleType: string;
  vendorCompany: string;
  entryDate: string;
}) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .label { font-weight: 600; color: #6b7280; }
        .value { color: #111827; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; color: #6b7280; font-size: 14px; }
        .action-button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🔔 New Entry Pending</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Awaiting Security Verification</p>
        </div>
        
        <div class="content">
          <h2 style="color: #111827; margin-bottom: 20px;">Entry Details</h2>
          
          <div class="detail-row">
            <span class="label">Payment Reference</span>
            <span class="value" style="font-weight: 600;">${data.paymentReference}</span>
          </div>
          
          <div class="detail-row">
            <span class="label">Resident Name</span>
            <span class="value">${data.residentName}</span>
          </div>
          
          <div class="detail-row">
            <span class="label">Vendor Company</span>
            <span class="value">${data.vendorCompany}</span>
          </div>
          
          <div class="detail-row">
            <span class="label">Vehicle Type</span>
            <span class="value">${data.vehicleType}</span>
          </div>
          
          <div class="detail-row" style="border-bottom: none;">
            <span class="label">Entry Date</span>
            <span class="value">${new Date(data.entryDate).toLocaleString()}</span>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin" class="action-button">
              View in Admin Dashboard
            </a>
          </div>
        </div>
        
        <div class="footer">
          <p>This is an automated notification from VGC Estate Payment System.</p>
          <p style="margin-top: 20px; font-size: 12px;">© 2025 VGC Estate. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
