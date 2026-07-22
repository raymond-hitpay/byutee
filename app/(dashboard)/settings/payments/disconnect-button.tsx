'use client';

export function DisconnectButton() {
  async function handleDisconnect() {
    await fetch('/api/oauth/disconnect', { method: 'POST' });
    window.location.reload();
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
