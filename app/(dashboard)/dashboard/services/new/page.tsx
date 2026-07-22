'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';

const CURRENCIES = ['SGD', 'USD', 'HKD', 'MYR'] as const;

export default function NewServicePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    durationMinutes: 60,
    price: 0,
    currency: 'SGD',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create service.');
      } else {
        router.push(`/dashboard/services/${data.id}`);
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-xl">
      <Link
        href="/dashboard/services"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Services
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>New Service</CardTitle>
          <CardDescription>Add a new service your customers can book.</CardDescription>
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
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Creating...' : 'Create Service'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/dashboard/services')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
