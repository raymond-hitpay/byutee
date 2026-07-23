import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { supabase } from '@/lib/supabase';
import { createPaymentRequest } from '@/lib/hitpay-payments';

export async function POST(req: NextRequest) {
  const { orgSlug, serviceId, customerName, customerEmail, bookingDate, bookingTime, paymentMethod } =
    await req.json();

  if (!orgSlug || !serviceId || !customerName || !customerEmail || !bookingDate || !bookingTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', orgSlug)
    .maybeSingle();
  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

  const { data: service } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .eq('org_id', org.id)
    .maybeSingle();
  if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

  const connectionType = org.hitpay_connection_type as 'oauth' | 'api_key' | null;
  const hasHitPay =
    (connectionType === 'oauth' && !!org.hitpay_access_token) ||
    (connectionType === 'api_key' && !!org.hitpay_api_key);

  const useHitPay = (paymentMethod === 'hitpay' || paymentMethod === 'paynow' || paymentMethod === 'cards') && hasHitPay;

  const bookingId = nanoid();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const successUrl = `${appUrl}/book/${org.slug}/success?booking=${bookingId}`;

  await supabase.from('bookings').insert({
    id: bookingId,
    org_id: org.id,
    service_id: serviceId,
    customer_name: customerName,
    customer_email: customerEmail,
    booking_date: bookingDate,
    booking_time: bookingTime,
    status: 'pending_payment',
  });

  if (useHitPay) {
    try {
      // Determine payment methods and commission based on selected method
      let hitpayPaymentMethods: string[] | undefined;
      let platformCommissionAmount: string | undefined;

      if (paymentMethod === 'paynow') {
        hitpayPaymentMethods = ['paynow_online'];
        // Fetch platform commission for PayNow
        const { data: commissionSetting } = await supabase
          .from('platform_settings')
          .select('value')
          .eq('key', 'paynow_commission_amount')
          .maybeSingle();
        platformCommissionAmount = commissionSetting?.value ?? undefined;
      } else if (paymentMethod === 'cards') {
        hitpayPaymentMethods = ['card'];
      }

      const payment = await createPaymentRequest({
        connectionType: connectionType!,
        accessToken: org.hitpay_access_token ?? undefined,
        apiKey: org.hitpay_api_key ?? undefined,
        amount: service.price.toFixed(2),
        currency: service.currency,
        customerName,
        customerEmail,
        purpose: `${org.name} — ${service.name}`,
        referenceNumber: bookingId,
        webhookUrl: `${appUrl}/api/webhooks/hitpay`,
        redirectUrl: successUrl,
        paymentMethods: hitpayPaymentMethods,
        platformCommissionAmount,
      });

      await supabase
        .from('bookings')
        .update({ hitpay_payment_id: payment.id, hitpay_checkout_url: payment.url })
        .eq('id', bookingId);

      return NextResponse.json({ checkoutUrl: payment.url });
    } catch (err) {
      await supabase.from('bookings').delete().eq('id', bookingId);
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Booking] Payment request failed:', msg);
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }

  return NextResponse.json({ redirectUrl: successUrl });
}
