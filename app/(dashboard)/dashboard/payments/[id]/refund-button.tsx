'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RefundButtonProps {
  bookingId: string;
  amount: number;
  currency: string;
}

export function RefundButton({ bookingId, amount, currency }: RefundButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const router = useRouter();

  async function handleRefund() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/payments/${bookingId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Refund failed. Please try again.');
        setConfirmed(false);
        return;
      }

      router.refresh();
    } catch {
      setError('Network error. Please try again.');
      setConfirmed(false);
    } finally {
      setLoading(false);
    }
  }

  if (!confirmed) {
    return (
      <div className="space-y-2">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          onClick={() => setConfirmed(true)}
          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors"
        >
          Issue Refund
        </button>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
      <p className="text-sm text-red-800 font-medium">
        Refund {currency} {amount.toFixed(2)} to customer?
      </p>
      <p className="text-xs text-red-600">
        This will initiate a full refund via HitPay and cannot be undone.
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleRefund}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Processing…' : 'Confirm Refund'}
        </button>
        <button
          onClick={() => setConfirmed(false)}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
