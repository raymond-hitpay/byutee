import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import BookingsCalendar from '@/components/BookingsCalendar';

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
    .order('booking_date', { ascending: true })
    .order('booking_time', { ascending: true });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Bookings</h1>
      <BookingsCalendar bookings={orgBookings ?? []} />
    </div>
  );
}
