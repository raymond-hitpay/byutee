'use client';
import { Badge } from '@/components/ui/badge';

interface BookingStatusBadgeProps {
  status: string;
}

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  if (status === 'confirmed') {
    return <Badge className="bg-green-100 text-green-800 border-green-200">Confirmed</Badge>;
  }
  if (status === 'cancelled') {
    return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
  }
  return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Awaiting Payment</Badge>;
}
