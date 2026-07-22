import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const [org] = await db.select().from(organizations).where(eq(organizations.email, email));
  if (!org || !(await bcrypt.compare(password, org.passwordHash))) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  const session = await getSession();
  session.orgId = org.id;
  session.orgSlug = org.slug;
  session.orgName = org.name;
  await session.save();
  return NextResponse.json({ ok: true });
}
