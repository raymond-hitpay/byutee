import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { exchangeCodeForTokens, getBusinessInfo } from '@/lib/hitpay-oauth';
import { requireSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const settingsUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/payments`;

  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`);
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) return NextResponse.redirect(`${settingsUrl}?error=access_denied`);

  const cookieStore = await cookies();
  const storedState = cookieStore.get('hitpay_oauth_state')?.value;
  cookieStore.delete('hitpay_oauth_state');

  if (!storedState || !state || state !== storedState) {
    return NextResponse.redirect(`${settingsUrl}?error=invalid_state`);
  }
  if (!code) {
    return NextResponse.redirect(`${settingsUrl}?error=no_code`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const business = await getBusinessInfo(tokens.access_token);
    await supabase
      .from('organizations')
      .update({
        hitpay_access_token: tokens.access_token,
        hitpay_refresh_token: tokens.refresh_token,
        hitpay_business_id: business.id,
        hitpay_business_name: business.name,
        hitpay_connection_type: 'oauth',
        hitpay_api_key: null,
      })
      .eq('id', session.orgId!);
    return NextResponse.redirect(`${settingsUrl}?connected=true`);
  } catch (err) {
    console.error('[OAuth Callback]', err);
    return NextResponse.redirect(`${settingsUrl}?error=token_exchange_failed`);
  }
}
