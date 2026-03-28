/**
 * Centralized email sender — Nodemailer (SMTP/Gmail)
 * Restored from commit 98045a71 — uses SMTP_HOST/USER/PASS env vars.
 */

import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('[Mailer] SMTP not configured — missing SMTP_HOST, SMTP_USER or SMTP_PASS');
      return null;
    }

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log('[Mailer] SMTP transporter initialized');
  }
  return transporter;
}

export interface MailOptions {
  to: string | { name: string; email: string };
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * Send a single email via SMTP.
 * Returns true on success, false on failure (never throws).
 */
export async function sendMail(opts: MailOptions): Promise<boolean> {
  try {
    const t = getTransporter();
    if (!t) return false;

    const toAddress = typeof opts.to === 'string' ? opts.to : `${opts.to.name} <${opts.to.email}>`;
    const from = `"${process.env.FROM_NAME || 'KEPROBA Trade Directory'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`;

    await t.sendMail({
      from,
      to: toAddress,
      subject: opts.subject,
      html: opts.html,
      ...(opts.text ? { text: opts.text } : {}),
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
      ...(opts.cc ? { cc: opts.cc } : {}),
      ...(opts.bcc ? { bcc: opts.bcc } : {}),
    });

    const recipient = typeof opts.to === 'string' ? opts.to : opts.to.email;
    console.log(`[Mailer] Sent "${opts.subject}" → ${recipient}`);
    return true;
  } catch (error: unknown) {
    const recipient = typeof opts.to === 'string' ? opts.to : (opts.to as { email: string }).email;
    console.error(`[Mailer] Failed to send "${opts.subject}" → ${recipient}:`, error);
    return false;
  }
}
