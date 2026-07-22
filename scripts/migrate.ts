import Database from 'better-sqlite3';

const db = new Database('./byutee.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    hitpay_access_token TEXT,
    hitpay_refresh_token TEXT,
    hitpay_business_id TEXT,
    hitpay_business_name TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL REFERENCES organizations(id),
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    price REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'SGD',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL REFERENCES organizations(id),
    service_id TEXT NOT NULL REFERENCES services(id),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    booking_date TEXT NOT NULL,
    booking_time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_payment',
    hitpay_payment_id TEXT,
    hitpay_checkout_url TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Additive migrations — safe to run multiple times (SQLite ignores duplicate column errors)
try { db.exec(`ALTER TABLE organizations ADD COLUMN hitpay_connection_type TEXT`); } catch {}
try { db.exec(`ALTER TABLE organizations ADD COLUMN hitpay_api_key TEXT`); } catch {}

console.log('Database initialized');
db.close();
