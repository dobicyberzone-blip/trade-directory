import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import twilio from 'twilio';
import prisma from '@/lib/prisma';
import { sendMail } from '@/lib/mailer';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

function generateOtpCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

async function sendEmailOtp(email: string, code: string, type: string, userName: string = ''): Promise<boolean> {
  const typeText = type === 'LOGIN' ? 'login' : type === 'REGISTRATION' ? 'registration' : 'password reset';
  const greeting = userName ? `Hello ${userName},` : 'Hello,';

  return sendMail({
    to: email,
    subject: `KEPROBA Verification Code`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-code { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px; color: #667eea; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>Verification Code</h1></div>
          <div class="content">
            <p>${greeting}</p>
            <p>You requested a verification code for ${typeText}. Use the code below to complete your action:</p>
            <div class="otp-code">${code}</div>
            <div class="warning">
              <strong>Security Notice:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>This code will expire in <strong>10 minutes</strong></li>
                <li>Never share this code with anyone</li>
                <li>KEPROBA staff will never ask for this code</li>
              </ul>
            </div>
            <p>If you didn't request this code, please ignore this email or contact support if you're concerned about your account security.</p>
            <p>Best regards,<br><strong>KEPROBA Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} KEPROBA - Kenya Export Promotion &amp; Branding Agency</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `${greeting}\n\nYour KEPROBA verification code is: ${code}\n\nThis code will expire in 10 minutes.\nNever share this code with anyone.\n\nIf you didn't request this code, please ignore this message.`,
  });
}

async function sendSmsOtp(phoneNumber: string, code: string): Promise<boolean> {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      return true;
    }
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: `Your KEPROBA verification code is: ${code}. This code will expire in 10 minutes. Do not share this code with anyone.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
    return true;
  } catch (error) {
    console.error('[OTP] SMS send failed:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email: rawEmail, phoneNumber, method, type = 'LOGIN' } = body;
    const email = rawEmail?.toLowerCase().trim();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400, headers: corsHeaders });
    }

    let userName = '';
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { firstName: true },
      });
      if (user) userName = user.firstName || '';
    } catch { /* non-fatal */ }

    if (!['EMAIL', 'SMS', 'TOTP'].includes(method)) {
      return NextResponse.json(
        { error: 'Invalid OTP method. Must be EMAIL, SMS, or TOTP' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (method === 'SMS' && !phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required for SMS OTP' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (method === 'TOTP') {
      return NextResponse.json(
        { message: 'Please enter the code from your authenticator app', method: 'TOTP' },
        { headers: corsHeaders }
      );
    }

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpCode.deleteMany({ where: { email, type, method } });
    await prisma.otpCode.create({
      data: {
        email,
        phoneNumber: method === 'SMS' ? phoneNumber : null,
        code,
        type,
        method,
        expiresAt,
      },
    });

    let sent = false;
    if (method === 'EMAIL') {
      sent = await sendEmailOtp(email, code, type, userName);
      if (!sent) {
        console.warn(`[OTP FALLBACK] Email delivery failed. Code for ${email}: ${code}`);
      }
    } else if (method === 'SMS') {
      sent = await sendSmsOtp(phoneNumber, code);
    }

    // Return success even if email failed — OTP is saved in DB
    // User can use resend. Don't block login flow on email delivery issues.
    return NextResponse.json(
      { 
        message: `OTP sent successfully via ${method}`, 
        method, 
        expiresIn: 600,
        ...(method === 'EMAIL' && !sent && { warning: 'Email delivery may be delayed' }),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('[OTP] Error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500, headers: corsHeaders });
  }
}
