'use client';

import { useState } from 'react';
import { Clock, ChevronLeft, X, CalendarDays, CreditCard, Store } from 'lucide-react';
import type { Service } from '@/lib/db/schema';

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

interface Org {
  name: string;
  slug: string;
}

interface Props {
  org: Org;
  services: Service[];
  hasHitPay: boolean;
}

type Step = 'services' | 'datetime' | 'details' | 'payment' | 'processing';
type PaymentMethod = 'hitpay' | 'counter';

export default function PublicBookingFlow({ org, services, hasHitPay }: Props) {
  const [step, setStep] = useState<Step>('services');
  const [selected, setSelected] = useState<Service | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  function selectService(service: Service) {
    setSelected(service);
    setBookingDate('');
    setBookingTime('');
    setStep('datetime');
  }

  async function handleBook(paymentMethod: PaymentMethod) {
    if (!selected || !bookingDate || !bookingTime || !customerName || !customerEmail) return;
    setStep('processing');
    setError('');

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgSlug: org.slug,
          serviceId: selected.id,
          customerName,
          customerEmail,
          bookingDate,
          bookingTime,
          paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        setStep('payment');
        return;
      }

      window.location.href = data.checkoutUrl ?? data.redirectUrl;
    } catch {
      setError('Network error. Please try again.');
      setStep('payment');
    }
  }

  const initials = org.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const bookingSummary = selected ? (
    <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 mb-6 space-y-1">
      <p className="font-semibold text-indigo-900">{selected.name}</p>
      <p className="text-sm text-indigo-600">
        {new Date(bookingDate + 'T00:00:00').toLocaleDateString('en-GB', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })}{' '}
        at {bookingTime}
      </p>
      <p className="text-sm text-indigo-600">
        {selected.duration_minutes} min &middot; {selected.currency} {selected.price.toFixed(2)}
      </p>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Storefront header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-8 flex items-center gap-5">
          <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Book an appointment online</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* ── Step: Services ── */}
        {step === 'services' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Our Services</h2>
            <p className="text-sm text-gray-500 mb-6">Select a service to book your appointment</p>

            {services.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>No services available yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col hover:border-indigo-400 hover:shadow-md transition-all"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-3">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-400">
                        <Clock className="h-3.5 w-3.5" />
                        {service.duration_minutes} min
                      </span>
                      <span className="text-base font-bold text-gray-900">
                        {service.currency} {service.price.toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={() => selectService(service)}
                      className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
                    >
                      Book Now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step: Date & Time ── */}
        {step === 'datetime' && selected && (
          <div className="max-w-lg">
            <button
              onClick={() => setStep('services')}
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to services
            </button>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center justify-between mb-6">
              <div>
                <p className="font-semibold text-indigo-900">{selected.name}</p>
                <p className="text-sm text-indigo-600 mt-0.5">
                  {selected.duration_minutes} min &middot; {selected.currency} {selected.price.toFixed(2)}
                </p>
              </div>
              <button onClick={() => setStep('services')} className="text-indigo-400 hover:text-indigo-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select a Date
                </label>
                <input
                  type="date"
                  min={today}
                  value={bookingDate}
                  onChange={(e) => { setBookingDate(e.target.value); setBookingTime(''); }}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {bookingDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Available Times
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setBookingTime(slot)}
                        className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                          bookingTime === slot
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-400 hover:text-indigo-600'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                disabled={!bookingDate || !bookingTime}
                onClick={() => setStep('details')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-xl transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Customer Details ── */}
        {step === 'details' && selected && (
          <div className="max-w-lg">
            <button
              onClick={() => setStep('datetime')}
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            {bookingSummary}

            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Your Details</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                disabled={!customerName || !customerEmail}
                onClick={() => setStep('payment')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-xl transition-colors"
              >
                Choose Payment Method
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Payment Method ── */}
        {step === 'payment' && selected && (
          <div className="max-w-lg">
            <button
              onClick={() => setStep('details')}
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            {bookingSummary}

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-1">How would you like to pay?</h3>
              <p className="text-sm text-gray-500 mb-5">Select a payment method to confirm your booking.</p>

              <div className="space-y-3">
                {hasHitPay && (
                  <button
                    onClick={() => handleBook('hitpay')}
                    className="w-full flex items-center gap-4 border-2 border-indigo-600 rounded-xl px-5 py-4 hover:bg-indigo-50 transition-colors text-left group"
                  >
                    <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                      <CreditCard className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Pay with HitPay</p>
                      <p className="text-sm text-gray-500">Credit card, PayNow, and more</p>
                    </div>
                    <span className="ml-auto text-base font-bold text-indigo-600">
                      {selected.currency} {selected.price.toFixed(2)}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => handleBook('counter')}
                  className="w-full flex items-center gap-4 border-2 border-gray-200 rounded-xl px-5 py-4 hover:border-gray-400 hover:bg-gray-50 transition-colors text-left group"
                >
                  <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-gray-200 transition-colors">
                    <Store className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Pay at Counter</p>
                    <p className="text-sm text-gray-500">Pay when you arrive for your appointment</p>
                  </div>
                  <span className="ml-auto text-base font-bold text-gray-700">
                    {selected.currency} {selected.price.toFixed(2)}
                  </span>
                </button>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step: Processing ── */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <div className="h-10 w-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin mb-4" />
            <p className="text-sm">Processing your booking…</p>
          </div>
        )}
      </div>
    </div>
  );
}
