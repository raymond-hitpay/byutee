'use client';

import { useState } from 'react';

export function ApiKeyForm() {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/settings/hitpay/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });

      if (res.ok) {
        window.location.href = '/dashboard/settings/payments?connected=true';
      } else {
        const data = await res.json();
        setErrorMsg(data.error ?? 'Failed to save API key');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error — please try again');
      setStatus('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
        <p className="text-xs text-amber-800">
          <strong>Note:</strong> API keys grant full account access. Use OAuth for production integrations.
        </p>
      </div>
      <div>
        <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-1">
          Merchant API Key
        </label>
        <input
          id="api-key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Paste your HitPay API key"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      {status === 'error' && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}
      <button
        type="submit"
        disabled={status === 'loading' || !apiKey.trim()}
        className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {status === 'loading' ? 'Validating…' : 'Connect with API Key'}
      </button>
    </form>
  );
}
