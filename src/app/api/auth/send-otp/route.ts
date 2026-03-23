import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

// Use centralized Prisma client for Vercel serverless
import prisma from '@/lib/prisma';

// SMTP transporter with connection pooling (reuse connections)
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return null;
    }
    
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      pool: true, // Enable connection pooling
      maxConnections: 5, // Max concurrent connections
      maxMessages: 100, // Max messages per connection
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

  }
  return transporter;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Generate 6-digit OTP
function generateOtpCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Send OTP via Email
async function sendEmailOtp(email: string, code: string, type: string, userName: string = ''): Promise<boolean> {
  try {
    const transporter = getTransporter();
    
    if (!transporter) {

      return true;
    }

    const typeText = type === 'LOGIN' ? 'login' : type === 'REGISTRATION' ? 'registration' : 'password reset';
    const greeting = userName ? `Hello ${userName},` : 'Hello,';

    const startTime = Date.now();
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'KEPROBA'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: `Your KEPROBA Verification Code - ${code}`,
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
            <div class="header">
              <h1>Verification Code</h1>
            </div>
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
              <p>&copy; ${new Date().getFullYear()} KEPROBA - Kenya Export Promotion & Branding Agency</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `${greeting}\n\nYour KEPROBA verification code is: ${code}\n\nThis code will expire in 10 minutes.\nNever share this code with anyone.\n\nIf you didn't request this code, please ignore this message.`,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    return true;
  } catch (error) {

    return false;
  }
}

// Send OTP via SMS
async function sendSmsOtp(phoneNumber: string, code: string): Promise<boolean> {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {

      return true;
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const message = `Your KEPROBA verification code is: ${code}. This code will expire in 10 minutes. Do not share this code with anyone.`;

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    return true;
  } catch (error) {

    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phoneNumber, method, type = 'LOGIN' } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Fetch user's name from database
    let userName = '';
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { firstName: true, lastName: true },
      });
      if (user) {
        userName = user.firstName || '';
      }
    } catch (error) {

    }

    // Validate method
    if (!['EMAIL', 'SMS', 'TOTP'].includes(method)) {
      return NextResponse.json(
        { error: 'Invalid OTP method. Must be EMAIL, SMS, or TOTP' },
        { status: 400, headers: corsHeaders }
      );
    }

    // For SMS, phone number is required
    if (method === 'SMS' && !phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required for SMS OTP' },
        { status: 400, headers: corsHeaders }
      );
    }

    // For TOTP, no OTP needs to be sent
    if (method === 'TOTP') {
      return NextResponse.json(
        {
          message: 'Please enter the code from your authenticator app',
          method: 'TOTP',
        },
        { headers: corsHeaders }
      );
    }

    // Generate OTP code
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Clean up old OTPs for this email/method
    await prisma.otpCode.deleteMany({
      where: {
        email,
        type,
        method,
      },
    });

    // Create new OTP
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

    // Send OTP based on method
    let sent = false;
    if (method === 'EMAIL') {
      sent = await sendEmailOtp(email, code, type, userName);
    } else if (method === 'SMS') {
      sent = await sendSmsOtp(phoneNumber, code);
    }

    if (!sent) {
      return NextResponse.json(
        { error: 'Failed to send OTP. Please try again.' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        message: `OTP sent successfully via ${method}`,
        method,
        expiresIn: 600, // 10 minutes in seconds
      },
      { headers: corsHeaders }
    );
  } catch (error) {

    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500, headers: corsHeaders }
    );
  }
}
