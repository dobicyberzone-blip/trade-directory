import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

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
      maxConnections: 5,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

  }
  return transporter;
}

async function sendPasswordResetEmail(email: string, resetToken: string, userName?: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  if (!appUrl) {
    console.error('[Email] NEXT_PUBLIC_APP_URL environment variable is not set');
    return false;
  }
  
  const resetLink = `${appUrl}/reset-password?token=${resetToken}`;
  const greeting = userName ? `Hello ${userName},` : 'Hello,';

  try {
    const transporter = getTransporter();

    if (!transporter) {
      // Log the reset link for development

      return true;
    }

    const startTime = Date.now();
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'KEPROBA'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset Request - KEPROBA E-Trade Directory',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .reset-button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>${greeting}</p>
              <p>We received a request to reset your password for the KEPROBA E-Trade Directory.</p>
              
              <p style="text-align: center;">
                <strong>Click the button below to reset your password:</strong>
              </p>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="reset-button">Reset Password</a>
              </div>
              
              <div class="warning">
                <strong>Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li>This reset link will expire in <strong>1 hour</strong> for security purposes</li>
                  <li>Never share this link with anyone</li>
                  <li>KEPROBA staff will never ask for this link</li>
                </ul>
              </div>
              
              <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.</p>
              
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
      text: `${greeting}\n\nWe received a request to reset your password for the KEPROBA E-Trade Directory.\n\nClick the following link to reset your password: ${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nKEPROBA Team`
    });

    const duration = Date.now() - startTime;

    return true;
  } catch (error) {

    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success message for security (don't reveal if email exists)
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email, you will receive password reset instructions.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Save reset token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Send password reset email with user's full name
    const userName = `${user.firstName} ${user.lastName}`.trim() || user.email.split('@')[0];

    const emailSent = await sendPasswordResetEmail(email, resetToken, userName);

    if (!emailSent) {

    }

    // Always return success message for security (don't reveal if email was sent)
    return NextResponse.json({
      message: 'If an account exists with this email, you will receive password reset instructions.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
