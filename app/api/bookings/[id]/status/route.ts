import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getPaymentRequestStatus } from '@/lib/hitpay-payments';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data: booking } = await supabase
    .from('bookings')
    .select('status, hitpay_payment_id, org_id')
    .eq('id', id)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // If still pending and we have a HitPay payment request ID, poll HitPay directly
  if (booking.status === 'pending_payment' && booking.hitpay_payment_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('hitpay_connection_type, hitpay_access_token, hitpay_api_key')
      .eq('id', booking.org_id)
      .maybeSingle();

    if (org) {
      const result = await getPaymentRequestStatus(
        {
          connectionType: org.hitpay_connection_type as 'oauth' | 'api_key',
          accessToken: org.hitpay_access_token ?? undefined,
          apiKey: org.hitpay_api_key ?? undefined,
        },
        booking.hitpay_payment_id
      );

      if (result?.status === 'completed') {
        await supabase
          .from('bookings')
          .update({
            status: 'confirmed',
            ...(result.paymentId ? { hitpay_payment_id: result.paymentId } : {}),
            ...(result.paymentMethod ? { hitpay_payment_method: result.paymentMethod } : {}),
          })
          .eq('id', id);

        return NextResponse.json({ status: 'confirmed' });
      }

      if (result?.status === 'failed') {
        await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('id', id);

        return NextResponse.json({ status: 'cancelled' });
      }
    }
  }

  return NextResponse.json({ status: booking.status });
}
