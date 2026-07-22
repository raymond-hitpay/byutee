import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { organizations, services } from '@/lib/db/schema';
import PublicBookingFlow from './PublicBookingFlow';

interface PageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function BookingPage({ params }: PageProps) {
  const { orgSlug } = await params;

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, orgSlug));

  if (!org) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-500">This booking page does not exist.</p>
        </div>
      </div>
    );
  }

  const allServices = await db
    .select()
    .from(services)
    .where(eq(services.orgId, org.id));

  return <PublicBookingFlow org={{ name: org.name, slug: org.slug }} services={allServices} />;
}
