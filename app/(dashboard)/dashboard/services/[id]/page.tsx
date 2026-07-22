import { redirect, notFound } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { bookings, services } from '@/lib/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { ChevronLeft, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ServiceEditForm } from './service-edit-form';
import { BookingStatusBadge } from '@/components/BookingStatusBadge';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ServiceDetailPage({ params }: PageProps) {
  let session;
  try {
    session = await requireSession();
  } catch {
    redirect('/login');
  }

  const { id } = await params;

  const [service] = await db
    .select()
    .from(services)
    .where(and(eq(services.id, id), eq(services.orgId, session.orgId!)));

  if (!service) notFound();

  const serviceBookings = await db
    .select()
    .from(bookings)
    .where(and(eq(bookings.serviceId, id), eq(bookings.orgId, session.orgId!)))
    .orderBy(desc(bookings.bookingDate), desc(bookings.bookingTime));

  return (
    <div className="p-6 space-y-8 max-w-3xl">
      <div>
        <Link
          href="/dashboard/services"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Services
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{service.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {service.durationMinutes} min
              </span>
              <span className="text-gray-300">·</span>
              <span className="font-medium text-gray-900">
                {service.currency} {service.price.toFixed(2)}
              </span>
            </div>
            {service.description && (
              <p className="mt-2 text-sm text-gray-600">{service.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit form */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Edit Service</h2>
        <ServiceEditForm service={service} />
      </section>

      {/* Bookings for this service */}
      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Bookings
          <span className="ml-2 text-sm font-normal text-gray-500">({serviceBookings.length})</span>
        </h2>

        {serviceBookings.length === 0 ? (
          <p className="text-sm text-gray-500">No bookings for this service yet.</p>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Date & Time</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {serviceBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{booking.customerName}</p>
                      <p className="text-xs text-gray-500">{booking.customerEmail}</p>
                    </td>
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
                    <td className="px-4 py-3">
                      <BookingStatusBadge status={booking.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
