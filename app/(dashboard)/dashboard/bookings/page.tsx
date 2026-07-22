import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { bookings, services } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { startOfWeek, addDays, format, isSameDay, parseISO } from 'date-fns';
import { BookingStatusBadge } from '@/components/BookingStatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function BookingsPage() {
  let session;
  try {
    session = await requireSession();
  } catch {
    redirect('/login');
  }

  const orgBookings = await db
    .select({
      booking: bookings,
      service: services,
    })
    .from(bookings)
    .leftJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(bookings.orgId, session.orgId!))
    .orderBy(desc(bookings.bookingDate), desc(bookings.bookingTime));

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const confirmedBookings = orgBookings.filter((b) => b.booking.status === 'confirmed');

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Bookings</h1>

      {/* Weekly Calendar */}
      <section>
        <h2 className="text-lg font-semibold mb-4">This Week</h2>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayBookings = confirmedBookings.filter((b) => {
              try {
                return isSameDay(parseISO(b.booking.bookingDate), day);
              } catch {
                return false;
              }
            });
            const isToday = isSameDay(day, today);

            return (
              <div
                key={day.toISOString()}
                className={`border rounded-lg p-2 min-h-[100px] ${
                  isToday ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div
                  className={`text-xs font-semibold mb-2 ${
                    isToday ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {format(day, 'EEE d')}
                </div>
                <div className="space-y-1">
                  {dayBookings.map((b) => (
                    <div
                      key={b.booking.id}
                      className="bg-green-100 text-green-800 text-xs rounded px-1 py-0.5 truncate"
                      title={`${b.booking.customerName} at ${b.booking.bookingTime}`}
                    >
                      <span className="font-medium">{b.booking.bookingTime}</span>{' '}
                      {b.booking.customerName}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Booking List */}
      <section>
        <h2 className="text-lg font-semibold mb-4">All Bookings</h2>
        {orgBookings.length === 0 ? (
          <p className="text-gray-500">No bookings yet.</p>
        ) : (
          <div className="space-y-3">
            {orgBookings.map(({ booking, service }) => (
              <Card key={booking.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="font-medium text-gray-900">
                        {booking.customerName}
                      </div>
                      <div className="text-sm text-gray-500">{booking.customerEmail}</div>
                      {service && (
                        <div className="text-sm text-gray-700 font-medium">
                          {service.name}
                        </div>
                      )}
                      <div className="text-sm text-gray-600">
                        {(() => {
                          try {
                            return format(parseISO(booking.bookingDate), 'EEE, MMM d, yyyy');
                          } catch {
                            return booking.bookingDate;
                          }
                        })()}{' '}
                        at {booking.bookingTime}
                        {service && (
                          <span className="text-gray-400 ml-2">
                            &middot; {service.durationMinutes} min
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <BookingStatusBadge status={booking.status} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
