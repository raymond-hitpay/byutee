import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { services } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const [service] = await db
      .select()
      .from(services)
      .where(and(eq(services.id, id), eq(services.orgId, session.orgId!)));
    if (!service) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ service });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const { name, description, durationMinutes, price, currency } = await req.json();
    const result = await db
      .update(services)
      .set({ name, description, durationMinutes: Number(durationMinutes), price: Number(price), currency })
      .where(and(eq(services.id, id), eq(services.orgId, session.orgId!)));
    if (result.rowsAffected === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await db
      .delete(services)
      .where(and(eq(services.id, id), eq(services.orgId, session.orgId!)));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
