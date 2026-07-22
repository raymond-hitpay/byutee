import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  const session = await getSession();
  // Clear any org session
  session.orgId = undefined;
  session.orgSlug = undefined;
  session.orgName = undefined;
  session.isAdmin = true;
  await session.save();
  return NextResponse.json({ ok: true });
}
