export type PlanId = 'starter' | 'professional' | 'enterprise';
export type Currency = 'SGD' | 'MYR' | 'VND' | 'PHP' | 'THB';

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  features: string[];
  basePrice: number; // in SGD
}

export const SUBSCRIPTION_PLANS: Record<PlanId, Plan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for solo practitioners',
    features: [
      'Up to 50 bookings/month',
      'Basic payment processing',
      'Email support',
    ],
    basePrice: 12,
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'For growing beauty businesses',
    features: [
      'Up to 500 bookings/month',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
    ],
    basePrice: 39,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For multi-location studios',
    features: [
      'Unlimited bookings',
      'Team management',
      'White-label solution',
      '24/7 support',
    ],
    basePrice: 133,
  },
};

// Currency conversion rates (1 SGD = X units)
const CURRENCY_RATES: Record<Currency, number> = {
  SGD: 1,
  MYR: 3.06,
  VND: 18200,
  PHP: 42,
  THB: 27,
};

export function getPlanById(planId: string): Plan | null {
  const plan = SUBSCRIPTION_PLANS[planId as PlanId];
  return plan || null;
}

export function getPlanPrice(planId: string, currency: Currency): number {
  const plan = getPlanById(planId);
  if (!plan) return 0;

  const rate = CURRENCY_RATES[currency];
  return Math.round(plan.basePrice * rate * 100) / 100;
}

export function getCurrencies(): Currency[] {
  return Object.keys(CURRENCY_RATES) as Currency[];
}

export function formatPrice(price: number, currency: Currency): string {
  return `${currency} ${price.toFixed(2)}`;
}
