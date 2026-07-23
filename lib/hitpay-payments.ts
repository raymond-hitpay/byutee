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
