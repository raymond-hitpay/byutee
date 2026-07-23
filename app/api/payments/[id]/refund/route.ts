import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { amount, reason } = body as { amount?: number; reason?: string };

  // Get booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, services(*)')
    .eq('id', id)
    .eq('org_id', session.orgId!)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  if (!booking.hitpay_payment_id) {
    return NextResponse.json({ error: 'No HitPay payment on this booking' }, { status: 400 });
  }

  if (booking.status !== 'confirmed') {
    return NextResponse.json({ error: 'Only confirmed payments can be refunded' }, { status: 400 });
  }

  // Get org credentials
  const { data: org } = await supabase
    .from('organizations')
    .select('hitpay_connection_type, hitpay_access_token, hitpay_api_key')
    .eq('id', session.orgId!)
    .maybeSingle();

  if (!org?.hitpay_connection_type) {
    return NextResponse.json({ error: 'HitPay not connected' }, { status: 400 });
  }

  const platformKey = process.env.HITPAY_PLATFORM_KEY;
  if (!platformKey) {
    return NextResponse.json({ error: 'Platform key not configured' }, { status: 500 });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-PLATFORM-KEY': platformKey,
    'X-Requested-With': 'XMLHttpRequest',
  };

  if (org.hitpay_connection_type === 'oauth' && org.hitpay_access_token) {
    headers['Authorization'] = `Bearer ${org.hitpay_access_token}`;
  } else if (org.hitpay_connection_type === 'api_key' && org.hitpay_api_key) {
    headers['X-BUSINESS-API-KEY'] = org.hitpay_api_key;
  } else {
    return NextResponse.json({ error: 'No valid HitPay credentials' }, { status: 400 });
  }

  const refundAmount = amount ?? booking.services?.price;
  const refundBody = new URLSearchParams({
    payment_id: booking.hitpay_payment_id,
    amount: String(refundAmount),
  });
  if (reason) {
    refundBody.append('reason', reason);
  }

  const apiBase = process.env.HITPAY_API_BASE;
  const res = await fetch(`${apiBase}/refunds`, {
    method: 'POST',
    headers,
    body: refundBody.toString(),
  });

  const responseText = await res.text();

  if (!res.ok) {
    let errorMessage = `HitPay refund failed (${res.status})`;
    try {
      const errorData = JSON.parse(responseText);
      errorMessage = errorData.message ?? errorData.error ?? errorMessage;
    } catch {
      errorMessage = responseText || errorMessage;
    }
    return NextResponse.json({ error: errorMessage }, { status: res.status });
  }

  const refundData = JSON.parse(responseText);

  // Update booking status to refunded
  await supabase
    .from('bookings')
    .update({ status: 'refunded' })
    .eq('id', id)
    .eq('org_id', session.orgId!);

  return NextResponse.json({ success: true, refund: refundData });
}
