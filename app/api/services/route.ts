import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { services } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET() {
  try {
    const session = await requireSession();
    const all = await db
      .select()
      .from(services)
      .where(eq(services.orgId, session.orgId!));
    return NextResponse.json({ services: all });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
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
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
