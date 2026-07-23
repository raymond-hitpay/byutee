import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { nanoid } from 'nanoid';

export async function GET() {
  try {
    const session = await requireSession();
    const { data: services } = await supabase
      .from('services')
      .select('*')
      .eq('org_id', session.orgId!);
    return NextResponse.json({ services: services ?? [] });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { name, description, durationMinutes, price, currency } = await req.json();
    const id = nanoid();
    await supabase.from('services').insert({
      id,
      org_id: session.orgId!,
      name,
      description,
      duration_minutes: Number(durationMinutes),
      price: Number(price),
      currency,
    });
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
