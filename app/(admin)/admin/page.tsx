import { supabase } from '@/lib/supabase';
import { getPlanById } from '@/lib/subscriptions';
import Link from 'next/link';

export default async function AdminBusinessesPage() {
  const { data: orgs } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false });

  const allOrgs = orgs ?? [];

  const orgsWithStats = await Promise.all(
    allOrgs.map(async (org) => {
      const { data: services } = await supabase
        .from('services')
        .select('id, name, currency, price')
        .eq('org_id', org.id)
        .limit(1);
      const { data: orgBookings } = await supabase
        .from('bookings')
        .select('status')
        .eq('org_id', org.id);
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('org_id', org.id)
        .maybeSingle();
      
      const bookings = orgBookings ?? [];
      const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
      const plan = subscription ? getPlanById(subscription.plan_id) : null;
      
      return {
        org,
        service: services?.[0] ?? null,
        totalBookings: bookings.length,
        confirmedCount,
        subscription,
        plan,
      };
    })
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Businesses</h1>
        <p className="text-sm text-gray-500 mt-1">
          {allOrgs.length} registered business{allOrgs.length !== 1 ? 'es' : ''}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Business Name</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Subscription</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">HitPay</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">HitPay Business</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Service</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Bookings (Confirmed / Total)</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orgsWithStats.map(({ org, service, totalBookings, confirmedCount, subscription, plan }) => (
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
                  {plan ? (
                    <div>
                      <div className="font-medium text-gray-900">{plan.name}</div>
                      <div className={`text-xs font-semibold ${
                        subscription?.status === 'active' ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                        {subscription?.status === 'active' ? '✓ Active' : 'Pending'}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400">No subscription</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {org.hitpay_access_token ? (
                    <span className="inline-flex items-center gap-1 text-green-700 font-medium">
                      Connected <span>✓</span>
                    </span>
                  ) : (
                    <span className="text-gray-400">Not connected</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {org.hitpay_business_name ?? <span className="text-gray-300">—</span>}
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
                  {confirmedCount} / {totalBookings}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {org.created_at ? new Date(org.created_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
            {orgsWithStats.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
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
