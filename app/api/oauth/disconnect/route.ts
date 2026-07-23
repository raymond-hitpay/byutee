import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { requireSession } from '@/lib/auth';

export async function POST() {
  try {
    const session = await requireSession();
    await supabase
      .from('organizations')
      .update({
        hitpay_access_token: null,
        hitpay_refresh_token: null,
        hitpay_business_id: null,
        hitpay_business_name: null,
        hitpay_api_key: null,
        hitpay_connection_type: null,
      })
      .eq('id', session.orgId!);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
