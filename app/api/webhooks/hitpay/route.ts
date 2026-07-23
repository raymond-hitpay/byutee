import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyHitPayWebhook } from '@/lib/hitpay-payments';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const payload: Record<string, string> = {};
  formData.forEach((value, key) => { payload[key] = value.toString(); });

  const hmac = payload['hmac'];
  if (!hmac) {
    return NextResponse.json({ error: 'Missing HMAC' }, { status: 400 });
  }

  if (!verifyHitPayWebhook(payload, hmac)) {
    console.warn('[Webhook] Invalid HMAC signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const bookingId = payload['reference_number'];
  const status = payload['status'];
  const paymentId = payload['payment_id'];
  const paymentMethod = payload['payment_method'] ?? null;

  if (!bookingId) {
    return NextResponse.json({ error: 'Missing reference_number' }, { status: 400 });
  }

  if (status === 'completed') {
    await supabase
      .from('bookings')
      .update({ status: 'confirmed', hitpay_payment_id: paymentId, hitpay_payment_method: paymentMethod })
      .eq('id', bookingId);
  } else if (status === 'failed') {
    await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);
  }

  return NextResponse.json({ received: true });
}
