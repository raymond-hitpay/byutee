import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';

interface WebhookPayload {
  status: string;
  id: string;
  billing_id?: string;
  amount?: number;
}

export async function POST(req: NextRequest) {
  try {
    // Validate webhook salt environment variable
    if (!process.env.HITPAY_WEBHOOK_SALT) {
      console.error('Missing webhook configuration: HITPAY_WEBHOOK_SALT not set');
      return NextResponse.json(
        { error: 'Missing webhook configuration' },
        { status: 500 }
      );
    }

    // Read request body as text
    const payload = await req.text();

    // Extract HMAC from query parameters or headers
    const hmac = req.nextUrl.searchParams.get('hmac') || req.headers.get('x-hitpay-hmac') || '';

    // Validate HMAC signature
    const hash = crypto
      .createHmac('sha256', process.env.HITPAY_WEBHOOK_SALT)
      .update(payload)
      .digest('hex');

    if (hash !== hmac) {
      console.warn('Invalid HMAC signature for webhook');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse JSON
    let data: WebhookPayload;
    try {
      const parsed = JSON.parse(payload);
      data = parsed.data || parsed;
    } catch {
      console.error('Failed to parse webhook payload');
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Return early if not completed
    if (data.status !== 'completed') {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Find subscription by HitPay payment ID
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('hitpay_payment_id', data.id)
      .maybeSingle();

    if (!subscription) {
      console.warn(`Subscription not found for HitPay payment ID: ${data.id}`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Calculate next renewal date (30 days from today)
    const today = new Date();
    const nextRenewalDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // Update subscription
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        hitpay_billing_id: data.billing_id || null,
        amount: data.amount ? data.amount / 100 : 0,
        next_renewal_date: nextRenewalDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (updateError) {
      console.error('Failed to update subscription:', updateError);
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error in POST /api/webhooks/hitpay/subscriptions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
