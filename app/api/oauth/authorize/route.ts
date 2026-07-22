import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { cookies } from 'next/headers';
import { buildAuthorizationUrl } from '@/lib/hitpay-oauth';
import { requireSession } from '@/lib/auth';

export async function GET() {
  try {
    await requireSession();
  } catch {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL!));
  }
  const state = nanoid(32);
  const cookieStore = await cookies();
  cookieStore.set('hitpay_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10,
    sameSite: 'lax',
  });
  return NextResponse.redirect(buildAuthorizationUrl(state));
}
