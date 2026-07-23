import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { createSubscriptionOrder } from '@/lib/hitpay-subscription';
import { getPlanById, getPlanPrice, type Currency } from '@/lib/subscriptions';

export async function POST(req: NextRequest) {
  try {
    // Get session
    const session = await getSession();
    if (!session.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { planId, currency, paymentMethod, customerPhone } = body;

    // Validate planId
    if (!planId || !getPlanById(planId)) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // Validate currency
    const validCurrencies = ['SGD', 'MYR', 'VND', 'PHP', 'THB'];
    if (!currency || !validCurrencies.includes(currency)) {
      return NextResponse.json({ error: 'Invalid currency' }, { status: 400 });
    }

    // Validate paymentMethod
    if (!paymentMethod || typeof paymentMethod !== 'string') {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    // Get organization details
    const { data: org } = await supabase
      .from('organizations')
      .select('name, email')
      .eq('id', session.orgId)
      .maybeSingle();

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check for duplicate subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('org_id', session.orgId)
      .eq('status', 'active')
      .maybeSingle();

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'Organization already has an active subscription' },
        { status: 409 }
      );
    }

    // Call createSubscriptionOrder
    let orderResponse;
    try {
      orderResponse = await createSubscriptionOrder({
        orgId: session.orgId,
        orgName: org.name,
        orgEmail: org.email,
        planId,
        currency: currency as Currency,
        paymentMethod,
        customerPhone,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create subscription order';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // Create subscription ID
    const subscriptionId = nanoid();

    // Calculate plan amount
    const planAmount = getPlanPrice(planId, currency as Currency);

    // Insert pending subscription in Supabase
    const { error: insertError } = await supabase.from('subscriptions').insert({
      id: subscriptionId,
      org_id: session.orgId,
      plan_id: planId,
      currency,
      status: 'pending',
      hitpay_payment_id: orderResponse.subscriptionId,
      amount: planAmount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error('Failed to insert subscription:', insertError);

      // Check if it's a duplicate constraint violation
      if (insertError.code === '23505' || insertError.message.includes('duplicate')) {
        return NextResponse.json(
          { error: 'Subscription already exists' },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    // Return response
    return NextResponse.json(
      {
        subscriptionId,
        url: orderResponse.url,
        direct_link: orderResponse.direct_link,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in POST /api/subscriptions/create:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
