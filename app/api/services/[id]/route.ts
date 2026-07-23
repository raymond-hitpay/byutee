import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const { data: service } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .eq('org_id', session.orgId!)
      .maybeSingle();
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
    const { error } = await supabase
      .from('services')
      .update({
        name,
        description,
        duration_minutes: Number(durationMinutes),
        price: Number(price),
        currency,
      })
      .eq('id', id)
      .eq('org_id', session.orgId!);
    if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await supabase
      .from('services')
      .delete()
      .eq('id', id)
      .eq('org_id', session.orgId!);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
