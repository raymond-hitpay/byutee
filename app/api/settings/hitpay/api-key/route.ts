import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireSession } from '@/lib/auth';

// POST: validate and save an API key
export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { apiKey } = await req.json();
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return NextResponse.json({ error: 'API key is required' }, { status: 400 });
  }

  // Validate the key works by calling HitPay
  const testRes = await fetch(`${process.env.HITPAY_API_BASE}/payment-requests?per_page=1`, {
    headers: {
      'X-BUSINESS-API-KEY': apiKey.trim(),
      'X-PLATFORM-KEY': process.env.HITPAY_PLATFORM_KEY ?? '',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  if (!testRes.ok) {
    return NextResponse.json(
      { error: 'Invalid API key — HitPay rejected it' },
      { status: 400 }
    );
  }

  // Clear all OAuth fields, save API key
  await db
    .update(organizations)
    .set({
      hitpayApiKey: apiKey.trim(),
      hitpayConnectionType: 'api_key',
      hitpayAccessToken: null,
      hitpayRefreshToken: null,
      hitpayBusinessId: null,
      hitpayBusinessName: null,
    })
    .where(eq(organizations.id, session.orgId!));

  return NextResponse.json({ ok: true });
}

// DELETE: remove API key connection (same effect as disconnect)
export async function DELETE() {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await db
    .update(organizations)
    .set({
      hitpayApiKey: null,
      hitpayConnectionType: null,
      hitpayAccessToken: null,
      hitpayRefreshToken: null,
      hitpayBusinessId: null,
      hitpayBusinessName: null,
    })
    .where(eq(organizations.id, session.orgId!));

  return NextResponse.json({ ok: true });
}
