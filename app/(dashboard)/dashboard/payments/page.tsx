import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { format, parseISO } from 'date-fns';

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Paid', className: 'bg-green-100 text-green-800' },
  pending_payment: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
};

function formatPaymentMethod(method: string | null): string {
  if (!method) return 'HitPay';
  return method
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function PaymentsPage() {
  let session;
  try {
    session = await requireSession();
  } catch {
    redirect('/login');
  }

  const { data: rows } = await supabase
    .from('bookings')
    .select('*, services(*)')
    .eq('org_id', session.orgId!)
    .order('created_at', { ascending: false });

  const payments = rows ?? [];

  const totalPaid = payments
    .filter((r) => r.status === 'confirmed')
    .reduce((sum, r) => sum + (r.services?.price ?? 0), 0);

  const currency = payments.find((r) => r.services?.currency)?.services?.currency ?? 'SGD';

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-sm text-gray-500 mt-1">Payment records for all bookings</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Total Collected</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {currency} {totalPaid.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Paid</p>
          <p className="mt-1 text-2xl font-semibold text-green-700">
            {payments.filter((r) => r.status === 'confirmed').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Pending</p>
          <p className="mt-1 text-2xl font-semibold text-yellow-600">
            {payments.filter((r) => r.status === 'pending_payment').length}
          </p>
        </div>
      </div>

      {/* Table */}
      {payments.length === 0 ? (
        <p className="text-gray-500 text-sm">No payments yet.</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Service</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Booking Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Source</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((row) => {
                const statusConfig = STATUS_STYLES[row.status] ?? {
                  label: row.status,
                  className: 'bg-gray-100 text-gray-600',
                };

                const isHitPay = !!row.hitpay_checkout_url;
                const isCounter = !isHitPay;
                const isUnpaid = isCounter && row.status === 'pending_payment';

                return (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{row.customer_name}</p>
                      <p className="text-xs text-gray-500">{row.customer_email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{row.services?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {(() => {
                        try {
                          return format(parseISO(row.booking_date), 'MMM d, yyyy');
                        } catch {
                          return row.booking_date;
                        }
                      })()}{' '}
                      <span className="text-gray-400">at {row.booking_time}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {row.services
                        ? `${row.services.currency} ${row.services.price.toFixed(2)}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.className}`}
                      >
                        {statusConfig.label}
                      </span>
                    </td>
                    {/* Source */}
                    <td className="px-4 py-3">
                      {isHitPay ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                          HitPay
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Manual
                        </span>
                      )}
                    </td>
                    {/* Method */}
                    <td className="px-4 py-3">
                      {isUnpaid ? (
                        <Link
                          href={`/dashboard/bookings/${row.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-0.5 rounded-full hover:bg-yellow-100 transition-colors"
                        >
                          Unpaid — view booking
                        </Link>
                      ) : isCounter ? (
                        <span className="text-sm text-gray-700">Cash</span>
                      ) : (
                        <span className="text-sm text-gray-700">
                          {formatPaymentMethod(row.hitpay_payment_method)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
