'use client';

import Image from 'next/image';
import type { PaymentMethodOption } from '@/lib/payment-methods';

interface PaymentMethodCardProps {
  method: PaymentMethodOption;
  selected: boolean;
  onSelect: (method: PaymentMethodOption) => void;
}

const METHOD_LOGOS: Record<string, string> = {
  card: '/card.svg',
  shopee_pay: '/shopeepay.svg',
  grabpay_direct: '/grabpay.svg',
  touch_n_go: '/touchngo_ewallet.svg',
  zalopay: '/zalopay.svg',
  line_pay: '/linepay.svg',
};

export default function PaymentMethodCard({
  method,
  selected,
  onSelect,
}: PaymentMethodCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(method)}
      className={`flex flex-col items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer min-w-[90px] ${
        selected
          ? 'border-pink-500 bg-pink-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div aria-hidden="true" className="h-10 w-16 flex items-center justify-center">
        {METHOD_LOGOS[method.id] ? (
          <Image
            src={METHOD_LOGOS[method.id]}
            alt=""
            width={64}
            height={32}
            className="object-contain h-10 w-auto"
          />
        ) : (
          <span className="text-xs font-bold text-gray-400">{method.name}</span>
        )}
      </div>
      <span className="sr-only">{method.name}</span>
    </button>
  );
}
