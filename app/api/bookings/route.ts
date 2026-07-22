import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { organizations, services, bookings } from '@/lib/db/schema';
import { createPaymentRequest } from '@/lib/hitpay-payments';

export async function POST(req: NextRequest) {
  const { orgSlug, serviceId, customerName, customerEmail, bookingDate, bookingTime } =
    await req.json();

  if (!orgSlug || !serviceId || !customerName || !customerEmail || !bookingDate || !bookingTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Load org by slug
  const [org] = await db.select().from(organizations).where(eq(organizations.slug, orgSlug));
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  // Load service
  const [service] = await db.select().from(services).where(eq(services.id, serviceId));
  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  // Guard: HitPay must be connected
  if (!org.hitpayAccessToken) {
    return NextResponse.json(
      { error: 'Payments not configured for this business' },
      { status: 400 }
    );
  }

  // Insert booking
  const bookingId = nanoid();
  await db.insert(bookings).values({
    id: bookingId,
    orgId: org.id,
    serviceId,
    customerName,
    customerEmail,
    bookingDate,
    bookingTime,
    status: 'pending_payment',
  });

  // Create HitPay payment request
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  try {
    const payment = await createPaymentRequest({
      accessToken: org.hitpayAccessToken,
      amount: service.price.toFixed(2),
      currency: service.currency,
      customerName,
      customerEmail,
      purpose: `${org.name} — ${service.name}`,
      referenceNumber: bookingId,
      webhookUrl: `${appUrl}/api/webhooks/hitpay`,
      redirectUrl: `${appUrl}/book/${org.slug}/success?booking=${bookingId}`,
    });

    // Update booking with payment info
    await db
      .update(bookings)
      .set({ hitpayPaymentId: payment.id, hitpayCheckoutUrl: payment.url })
      .where(eq(bookings.id, bookingId));

    return NextResponse.json({ checkoutUrl: payment.url });
  } catch (err) {
    // Clean up orphaned booking
    await db.delete(bookings).where(eq(bookings.id, bookingId));
    console.error('[Booking] Payment request failed:', err);
    return NextResponse.json({ error: 'Failed to create payment request' }, { status: 502 });
  }
}
