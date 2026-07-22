import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { and, eq } from 'drizzle-orm';
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
  const [service] = await db.select().from(services)
    .where(and(eq(services.id, serviceId), eq(services.orgId, org.id)));
  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  const connectionType = org.hitpayConnectionType as 'oauth' | 'api_key' | null;
  const hasPayment =
    (connectionType === 'oauth' && !!org.hitpayAccessToken) ||
    (connectionType === 'api_key' && !!org.hitpayApiKey);

  // Insert booking
  const bookingId = nanoid();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const successUrl = `${appUrl}/book/${org.slug}/success?booking=${bookingId}`;

  await db.insert(bookings).values({
    id: bookingId,
    orgId: org.id,
    serviceId,
    customerName,
    customerEmail,
    bookingDate,
    bookingTime,
    status: hasPayment ? 'pending_payment' : 'confirmed',
  });

  // If payment is configured, create a HitPay payment request
  if (hasPayment) {
    try {
      const payment = await createPaymentRequest({
        connectionType: connectionType!,
        accessToken: org.hitpayAccessToken ?? undefined,
        apiKey: org.hitpayApiKey ?? undefined,
        amount: service.price.toFixed(2),
        currency: service.currency,
        customerName,
        customerEmail,
        purpose: `${org.name} — ${service.name}`,
        referenceNumber: bookingId,
        webhookUrl: `${appUrl}/api/webhooks/hitpay`,
        redirectUrl: successUrl,
      });

      await db
        .update(bookings)
        .set({ hitpayPaymentId: payment.id, hitpayCheckoutUrl: payment.url })
        .where(eq(bookings.id, bookingId));

      return NextResponse.json({ checkoutUrl: payment.url });
    } catch (err) {
      await db.delete(bookings).where(eq(bookings.id, bookingId));
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Booking] Payment request failed:', msg);
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }

  // No payment configured — booking is confirmed immediately
  return NextResponse.json({ redirectUrl: successUrl });
}
