import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireSession } from '@/lib/auth';

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

  await supabase
    .from('organizations')
    .update({
      hitpay_api_key: apiKey.trim(),
      hitpay_connection_type: 'api_key',
      hitpay_access_token: null,
      hitpay_refresh_token: null,
      hitpay_business_id: null,
      hitpay_business_name: null,
    })
    .eq('id', session.orgId!);

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await supabase
    .from('organizations')
    .update({
      hitpay_api_key: null,
      hitpay_connection_type: null,
      hitpay_access_token: null,
      hitpay_refresh_token: null,
      hitpay_business_id: null,
      hitpay_business_name: null,
    })
    .eq('id', session.orgId!);

  return NextResponse.json({ ok: true });
}
