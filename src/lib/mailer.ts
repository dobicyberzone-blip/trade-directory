/**
 * Centralized email sender — SendGrid
 * All email operations across the app route through this module.
 */

import sgMail from '@sendgrid/mail';

const FROM_EMAIL = 'omar.ngenge@eiti.tech';
const FROM_NAME = process.env.FROM_NAME || 'KEPROBA Trade Directory';
const API_KEY = process.env.SENDGRID_API_KEY;

if (!API_KEY) {
  throw new Error('[Mailer] SENDGRID_API_KEY environment variable is not set');
}

sgMail.setApiKey(API_KEY);

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
 * Send a single email via SendGrid.
 * Returns true on success, false on failure (never throws).
 */
export async function sendMail(opts: MailOptions): Promise<boolean> {
  try {
    const toField = typeof opts.to === 'string'
      ? opts.to
      : { name: opts.to.name, email: opts.to.email };

    const msg: sgMail.MailDataRequired = {
      to: toField,
      from: { name: FROM_NAME, email: FROM_EMAIL },
      subject: opts.subject,
      html: opts.html,
      ...(opts.text ? { text: opts.text } : {}),
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
      ...(opts.cc ? { cc: opts.cc } : {}),
      ...(opts.bcc ? { bcc: opts.bcc } : {}),
    };

    await sgMail.send(msg);
    const recipient = typeof opts.to === 'string' ? opts.to : opts.to.email;
    console.log(`[Mailer] Sent "${opts.subject}" → ${recipient}`);
    return true;
  } catch (error: unknown) {
    const recipient = typeof opts.to === 'string' ? opts.to : (opts.to as { email: string }).email;
    console.error(`[Mailer] Failed to send "${opts.subject}" → ${recipient}:`, error);
    return false;
  }
}
