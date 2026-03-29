import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';
import { sendMail } from '@/lib/mailer';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: cors });
}

export async function POST(req: NextRequest) {
  const token = await verifyToken(req);
  if (!token || (token.role !== 'ADMIN' && token.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: cors });
  }

  const { to, toName, subject, message } = await req.json();
  if (!to || !subject || !message) {
    return NextResponse.json({ error: 'to, subject and message are required' }, { status: 400, headers: cors });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  await sendMail({
    to: toName ? { name: toName, email: to } : to,
    subject,
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><style>
  body{margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#333}
  .wrapper{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);padding:28px 32px;text-align:center}
  .header h1{margin:0;color:#fff;font-size:20px;font-weight:700}
  .body{padding:32px}
  .message{background:#f8fafc;border-left:4px solid #16a34a;padding:16px 20px;border-radius:4px;white-space:pre-wrap;font-size:15px;line-height:1.7;color:#374151}
  .footer{background:#f8fafc;padding:20px 32px;text-align:center;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb}
  .footer a{color:#16a34a;text-decoration:none}
</style></head>
<body>
  <div class="wrapper">
    <div class="header"><h1>Message from KEPROBA Administration</h1></div>
    <div class="body">
      <p style="font-size:16px;margin-bottom:20px">Hello <strong>${toName || to}</strong>,</p>
      <div class="message">${message.replace(/\n/g, '<br/>')}</div>
      <p style="margin-top:24px;font-size:13px;color:#6b7280">
        This message was sent directly by a KEPROBA administrator. If you have questions, please reply to this email or visit your dashboard.
      </p>
    </div>
    <div class="footer">
      <p style="margin:0 0 6px"><strong>Kenya Export Promotion and Branding Agency (KEPROBA)</strong></p>
      <p style="margin:0"><a href="${appUrl}">Trade Directory</a> &nbsp;|&nbsp; <a href="${appUrl}/contact">Contact Support</a></p>
    </div>
  </div>
</body>
</html>`,
    text: `Hello ${toName || to},\n\n${message}\n\n---\nKenya Export Promotion and Branding Agency (KEPROBA)\n${appUrl}`,
  });

  return NextResponse.json({ success: true }, { headers: cors });
}



