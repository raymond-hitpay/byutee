import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { organizations, services } from '@/lib/db/schema';
import BookingForm from '@/components/BookingForm';

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

  if (!org.hitpayAccessToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{org.name}</h1>
          <p className="text-gray-500">
            Booking is not available yet — the merchant has not connected payments.
          </p>
        </div>
      </div>
    );
  }

  const [service] = await db
    .select()
    .from(services)
    .where(eq(services.orgId, org.id));

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{org.name}</h1>
          <p className="text-gray-500">No services available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{org.name}</h1>
          <p className="text-gray-500 mt-1">Book an appointment</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">{service.name}</h2>
          {service.description && (
            <p className="text-gray-500 text-sm mb-3">{service.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{service.durationMinutes} min</span>
            <span className="text-gray-300">|</span>
            <span className="font-semibold text-gray-900">
              {service.currency} {service.price.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Your Details</h3>
          <BookingForm
            orgSlug={org.slug}
            serviceId={service.id}
            price={service.price}
            currency={service.currency}
          />
        </div>
      </div>
    </div>
  );
}
