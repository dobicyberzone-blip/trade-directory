/**
 * Cron Job: Logo Upload Reminder
 * Sends reminder emails to exporters who have not uploaded a company logo.
 *
 * Recommended schedule: every 3 days
 * Security: protected by CRON_SECRET env var checked via Authorization header.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendLogoReminderEmail } from '@/lib/email-templates';

export async function GET(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find all active exporter businesses without a logo
    const businesses = await prisma.business.findMany({
      where: {
        logoUrl: null,
        owner: { role: 'EXPORTER', suspended: false },
      },
      select: {
        id: true,
        name: true,
        owner: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    let sent = 0;
    let failed = 0;

    for (const biz of businesses) {
      const ok = await sendLogoReminderEmail(
        biz.owner.email,
        biz.owner.firstName,
        biz.name
      );
      if (ok) sent++; else failed++;
    }

    console.log(`[Cron/logo-reminder] Sent: ${sent}, Failed: ${failed}, Total: ${businesses.length}`);
    return NextResponse.json({ sent, failed, total: businesses.length });
  } catch (error: any) {
    console.error('[Cron/logo-reminder] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
