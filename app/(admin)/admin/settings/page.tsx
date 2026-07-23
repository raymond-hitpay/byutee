'use client';

import { useEffect, useState } from 'react';

export default function AdminSettingsPage() {
  const [commissionAmount, setCommissionAmount] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => {
        setCommissionAmount(data.paynow_commission_amount ?? '0');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');

    const amount = parseFloat(commissionAmount);
    if (isNaN(amount) || amount < 0) {
      setError('Please enter a valid amount (0 or greater).');
      setSaving(false);
      return;
    }

    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'paynow_commission_amount', value: amount.toFixed(2) }),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
    } else {
      const data = await res.json();
      setError(data.error ?? 'Failed to save settings.');
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Platform-level configuration</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-xl">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Commission Rates</h2>
        <p className="text-sm text-gray-500 mb-6">
          Set the platform commission amount charged per transaction for each payment method.
          This amount is passed to HitPay as <code className="bg-gray-100 px-1 rounded text-xs">platform_commission_amount</code>.
        </p>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PayNow by HitPay — Commission per transaction (SGD)
            </label>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 font-medium">SGD</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={loading ? '' : commissionAmount}
                onChange={(e) => { setCommissionAmount(e.target.value); setSaved(false); }}
                placeholder={loading ? 'Loading…' : '0.00'}
                disabled={loading || saving}
                className="w-36 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Enter 0 to charge no platform commission on PayNow payments.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {saved && (
            <p className="text-sm text-green-600">Settings saved successfully.</p>
          )}

          <button
            type="submit"
            disabled={loading || saving}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}
