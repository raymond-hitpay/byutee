'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface BookingStatusPollerProps {
  bookingId: string;
  initialStatus: string;
}

export default function BookingStatusPoller({ bookingId, initialStatus }: BookingStatusPollerProps) {
  const router = useRouter();

  useEffect(() => {
    if (initialStatus === 'confirmed' || initialStatus === 'cancelled') return;

    let attempts = 0;
    const maxAttempts = 20; // poll for up to ~1 minute

    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/bookings/${bookingId}/status`);
        const data = await res.json();
        if (data.status === 'confirmed' || data.status === 'cancelled') {
          clearInterval(interval);
          router.refresh();
        }
      } catch {
        // ignore network errors, keep polling
      }
      if (attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [bookingId, initialStatus, router]);

  return null;
}
