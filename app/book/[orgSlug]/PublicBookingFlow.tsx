'use client';

import { useState } from 'react';
import { ChevronLeft, Clock } from 'lucide-react';
import type { Service } from '@/lib/db/schema';

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
];

interface Props {
  orgSlug: string;
  services: Service[];
}

export default function PublicBookingFlow({ orgSlug, services }: Props) {
  const [selected, setSelected] = useState<Service | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('09:00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgSlug,
          serviceId: selected.id,
          customerName,
          customerEmail,
          bookingDate,
          bookingTime,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Step 1: service picker
  if (!selected) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-600 mb-4">Select a service to get started</p>
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => setSelected(service)}
            className="w-full text-left bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hover:border-indigo-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                  {service.name}
                </h2>
                {service.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{service.description}</p>
                )}
                <span className="inline-flex items-center gap-1 text-sm text-gray-500 mt-2">
                  <Clock className="h-3.5 w-3.5" />
                  {service.durationMinutes} min
                </span>
              </div>
              <span className="flex-shrink-0 font-semibold text-gray-900">
                {service.currency} {service.price.toFixed(2)}
              </span>
            </div>
          </button>
        ))}
      </div>
    );
  }

  // Step 2: booking form
  return (
    <div className="space-y-4">
      {/* Selected service summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <button
          onClick={() => setSelected(null)}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3"
        >
          <ChevronLeft className="h-4 w-4" />
          Change service
        </button>
        <h2 className="font-semibold text-gray-900">{selected.name}</h2>
        {selected.description && (
          <p className="text-sm text-gray-500 mt-1">{selected.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {selected.durationMinutes} min
          </span>
          <span className="text-gray-300">|</span>
          <span className="font-semibold text-gray-900">
            {selected.currency} {selected.price.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Booking form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Your Details</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <input
              id="customerName"
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Jane Smith"
            />
          </div>

          <div>
            <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              id="customerEmail"
              type="email"
              required
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="jane@example.com"
            />
          </div>

          <div>
            <label htmlFor="bookingDate" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              id="bookingDate"
              type="date"
              required
              min={today}
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="bookingTime" className="block text-sm font-medium text-gray-700 mb-1">
              Time
            </label>
            <select
              id="bookingTime"
              required
              value={bookingTime}
              onChange={(e) => setBookingTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Processing...' : `Book Now — ${selected.currency} ${selected.price.toFixed(2)}`}
          </button>
        </form>
      </div>
    </div>
  );
}
