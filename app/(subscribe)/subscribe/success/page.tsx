'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function SuccessPage() {
  const router = useRouter();
  const [planName, setPlanName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [nextRenewal, setNextRenewal] = useState<string>('');
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Retrieve subscription details from sessionStorage
    const savedPlanName = sessionStorage.getItem('subscriptionPlanName');
    const savedAmount = sessionStorage.getItem('subscriptionAmount');
    const savedCurrency = sessionStorage.getItem('selectedCurrency');

    if (savedPlanName) setPlanName(savedPlanName);
    if (savedAmount && savedCurrency) {
      setAmount(`${savedAmount} ${savedCurrency}`);
    }

    // Calculate next renewal date (30 days from now)
    const today = new Date();
    const nextDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    const formattedDate = nextDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    setNextRenewal(formattedDate);

    // Confirm subscription on page load
    const confirmSubscription = async () => {
      try {
        const res = await fetch('/api/subscriptions/confirm', { method: 'POST' });
        if (res.ok) {
          // Wait a bit for session to propagate, then redirect
          setTimeout(() => {
            setRedirecting(true);
            router.push('/dashboard');
          }, 500);
        }
      } catch (error) {
        console.error('Failed to confirm subscription:', error);
      }
    };

    confirmSubscription();
  }, [router]);

  if (redirecting) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-3xl">Subscription Confirmed!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-2">Your subscription is active</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {planName && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Plan</span>
                  <span className="font-semibold text-gray-900">{planName}</span>
                </div>
              )}
              {amount && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Monthly Amount</span>
                  <span className="font-semibold text-gray-900">{amount}</span>
                </div>
              )}
              {nextRenewal && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Next Renewal</span>
                  <span className="font-semibold text-gray-900">{nextRenewal}</span>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 text-center">
              You can manage your subscription and billing at any time from your dashboard.
            </p>

            <Link href="/dashboard" className="block w-full">
              <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700">
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
