import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { getPlanById, getPlanPrice, type Currency } from '@/lib/subscriptions';
import { getCurrencies } from '@/lib/subscriptions';
import SubscriptionCheckout from '@/components/SubscriptionCheckout';

interface CheckoutPageProps {
  params: Promise<{ planId: string }>;
  searchParams: Promise<{ currency?: string }>;
}

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const { planId } = await params;
  const { currency: currencyParam } = await searchParams;

  // Check authentication
  const session = await getSession();
  if (!session.orgId) {
    redirect(`/login?redirect=/subscribe/${planId}/checkout${currencyParam ? `?currency=${currencyParam}` : ''}`);
  }

  // Validate and get currency
  const validCurrencies = getCurrencies();
  let currency: Currency = 'SGD';

  if (currencyParam && validCurrencies.includes(currencyParam as Currency)) {
    currency = currencyParam as Currency;
  } else if (typeof currencyParam === 'string') {
    // Invalid currency parameter
    redirect(`/subscribe/${planId}/checkout?currency=SGD`);
  }

  // Validate plan exists
  const plan = getPlanById(planId);
  if (!plan) {
    return (
      <main className="min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Plan Not Found</h1>
            <p className="text-gray-600 mb-6">The subscription plan you're looking for doesn't exist.</p>
            <a
              href="/subscribe"
              className="inline-block px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
            >
              Back to Plans
            </a>
          </div>
        </div>
      </main>
    );
  }

  // Get organization data
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, email')
    .eq('id', session.orgId)
    .maybeSingle();

  if (orgError || !org) {
    return (
      <main className="min-h-screen py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Organization Not Found</h1>
            <p className="text-gray-600 mb-6">We couldn't load your organization details.</p>
            <a
              href="/subscribe"
              className="inline-block px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
            >
              Back to Plans
            </a>
          </div>
        </div>
      </main>
    );
  }

  // Check for existing active subscription — skip checkout if already subscribed
  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('id, plan_id, status')
    .eq('org_id', session.orgId)
    .eq('status', 'active')
    .maybeSingle();

  if (existingSubscription) {
    redirect('/dashboard');
  }

  // Calculate plan price
  const planPrice = getPlanPrice(planId, currency);

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/subscribe"
            className="text-sm text-pink-600 hover:text-pink-700 font-medium mb-4 inline-block"
          >
            ← Back to Plans
          </a>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Checkout</h1>
          <p className="text-gray-600">Complete your subscription to the {plan.name} plan</p>
        </div>

        {/* Checkout */}
        <SubscriptionCheckout
          plan={plan}
          currency={currency}
          planPrice={planPrice}
          orgName={org.name}
        />
      </div>
    </main>
  );
}
