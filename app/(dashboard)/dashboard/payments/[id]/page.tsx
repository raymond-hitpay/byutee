import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { ChevronLeft } from 'lucide-react';
import { RefundButton } from './refund-button';

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Paid', className: 'bg-green-100 text-green-800' },
  pending_payment: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refunded', className: 'bg-purple-100 text-purple-800' },
};

function formatPaymentMethod(method: string | null): string {
  if (!method) return 'HitPay';
  return method
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
  const canRefund = isHitPay && booking.status === 'confirmed' && !!booking.hitpay_payment_id;

  let formattedDate = booking.booking_date;
  try {
    formattedDate = format(parseISO(booking.booking_date), 'EEEE, MMMM d, yyyy');
  } catch {
    // keep raw value
  }

  let formattedCreatedAt: string | null = null;
  if (booking.created_at) {
    try {
      formattedCreatedAt = format(parseISO(booking.created_at), 'MMM d, yyyy h:mm a');
    } catch {
      formattedCreatedAt = booking.created_at;
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <Link
        href="/dashboard/payments"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Payments
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Detail</h1>
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

        {/* Booking */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Booking</h2>
          <p className="font-medium text-gray-900">{booking.services?.name ?? '—'}</p>
          <p className="text-sm text-gray-500 mt-1">
            {formattedDate} at {booking.booking_time}
          </p>
          {booking.services && (
            <p className="text-sm text-gray-500 mt-0.5">
              {booking.services.duration_minutes} min
            </p>
          )}
        </div>

        {/* Payment */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Payment</h2>
          <div className="space-y-3 text-sm">
            {booking.services && (
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-semibold text-gray-900 text-base">
                  {booking.services.currency} {booking.services.price.toFixed(2)}
                </span>
              </div>
            )}
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
              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-500 shrink-0">HitPay Payment ID</span>
                <span className="font-mono text-xs text-gray-600 break-all text-right">
                  {booking.hitpay_payment_id}
                </span>
              </div>
            )}
            {formattedCreatedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-700">{formattedCreatedAt}</span>
              </div>
            )}
          </div>
        </div>

        {/* Refund */}
        {canRefund && booking.services && (
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Refund</h2>
            <p className="text-sm text-gray-500 mb-4">
              Issue a full refund to the customer via HitPay. The refund will appear in both
              your HitPay dashboard and the customer&apos;s account.
            </p>
            <RefundButton
              bookingId={booking.id}
              amount={booking.services.price}
              currency={booking.services.currency}
            />
          </div>
        )}

        {/* Already refunded notice */}
        {booking.status === 'refunded' && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800 font-medium">This payment has been refunded.</p>
          </div>
        )}
      </div>
    </div>
  );
}
