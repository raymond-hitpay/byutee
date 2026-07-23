import { Currency } from './subscriptions';

export type GenerateParam = '' | 'generate_direct_link' | 'generate_qr';
export type ApiKeyRegion = 'SG' | 'MY' | 'PH' | 'TH';
export type ResponseType = 'redirect' | 'link' | 'qr';

export interface PaymentMethodOption {
  id: string;
  name: string;
  generateParam: GenerateParam;
  apiKeyRegion: ApiKeyRegion;
  requiresRedirectUrl: boolean;
  requiresPhone: boolean;
  responseType: ResponseType;
  isHostedCheckout?: boolean;
}

export const PAYMENT_METHODS_BY_CURRENCY: Record<Currency, PaymentMethodOption[]> = {
  SGD: [
    {
      id: 'shopee_pay',
      name: 'Shopee Pay',
      generateParam: 'generate_direct_link',
      apiKeyRegion: 'SG',
      requiresRedirectUrl: true,
      requiresPhone: true,
      responseType: 'link',
    },
    {
      id: 'grabpay_direct',
      name: 'GrabPay',
      generateParam: 'generate_direct_link',
      apiKeyRegion: 'SG',
      requiresRedirectUrl: true,
      requiresPhone: false,
      responseType: 'link',
    },
    {
      id: 'card',
      name: 'Card',
      generateParam: '',
      apiKeyRegion: 'SG',
      requiresRedirectUrl: true,
      requiresPhone: false,
      responseType: 'redirect',
      isHostedCheckout: true,
    },
  ],
  MYR: [
    {
      id: 'shopee_pay',
      name: 'Shopee Pay',
      generateParam: 'generate_direct_link',
      apiKeyRegion: 'MY',
      requiresRedirectUrl: true,
      requiresPhone: true,
      responseType: 'link',
    },
    {
      id: 'grabpay',
      name: 'GrabPay',
      generateParam: 'generate_direct_link',
      apiKeyRegion: 'MY',
      requiresRedirectUrl: true,
      requiresPhone: false,
      responseType: 'link',
    },
    {
      id: 'touch_n_go',
      name: 'Touch \'N Go',
      generateParam: 'generate_direct_link',
      apiKeyRegion: 'MY',
      requiresRedirectUrl: true,
      requiresPhone: false,
      responseType: 'link',
    },
    {
      id: 'card',
      name: 'Card',
      generateParam: '',
      apiKeyRegion: 'MY',
      requiresRedirectUrl: true,
      requiresPhone: false,
      responseType: 'redirect',
      isHostedCheckout: true,
    },
  ],
  VND: [
    {
      id: 'zalopay',
      name: 'ZaloPay',
      generateParam: 'generate_qr',
      apiKeyRegion: 'SG',
      requiresRedirectUrl: true,
      requiresPhone: false,
      responseType: 'qr',
    },
    {
      id: 'card',
      name: 'Card',
      generateParam: '',
      apiKeyRegion: 'SG',
      requiresRedirectUrl: true,
      requiresPhone: false,
      responseType: 'redirect',
      isHostedCheckout: true,
    },
  ],
  PHP: [
    {
      id: 'shopee_pay',
      name: 'Shopee Pay',
      generateParam: 'generate_direct_link',
      apiKeyRegion: 'PH',
      requiresRedirectUrl: true,
      requiresPhone: true,
      responseType: 'link',
    },
  ],
  THB: [
    {
      id: 'line_pay',
      name: 'LINE Pay',
      generateParam: 'generate_direct_link',
      apiKeyRegion: 'TH',
      requiresRedirectUrl: true,
      requiresPhone: false,
      responseType: 'link',
    },
    {
      id: 'card',
      name: 'Card',
      generateParam: '',
      apiKeyRegion: 'TH',
      requiresRedirectUrl: true,
      requiresPhone: false,
      responseType: 'redirect',
      isHostedCheckout: true,
    },
  ],
};

export const PHONE_COUNTRY_CODES: Record<string, string> = {
  SGD: '65',
  MYR: '60',
  PHP: '63',
};

export function getPaymentMethods(currency: Currency): PaymentMethodOption[] {
  return PAYMENT_METHODS_BY_CURRENCY[currency] || [];
}
