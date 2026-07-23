'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { Badge } from '@/components/ui/badge';

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

  if (!mounted) {
    return null;
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

        {/* Active subscription banner */}
        {activePlanId && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <p className="text-green-800 font-medium">
              You are currently on the <span className="font-bold capitalize">{activePlanId}</span> plan.
            </p>
            <p className="text-green-700 text-sm mt-1">
              To change your plan, please contact our support team.
            </p>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const price = getPlanPrice(plan.id, currency);
            const formattedPrice = formatPrice(price, currency);
            const isCurrent = activePlanId === plan.id;

            return (
              <Card
                key={plan.id}
                className={`flex flex-col hover:shadow-lg transition-shadow duration-300 ${isCurrent ? 'ring-2 ring-pink-500' : ''}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{plan.name}</CardTitle>
                    {isCurrent && (
                      <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0">
                        Current Plan
                      </Badge>
                    )}
                  </div>
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
                  {isCurrent ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled
                    >
                      Current Plan
                    </Button>
                  ) : activePlanId ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled
                    >
                      Contact Support to Switch
                    </Button>
                  ) : (
                    <Link
                      href={`/subscribe/${plan.id}/checkout?currency=${currency}`}
                      className="w-full"
                    >
                      <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700">
                        Choose Plan
                      </Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
