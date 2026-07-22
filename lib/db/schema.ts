import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  hitpayAccessToken: text('hitpay_access_token'),
  hitpayRefreshToken: text('hitpay_refresh_token'),
  hitpayBusinessId: text('hitpay_business_id'),
  hitpayBusinessName: text('hitpay_business_name'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const services = sqliteTable('services', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organizations.id),
  name: text('name').notNull(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').notNull().default(60),
  price: real('price').notNull(),
  currency: text('currency').notNull().default('SGD'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const bookings = sqliteTable('bookings', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull().references(() => organizations.id),
  serviceId: text('service_id').notNull().references(() => services.id),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  bookingDate: text('booking_date').notNull(),
  bookingTime: text('booking_time').notNull(),
  status: text('status').notNull().default('pending_payment'),
  hitpayPaymentId: text('hitpay_payment_id'),
  hitpayCheckoutUrl: text('hitpay_checkout_url'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export type Organization = typeof organizations.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
