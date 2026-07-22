const CLIENT_ID = process.env.HITPAY_OAUTH_CLIENT_ID!;
const CLIENT_SECRET = process.env.HITPAY_OAUTH_CLIENT_SECRET!;
const AUTHORIZE_URL = process.env.HITPAY_OAUTH_AUTHORIZE_URL!;
const TOKEN_URL = process.env.HITPAY_OAUTH_TOKEN_URL!;
const API_BASE = process.env.HITPAY_API_BASE!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export function buildAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: `${APP_URL}/api/oauth/callback`,
    response_type: 'code',
    scope: 'business:read payments:create payments:read',
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export async function exchangeCodeForTokens(code: string): Promise<OAuthTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: `${APP_URL}/api/oauth/callback`,
    code,
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) throw new Error(`Token exchange failed (${res.status}): ${await res.text()}`);
  return res.json();
}

export interface HitPayBusinessInfo {
  id: string;
  name: string;
  email: string;
  country: string;
  currency: string;
}

export async function getBusinessInfo(accessToken: string): Promise<HitPayBusinessInfo> {
  const res = await fetch(`${API_BASE}/info`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Business info failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  if (!data.id || !data.name) {
    throw new Error('Invalid business info response from HitPay');
  }
  return data as HitPayBusinessInfo;
}
