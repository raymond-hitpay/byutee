import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';

export default async function AdminPaymentsPage() {
  // Fetch all confirmed bookings (= payments) with org info
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false });

  const allBookings = bookings ?? [];

  // Fetch all orgs in one query to avoid N+1
  const orgIds = [...new Set(allBookings.map((b) => b.org_id))];
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .in('id', orgIds.length > 0 ? orgIds : ['']);
  const orgMap = Object.fromEntries((orgs ?? []).map((o) => [o.id, o]));

  // Fetch all services in one query
  const serviceIds = [...new Set(allBookings.map((b) => b.service_id))];
  const { data: services } = await supabase
    .from('services')
    .select('id, name, price, currency')
    .in('id', serviceIds.length > 0 ? serviceIds : ['']);
  const serviceMap = Object.fromEntries((services ?? []).map((s) => [s.id, s]));

  const totalAmount = allBookings.reduce((sum, b) => {
    const svc = serviceMap[b.service_id];
    return sum + (svc?.price ?? 0);
  }, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-sm text-gray-500 mt-1">
          {allBookings.length} confirmed payment{allBookings.length !== 1 ? 's' : ''} across all businesses
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Total Payments</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{allBookings.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Estimated Revenue</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            SGD {totalAmount.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Mixed currencies shown as SGD</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Business</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Customer</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Service</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Amount</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Method</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Booking Date</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Paid At</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {allBookings.map((booking) => {
              const org = orgMap[booking.org_id];
              const svc = serviceMap[booking.service_id];
              return (
                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {org ? (
                      <Link
                        href={`/admin/${org.id}`}
                        className="hover:text-blue-600 hover:underline"
                      >
                        {org.name}
                      </Link>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-900">{booking.customer_name}</div>
                    <div className="text-gray-400 text-xs">{booking.customer_email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {svc?.name ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    {svc ? `${svc.currency} ${svc.price.toFixed(2)}` : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {booking.hitpay_payment_method ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {booking.hitpay_payment_method}
                      </span>
                    ) : booking.hitpay_checkout_url ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        HitPay
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Counter
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {booking.booking_date
                      ? format(parseISO(booking.booking_date), 'dd MMM yyyy')
                      : '—'}{' '}
                    <span className="text-gray-400">{booking.booking_time}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {booking.created_at
                      ? format(parseISO(booking.created_at), 'dd MMM yyyy, HH:mm')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/payments/${booking.id}`}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              );
            })}
            {allBookings.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  No confirmed payments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
