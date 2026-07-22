'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Service } from '@/lib/db/schema';

const CURRENCIES = ['SGD', 'USD', 'HKD', 'MYR'] as const;

export function ServiceEditForm({ service }: { service: Service }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({
    name: service.name,
    description: service.description ?? '',
    durationMinutes: service.durationMinutes,
    price: service.price,
    currency: service.currency,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Failed to update service.' });
      } else {
        setMessage({ type: 'success', text: 'Service updated.' });
        router.refresh();
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this service? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await fetch(`/api/services/${service.id}`, { method: 'DELETE' });
      router.push('/dashboard/services');
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete service.' });
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div className="space-y-1">
        <Label htmlFor="name">Service Name</Label>
        <Input
          id="name"
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="description">Description (optional)</Label>
        <textarea
          id="description"
          className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="durationMinutes">Duration (minutes)</Label>
        <Input
          id="durationMinutes"
          type="number"
          min={15}
          required
          value={form.durationMinutes}
          onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            min={0}
            step={0.01}
            required
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="currency">Currency</Label>
          <select
            id="currency"
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}

      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
          disabled={deleting}
          onClick={handleDelete}
        >
          {deleting ? 'Deleting...' : 'Delete Service'}
        </Button>
      </div>
    </form>
  );
}
