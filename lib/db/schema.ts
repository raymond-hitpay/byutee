export interface Organization {
  id: string;
  name: string;
  slug: string;
  email: string;
  password_hash: string;
  hitpay_access_token: string | null;
  hitpay_refresh_token: string | null;
  hitpay_business_id: string | null;
  hitpay_business_name: string | null;
  hitpay_connection_type: string | null;
  hitpay_api_key: string | null;
  created_at: string | null;
}

export interface Service {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  currency: string;
  created_at: string | null;
}

export interface Booking {
  id: string;
  org_id: string;
  service_id: string;
  customer_name: string;
  customer_email: string;
  booking_date: string;
  booking_time: string;
  status: string;
  hitpay_payment_id: string | null;
  hitpay_checkout_url: string | null;
  hitpay_payment_method: string | null;
  created_at: string | null;
}
