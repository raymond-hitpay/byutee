import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyHitPayWebhook } from '@/lib/hitpay-payments';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // Parse application/x-www-form-urlencoded
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

  if (!bookingId) {
    return NextResponse.json({ error: 'Missing reference_number' }, { status: 400 });
  }

  if (status === 'completed') {
    await db.update(bookings)
      .set({ status: 'confirmed', hitpayPaymentId: paymentId })
      .where(eq(bookings.id, bookingId));
  } else if (status === 'failed') {
    await db.update(bookings)
      .set({ status: 'cancelled' })
      .where(eq(bookings.id, bookingId));
  }

  return NextResponse.json({ received: true });
}
