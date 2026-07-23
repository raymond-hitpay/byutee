import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';
import { ChevronLeft } from 'lucide-react';
import { getChargeDetail } from '@/lib/hitpay-payments';

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Paid', className: 'bg-green-100 text-green-800' },
  pending_payment: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refunded', className: 'bg-purple-100 text-purple-800' },
};

function fmt(date: string, pattern = 'MMM d, yyyy h:mm a') {
  try { return format(parseISO(date), pattern); } catch { return date; }
}

export default async function AdminPaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, services(*)')
    .eq('id', id)
    .maybeSingle();

  if (!booking) notFound();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, hitpay_connection_type, hitpay_access_token, hitpay_api_key')
    .eq('id', booking.org_id)
    .maybeSingle();

  const statusConfig = STATUS_STYLES[booking.status] ?? {
    label: booking.status,
    className: 'bg-gray-100 text-gray-600',
  };

  const isHitPay = !!booking.hitpay_checkout_url;
  const isCounter = !isHitPay;

  let charge = null;
  if (booking.hitpay_payment_id && org?.hitpay_connection_type) {
    charge = await getChargeDetail(
      {
        connectionType: org.hitpay_connection_type as 'oauth' | 'api_key',
        accessToken: org.hitpay_access_token ?? undefined,
        apiKey: org.hitpay_api_key ?? undefined,
      },
      booking.hitpay_payment_id
    );
  }

  const pm = charge?.payment_method ?? null;

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/payments"
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
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.className}`}>
          {statusConfig.label}
        </span>
      </div>

      <div className="space-y-4">
        {/* Business */}
        {org && (
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Business</h2>
            <Link href={`/admin/${org.id}`} className="font-semibold text-gray-900 hover:text-blue-600 hover:underline">
              {org.name}
            </Link>
            <p className="text-sm text-gray-500 mt-0.5">/{org.slug}</p>
          </div>
        )}

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
            {fmt(booking.booking_date, 'EEEE, MMMM d, yyyy')} at {booking.booking_time}
          </p>
          {booking.services && (
            <p className="text-sm text-gray-500 mt-0.5">{booking.services.duration_minutes} min</p>
          )}
        </div>

        {/* Payment */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Payment</h2>

          {/* Payment method header with logo */}
          {pm && (
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <div className="h-10 w-10 rounded-lg border border-gray-200 bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                <Image
                  src={pm.display_logo?.md ?? pm.method_logo?.md}
                  alt={pm.display_logo?.displayName ?? pm.method_logo?.displayName}
                  width={32}
                  height={32}
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {pm.display_logo?.displayName ?? pm.method_logo?.displayName}
                </p>
                {pm.data?.last4 && (
                  <p className="text-xs text-gray-500">
                    {pm.data.brand} •••• {pm.data.last4}
                    {pm.data.country && ` · ${pm.data.country}`}
                  </p>
                )}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="h-8 w-8 rounded border border-gray-200 bg-white flex items-center justify-center overflow-hidden">
                  <Image
                    src={pm.method_logo?.md}
                    alt={pm.method_logo?.displayName}
                    width={24}
                    height={24}
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <span className="text-xs text-gray-400">{pm.method_logo?.displayName}</span>
              </div>
            </div>
          )}

          <div className="space-y-2.5 text-sm">
            {charge ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">Gross Amount</span>
                  <span className="font-semibold text-gray-900 text-base">
                    {charge.currency.toUpperCase()} {charge.amount.toFixed(2)}
                  </span>
                </div>
                {charge.fixed_fee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fixed Fee</span>
                    <span className="text-gray-700">− {charge.currency.toUpperCase()} {charge.fixed_fee.toFixed(2)}</span>
                  </div>
                )}
                {charge.discount_fee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Processing Fee
                      {charge.discount_fee_rate > 0 && (
                        <span className="ml-1 text-xs text-gray-400">({charge.discount_fee_rate}%)</span>
                      )}
                    </span>
                    <span className="text-gray-700">− {charge.currency.toUpperCase()} {charge.discount_fee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-100">
                  <span className="text-gray-500 font-medium">Net Payout</span>
                  <span className="font-bold text-green-700 text-base">
                    {charge.currency.toUpperCase()} {charge.amount_without_fees.toFixed(2)}
                  </span>
                </div>
                {charge.refunded_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Refunded</span>
                    <span className="text-purple-700">− {charge.currency.toUpperCase()} {charge.refunded_amount.toFixed(2)}</span>
                  </div>
                )}
                {charge.exchange_rate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Exchange Rate</span>
                    <span className="text-gray-700">{charge.exchange_rate}</span>
                  </div>
                )}
              </>
            ) : (
              booking.services && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-semibold text-gray-900 text-base">
                    {booking.services.currency} {booking.services.price.toFixed(2)}
                  </span>
                </div>
              )
            )}

            <div className="flex justify-between pt-2 border-t border-gray-100">
              <span className="text-gray-500">Source</span>
              <span className="font-medium text-gray-900">{isHitPay ? 'HitPay' : 'Manual'}</span>
            </div>
            {isCounter && (
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="font-medium text-gray-900">
                  {booking.status === 'confirmed' ? 'Cash' : 'Pay at Counter (Unpaid)'}
                </span>
              </div>
            )}
            {booking.hitpay_payment_id && (
              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-500 shrink-0">HitPay Charge ID</span>
                <span className="font-mono text-xs text-gray-600 break-all text-right">
                  {booking.hitpay_payment_id}
                </span>
              </div>
            )}
            {charge?.closed_at && (
              <div className="flex justify-between">
                <span className="text-gray-500">Paid At</span>
                <span className="text-gray-700">{fmt(charge.closed_at)}</span>
              </div>
            )}
            {booking.created_at && (
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-700">{fmt(booking.created_at)}</span>
              </div>
            )}
          </div>
        </div>

        {booking.status === 'refunded' && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-800 font-medium">This payment has been refunded.</p>
          </div>
        )}
      </div>
    </div>
  );
}
