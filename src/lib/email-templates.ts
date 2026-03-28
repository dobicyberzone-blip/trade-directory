/**
 * Email Templates for User Actions
 * Sends emails for registration, login, profile updates, etc.
 */

import { sendMail } from './mailer';

const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL;

if (!dashboardUrl) {
  throw new Error('NEXT_PUBLIC_APP_URL environment variable is not set');
}

/**
 * Send registration success email
 */
export async function sendRegistrationEmail(
  email: string,
  firstName: string,
  lastName: string,
  role: string,
  partnerType?: string
): Promise<boolean> {
  try {

    const userName = `${firstName} ${lastName}`.trim();
    // Partners are stored as BUYER role with a partnerType — show their specific partner type
    const roleText = partnerType
      ? partnerType
      : role === 'EXPORTER' ? 'Exporter'
      : role === 'BUYER' ? 'Buyer'
      : role === 'PARTNER' ? 'Partner'
      : 'Admin';

    return sendMail({
      to: email,
      subject: 'Welcome to the KEPROBA Trade Directory',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
            .content { padding: 40px 30px; }
            .welcome-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 25px 0; border-radius: 4px; }
            .cta-box { background: #f0fdf4; border: 2px solid #16a34a; border-radius: 10px; padding: 24px 20px; margin: 28px 0; text-align: center; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff !important; text-decoration: none; font-size: 16px; font-weight: 700; padding: 14px 36px; border-radius: 8px; letter-spacing: 0.3px; }
            .footer { background: #f8f9fa; text-align: center; padding: 25px 30px; color: #666; font-size: 13px; border-top: 1px solid #e9ecef; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to KEPROBA!</h1>
            </div>
            <div class="content">
              <p style="font-size: 16px;">Hello ${userName},</p>
              <div class="welcome-box">
                <h2 style="margin: 0 0 12px 0; color: #16a34a;">Registration Successful!</h2>
                <p style="margin: 0;">Your ${roleText} account has been created successfully. You can now access all features of the KEPROBA Trade Directory platform.</p>
              </div>
              <p><strong>Account Details:</strong></p>
              <ul>
                <li>Email: ${email}</li>
                <li>Role: ${roleText}</li>
                <li>Registration Date: ${new Date().toLocaleDateString()}</li>
              </ul>
              <div class="cta-box">
                <p style="margin: 0 0 6px 0; font-size: 15px; font-weight: 600; color: #15803d;">Your Trade Directory account is ready</p>
                <p style="margin: 0 0 18px 0; font-size: 14px; color: #555;">Sign in now to access your dashboard and get started.</p>
                <a href="${dashboardUrl}/login" class="cta-button">Access Trade Directory</a>
                <p style="margin: 16px 0 0 0; font-size: 12px; color: #888;">Or copy this link: <a href="${dashboardUrl}/login" style="color: #16a34a;">${dashboardUrl}/login</a></p>
              </div>
              <p><strong>Next Steps:</strong></p>
              <ul>
                ${role === 'EXPORTER' ? '<li>Complete your business profile</li><li>Add your products to the directory</li><li>Start receiving inquiries from buyers</li>' : ''}
                ${role === 'BUYER' && !partnerType ? '<li>Browse the exporter directory</li><li>Send inquiries to exporters</li><li>Connect with verified businesses</li>' : ''}
                ${partnerType ? '<li>Access your partner dashboard</li><li>Browse the exporter directory</li><li>Connect with exporters and buyers</li><li>Explore partnership opportunities</li>' : ''}
                ${role === 'ADMIN' ? '<li>Access the admin dashboard</li><li>Manage users and businesses</li><li>Review verification requests</li>' : ''}
              </ul>
            </div>
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong></p>
              <p style="margin: 0;">Need help? <a href="${dashboardUrl}/contact" style="color: #16a34a;">Contact Support</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`[Email] Registration email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send registration email:', error);
    return false;
  }
}

/**
 * Send login notification email
 */
export async function sendLoginEmail(
  email: string,
  firstName: string,
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> {
  try {

    const loginTime = new Date().toLocaleString();
    const location = ipAddress || 'Unknown location';

    return sendMail({
      to: email,
      subject: 'New Sign-In to Your KEPROBA Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .info-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; margin: 25px 0; border-radius: 8px; }
            .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 700; padding: 13px 32px; border-radius: 8px; }
            .footer { background: #f8f9fa; text-align: center; padding: 25px 30px; color: #666; font-size: 13px; border-top: 1px solid #e9ecef; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Login Notification</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              <p>We detected a new login to your KEPROBA account.</p>
              <div class="info-box">
                <p style="margin: 0 0 10px 0;"><strong>Login Details:</strong></p>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Time: ${loginTime}</li>
                  <li>IP Address: ${location}</li>
                  ${userAgent ? `<li>Device: ${userAgent.substring(0, 50)}...</li>` : ''}
                </ul>
              </div>
              <div class="warning-box">
                <strong>Security Notice:</strong>
                <p style="margin: 10px 0 0 0;">If this wasn't you, please secure your account immediately by changing your password and contacting our support team.</p>
              </div>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${dashboardUrl}/dashboard/settings/security" class="cta-button">Review Security Settings</a>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong></p>
              <p style="margin: 0;"><a href="${dashboardUrl}/dashboard/settings/security" style="color: #16a34a;">Security Settings</a> | <a href="${dashboardUrl}/contact" style="color: #16a34a;">Contact Support</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`[Email] Login notification sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send login email:', error);
    return false;
  }
}

/**
 * Send profile update confirmation email
 */
export async function sendProfileUpdateEmail(
  email: string,
  firstName: string,
  updatedFields: string[]
): Promise<boolean> {
  try {

    const fieldsList = updatedFields.map(field => `<li>${field}</li>`).join('');

    return sendMail({
      to: email,
      subject: 'Your Profile Has Been Updated — KEPROBA',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .success-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 25px 0; border-radius: 4px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 700; padding: 13px 32px; border-radius: 8px; }
            .footer { background: #f8f9fa; text-align: center; padding: 25px 30px; color: #666; font-size: 13px; border-top: 1px solid #e9ecef; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Profile Updated</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              <div class="success-box">
                <h2 style="margin: 0 0 12px 0; color: #16a34a;">Your profile has been updated successfully!</h2>
                <p style="margin: 0;">The following information was updated:</p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  ${fieldsList}
                </ul>
              </div>
              <p>Updated on: ${new Date().toLocaleString()}</p>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${dashboardUrl}/dashboard/settings/profile" class="cta-button">View Your Profile</a>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong></p>
              <p style="margin: 0;">If you didn't make these changes, <a href="${dashboardUrl}/contact" style="color: #16a34a;">contact support immediately</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`[Email] Profile update email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send profile update email:', error);
    return false;
  }
}

/**
 * Send business verification submitted email
 */
export async function sendBusinessSubmittedEmail(
  email: string,
  firstName: string,
  businessName: string
): Promise<boolean> {
  try {

    return sendMail({
      to: email,
      subject: 'Business Verification Request Received — KEPROBA',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .info-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 4px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 700; padding: 13px 32px; border-radius: 8px; }
            .footer { background: #f8f9fa; text-align: center; padding: 25px 30px; color: #666; font-size: 13px; border-top: 1px solid #e9ecef; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verification Submitted</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              <div class="info-box">
                <h2 style="margin: 0 0 12px 0; color: #3b82f6;">Business verification submitted successfully!</h2>
                <p style="margin: 0;">Your business "${businessName}" has been submitted for verification. Our team will review your information and documents.</p>
              </div>
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Our verification team will review your business details</li>
                <li>We'll verify your documents and credentials</li>
                <li>You'll receive an email once the review is complete</li>
                <li>Typical review time: 2-3 business days</li>
              </ul>
              <p>You'll be notified via email once your business is verified and visible in the directory.</p>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${dashboardUrl}/dashboard/exporter/business-profile" class="cta-button">Track Verification Status</a>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong></p>
              <p style="margin: 0;">Questions? <a href="${dashboardUrl}/contact" style="color: #16a34a;">Contact Support</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`[Email] Business submitted email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send business submitted email:', error);
    return false;
  }
}

/**
 * Send password change confirmation email
 */
export async function sendPasswordChangeEmail(
  email: string,
  firstName: string
): Promise<boolean> {
  try {

    return sendMail({
      to: email,
      subject: 'Your Password Has Been Changed — KEPROBA',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .success-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 25px 0; border-radius: 4px; }
            .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 700; padding: 13px 32px; border-radius: 8px; }
            .footer { background: #f8f9fa; text-align: center; padding: 25px 30px; color: #666; font-size: 13px; border-top: 1px solid #e9ecef; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Changed</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              <div class="success-box">
                <h2 style="margin: 0 0 12px 0; color: #16a34a;">Your password has been changed successfully!</h2>
                <p style="margin: 0;">Changed on: ${new Date().toLocaleString()}</p>
              </div>
              <div class="warning-box">
                <strong>Security Alert:</strong>
                <p style="margin: 10px 0 0 0;">If you didn't make this change, please contact our support team immediately to secure your account.</p>
              </div>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${dashboardUrl}/dashboard/settings/security" class="cta-button">Go to Security Settings</a>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong></p>
              <p style="margin: 0;"><a href="${dashboardUrl}/contact" style="color: #16a34a;">Contact Support</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`[Email] Password change email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send password change email:', error);
    return false;
  }
}

/**
 * Send product submitted for review email
 */
export async function sendProductSubmittedEmail(
  email: string,
  firstName: string,
  productName: string
): Promise<boolean> {
  try {

    return sendMail({
      to: email,
      subject: 'Product Submitted for Review — KEPROBA',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .info-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 4px; }
            .footer { background: #f8f9fa; text-align: center; padding: 25px 30px; color: #666; font-size: 13px; border-top: 1px solid #e9ecef; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Product Submitted</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              <div class="info-box">
                <h2 style="margin: 0 0 12px 0; color: #3b82f6;">Product submitted successfully!</h2>
                <p style="margin: 0;">Your product "${productName}" has been submitted for review by our team.</p>
              </div>
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Our team will review your product details</li>
                <li>We'll verify the information and images</li>
                <li>You'll receive an email once the review is complete</li>
                <li>Typical review time: 1-2 business days</li>
              </ul>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${dashboardUrl}/dashboard/exporter/products" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 13px 32px; border-radius: 8px;">View My Products</a>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong></p>
              <p style="margin: 0;">Questions? <a href="${dashboardUrl}/contact" style="color: #16a34a;">Contact Support</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`[Email] Product submitted email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send product submitted email:', error);
    return false;
  }
}

/**
 * Send inquiry received email to exporter
 */
export async function sendInquiryReceivedEmail(
  email: string,
  exporterName: string,
  buyerName: string,
  productName: string,
  message: string
): Promise<boolean> {
  try {

    return sendMail({
      to: email,
      subject: 'You Have a New Buyer Inquiry — KEPROBA',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .inquiry-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; margin: 25px 0; border-radius: 8px; }
            .footer { background: #f8f9fa; text-align: center; padding: 25px 30px; color: #666; font-size: 13px; border-top: 1px solid #e9ecef; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Inquiry</h1>
            </div>
            <div class="content">
              <p>Hello ${exporterName},</p>
              <p>You have received a new inquiry from a buyer!</p>
              <div class="inquiry-box">
                <p style="margin: 0 0 10px 0;"><strong>From:</strong> ${buyerName}</p>
                <p style="margin: 0 0 10px 0;"><strong>Product:</strong> ${productName}</p>
                <p style="margin: 0 0 10px 0;"><strong>Message:</strong></p>
                <p style="margin: 0; padding: 10px; background: white; border-radius: 4px;">${message}</p>
              </div>
              <p><strong>Quick Response Tips:</strong></p>
              <ul>
                <li>Respond within 24 hours for best results</li>
                <li>Provide detailed product information</li>
                <li>Include pricing and minimum order quantities</li>
                <li>Be professional and courteous</li>
              </ul>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${dashboardUrl}/dashboard/exporter/inquiries" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 13px 32px; border-radius: 8px;">Reply to Inquiry</a>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong></p>
              <p style="margin: 0;"><a href="${dashboardUrl}/dashboard/exporter/inquiries" style="color: #16a34a;">View All Inquiries</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`[Email] Inquiry received email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send inquiry received email:', error);
    return false;
  }
}

/**
 * Send inquiry response email to buyer
 */
export async function sendInquiryResponseEmail(
  email: string,
  buyerName: string,
  exporterName: string,
  productName: string
): Promise<boolean> {
  try {

    return sendMail({
      to: email,
      subject: 'An Exporter Has Responded to Your Inquiry — KEPROBA',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .response-box { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 4px; }
            .footer { background: #f8f9fa; text-align: center; padding: 25px 30px; color: #666; font-size: 13px; border-top: 1px solid #e9ecef; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Inquiry Response</h1>
            </div>
            <div class="content">
              <p>Hello ${buyerName},</p>
              <div class="response-box">
                <h2 style="margin: 0 0 12px 0; color: #3b82f6;">You have a new response!</h2>
                <p style="margin: 0;">${exporterName} has responded to your inquiry about "${productName}".</p>
              </div>
              <p>Check your messages to view the full response and continue the conversation.</p>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${dashboardUrl}/dashboard/buyer/inquiries" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 13px 32px; border-radius: 8px;">View Response</a>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong></p>
              <p style="margin: 0;"><a href="${dashboardUrl}/dashboard/buyer/inquiries" style="color: #16a34a;">View All Inquiries</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`[Email] Inquiry response email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send inquiry response email:', error);
    return false;
  }
}

/**
 * Send business details updated email (Exporter only)
 */
export async function sendBusinessDetailsUpdatedEmail(
  email: string,
  firstName: string,
  businessName: string,
  updatedFields: string[]
): Promise<boolean> {
  try {

    const fieldsList = updatedFields.map(field => `<li>${field}</li>`).join('');

    return sendMail({
      to: email,
      subject: 'Your Business Details Have Been Updated — KEPROBA',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .success-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 25px 0; border-radius: 4px; }
            .footer { background: #f8f9fa; text-align: center; padding: 25px 30px; color: #666; font-size: 13px; border-top: 1px solid #e9ecef; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Business Details Updated</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              <div class="success-box">
                <h2 style="margin: 0 0 12px 0; color: #16a34a;">Your business details have been updated successfully!</h2>
                <p style="margin: 0 0 10px 0;"><strong>Business:</strong> ${businessName}</p>
                <p style="margin: 0;">The following information was updated:</p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  ${fieldsList}
                </ul>
              </div>
              <p>Updated on: ${new Date().toLocaleString()}</p>
              <p><strong>Note:</strong> If your business was previously verified, these changes may require re-verification by our team.</p>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${dashboardUrl}/dashboard/exporter/business-profile" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 13px 32px; border-radius: 8px;">View Business Profile</a>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong></p>
              <p style="margin: 0;">If you didn't make these changes, <a href="${dashboardUrl}/contact" style="color: #16a34a;">contact support immediately</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`[Email] Business details updated email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send business details updated email:', error);
    return false;
  }
}

/**
 * Send success story submitted email
 */
export async function sendSuccessStorySubmittedEmail(
  email: string,
  firstName: string,
  storyTitle: string
): Promise<boolean> {
  try {

    return sendMail({
      to: email,
      subject: 'Your Success Story Has Been Submitted — KEPROBA',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .success-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 25px 0; border-radius: 4px; }
            .footer { background: #f8f9fa; text-align: center; padding: 25px 30px; color: #666; font-size: 13px; border-top: 1px solid #e9ecef; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Success Story Submitted</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              <div class="success-box">
                <h2 style="margin: 0 0 12px 0; color: #16a34a;">Thank you for sharing your success story!</h2>
                <p style="margin: 0;"><strong>Story Title:</strong> "${storyTitle}"</p>
              </div>
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Our team will review your success story</li>
                <li>We may contact you for additional details or images</li>
                <li>Once approved, your story will be featured on our platform</li>
                <li>You'll receive an email when your story is published</li>
              </ul>
              <p>Your success story helps inspire other Kenyan exporters and showcases the impact of our platform!</p>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${dashboardUrl}/dashboard/exporter/success-stories" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 13px 32px; border-radius: 8px;">View My Stories</a>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong></p>
              <p style="margin: 0;">Questions? <a href="${dashboardUrl}/contact" style="color: #16a34a;">Contact Support</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`[Email] Success story submitted email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send success story submitted email:', error);
    return false;
  }
}

/**
 * Send inquiry sent confirmation email to buyer
 */
export async function sendInquirySentEmail(
  email: string,
  buyerName: string,
  exporterName: string,
  productName: string
): Promise<boolean> {
  try {

    return sendMail({
      to: email,
      subject: 'Your Inquiry Has Been Sent — KEPROBA',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .success-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 25px 0; border-radius: 4px; }
            .footer { background: #f8f9fa; text-align: center; padding: 25px 30px; color: #666; font-size: 13px; border-top: 1px solid #e9ecef; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Inquiry Sent</h1>
            </div>
            <div class="content">
              <p>Hello ${buyerName},</p>
              <div class="success-box">
                <h2 style="margin: 0 0 12px 0; color: #16a34a;">Your inquiry has been sent successfully!</h2>
                <p style="margin: 0 0 10px 0;"><strong>To:</strong> ${exporterName}</p>
                <p style="margin: 0;"><strong>Product:</strong> ${productName}</p>
              </div>
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>The exporter will receive your inquiry</li>
                <li>They typically respond within 24-48 hours</li>
                <li>You'll receive an email when they reply</li>
                <li>You can track your inquiry in your dashboard</li>
              </ul>
              <p><strong>Tips for successful communication:</strong></p>
              <ul>
                <li>Check your messages regularly</li>
                <li>Respond promptly to exporter questions</li>
                <li>Be clear about your requirements and quantities</li>
                <li>Ask about certifications and shipping options</li>
              </ul>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${dashboardUrl}/dashboard/buyer/inquiries" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 13px 32px; border-radius: 8px;">Track My Inquiries</a>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong></p>
              <p style="margin: 0;"><a href="${dashboardUrl}/dashboard/buyer/inquiries" style="color: #16a34a;">View All Inquiries</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`[Email] Inquiry sent email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send inquiry sent email:', error);
    return false;
  }
}

/**
 * Send business verification approved email
 */
export async function sendBusinessVerificationApprovedEmail(
  email: string,
  firstName: string,
  businessName: string
): Promise<boolean> {
  try {

    return sendMail({
      to: email,
      subject: 'Your Business Has Been Verified — KEPROBA',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
            .content { padding: 40px 30px; }
            .success-box { background: #f0fdf4; border: 2px solid #16a34a; padding: 25px; margin: 25px 0; border-radius: 8px; text-align: center; }
            .badge { display: inline-block; background: #16a34a; color: white; padding: 8px 20px; border-radius: 20px; font-weight: 600; font-size: 14px; margin: 15px 0; }
            .footer { background: #f8f9fa; text-align: center; padding: 25px 30px; color: #666; font-size: 13px; border-top: 1px solid #e9ecef; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations!</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              <div class="success-box">
                <h2 style="margin: 0 0 15px 0; color: #16a34a; font-size: 24px;">Your Business is Now Verified!</h2>
                <p style="margin: 0 0 10px 0; font-size: 18px;"><strong>${businessName}</strong></p>
                <div class="badge">✓ VERIFIED BUSINESS</div>
                <p style="margin: 15px 0 0 0; color: #666;">Verified on: ${new Date().toLocaleDateString()}</p>
              </div>
              <p><strong>What this means for you:</strong></p>
              <ul>
                <li>✓ Your business is now visible in the KEPROBA directory</li>
                <li>✓ Buyers can find and contact you directly</li>
                <li>✓ You have a verified badge on your profile</li>
                <li>✓ Increased credibility and trust with potential buyers</li>
                <li>✓ Access to all platform features</li>
              </ul>
              <p><strong>Next steps to maximize your success:</strong></p>
              <ul>
                <li>Add more products to your catalog</li>
                <li>Upload high-quality product images</li>
                <li>Keep your business information up to date</li>
                <li>Respond promptly to buyer inquiries</li>
                <li>Share your success stories</li>
              </ul>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${dashboardUrl}/dashboard/exporter/business-profile" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 13px 32px; border-radius: 8px;">View Your Business Profile</a>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong></p>
              <p style="margin: 0;">Need help? <a href="${dashboardUrl}/contact" style="color: #16a34a;">Contact Support</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`[Email] Business verification approved email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send business verification approved email:', error);
    return false;
  }
}

/**
 * Send product approved email
 */
export async function sendProductApprovedEmail(
  email: string,
  firstName: string,
  productName: string
): Promise<boolean> {
  try {

    return sendMail({
      to: email,
      subject: 'Your Product Has Been Approved — KEPROBA',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .success-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 25px 0; border-radius: 4px; }
            .footer { background: #f8f9fa; text-align: center; padding: 25px 30px; color: #666; font-size: 13px; border-top: 1px solid #e9ecef; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Product Approved</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              <div class="success-box">
                <h2 style="margin: 0 0 12px 0; color: #16a34a;">Your product has been approved!</h2>
                <p style="margin: 0;"><strong>Product:</strong> ${productName}</p>
              </div>
              <p><strong>What this means:</strong></p>
              <ul>
                <li>✓ Your product is now visible to all buyers</li>
                <li>✓ Buyers can send inquiries about this product</li>
                <li>✓ The product appears in search results</li>
                <li>✓ Your product catalog is growing</li>
              </ul>
              <p><strong>Tips to attract more buyers:</strong></p>
              <ul>
                <li>Use high-quality product images</li>
                <li>Write detailed product descriptions</li>
                <li>Keep pricing and availability updated</li>
                <li>Respond quickly to inquiries</li>
                <li>Add more products to your catalog</li>
              </ul>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${dashboardUrl}/dashboard/exporter/products" style="display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 13px 32px; border-radius: 8px;">View My Products</a>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong></p>
              <p style="margin: 0;"><a href="${dashboardUrl}/dashboard/exporter/products" style="color: #16a34a;">View All Products</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`[Email] Product approved email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send product approved email:', error);
    return false;
  }
}

/**
 * Send business verification rejected email
 */
export async function sendBusinessVerificationRejectedEmail(
  email: string,
  firstName: string,
  businessName: string,
  reason: string
): Promise<boolean> {
  try {

    const profileUrl = `${dashboardUrl}/dashboard/exporter/business-profile`;

    return sendMail({
      to: email,
      subject: 'Action Required: Please Update Your Business Profile — KEPROBA',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
            .content { padding: 40px 30px; }
            .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 4px; }
            .reason-box { background: #fff7ed; border: 1px solid #fed7aa; padding: 16px 20px; margin: 20px 0; border-radius: 6px; }
            .cta-wrap { text-align: center; margin: 30px 0; }
            .cta-button { display: inline-block; background: #16a34a; color: white !important; padding: 14px 36px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; }
            .steps { background: #f8f9fa; border-radius: 8px; padding: 20px 24px; margin: 20px 0; }
            .steps ol { margin: 0; padding-left: 20px; }
            .steps li { margin-bottom: 8px; }
            .footer { background: #f8f9fa; text-align: center; padding: 25px 30px; color: #666; font-size: 13px; border-top: 1px solid #e9ecef; }
            .footer a { color: #16a34a; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Verification Requires Attention</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              <div class="warning-box">
                <h2 style="margin: 0 0 10px 0; color: #d97706; font-size: 18px;">Your business verification was not approved</h2>
                <p style="margin: 0;"><strong>Business:</strong> ${businessName}</p>
              </div>

              <div class="reason-box">
                <p style="margin: 0 0 6px 0; font-weight: 600; color: #92400e;">Reason from admin:</p>
                <p style="margin: 0; color: #78350f;">${reason}</p>
              </div>

              <div class="steps">
                <p style="margin: 0 0 12px 0; font-weight: 600;">What you need to do:</p>
                <ol>
                  <li>Click the button below to open your Business Profile</li>
                  <li>Review and correct the information based on the reason above</li>
                  <li>Upload any missing or corrected documents</li>
                  <li>Save your changes — this will resubmit your profile for review</li>
                </ol>
              </div>

              <div class="cta-wrap">
                <a href="${profileUrl}" class="cta-button">Update Business Profile</a>
              </div>

              <p style="font-size: 13px; color: #666; text-align: center;">
                Or copy this link: <a href="${profileUrl}" style="color: #16a34a;">${profileUrl}</a>
              </p>

              <p>Our team is here to help. If you have questions about the requirements, contact our support team.</p>
            </div>
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong></p>
              <p style="margin: 0;"><a href="${dashboardUrl}/contact">Contact Support</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Business Verification Update - Action Required

Hello ${firstName},

Your business "${businessName}" verification was not approved.

Reason: ${reason}

To fix this, please update your business profile here:
${profileUrl}

Steps:
1. Open the link above
2. Review and correct your business information
3. Upload any missing or corrected documents
4. Save your changes to resubmit for review

Need help? Contact us at ${dashboardUrl}/contact

Kenya Export Promotion and Branding Agency (KEPROBA)
      `.trim(),
    });

    console.log(`[Email] Business verification rejected email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send business verification rejected email:', error);
    return false;
  }
}

/**
 * Send account suspended email to user
 */
export async function sendAccountSuspendedEmail(
  email: string,
  firstName: string,
  reason?: string
): Promise<boolean> {
  try {

    return sendMail({
      to: email,
      subject: 'Important: Your KEPROBA Account Has Been Suspended',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
            .content { padding: 40px 30px; }
            .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 25px 0; border-radius: 4px; }
            .footer { background: #f8f9fa; text-align: center; padding: 25px 30px; color: #666; font-size: 13px; border-top: 1px solid #e9ecef; }
            .footer a { color: #16a34a; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Account Suspended</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              <div class="alert-box">
                <h2 style="margin: 0 0 12px 0; color: #dc2626;">Your account has been suspended</h2>
                <p style="margin: 0;">Your KEPROBA account has been suspended by an administrator and you will not be able to log in until the suspension is lifted.</p>
                ${reason ? `<p style="margin: 12px 0 0 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
              </div>
              <p><strong>What this means:</strong></p>
              <ul>
                <li>You cannot log in to your account</li>
                <li>Your profile and listings are not visible to others</li>
                <li>Pending inquiries and messages are paused</li>
              </ul>
              <p>If you believe this suspension was made in error or would like to appeal, please contact our support team with your account email and details.</p>
              <p style="margin-top: 30px;">
                <a href="${dashboardUrl}/contact" style="background: #16a34a; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Contact Support</a>
              </p>
            </div>
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong></p>
              <p style="margin: 0;"><a href="${dashboardUrl}/contact">Contact Support</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`[Email] Account suspended email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send account suspended email:', error);
    return false;
  }
}

/**
 * Send account unsuspended (reinstated) email to user
 */
export async function sendAccountUnsuspendedEmail(
  email: string,
  firstName: string
): Promise<boolean> {
  try {

    return sendMail({
      to: email,
      subject: 'Your KEPROBA Account Has Been Reinstated',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
            .content { padding: 40px 30px; }
            .success-box { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 25px 0; border-radius: 4px; }
            .footer { background: #f8f9fa; text-align: center; padding: 25px 30px; color: #666; font-size: 13px; border-top: 1px solid #e9ecef; }
            .footer a { color: #16a34a; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Account Reinstated</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              <div class="success-box">
                <h2 style="margin: 0 0 12px 0; color: #16a34a;">Your account has been reinstated!</h2>
                <p style="margin: 0;">Your KEPROBA account suspension has been lifted. You can now log in and access all platform features again.</p>
              </div>
              <p><strong>You can now:</strong></p>
              <ul>
                <li>✓ Log in to your account</li>
                <li>✓ Access your dashboard and profile</li>
                <li>✓ Send and receive inquiries</li>
                <li>✓ Manage your listings</li>
              </ul>
              <p>We encourage you to review our <a href="${dashboardUrl}/terms-and-conditions" style="color: #16a34a;">Terms of Service</a> to ensure continued compliance.</p>
              <p style="margin-top: 30px;">
                <a href="${dashboardUrl}/login" style="background: #16a34a; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Log In Now</a>
              </p>
            </div>
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong></p>
              <p style="margin: 0;"><a href="${dashboardUrl}/contact">Contact Support</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`[Email] Account unsuspended email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send account unsuspended email:', error);
    return false;
  }
}

/**
 * Send business suspended email to business owner
 */
export async function sendBusinessSuspendedEmail(
  email: string,
  firstName: string,
  businessName: string,
  reason?: string
): Promise<boolean> {
  try {

    return sendMail({
      to: email,
      subject: `Important: Your Business "${businessName}" Has Been Suspended — KEPROBA`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
            .content { padding: 40px 30px; }
            .alert-box { background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 25px 0; border-radius: 4px; }
            .footer { background: #f8f9fa; text-align: center; padding: 25px 30px; color: #666; font-size: 13px; border-top: 1px solid #e9ecef; }
            .footer a { color: #16a34a; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Business Suspended</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName},</p>
              <div class="alert-box">
                <h2 style="margin: 0 0 12px 0; color: #dc2626;">Your business has been suspended</h2>
                <p style="margin: 0 0 10px 0;"><strong>Business:</strong> ${businessName}</p>
                <p style="margin: 0;">Your business listing has been suspended by an administrator and is no longer visible in the KEPROBA directory.</p>
                ${reason ? `<p style="margin: 12px 0 0 0;"><strong>Reason:</strong> ${reason}</p>` : ''}
              </div>
              <p><strong>What this means:</strong></p>
              <ul>
                <li>Your business is not visible in the directory</li>
                <li>Buyers cannot find or contact your business</li>
                <li>Your products are not shown in search results</li>
                <li>New inquiries are paused</li>
              </ul>
              <p>To appeal this decision or get more information, please contact our support team.</p>
              <p style="margin-top: 30px;">
                <a href="${dashboardUrl}/contact" style="background: #16a34a; color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Contact Support</a>
              </p>
            </div>
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong></p>
              <p style="margin: 0;"><a href="${dashboardUrl}/contact">Contact Support</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`[Email] Business suspended email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send business suspended email:', error);
    return false;
  }
}

/**
 * Send new rating notification email to exporter
 * Triggered asynchronously when a buyer submits or updates a rating
 */
export async function sendRatingNotificationEmail(
  exporterEmail: string,
  exporterName: string,
  businessName: string,
  buyerName: string,
  ratingScore: number,
  review: string | null,
  submittedAt: Date,
  isUpdate: boolean = false
): Promise<boolean> {
  try {

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const dashboardLink = `${appUrl}/dashboard/exporter/business-profile`;
    const stars = '★'.repeat(ratingScore) + '☆'.repeat(5 - ratingScore);
    const ratingLabel = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][ratingScore] || '';
    const formattedDate = submittedAt.toLocaleString('en-KE', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Africa/Nairobi',
    });

    return sendMail({
      to: exporterEmail,
      subject: `New Rating Received for ${businessName} — KEPROBA`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Rating Received</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #333; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 36px 32px; text-align: center; }
    .header img { height: 48px; margin-bottom: 12px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
    .header p { margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 14px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 16px; margin-bottom: 20px; }
    .rating-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 24px; margin: 24px 0; }
    .rating-card h2 { margin: 0 0 16px; font-size: 17px; color: #15803d; }
    .stars { font-size: 28px; color: #f59e0b; letter-spacing: 2px; margin-bottom: 4px; }
    .rating-label { font-size: 13px; color: #6b7280; margin-bottom: 16px; }
    .detail-row { display: flex; gap: 8px; margin-bottom: 10px; font-size: 14px; }
    .detail-label { font-weight: 600; color: #374151; min-width: 110px; }
    .detail-value { color: #4b5563; }
    .review-box { background: #ffffff; border: 1px solid #d1fae5; border-radius: 8px; padding: 14px 16px; margin-top: 14px; font-size: 14px; color: #374151; line-height: 1.6; font-style: italic; }
    .no-review { color: #9ca3af; font-size: 13px; font-style: italic; margin-top: 10px; }
    .cta { text-align: center; margin: 32px 0 8px; }
    .cta a { display: inline-block; background: #16a34a; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 0.2px; }
    .cta a:hover { background: #15803d; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 28px 0; }
    .footer { background: #f8fafc; padding: 24px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
    .footer a { color: #16a34a; text-decoration: none; }
    .badge { display: inline-block; background: ${isUpdate ? '#fef3c7' : '#dcfce7'}; color: ${isUpdate ? '#92400e' : '#166534'}; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <!-- Header -->
    <div class="header">
      <h1>🌟 New Rating Received</h1>
      <p>Kenya Export Promotion &amp; Branding Agency</p>
    </div>

    <!-- Body -->
    <div class="body">
      <p class="greeting">Hello <strong>${exporterName}</strong>,</p>
      <p style="font-size:15px; color:#4b5563;">
        A buyer has ${isUpdate ? 'updated their rating' : 'submitted a new rating'} for your business on the KEPROBA Trade Directory.
      </p>

      <!-- Rating Card -->
      <div class="rating-card">
        <span class="badge">${isUpdate ? 'Rating Updated' : 'New Rating'}</span>
        <h2>Rating Details</h2>

        <div class="stars">${stars}</div>
        <div class="rating-label">${ratingScore}/5 — ${ratingLabel}</div>

        <div class="detail-row">
          <span class="detail-label">Business:</span>
          <span class="detail-value">${businessName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Rated by:</span>
          <span class="detail-value">${buyerName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Submitted on:</span>
          <span class="detail-value">${formattedDate}</span>
        </div>

        ${review
          ? `<p style="margin:14px 0 4px; font-size:13px; font-weight:600; color:#374151;">Written Feedback:</p>
             <div class="review-box">"${review}"</div>`
          : `<p class="no-review">No written feedback was provided.</p>`
        }
      </div>

      <!-- CTA -->
      <div class="cta">
        <a href="${dashboardLink}">View Your Business Profile &amp; Ratings →</a>
      </div>

      <hr class="divider" />

      <p style="font-size:13px; color:#6b7280; text-align:center;">
        Ratings help build trust with international buyers. Keep delivering excellent service to maintain a strong profile on the directory.
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin:0 0 6px;"><strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong></p>
      <p style="margin:0 0 6px;">
        <a href="${appUrl}">Trade Directory</a> &nbsp;|&nbsp;
        <a href="${appUrl}/dashboard">Dashboard</a> &nbsp;|&nbsp;
        <a href="${appUrl}/contact">Contact Support</a>
      </p>
      <p style="margin:8px 0 0; font-size:11px; color:#d1d5db;">
        You are receiving this email because you are a registered exporter on the KEPROBA Trade Directory.<br/>
        © ${new Date().getFullYear()} KEPROBA. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`,
    });

    console.log(`[Email] Rating notification sent to ${exporterEmail} for business "${businessName}" (score: ${ratingScore}, isUpdate: ${isUpdate})`);
    return true;
  } catch (error) {
    console.error(`[Email] Failed to send rating notification to ${exporterEmail}:`, error);
    return false;
  }
}


/**
 * Send admin notification email when an exporter's verification is completed
 * Sent to ALL admin users upon successful verification approval
 */
export async function sendAdminVerificationCompletedEmail(
  adminEmail: string,
  adminName: string,
  businessName: string,
  businessId: string,
  exporterName: string,
  exporterEmail: string,
  verifiedBy: string,
  verifiedAt: Date
): Promise<boolean> {
  try {

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const reviewUrl = `${appUrl}/dashboard/admin/business-verification`;
    const formattedDate = verifiedAt.toLocaleString('en-KE', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Africa/Nairobi',
    });

    return sendMail({
      to: adminEmail,
      subject: `Business Verified: ${businessName} — KEPROBA`,
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Exporter Verification Completed</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #333; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 32px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; }
    .header p { margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 14px; }
    .body { padding: 36px 32px; }
    .greeting { font-size: 16px; margin-bottom: 20px; }
    .verified-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 24px; margin: 24px 0; }
    .verified-card h2 { margin: 0 0 16px; font-size: 17px; color: #15803d; }
    .badge { display: inline-block; background: #16a34a; color: #fff; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .detail-row { display: flex; gap: 8px; margin-bottom: 10px; font-size: 14px; }
    .detail-label { font-weight: 600; color: #374151; min-width: 130px; }
    .detail-value { color: #4b5563; }
    .cta { text-align: center; margin: 32px 0 8px; }
    .cta a { display: inline-block; background: #16a34a; color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 28px 0; }
    .footer { background: #f8fafc; padding: 24px 32px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
    .footer a { color: #16a34a; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>✅ Exporter Verification Completed</h1>
      <p>Kenya Export Promotion &amp; Branding Agency</p>
    </div>
    <div class="body">
      <p class="greeting">Hello <strong>${adminName}</strong>,</p>
      <p style="font-size:15px; color:#4b5563;">
        An exporter's verification process has been successfully completed on the KEPROBA Trade Directory. The details are below for your records.
      </p>

      <div class="verified-card">
        <span class="badge">✓ Verified</span>
        <h2>Verification Details</h2>
        <div class="detail-row">
          <span class="detail-label">Business Name:</span>
          <span class="detail-value"><strong>${businessName}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Business ID:</span>
          <span class="detail-value" style="font-family: monospace; font-size: 13px;">${businessId}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Exporter:</span>
          <span class="detail-value">${exporterName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Exporter Email:</span>
          <span class="detail-value"><a href="mailto:${exporterEmail}" style="color:#16a34a;">${exporterEmail}</a></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Verified By:</span>
          <span class="detail-value">${verifiedBy}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Verified On:</span>
          <span class="detail-value">${formattedDate}</span>
        </div>
      </div>

      <p style="font-size:14px; color:#4b5563;">
        The exporter's business profile is now live in the Trade Directory. You can review the full verified details, manage featuring, or take any further administrative actions using the button below.
      </p>

      <div class="cta">
        <a href="${reviewUrl}">Review Verified Business →</a>
      </div>
      <p style="text-align:center; font-size:12px; color:#9ca3af; margin-top:8px;">
        Or copy this link: <a href="${reviewUrl}" style="color:#16a34a;">${reviewUrl}</a>
      </p>

      <hr class="divider" />

      <p style="font-size:13px; color:#6b7280; text-align:center;">
        This notification was sent because you are an administrator on the KEPROBA Trade Directory platform.
      </p>
    </div>
    <div class="footer">
      <p style="margin:0 0 6px;"><strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong></p>
      <p style="margin:0 0 6px;">
        <a href="${appUrl}">Trade Directory</a> &nbsp;|&nbsp;
        <a href="${appUrl}/dashboard/admin">Admin Dashboard</a> &nbsp;|&nbsp;
        <a href="${appUrl}/contact">Contact Support</a>
      </p>
      <p style="margin:8px 0 0; font-size:11px; color:#d1d5db;">
        © ${new Date().getFullYear()} KEPROBA. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`,
    });

    console.log(`[Email] Admin verification notification sent to ${adminEmail} for business "${businessName}"`);
    return true;
  } catch (error) {
    console.error(`[Email] Failed to send admin verification notification to ${adminEmail}:`, error);
    return false;
  }
}

/**
 * Send company logo upload reminder email to exporters without a logo
 */
export async function sendLogoReminderEmail(
  email: string,
  firstName: string,
  businessName: string
): Promise<boolean> {
  try {

    return sendMail({
      to: email,
      subject: 'Action Required: Complete Your Business Profile — KEPROBA',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 26px; font-weight: 600; }
            .content { padding: 40px 30px; }
            .alert-box { background: #fff7ed; border-left: 4px solid #f97316; padding: 20px; margin: 25px 0; border-radius: 4px; }
            .benefit-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .cta-box { text-align: center; margin: 32px 0; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: #ffffff !important; text-decoration: none; font-size: 16px; font-weight: 700; padding: 14px 36px; border-radius: 8px; letter-spacing: 0.3px; }
            .footer { background: #f8f9fa; text-align: center; padding: 25px 30px; color: #666; font-size: 13px; border-top: 1px solid #e9ecef; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📷 Your Profile Needs a Logo</h1>
            </div>
            <div class="content">
              <p style="font-size: 16px;">Hello ${firstName},</p>
              <p>We noticed that your business <strong>${businessName}</strong> on the KEPROBA Trade Directory does not yet have a company logo.</p>
              <div class="alert-box">
                <strong>⚠️ Your profile is incomplete</strong>
                <p style="margin: 8px 0 0 0;">Businesses with a logo receive significantly more views and inquiries from international buyers. A professional logo builds trust and makes your listing stand out.</p>
              </div>
              <div class="benefit-box">
                <p style="margin: 0 0 10px 0; font-weight: 600; color: #15803d;">Why upload your logo?</p>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Increase visibility to international buyers</li>
                  <li>Build credibility and brand recognition</li>
                  <li>Improve your profile completion score</li>
                  <li>Stand out in search results</li>
                </ul>
              </div>
              <p>It only takes a minute — upload a JPG or JPEG image (recommended size: 400×400px).</p>
              <div class="cta-box">
                <a href="${dashboardUrl}/dashboard/exporter/business-profile" class="cta-button">Upload Logo Now</a>
                <p style="margin: 14px 0 0 0; font-size: 12px; color: #888;">Or copy this link: <a href="${dashboardUrl}/dashboard/exporter/business-profile" style="color: #16a34a;">${dashboardUrl}/dashboard/exporter/business-profile</a></p>
              </div>
            </div>
            <div class="footer">
              <p style="margin: 0 0 10px 0;"><strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong></p>
              <p style="margin: 0;">Need help? <a href="${dashboardUrl}/contact" style="color: #16a34a;">Contact Support</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`[Email] Logo reminder sent to ${email} (${businessName})`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send logo reminder email:', error);
    return false;
  }
}
