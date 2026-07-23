import crypto from 'crypto';

export interface CreatePaymentRequestParams {
  connectionType: 'oauth' | 'api_key';
  accessToken?: string; // required when connectionType === 'oauth'
  apiKey?: string;      // required when connectionType === 'api_key'
  amount: string;
  currency: string;
  customerName: string;
  customerEmail: string;
  purpose: string;
  referenceNumber: string;
  webhookUrl: string;
  redirectUrl: string;
  paymentMethods?: string[];          // e.g. ['paynow_online'] or ['card']
  platformCommissionAmount?: string;  // e.g. '30.00'
}

export async function createPaymentRequest(
  params: CreatePaymentRequestParams
): Promise<{ id: string; url: string }> {
  const platformKey = process.env.HITPAY_PLATFORM_KEY;
  if (!platformKey) throw new Error('HITPAY_PLATFORM_KEY is not set');

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-PLATFORM-KEY': platformKey,
    'X-Requested-With': 'XMLHttpRequest',
  };
  if (params.connectionType === 'oauth' && params.accessToken) {
    headers['Authorization'] = `Bearer ${params.accessToken}`;
  } else if (params.connectionType === 'api_key' && params.apiKey) {
    headers['X-BUSINESS-API-KEY'] = params.apiKey;
  } else {
    throw new Error('No valid HitPay credentials provided');
  }

  const body = new URLSearchParams({
    amount: params.amount,
    currency: params.currency,
    name: params.customerName,
    email: params.customerEmail,
    purpose: params.purpose,
    reference_number: params.referenceNumber,
    redirect_url: params.redirectUrl,
  });

  // HitPay rejects localhost webhook URLs — only send in non-local environments
  const isLocalhost = params.webhookUrl.includes('localhost') || params.webhookUrl.includes('127.0.0.1');
  if (!isLocalhost) {
    body.append('webhook', params.webhookUrl);
  }

  if (params.paymentMethods && params.paymentMethods.length > 0) {
    for (const method of params.paymentMethods) {
      body.append('payment_methods[]', method);
    }
  }

  if (params.platformCommissionAmount && parseFloat(params.platformCommissionAmount) > 0) {
    body.append('platform_commission_amount', params.platformCommissionAmount);
  }

  const url = `${process.env.HITPAY_API_BASE}/payment-requests`;
  console.log('[HitPay] POST', url);
  console.log('[HitPay] headers', JSON.stringify({ ...headers, Authorization: headers['Authorization'] ? '***' : undefined, 'X-BUSINESS-API-KEY': headers['X-BUSINESS-API-KEY'] ? '***' : undefined }));
  console.log('[HitPay] body', body.toString());

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: body.toString(),
  });

  const responseText = await res.text();
  console.log('[HitPay] response', res.status, responseText);

  if (!res.ok) {
    throw new Error(`Payment request failed (${res.status}): ${responseText}`);
  }

  const data = JSON.parse(responseText);
  return { id: data.id, url: data.url };
}

export interface HitPayChargeDetail {
  id: string;
  currency: string;
  home_currency: string;
  exchange_rate: number | null;
  amount: number;
  amount_without_fees: number;
  refunded_amount: number;
  fixed_fee: number;
  discount_fee: number;
  discount_fee_rate: number;
  status: string;
  payment_method: {
    code: string;
    name: string;
    display_logo: {
      sm: string;
      md: string;
      lg: string;
      svg: string;
      displayName: string;
      iconName: string;
    };
    method_logo: {
      sm: string;
      md: string;
      lg: string;
      svg: string;
      displayName: string;
      iconName: string;
    };
    data?: {
      brand?: string;
      last4?: string;
      country_code?: string;
      country?: string;
    };
  } | null;
  customer: {
    name: string;
    email: string;
    phone_number?: string;
  } | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getChargeDetail(
  credentials: {
    connectionType: 'oauth' | 'api_key';
    accessToken?: string;
    apiKey?: string;
  },
  chargeId: string
): Promise<HitPayChargeDetail | null> {
  const platformKey = process.env.HITPAY_PLATFORM_KEY;
  if (!platformKey) return null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-PLATFORM-KEY': platformKey,
    'X-Requested-With': 'XMLHttpRequest',
  };

  if (credentials.connectionType === 'oauth' && credentials.accessToken) {
    headers['Authorization'] = `Bearer ${credentials.accessToken}`;
  } else if (credentials.connectionType === 'api_key' && credentials.apiKey) {
    headers['X-BUSINESS-API-KEY'] = credentials.apiKey;
  } else {
    return null;
  }

  const url = `${process.env.HITPAY_API_BASE}/charges/${chargeId}`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    return (await res.json()) as HitPayChargeDetail;
  } catch {
    return null;
  }
}

export async function getPaymentRequestStatus(
  credentials: {
    connectionType: 'oauth' | 'api_key';
    accessToken?: string;
    apiKey?: string;
  },
  paymentRequestId: string
): Promise<{ status: string; paymentId?: string; paymentMethod?: string } | null> {
  const platformKey = process.env.HITPAY_PLATFORM_KEY;
  if (!platformKey) return null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-PLATFORM-KEY': platformKey,
    'X-Requested-With': 'XMLHttpRequest',
  };

  if (credentials.connectionType === 'oauth' && credentials.accessToken) {
    headers['Authorization'] = `Bearer ${credentials.accessToken}`;
  } else if (credentials.connectionType === 'api_key' && credentials.apiKey) {
    headers['X-BUSINESS-API-KEY'] = credentials.apiKey;
  } else {
    return null;
  }

  const url = `${process.env.HITPAY_API_BASE}/payment-requests/${paymentRequestId}`;
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    // HitPay payment request has a `status` field and `payments` array
    const payment = data.payments?.[0];
    return {
      status: data.status as string,
      paymentId: payment?.id,
      paymentMethod: payment?.payment_type,
    };
  } catch {
    return null;
  }
}

export function verifyHitPayWebhook(
  payload: Record<string, string>,
  receivedHmac: string
): boolean {
  const salt = process.env.HITPAY_WEBHOOK_SALT;
  if (!salt) return false;
  const sortedKeys = Object.keys(payload)
    .filter((k) => k !== 'hmac')
    .sort();
  const sigString = sortedKeys.map((k) => `${k}${payload[k] ?? ''}`).join('');
  const computed = crypto.createHmac('sha256', salt).update(sigString).digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed, 'hex'),
      Buffer.from(receivedHmac, 'hex')
    );
  } catch {
    return false;
  }
}
