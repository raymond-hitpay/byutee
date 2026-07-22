import { requireSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { services, bookings } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  let session;
  try {
    session = await requireSession();
  } catch {
    redirect('/login');
  }

  const { orgId, orgName } = session;

  const [service] = await db
    .select()
    .from(services)
    .where(eq(services.orgId, orgId!));

  const allBookings = await db
    .select()
    .from(bookings)
    .where(eq(bookings.orgId, orgId!));

  const totalBookings = allBookings.length;
  const confirmedBookings = allBookings.filter((b) => b.status === 'confirmed').length;
  const pendingPayment = allBookings.filter((b) => b.status === 'pending_payment').length;

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
