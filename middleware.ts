import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  if (req.nextUrl.pathname.startsWith('/dashboard')) {
    const session = await getIronSession<SessionData>(req, res, sessionOptions);

    if (!session.orgId) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Check subscription status
    try {
      const origin = req.nextUrl.origin;
      const subResponse = await fetch(`${origin}/api/subscriptions/status`, {
        headers: { Cookie: req.headers.get('cookie') || '' },
      });
      const sub = await subResponse.json();

      if (!sub.hasActiveSubscription) {
        return NextResponse.redirect(new URL('/subscribe', req.url));
      }
    } catch (error) {
      console.error('Subscription check error:', error);
      return NextResponse.redirect(new URL('/subscribe', req.url));
    }
  }

  if (
    req.nextUrl.pathname.startsWith('/admin') &&
    !req.nextUrl.pathname.startsWith('/admin/login')
  ) {
    const session = await getIronSession<SessionData>(req, res, sessionOptions);
    if (!session.isAdmin) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
