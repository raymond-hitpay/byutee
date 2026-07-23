import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ orgId: string }>;
}

export default async function AdminBusinessDetailPage({ params }: Props) {
  const { orgId } = await params;

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .maybeSingle();
  if (!org) notFound();

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('org_id', org.id)
    .limit(1);
  const service = services?.[0] ?? null;

  const { data: orgBookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('org_id', org.id);
  const bookings = orgBookings ?? [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
      </div>

      {/* Org details */}
      <div className="bg-white rounded-lg shadow p-6 space-y-3">
        <h2 className="text-base font-semibold text-gray-700 mb-2">Organisation</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <dt className="text-gray-500">Email</dt>
          <dd className="text-gray-900">{org.email}</dd>
          <dt className="text-gray-500">Slug</dt>
          <dd>
            <a
              href={`/book/${org.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              /book/{org.slug}
            </a>
          </dd>
          <dt className="text-gray-500">HitPay Status</dt>
          <dd>
            {org.hitpay_access_token ? (
              <span className="text-green-700 font-medium">Connected ✓</span>
            ) : (
              <span className="text-gray-400">Not connected</span>
            )}
          </dd>
          {org.hitpay_business_name && (
            <>
              <dt className="text-gray-500">HitPay Business</dt>
              <dd className="text-gray-900">{org.hitpay_business_name}</dd>
            </>
          )}
          <dt className="text-gray-500">Joined</dt>
          <dd className="text-gray-900">
            {org.created_at ? new Date(org.created_at).toLocaleString() : '—'}
          </dd>
        </dl>
      </div>

      {/* Service */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-3">Service</h2>
        {service ? (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <dt className="text-gray-500">Name</dt>
            <dd className="text-gray-900">{service.name}</dd>
            <dt className="text-gray-500">Price</dt>
            <dd className="text-gray-900">
              {service.currency} {service.price.toFixed(2)}
            </dd>
            <dt className="text-gray-500">Duration</dt>
            <dd className="text-gray-900">{service.duration_minutes} min</dd>
            {service.description && (
              <>
                <dt className="text-gray-500">Description</dt>
                <dd className="text-gray-900">{service.description}</dd>
              </>
            )}
          </dl>
        ) : (
          <p className="text-sm text-gray-400">No service configured.</p>
        )}
      </div>

      {/* Bookings */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-700">
            Bookings ({bookings.length})
          </h2>
        </div>
        {bookings.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Date & Time</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{booking.customer_name}</div>
                    <div className="text-gray-500">{booking.customer_email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {booking.booking_date} {booking.booking_time}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        booking.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : booking.status === 'cancelled'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {booking.created_at ? new Date(booking.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="px-6 py-6 text-sm text-gray-400">No bookings yet.</p>
        )}
      </div>
    </div>
  );
}
