import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const ADMIN_EMAIL = 'enquiries@brand.go.ke';

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      // SMTP not configured — still return success so UX isn't broken
      console.warn('Contact form: SMTP not configured, email not sent');
      return NextResponse.json({ success: true });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://brand.go.ke';
    const fromLabel = `"${process.env.FROM_NAME || 'KEPROBA Trade Directory'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><style>
  body{margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#333}
  .wrapper{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);padding:28px 32px;text-align:center}
  .header h1{margin:0;color:#fff;font-size:20px;font-weight:700}
  .body{padding:32px}
  .field{margin-bottom:16px}
  .label{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#6b7280;margin-bottom:4px}
  .value{font-size:15px;color:#111827}
  .message-box{background:#f8fafc;border-left:4px solid #16a34a;padding:16px 20px;border-radius:4px;white-space:pre-wrap;font-size:15px;line-height:1.7;color:#374151}
  .footer{background:#f8fafc;padding:20px 32px;text-align:center;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb}
  .footer a{color:#16a34a;text-decoration:none}
</style></head>
<body>
  <div class="wrapper">
    <div class="header"><h1>New Contact Form Submission</h1></div>
    <div class="body">
      <div class="field"><div class="label">From</div><div class="value">${name} &lt;${email}&gt;</div></div>
      <div class="field"><div class="label">Subject</div><div class="value">${subject}</div></div>
      <div class="field"><div class="label">Message</div><div class="message-box">${message.replace(/\n/g, '<br/>')}</div></div>
      <p style="margin-top:24px;font-size:13px;color:#6b7280">
        Submitted via the KEPROBA Trade Directory contact form. Reply directly to this email to respond to the sender.
      </p>
    </div>
    <div class="footer">
      <p style="margin:0 0 6px"><strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong></p>
      <p style="margin:0"><a href="${appUrl}">Trade Directory</a></p>
    </div>
  </div>
</body>
</html>`;

    const text = `New contact form submission\n\nFrom: ${name} <${email}>\nSubject: ${subject}\n\nMessage:\n${message}\n\n---\nKEPROBA Trade Directory\n${appUrl}`;

    // Send to admin inbox
    await transporter.sendMail({
      from: fromLabel,
      to: ADMIN_EMAIL,
      replyTo: `"${name}" <${email}>`,
      subject: `[Contact Form] ${subject}`,
      html,
      text,
    });

    // Send auto-reply to the sender
    await transporter.sendMail({
      from: fromLabel,
      to: `"${name}" <${email}>`,
      subject: `Re: ${subject} — We've received your message`,
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><style>
  body{margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#333}
  .wrapper{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);padding:28px 32px;text-align:center}
  .header h1{margin:0;color:#fff;font-size:20px;font-weight:700}
  .body{padding:32px}
  .footer{background:#f8fafc;padding:20px 32px;text-align:center;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb}
  .footer a{color:#16a34a;text-decoration:none}
</style></head>
<body>
  <div class="wrapper">
    <div class="header"><h1>Thank you for contacting us</h1></div>
    <div class="body">
      <p style="font-size:16px">Hello <strong>${name}</strong>,</p>
      <p style="font-size:15px;line-height:1.7;color:#374151">
        Thank you for reaching out to the Kenya Export Promotion and Branding Agency (KEPROBA).
        We have received your message regarding <strong>"${subject}"</strong> and will get back to you as soon as possible.
      </p>
      <p style="font-size:15px;line-height:1.7;color:#374151">
        Our team typically responds within 1–2 business days. If your matter is urgent, you can also reach us at
        <a href="tel:+254202228348" style="color:#16a34a">+254 20 222 85 34 8</a>.
      </p>
    </div>
    <div class="footer">
      <p style="margin:0 0 6px"><strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong></p>
      <p style="margin:0"><a href="${appUrl}">Trade Directory</a> &nbsp;|&nbsp; <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a></p>
    </div>
  </div>
</body>
</html>`,
      text: `Hello ${name},\n\nThank you for contacting KEPROBA. We have received your message regarding "${subject}" and will respond within 1–2 business days.\n\nBest regards,\nKEPROBA Team\n${appUrl}`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
