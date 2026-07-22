'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Service } from '@/lib/db/schema';

const CURRENCIES = ['SGD', 'USD', 'HKD', 'MYR'] as const;

interface FormState {
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  currency: string;
}

const defaultForm: FormState = {
  name: '',
  description: '',
  durationMinutes: 60,
  price: 0,
  currency: 'SGD',
};

export default function ServicesPage() {
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);

  useEffect(() => {
    async function loadService() {
      try {
        const res = await fetch('/api/services');
        const data = await res.json();
        if (data.service) {
          setService(data.service);
          setForm({
            name: data.service.name,
            description: data.service.description ?? '',
            durationMinutes: data.service.durationMinutes,
            price: data.service.price,
            currency: data.service.currency,
          });
        }
      } catch {
        setMessage({ type: 'error', text: 'Failed to load service.' });
      } finally {
        setLoading(false);
      }
    }
    loadService();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const method = service ? 'PATCH' : 'POST';

    try {
      const res = await fetch('/api/services', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Failed to save service.' });
      } else {
        setMessage({ type: 'success', text: service ? 'Service updated successfully.' : 'Service created successfully.' });
        if (!service) {
          // Reload to get the created service
          const reload = await fetch('/api/services');
          const reloadData = await reload.json();
          if (reloadData.service) setService(reloadData.service);
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  return (
    <div className="max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>{service ? 'Edit Service' : 'Create Your Service'}</CardTitle>
          <CardDescription>
            {service
              ? 'Update the details of your service.'
              : 'Set up the single service your customers can book.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Haircut"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Description (optional)</Label>
              <textarea
                id="description"
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe your service..."
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
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {message && (
              <p
                className={`text-sm ${
                  message.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {message.text}
              </p>
            )}

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Saving...' : service ? 'Update Service' : 'Create Service'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
