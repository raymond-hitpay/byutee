'use client';

export function DisconnectButton() {
  async function handleDisconnect() {
    try {
      const res = await fetch('/api/oauth/disconnect', { method: 'POST' });
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
      Disconnect
    </button>
  );
}
