import { db } from '@/lib/db';
import { organizations, services, bookings } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';

export default async function AdminBusinessesPage() {
  const orgs = await db.select().from(organizations).orderBy(desc(organizations.createdAt));

  const orgsWithStats = await Promise.all(
    orgs.map(async (org) => {
      const [service] = await db.select().from(services).where(eq(services.orgId, org.id));
      const orgBookings = await db.select().from(bookings).where(eq(bookings.orgId, org.id));
      const confirmedCount = orgBookings.filter((b) => b.status === 'confirmed').length;
      return { org, service: service ?? null, totalBookings: orgBookings.length, confirmedCount };
    })
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Businesses</h1>
        <p className="text-sm text-gray-500 mt-1">{orgs.length} registered business{orgs.length !== 1 ? 'es' : ''}</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Business Name</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">HitPay</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">HitPay Business</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Service</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Bookings</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orgsWithStats.map(({ org, service, totalBookings, confirmedCount }) => (
              <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/${org.id}`}
                      className="hover:text-blue-600 hover:underline"
                    >
                      {org.name}
                    </Link>
                    <a
                      href={`/book/${org.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-500 text-xs"
                      title="Open booking page"
                    >
                      ↗
                    </a>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{org.email}</td>
                <td className="px-4 py-3">
                  {org.hitpayAccessToken ? (
                    <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                      Connected <span>✓</span>
                    </span>
                  ) : (
                    <span className="text-gray-400">Not connected</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {org.hitpayBusinessName ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {service ? (
                    <span>
                      {service.name}{' '}
                      <span className="text-gray-400">
                        {service.currency} {service.price.toFixed(2)}
                      </span>
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {totalBookings} / {confirmedCount}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
            {orgsWithStats.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No businesses registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
