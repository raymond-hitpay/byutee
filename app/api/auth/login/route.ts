import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('email', email)
    .maybeSingle();
  if (!org || !(await bcrypt.compare(password, org.password_hash))) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  const session = await getSession();
  session.orgId = org.id;
  session.orgSlug = org.slug;
  session.orgName = org.name;
  await session.save();
  return NextResponse.json({ ok: true });
}
