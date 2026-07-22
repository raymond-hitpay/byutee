import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { getSession } from '@/lib/auth';
import { generateSlug } from '@/lib/utils';

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const id = nanoid();
  const slug = generateSlug(name);
  try {
    await db.insert(organizations).values({ id, name, slug, email, passwordHash });
  } catch {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
  }
  const session = await getSession();
  session.orgId = id;
  session.orgSlug = slug;
  session.orgName = name;
  await session.save();
  return NextResponse.json({ ok: true });
}
