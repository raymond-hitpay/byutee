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
  }
  return res;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
