import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { services } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Clock, Plus } from 'lucide-react';

export default async function ServicesPage() {
  let session;
  try {
    session = await requireSession();
  } catch {
    redirect('/login');
  }

  const allServices = await db
    .select()
    .from(services)
    .where(eq(services.orgId, session.orgId!));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500 mt-1">Manage the services your customers can book</p>
        </div>
        <Link
          href="/dashboard/services/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Service
        </Link>
      </div>

      {allServices.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500 text-sm">No services yet.</p>
          <Link
            href="/dashboard/services/new"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-gray-900 underline underline-offset-2"
          >
            Create your first service
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allServices.map((service) => (
            <Link
              key={service.id}
              href={`/dashboard/services/${service.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-400 hover:shadow-sm transition-all"
            >
              <h2 className="font-semibold text-gray-900 truncate">{service.name}</h2>
              {service.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{service.description}</p>
              )}
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-gray-500">
                  <Clock className="h-3.5 w-3.5" />
                  {service.durationMinutes} min
                </span>
                <span className="font-semibold text-gray-900">
                  {service.currency} {service.price.toFixed(2)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
