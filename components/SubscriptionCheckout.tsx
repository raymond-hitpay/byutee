'use client';

import { useState } from 'react';
import { Plan, formatPrice, type Currency } from '@/lib/subscriptions';
import { getPaymentMethods, type PaymentMethodOption } from '@/lib/payment-methods';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PaymentMethodCard from '@/components/PaymentMethodCard';

const METHOD_DESCRIPTIONS: Record<string, string> = {
  card: "After submission, you'll be guided through completing the next steps with Cards.",
  shopee_pay: "After submission, you'll be guided through completing the next steps with Shopee Pay.",
  grabpay_direct: "After submission, you'll be guided through completing the next steps with GrabPay.",
  touch_n_go: "After submission, you'll be guided through completing the next steps with Touch 'N Go.",
  zalopay: "A QR code will be displayed for the customer to scan with their ZaloPay app.",
  line_pay: "After submission, you'll be guided through completing the next steps with LINE Pay.",
};

interface SubscriptionCheckoutProps {
  plan: Plan;
  currency: Currency;
  planPrice: number;
  orgName: string;
}

export default function SubscriptionCheckout({
  plan,
  currency,
  planPrice,
  orgName,
}: SubscriptionCheckoutProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const paymentMethods = getPaymentMethods(currency);
  const selectedMethod = paymentMethods.find((m) => m.id === selectedPaymentMethod);
  const requiresPhone = selectedMethod?.requiresPhone ?? false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate payment method selection
    if (!selectedPaymentMethod) {
      setError('Please select a payment method');
      setLoading(false);
      return;
    }

    // Validate phone if required
    if (requiresPhone && !customerPhone.trim()) {
      setError('Phone number is required for this payment method');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          currency,
          paymentMethod: selectedPaymentMethod,
          customerPhone: customerPhone.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      // Handle direct link or hosted checkout response
      if (data.direct_link) {
        // For direct payment links (e.g., Shopee Pay, GrabPay)
        window.location.href = data.direct_link;
      } else if (data.url) {
        // For hosted checkout
        window.location.href = data.url;
      } else {
        setError('No checkout URL received. Please try again.');
        setLoading(false);
      }
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Plan Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b">
            <div>
              <p className="font-semibold text-gray-900">{plan.name} Plan</p>
              <p className="text-sm text-gray-600">Billing: Monthly</p>
            </div>
            <p className="font-semibold text-gray-900">{formatPrice(planPrice, currency)}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Plan Features:</p>
            <ul className="space-y-2">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-pink-500 font-bold flex-shrink-0">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-3 border-t flex justify-between items-center">
            <p className="font-semibold text-gray-900">Total (Monthly)</p>
            <p className="text-2xl font-bold text-pink-600">{formatPrice(planPrice, currency)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Checkout Form */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>
            Billing to: <span className="font-semibold text-gray-900">{orgName}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Payment Method Selection */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Payment Method
              </h3>
              <div className="flex flex-row gap-3 flex-wrap">
                {paymentMethods.map((method: PaymentMethodOption) => (
                  <PaymentMethodCard
                    key={method.id}
                    method={method}
                    selected={selectedPaymentMethod === method.id}
                    onSelect={(m) => setSelectedPaymentMethod(m.id)}
                  />
                ))}
              </div>
              {selectedMethod && (
                <div className="mt-3 flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
                  <svg className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span>{METHOD_DESCRIPTIONS[selectedMethod.id]}</span>
                </div>
              )}
            </div>

            {/* Conditional Phone Field */}
            {requiresPhone && (
              <div>
                <label htmlFor="customerPhone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  id="customerPhone"
                  type="tel"
                  required={requiresPhone}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Enter your phone number"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Required for {selectedMethod?.name} payment
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || !selectedPaymentMethod}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold py-3 px-4 rounded-lg transition-all"
            >
              {loading ? 'Processing...' : `Pay ${formatPrice(planPrice, currency)}`}
            </Button>

            <p className="text-xs text-gray-600 text-center">
              Your payment is secure and encrypted. We use HitPay for payment processing.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
