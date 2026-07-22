'use client';

interface DisconnectButtonProps {
  connectionType: 'oauth' | 'api_key';
}

export function DisconnectButton({ connectionType }: DisconnectButtonProps) {
  async function handleDisconnect() {
    try {
      const endpoint =
        connectionType === 'api_key'
          ? '/api/settings/hitpay/api-key'
          : '/api/oauth/disconnect';
      const method = connectionType === 'api_key' ? 'DELETE' : 'POST';

      const res = await fetch(endpoint, { method });
      if (res.ok) {
        window.location.href = '/dashboard/settings/payments';
      } else {
        window.location.href = '/dashboard/settings/payments?error=disconnect_failed';
      }
    } catch {
      window.location.href = '/dashboard/settings/payments?error=disconnect_failed';
    }
  }

  return (
    <button
      onClick={handleDisconnect}
      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
    >
      Revoke Access
    </button>
  );
}
