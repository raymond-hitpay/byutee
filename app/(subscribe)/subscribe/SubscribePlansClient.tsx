'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  SUBSCRIPTION_PLANS,
  getPlanPrice,
  formatPrice,
  getCurrencies,
  type Currency,
} from '@/lib/subscriptions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const CURRENCY_FLAGS: Record<Currency, string> = {
  SGD: '🇸🇬',
  MYR: '🇲🇾',
  PHP: '🇵🇭',
  VND: '🇻🇳',
  THB: '🇹🇭',
};

interface SubscribePlansClientProps {
  activePlanId: string | null;
}

export default function SubscribePlansClient({ activePlanId }: SubscribePlansClientProps) {
  const router = useRouter();
  const [currency, setCurrency] = useState<Currency>('SGD');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedCurrency = sessionStorage.getItem('selectedCurrency');
    if (savedCurrency && getCurrencies().includes(savedCurrency as Currency)) {
      setCurrency(savedCurrency as Currency);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      sessionStorage.setItem('selectedCurrency', currency);
    }
  }, [currency, mounted]);

  const handleDashboardClick = () => {
    window.location.href = '/dashboard';
  };

  if (!mounted) {
    return null;
  }

  // If subscribed, show banner
  if (activePlanId) {
    return (
      <main className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="w-full max-w-md">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="text-4xl mb-4">✓</div>
              <CardTitle className="text-2xl">Subscription Active</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-900 font-semibold">
                You are currently on the <span className="capitalize text-pink-600">{activePlanId}</span> plan.
              </p>
              <p className="text-gray-600 text-sm">
                To change your plan, please contact our support team.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <button
                onClick={handleDashboardClick}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
              >
                Go to Dashboard
              </button>
              <a
                href="/dashboard"
                className="w-full text-center text-sm text-gray-600 hover:text-gray-900 py-2"
              >
                or click here
              </a>
            </CardFooter>
          </Card>
        </div>
      </main>
    );
  }

  const plans = Object.values(SUBSCRIPTION_PLANS);
  const currencies = getCurrencies();

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <span className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            Byutee
          </span>

          {/* Currency Dropdown */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Currency:</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 font-medium hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              {currencies.map((curr) => (
                <option key={curr} value={curr}>
                  {CURRENCY_FLAGS[curr]} {curr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600">
            Select the perfect plan for your beauty business
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const price = getPlanPrice(plan.id, currency);
            const formattedPrice = formatPrice(price, currency);

            return (
              <Card
                key={plan.id}
                className="flex flex-col hover:shadow-lg transition-shadow duration-300"
              >
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-grow">
                  <div className="mb-6">
                    <div className="text-3xl font-bold text-gray-900">
                      {formattedPrice}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">/month</p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700">
                      Features:
                    </p>
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-gray-700"
                        >
                          <span className="text-pink-500 font-bold flex-shrink-0">
                            ✓
                          </span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>

                <CardFooter>
                  <a
                    href={`/subscribe/${plan.id}/checkout?currency=${currency}`}
                    className="w-full"
                  >
                    <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700">
                      Choose Plan
                    </Button>
                  </a>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
