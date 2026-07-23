import { requireSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  let session;
  try {
    session = await requireSession();
  } catch {
    redirect('/login');
  }

  const { orgId, orgName } = session;

  const { data: services } = await supabase
    .from('services')
    .select('name')
    .eq('org_id', orgId!)
    .limit(1);
  const service = services?.[0] ?? null;

  const { data: allBookings } = await supabase
    .from('bookings')
    .select('status')
    .eq('org_id', orgId!);
  const bookings = allBookings ?? [];

  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed').length;
  const pendingPayment = bookings.filter((b) => b.status === 'pending_payment').length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Welcome, {orgName}!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            {service
              ? `Your service "${service.name}" is live and ready to accept bookings.`
              : 'Get started by creating your first service.'}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalBookings}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Confirmed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{confirmedBookings}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Pending Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{pendingPayment}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
