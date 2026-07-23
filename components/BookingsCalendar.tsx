'use client';

import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  isSameDay,
  isSameMonth,
  parseISO,
  isToday,
  compareAsc,
} from 'date-fns';
import { ChevronLeft, ChevronRight, X, User, Mail, Clock, CalendarDays, CreditCard } from 'lucide-react';
import { BookingStatusBadge } from '@/components/BookingStatusBadge';
import type { Booking, Service } from '@/lib/db/schema';

export interface BookingWithService extends Booking {
  services: Service | null;
}

type CalendarView = 'month' | 'week' | 'day' | 'schedule';

const VIEWS: { key: CalendarView; label: string }[] = [
  { key: 'month', label: 'Month' },
  { key: 'week', label: 'Week' },
  { key: 'day', label: 'Day' },
  { key: 'schedule', label: 'Schedule' },
];

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8am–8pm

function bookingsForDay(bookings: BookingWithService[], day: Date) {
  return bookings
    .filter((b) => {
      try { return isSameDay(parseISO(b.booking_date), day); } catch { return false; }
    })
    .sort((a, b) => a.booking_time.localeCompare(b.booking_time));
}

function statusColor(status: string) {
  if (status === 'confirmed') return 'bg-green-100 text-green-800 border-green-200';
  if (status === 'cancelled') return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-yellow-100 text-yellow-800 border-yellow-200';
}

// ── Booking chip used across views ──
function BookingChip({
  booking,
  onClick,
  compact = false,
}: {
  booking: BookingWithService;
  onClick: (b: BookingWithService) => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={() => onClick(booking)}
      className={`w-full text-left rounded px-1.5 py-0.5 text-xs border truncate hover:opacity-80 transition-opacity ${statusColor(booking.status)}`}
      title={`${booking.customer_name} — ${booking.services?.name ?? ''} at ${booking.booking_time}`}
    >
      {compact ? (
        <span className="font-medium">{booking.booking_time}</span>
      ) : (
        <>
          <span className="font-medium">{booking.booking_time}</span>{' '}
          <span className="truncate">{booking.customer_name}</span>
        </>
      )}
    </button>
  );
}

