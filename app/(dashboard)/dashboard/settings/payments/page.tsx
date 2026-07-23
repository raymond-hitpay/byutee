import { requireSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { DisconnectButton } from './disconnect-button';
import { ApiKeyForm } from './api-key-form';

interface PageProps {
  searchParams: Promise<{ connected?: string; error?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Access was denied. Please try again.',
  invalid_state: 'Security check failed. Please try again.',
  no_code: 'No authorization code received. Please try again.',
  token_exchange_failed: 'Failed to connect to HitPay. Please try again.',
  disconnect_failed: 'Failed to revoke connection. Please try again.',
};

export default async function PaymentsSettingsPage({ searchParams }: PageProps) {
  let session;
  try {
    session = await requireSession();
  } catch {
    redirect('/login');
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', session.orgId!)
    .maybeSingle();

  if (!org) redirect('/login');

  const params = await searchParams;
  const connectionType = org.hitpay_connection_type as 'oauth' | 'api_key' | null;
  const isConnected = !!connectionType;
  const showConnectedBanner = params.connected === 'true' && isConnected;
  const errorMessage = params.error ? (ERROR_MESSAGES[params.error] ?? 'An error occurred. Please try again.') : null;

  const maskedApiKey = org.hitpay_api_key
    ? `••••••••${org.hitpay_api_key.slice(-4)}`
    : null;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Payment Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Connect your HitPay account to accept payments through your booking portal
        </p>
      </div>

      {showConnectedBanner && (
        <div className="mb-6 rounded-md bg-green-50 border border-green-200 p-4">
          <p className="text-sm font-medium text-green-800">Successfully connected to HitPay!</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm font-medium text-red-800">{errorMessage}</p>
        </div>
      )}

      {isConnected ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">HitPay Account</h2>
              <p className="mt-1 text-sm text-gray-500">Your account is connected and ready to accept payments.</p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Connected ✓
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500">Connection method</p>
              <p className="font-medium text-gray-900 mt-0.5">
                {connectionType === 'oauth' ? 'OAuth (HitPay Platform)' : 'Direct API Key'}
              </p>
            </div>

            {connectionType === 'oauth' && org.hitpay_business_name && (
              <div>
                <p className="text-gray-500">Connected business</p>
                <p className="font-medium text-gray-900 mt-0.5">{org.hitpay_business_name}</p>
              </div>
            )}

            {connectionType === 'api_key' && maskedApiKey && (
              <div>
                <p className="text-gray-500">API key</p>
                <p className="font-medium text-gray-900 font-mono mt-0.5">{maskedApiKey}</p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <DisconnectButton connectionType={connectionType!} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Choose how to connect your HitPay account:</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">API Key</h2>
              <p className="text-sm text-gray-500 mb-4">
                Enter your Merchant API key from HitPay → Developers → API Keys.
              </p>
              <ApiKeyForm />
            </div>

            <div className="bg-white rounded-lg border border-blue-200 p-6">
              <div className="flex items-start justify-between mb-1">
                <h2 className="text-base font-semibold text-gray-900">OAuth</h2>
                <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">Recommended</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Securely authorize byutee via HitPay&apos;s OAuth flow. Limited scopes, no stored secret.
              </p>
              <a
                href="/api/oauth/authorize"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Sign in with HitPay
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
