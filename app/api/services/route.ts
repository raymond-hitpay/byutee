import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { services } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET() {
  try {
    const session = await requireSession();
    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.orgId, session.orgId!));
    return NextResponse.json({ service: service ?? null });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const [existing] = await db
      .select()
      .from(services)
      .where(eq(services.orgId, session.orgId!));
    if (existing) {
      return NextResponse.json({ error: 'Service already exists' }, { status: 409 });
    }
    const { name, description, durationMinutes, price, currency } = await req.json();
    const id = nanoid();
    await db.insert(services).values({
      id,
      orgId: session.orgId!,
      name,
      description,
      durationMinutes: Number(durationMinutes),
      price: Number(price),
      currency,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession();
    const { name, description, durationMinutes, price, currency } = await req.json();
    await db
      .update(services)
      .set({
        name,
        description,
        durationMinutes: Number(durationMinutes),
        price: Number(price),
        currency,
      })
      .where(eq(services.orgId, session.orgId!));
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