// ── Month View ──
function MonthView({
  current,
  bookings,
  onBookingClick,
}: {
  current: Date;
  bookings: BookingWithService[];
  onBookingClick: (b: BookingWithService) => void;
}) {
  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let d = gridStart;
  while (d <= gridEnd) {
    days.push(d);
    d = addDays(d, 1);
  }

  const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div>
      <div className="grid grid-cols-7 border-l border-t border-gray-200">
        {DAY_HEADERS.map((h) => (
          <div key={h} className="border-r border-b border-gray-200 px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
            {h}
          </div>
        ))}
        {days.map((day) => {
          const dayBookings = bookingsForDay(bookings, day);
          const inMonth = isSameMonth(day, current);
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className={`border-r border-b border-gray-200 min-h-[100px] p-1.5 ${
                !inMonth ? 'bg-gray-50' : 'bg-white'
              }`}
            >
              <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                today ? 'bg-indigo-600 text-white' : inMonth ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-0.5">
                {dayBookings.slice(0, 3).map((b) => (
                  <BookingChip key={b.id} booking={b} onClick={onBookingClick} />
                ))}
                {dayBookings.length > 3 && (
                  <div className="text-xs text-gray-400 px-1">+{dayBookings.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Week View ──
function WeekView({
  current,
  bookings,
  onBookingClick,
}: {
  current: Date;
  bookings: BookingWithService[];
  onBookingClick: (b: BookingWithService) => void;
}) {
  const weekStart = startOfWeek(current, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="grid grid-cols-7 border-l border-t border-gray-200">
      {weekDays.map((day) => {
        const dayBookings = bookingsForDay(bookings, day);
        const today = isToday(day);
        return (
          <div key={day.toISOString()} className="border-r border-b border-gray-200 min-h-[200px] bg-white">
            <div className={`px-2 py-2 text-xs font-semibold border-b border-gray-100 ${today ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 bg-gray-50'}`}>
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-1 ${today ? 'bg-indigo-600 text-white' : ''}`}>
                {format(day, 'd')}
              </span>
              {format(day, 'EEE')}
            </div>
            <div className="p-1 space-y-0.5">
              {dayBookings.map((b) => (
                <BookingChip key={b.id} booking={b} onClick={onBookingClick} />
              ))}
              {dayBookings.length === 0 && (
                <div className="text-xs text-gray-300 p-1">—</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Day View ──
function DayView({
  current,
  bookings,
  onBookingClick,
}: {
  current: Date;
  bookings: BookingWithService[];
  onBookingClick: (b: BookingWithService) => void;
}) {
  const dayBookings = bookingsForDay(bookings, current);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {HOURS.map((hour) => {
        const hourStr = `${String(hour).padStart(2, '0')}:`;
        const hourBookings = dayBookings.filter((b) => b.booking_time.startsWith(hourStr));
        return (
          <div key={hour} className="flex border-b border-gray-100 last:border-b-0 min-h-[56px]">
            <div className="w-16 flex-shrink-0 px-3 py-2 text-xs text-gray-400 font-medium border-r border-gray-100 bg-gray-50">
              {format(new Date(2000, 0, 1, hour), 'h a')}
            </div>
            <div className="flex-1 p-1 space-y-0.5">
              {hourBookings.map((b) => (
                <button
                  key={b.id}
                  onClick={() => onBookingClick(b)}
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm border hover:opacity-80 transition-opacity ${statusColor(b.status)}`}
                >
                  <div className="font-semibold">{b.booking_time} — {b.customer_name}</div>
                  <div className="text-xs opacity-75">{b.services?.name ?? ''}{b.services ? ` · ${b.services.duration_minutes} min` : ''}</div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Schedule View ──
function ScheduleView({
  bookings,
  onBookingClick,
}: {
  bookings: BookingWithService[];
  onBookingClick: (b: BookingWithService) => void;
}) {
  const sorted = [...bookings].sort((a, b) => {
    const dateCmp = compareAsc(parseISO(a.booking_date), parseISO(b.booking_date));
    return dateCmp !== 0 ? dateCmp : a.booking_time.localeCompare(b.booking_time);
  });

  // Group by date
  const groups: Record<string, BookingWithService[]> = {};
  for (const b of sorted) {
    const key = b.booking_date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  }

  if (sorted.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No bookings yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([dateKey, dayBookings]) => {
        let dateLabel: string;
        try {
          const d = parseISO(dateKey);
          dateLabel = isToday(d)
            ? `Today — ${format(d, 'EEE, MMM d, yyyy')}`
            : format(d, 'EEE, MMM d, yyyy');
        } catch {
          dateLabel = dateKey;
        }
        return (
          <div key={dateKey}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{dateLabel}</h3>
            <div className="space-y-2">
              {dayBookings.map((b) => (
                <button
                  key={b.id}
                  onClick={() => onBookingClick(b)}
                  className="w-full text-left bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="font-medium text-gray-900">{b.customer_name}</div>
                      <div className="text-sm text-gray-500">{b.customer_email}</div>
                      {b.services && (
                        <div className="text-sm text-gray-700">{b.services.name}</div>
                      )}
                      <div className="text-sm text-gray-500">
                        {b.booking_time}
                        {b.services && <span className="text-gray-400"> · {b.services.duration_minutes} min</span>}
                      </div>
                    </div>
                    <BookingStatusBadge status={b.status} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Booking Detail Modal ──
function BookingDetailModal({
  booking,
  onClose,
}: {
  booking: BookingWithService;
  onClose: () => void;
}) {
  let dateLabel: string;
  try {
    dateLabel = format(parseISO(booking.booking_date), 'EEEE, MMMM d, yyyy');
  } catch {
    dateLabel = booking.booking_date;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{booking.customer_name}</h2>
            <BookingStatusBadge status={booking.status} />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-0.5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-500">Email</div>
              <div className="text-sm font-medium text-gray-900">{booking.customer_email}</div>
            </div>
          </div>

          {booking.services && (
            <div className="flex items-center gap-3 px-4 py-3">
              <CalendarDays className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-500">Service</div>
                <div className="text-sm font-medium text-gray-900">{booking.services.name}</div>
                {booking.services.description && (
                  <div className="text-xs text-gray-500 mt-0.5">{booking.services.description}</div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 px-4 py-3">
            <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <div>
              <div className="text-xs text-gray-500">Date & Time</div>
              <div className="text-sm font-medium text-gray-900">{dateLabel} at {booking.booking_time}</div>
              {booking.services && (
                <div className="text-xs text-gray-500 mt-0.5">{booking.services.duration_minutes} min</div>
              )}
            </div>
          </div>

          {booking.services && (
            <div className="flex items-center gap-3 px-4 py-3">
              <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-500">Price</div>
                <div className="text-sm font-medium text-gray-900">
                  {booking.services.currency} {booking.services.price.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {booking.hitpay_payment_id && (
            <div className="flex items-center gap-3 px-4 py-3">
              <CreditCard className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-500">HitPay Payment ID</div>
                <div className="text-sm font-medium text-gray-900 font-mono break-all">
                  {booking.hitpay_payment_id}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-400">Booking ID: {booking.id}</div>
      </div>
    </div>
  );
}

// ── Main Calendar Component ──
export default function BookingsCalendar({ bookings }: { bookings: BookingWithService[] }) {
  const [view, setView] = useState<CalendarView>('week');
  const [current, setCurrent] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<BookingWithService | null>(null);

  function goToday() { setCurrent(new Date()); }

  function goPrev() {
    if (view === 'month') setCurrent((d) => subMonths(d, 1));
    else if (view === 'week') setCurrent((d) => subWeeks(d, 1));
    else if (view === 'day') setCurrent((d) => subDays(d, 1));
  }

  function goNext() {
    if (view === 'month') setCurrent((d) => addMonths(d, 1));
    else if (view === 'week') setCurrent((d) => addWeeks(d, 1));
    else if (view === 'day') setCurrent((d) => addDays(d, 1));
  }

  function currentLabel() {
    if (view === 'month') return format(current, 'MMMM yyyy');
    if (view === 'week') {
      const ws = startOfWeek(current, { weekStartsOn: 1 });
      const we = endOfWeek(current, { weekStartsOn: 1 });
      return isSameMonth(ws, we)
        ? `${format(ws, 'MMM d')} – ${format(we, 'd, yyyy')}`
        : `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`;
    }
    if (view === 'day') return format(current, 'EEEE, MMMM d, yyyy');
    return 'All Bookings';
  }

  const showNav = view !== 'schedule';

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* View switcher */}
        <div className="flex rounded-xl border border-gray-200 bg-gray-50 p-1 gap-0.5">
          {VIEWS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                view === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Nav */}
        {showNav && (
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={goNext}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={goToday}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-gray-700"
            >
              Today
            </button>
          </div>
        )}

        {/* Current period label */}
        {showNav && (
          <span className="text-base font-semibold text-gray-900">{currentLabel()}</span>
        )}
      </div>

      {/* Calendar views */}
      {view === 'month' && (
        <MonthView current={current} bookings={bookings} onBookingClick={setSelectedBooking} />
      )}
      {view === 'week' && (
        <WeekView current={current} bookings={bookings} onBookingClick={setSelectedBooking} />
      )}
      {view === 'day' && (
        <DayView current={current} bookings={bookings} onBookingClick={setSelectedBooking} />
      )}
      {view === 'schedule' && (
        <ScheduleView bookings={bookings} onBookingClick={setSelectedBooking} />
      )}

      {/* Detail modal */}
      {selectedBooking && (
        <BookingDetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
      )}
    </div>
  );
}
