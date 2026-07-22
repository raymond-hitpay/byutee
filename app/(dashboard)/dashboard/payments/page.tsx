import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { bookings, services } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { format, parseISO } from 'date-fns';

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Paid', className: 'bg-green-100 text-green-800' },
  pending_payment: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
};

export default async function PaymentsPage() {
  let session;
  try {
    session = await requireSession();
  } catch {
    redirect('/login');
  }

  const rows = await db
    .select({ booking: bookings, service: services })
    .from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(bookings.orgId, session.orgId!))
    .orderBy(desc(bookings.createdAt));

  const totalPaid = rows
    .filter((r) => r.booking.status === 'confirmed')
    .reduce((sum, r) => sum + (r.service?.price ?? 0), 0);

  const currency = rows.find((r) => r.service?.currency)?.service?.currency ?? 'SGD';

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
            {rows.filter((r) => r.booking.status === 'confirmed').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Pending</p>
          <p className="mt-1 text-2xl font-semibold text-yellow-600">
            {rows.filter((r) => r.booking.status === 'pending_payment').length}
          </p>
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
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
                <th className="px-4 py-3 text-left font-medium text-gray-500">Payment ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map(({ booking, service }) => {
                const statusConfig = STATUS_STYLES[booking.status] ?? {
                  label: booking.status,
                  className: 'bg-gray-100 text-gray-600',
                };
                return (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{booking.customerName}</p>
                      <p className="text-xs text-gray-500">{booking.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{service?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {(() => {
                        try {
                          return format(parseISO(booking.bookingDate), 'MMM d, yyyy');
                        } catch {
                          return booking.bookingDate;
                        }
                      })()}{' '}
                      <span className="text-gray-400">at {booking.bookingTime}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {service ? `${service.currency} ${service.price.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.className}`}
                      >
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                      {booking.hitpayPaymentId ?? '—'}
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
