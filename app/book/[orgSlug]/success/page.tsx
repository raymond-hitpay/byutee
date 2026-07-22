import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { bookings, services } from '@/lib/db/schema';

interface PageProps {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ booking?: string }>;
}

export default async function SuccessPage({ params, searchParams }: PageProps) {
  const { orgSlug } = await params;
  const { booking: bookingId } = await searchParams;

  if (!bookingId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">No booking ID provided.</p>
          <Link href={`/book/${orgSlug}`} className="text-indigo-600 hover:underline mt-4 block">
            Back to booking
          </Link>
        </div>
      </div>
    );
  }

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId));

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Booking not found.</p>
          <Link href={`/book/${orgSlug}`} className="text-indigo-600 hover:underline mt-4 block">
            Back to booking
          </Link>
        </div>
      </div>
    );
  }

  const [service] = await db.select().from(services).where(eq(services.id, booking.serviceId));

  const isConfirmed = booking.status === 'confirmed';

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          {isConfirmed ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
              <p className="text-gray-500 mb-6">Your booking is confirmed. See you soon!</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Received</h1>
              <p className="text-gray-500 mb-6">
                Your booking is awaiting payment confirmation.
              </p>
            </>
          )}

          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Name</span>
              <span className="font-medium text-gray-900">{booking.customerName}</span>
            </div>
            {service && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Service</span>
                <span className="font-medium text-gray-900">{service.name}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-gray-900">{booking.bookingDate}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Time</span>
              <span className="font-medium text-gray-900">{booking.bookingTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  isConfirmed
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {isConfirmed ? 'Confirmed' : 'Pending Payment'}
              </span>
            </div>
          </div>

          <Link
            href={`/book/${orgSlug}`}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium hover:underline"
          >
            Back to booking page
          </Link>
        </div>
      </div>
    </div>
  );
}
