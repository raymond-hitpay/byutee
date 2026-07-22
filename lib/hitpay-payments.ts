import crypto from 'crypto';

export interface CreatePaymentRequestParams {
  accessToken: string;
  amount: string;
  currency: string;
  customerName: string;
  customerEmail: string;
  purpose: string;
  referenceNumber: string;
  webhookUrl: string;
  redirectUrl: string;
}

export async function createPaymentRequest(
  params: CreatePaymentRequestParams
): Promise<{ id: string; url: string }> {
  const body = new URLSearchParams({
    amount: params.amount,
    currency: params.currency,
    name: params.customerName,
    email: params.customerEmail,
    purpose: params.purpose,
    reference_number: params.referenceNumber,
    webhook: params.webhookUrl,
    redirect_url: params.redirectUrl,
  });

  const res = await fetch(`${process.env.HITPAY_API_BASE}/payment-requests`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Payment request failed (${res.status}): ${err}`);
  }

  const data = await res.json();
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
