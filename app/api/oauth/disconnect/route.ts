import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireSession } from '@/lib/auth';

export async function POST() {
  try {
    const session = await requireSession();
    await db.update(organizations)
      .set({
        hitpayAccessToken: null,
        hitpayRefreshToken: null,
        hitpayBusinessId: null,
        hitpayBusinessName: null,
        hitpayApiKey: null,
        hitpayConnectionType: null,
      })
      .where(eq(organizations.id, session.orgId!));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
