import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { ChevronLeft } from 'lucide-react';

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Paid', className: 'bg-green-100 text-green-800' },
  pending_payment: { label: 'Unpaid', className: 'bg-yellow-100 text-yellow-800' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
};

function formatPaymentMethod(method: string | null): string {
  if (!method) return 'HitPay';
  return method
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireSession();
  } catch {
    redirect('/login');
  }

  const { id } = await params;

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, services(*)')
    .eq('id', id)
    .eq('org_id', session.orgId!)
    .maybeSingle();

  if (!booking) notFound();

  const statusConfig = STATUS_STYLES[booking.status] ?? {
    label: booking.status,
    className: 'bg-gray-100 text-gray-600',
  };

  const isHitPay = !!booking.hitpay_checkout_url;
  const isCounter = !isHitPay;

  let formattedDate = booking.booking_date;
  try {
    formattedDate = format(parseISO(booking.booking_date), 'EEEE, MMMM d, yyyy');
  } catch {
    // keep raw value
  }

  return (
    <div className="p-6 max-w-2xl">
      <Link
        href="/dashboard/bookings"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Bookings
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Detail</h1>
          <p className="text-xs text-gray-400 font-mono mt-1">{booking.id}</p>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.className}`}
        >
          {statusConfig.label}
        </span>
      </div>

      <div className="space-y-4">
        {/* Customer */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Customer</h2>
          <p className="font-semibold text-gray-900">{booking.customer_name}</p>
          <p className="text-sm text-gray-500">{booking.customer_email}</p>
        </div>

        {/* Appointment */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Appointment</h2>
          <p className="font-medium text-gray-900">{booking.services?.name ?? '—'}</p>
          <p className="text-sm text-gray-500 mt-1">
            {formattedDate} at {booking.booking_time}
          </p>
          {booking.services && (
            <p className="text-sm text-gray-500 mt-0.5">
              {booking.services.duration_minutes} min &middot;{' '}
              <span className="font-medium text-gray-900">
                {booking.services.currency} {booking.services.price.toFixed(2)}
              </span>
            </p>
          )}
        </div>

        {/* Payment */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Payment</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Source</span>
              <span className="font-medium text-gray-900">{isHitPay ? 'HitPay' : 'Manual'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Method</span>
              <span className="font-medium text-gray-900">
                {isCounter
                  ? booking.status === 'confirmed'
                    ? 'Cash'
                    : 'Pay at Counter (Unpaid)'
                  : formatPaymentMethod(booking.hitpay_payment_method)}
              </span>
            </div>
            {booking.hitpay_payment_id && (
              <div className="flex justify-between">
                <span className="text-gray-500">Payment ID</span>
                <span className="font-mono text-xs text-gray-600">{booking.hitpay_payment_id}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
