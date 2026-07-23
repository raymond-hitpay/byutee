import { getPlanById, getPlanPrice, type Currency } from '@/lib/subscriptions';
import { getPaymentMethods, PHONE_COUNTRY_CODES } from '@/lib/payment-methods';
import { createRecurringBilling, type RecurringBillingRequest } from '@/lib/hitpay';

export interface CreateOrderRequest {
  orgId: string;
  orgName: string;
  orgEmail: string;
  planId: string;
  currency: Currency;
  paymentMethod: string;
  customerPhone?: string;
}

export interface CreateOrderResponse {
  url?: string;
  direct_link?: string;
  subscriptionId: string;
}

/**
 * Get the API key for a region from environment variables
 */
function getApiKey(region: string): string {
  const apiKey = process.env[`HITPAY_API_KEY_${region}`];
  if (!apiKey) {
    throw new Error(`Missing HitPay API key for region ${region}`);
  }
  return apiKey;
}

/**
 * Format amount for HitPay API (handle currency-specific formatting)
 */
function formatAmountForApi(amount: number, currency: Currency): string {
  // VND and PHP don't use decimal places
  if (currency === 'VND' || currency === 'PHP') {
    return String(Math.round(amount));
  }
  // All other currencies use 2 decimal places
  return amount.toFixed(2);
}

/**
 * Get the phone country code for a currency
 */
function getPhoneCountryCode(currency: Currency): string {
  const code = PHONE_COUNTRY_CODES[currency];
  if (!code) {
    throw new Error(`Phone country code not found for currency ${currency}`);
  }
  return code;
}

/**
 * Create a subscription order with HitPay recurring billing API
 */
export async function createSubscriptionOrder(req: CreateOrderRequest): Promise<CreateOrderResponse> {
  // Validate plan exists
  const plan = getPlanById(req.planId);
  if (!plan) {
    throw new Error('Invalid plan ID');
  }

  // Validate payment method is supported for currency
  const supportedMethods = getPaymentMethods(req.currency);
  const method = supportedMethods.find((m) => m.id === req.paymentMethod);
  if (!method) {
    throw new Error('Payment method not supported for this currency');
  }

  // Validate required fields
  if (method.requiresPhone && !req.customerPhone) {
    throw new Error(`Customer phone number is required for ${method.name}`);
  }

  if (method.requiresRedirectUrl && !process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error(`NEXT_PUBLIC_APP_URL environment variable is required for ${method.name}`);
  }

  // Build the request for HitPay recurring billing API
  const billingName = `${plan.name} Plan`;
  const planPrice = getPlanPrice(req.planId, req.currency);
  const amount = formatAmountForApi(planPrice, req.currency);

  // Format today's date as YYYY-MM-DD for start_date
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];

  // Get API key for the region
  const apiKey = getApiKey(method.apiKeyRegion);

  // Build the HitPay recurring billing request
  const hitpayRequest: RecurringBillingRequest = {
    customer_email: req.orgEmail,
    customer_name: req.orgName,
    amount: amount,
    currency: req.currency.toLowerCase(),
    name: billingName,
    payment_method: req.paymentMethod,
    generate_param: (method.generateParam || '') as 'generate_qr' | 'generate_direct_link' | 'generate_instructions' | '',
    cycle: 'monthly',
    cycle_frequency: 'month',
    start_date: startDate,
  };

  // Add redirect URLs if method requires them
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (method.requiresRedirectUrl && appUrl) {
    hitpayRequest.redirect_url = `${appUrl}/subscribe/success`;
    hitpayRequest.cancel_url = `${appUrl}/subscribe/cancelled`;
  }

  // Add phone number if required
  if (method.requiresPhone && req.customerPhone) {
    hitpayRequest.customer_phone_number = req.customerPhone;
    hitpayRequest.customer_phone_number_country_code = getPhoneCountryCode(req.currency);
  }

  // Call the createRecurringBilling function
  const data = await createRecurringBilling(
    hitpayRequest,
    apiKey,
    (process.env.HITPAY_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production'
  );

  // Extract the response data using the actual subscription ID from HitPay
  const result: CreateOrderResponse = {
    subscriptionId: data.id,
  };

  // Add URL based on response type
  if (method.responseType === 'qr' && data.qr_code_data) {
    result.url = data.qr_code_data.qr_code;
  } else if (method.responseType === 'link' && data.direct_link) {
    result.direct_link = data.direct_link.direct_link_url;
    result.url = data.direct_link.direct_link_url;
  } else if (method.responseType === 'redirect') {
    // For card payments with redirect response
    result.url = data.id || undefined;
  }

  return result;
}
