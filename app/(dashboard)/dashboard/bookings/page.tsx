import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { startOfWeek, addDays, format, isSameDay, parseISO } from 'date-fns';
import { BookingStatusBadge } from '@/components/BookingStatusBadge';
import { Card, CardContent } from '@/components/ui/card';

export default async function BookingsPage() {
  let session;
  try {
    session = await requireSession();
  } catch {
    redirect('/login');
  }

  const { data: orgBookings } = await supabase
    .from('bookings')
    .select('*, services(*)')
    .eq('org_id', session.orgId!)
    .order('booking_date', { ascending: false })
    .order('booking_time', { ascending: false });

  const rows = orgBookings ?? [];

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const confirmedBookings = rows.filter((b) => b.status === 'confirmed');

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
                return isSameDay(parseISO(b.booking_date), day);
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
                      key={b.id}
                      className="bg-green-100 text-green-800 text-xs rounded px-1 py-0.5 truncate"
                      title={`${b.customer_name} at ${b.booking_time}`}
                    >
                      <span className="font-medium">{b.booking_time}</span>{' '}
                      {b.customer_name}
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
        {rows.length === 0 ? (
          <p className="text-gray-500">No bookings yet.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <Card key={row.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="font-medium text-gray-900">
                        {row.customer_name}
                      </div>
                      <div className="text-sm text-gray-500">{row.customer_email}</div>
                      {row.services && (
                        <div className="text-sm text-gray-700 font-medium">
                          {row.services.name}
                        </div>
                      )}
                      <div className="text-sm text-gray-600">
                        {(() => {
                          try {
                            return format(parseISO(row.booking_date), 'EEE, MMM d, yyyy');
                          } catch {
                            return row.booking_date;
                          }
                        })()}{' '}
                        at {row.booking_time}
                        {row.services && (
                          <span className="text-gray-400 ml-2">
                            &middot; {row.services.duration_minutes} min
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <BookingStatusBadge status={row.status} />
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
