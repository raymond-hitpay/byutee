import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { DisconnectButton } from './disconnect-button';

interface PageProps {
  searchParams: Promise<{ connected?: string; error?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Access was denied. Please try again.',
  invalid_state: 'Security check failed. Please try again.',
  no_code: 'No authorization code received. Please try again.',
  token_exchange_failed: 'Failed to connect to HitPay. Please try again.',
};

export default async function PaymentsSettingsPage({ searchParams }: PageProps) {
  let session;
  try {
    session = await requireSession();
  } catch {
    redirect('/login');
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, session.orgId!),
  });

  if (!org) {
    redirect('/login');
  }

  const params = await searchParams;
  const isConnected = params.connected === 'true';
  const errorKey = params.error;
  const errorMessage = errorKey ? (ERROR_MESSAGES[errorKey] ?? 'An error occurred. Please try again.') : null;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Payment Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Connect your HitPay account to accept payments through your booking portal
        </p>
      </div>

      {isConnected && (
        <div className="mb-6 rounded-md bg-green-50 border border-green-200 p-4">
          <p className="text-sm font-medium text-green-800">Successfully connected to HitPay!</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm font-medium text-red-800">{errorMessage}</p>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">HitPay Account</h2>
            <p className="mt-1 text-sm text-gray-500">
              Connect your HitPay business account to enable payment collection.
            </p>
          </div>
          {org.hitpayAccessToken ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Connected ✓
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              Not connected
            </span>
          )}
        </div>

        <div className="mt-6">
          {org.hitpayAccessToken ? (
            <div className="space-y-4">
              {org.hitpayBusinessName && (
                <div>
                  <p className="text-sm text-gray-500">Connected business</p>
                  <p className="mt-0.5 text-sm font-medium text-gray-900">{org.hitpayBusinessName}</p>
                </div>
              )}
              <DisconnectButton />
            </div>
          ) : (
            <a
              href="/api/oauth/authorize"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Sign in with HitPay
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
