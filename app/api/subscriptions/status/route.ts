import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getPlanById } from '@/lib/subscriptions';

export async function GET() {
  try {
    // Get session
    const session = await getSession();
    if (!session.orgId) {
      return NextResponse.json({ hasActiveSubscription: false }, { status: 200 });
    }

    // Query Supabase for active subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('org_id', session.orgId)
      .eq('status', 'active')
      .maybeSingle();

    // Check if subscription exists and is not expired
    if (!subscription) {
      return NextResponse.json({ hasActiveSubscription: false }, { status: 200 });
    }

    // Check if subscription has expired
    const today = new Date().toISOString().split('T')[0];
    if (subscription.next_renewal_date && subscription.next_renewal_date < today) {
      return NextResponse.json({ hasActiveSubscription: false }, { status: 200 });
    }

    // Get plan details
    const plan = getPlanById(subscription.plan_id);
    if (!plan) {
      return NextResponse.json({ hasActiveSubscription: false }, { status: 200 });
    }

    // Return active subscription data
    return NextResponse.json(
      {
        hasActiveSubscription: true,
        planId: subscription.plan_id,
        planName: plan.name,
        currency: subscription.currency,
        nextRenewalDate: subscription.next_renewal_date,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/subscriptions/status:', error);
    return NextResponse.json({ hasActiveSubscription: false }, { status: 200 });
  }
}
