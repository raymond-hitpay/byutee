import { db } from '@/lib/db';
import { organizations, services, bookings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ orgId: string }>;
}

export default async function AdminBusinessDetailPage({ params }: Props) {
  const { orgId } = await params;

  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId));
  if (!org) notFound();

  const [service] = await db.select().from(services).where(eq(services.orgId, org.id));
  const orgBookings = await db
    .select()
    .from(bookings)
    .where(eq(bookings.orgId, org.id));

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
            {org.hitpayAccessToken ? (
              <span className="text-green-700 font-medium">Connected ✓</span>
            ) : (
              <span className="text-gray-400">Not connected</span>
            )}
          </dd>
          {org.hitpayBusinessName && (
            <>
              <dt className="text-gray-500">HitPay Business</dt>
              <dd className="text-gray-900">{org.hitpayBusinessName}</dd>
            </>
          )}
          <dt className="text-gray-500">Joined</dt>
          <dd className="text-gray-900">
            {org.createdAt ? new Date(org.createdAt).toLocaleString() : '—'}
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
            <dd className="text-gray-900">{service.durationMinutes} min</dd>
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
            Bookings ({orgBookings.length})
          </h2>
        </div>
        {orgBookings.length > 0 ? (
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
              {orgBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{booking.customerName}</div>
                    <div className="text-gray-500">{booking.customerEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {booking.bookingDate} {booking.bookingTime}
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
                    {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : '—'}
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
