# Dual HitPay Connection Methods Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow each organization to connect to HitPay via either a direct API key or OAuth (one at a time), with the ability to revoke either connection.

**Architecture:** Add two columns to `organizations` (`hitpay_connection_type`, `hitpay_api_key`), update the payment request builder to switch auth headers based on connection type, add a new API route for API key save/validate, and replace the settings UI with a two-option card layout.

**Tech Stack:** Next.js 15 App Router, Drizzle ORM + better-sqlite3, iron-session, TypeScript, Tailwind CSS, shadcn/ui

## Global Constraints

- SQLite database at `./byutee.db` — use raw `db.exec()` for schema migrations (no drizzle-kit generate step)
- All API routes use `requireSession()` from `@/lib/auth` for auth
- `connectionType` values are the string literals `'oauth'` and `'api_key'` — never null when connected
- Connecting via one method must clear ALL fields from the other method before saving
- HitPay sandbox API base: `process.env.HITPAY_API_BASE` (e.g. `https://api.sandbox.hit-pay.com/v1`)
- No new npm packages — use only what's already installed

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `lib/db/schema.ts` | Modify | Add `hitpayConnectionType` and `hitpayApiKey` columns + update `Organization` type |
| `scripts/migrate.ts` | Modify | Add `ALTER TABLE` statements for the two new columns |
| `lib/hitpay-payments.ts` | Modify | Accept `connectionType` + `apiKey` on params; switch auth header |
| `app/api/settings/hitpay/api-key/route.ts` | Create | POST: validate + save API key; DELETE: clear API key connection |
| `app/api/oauth/disconnect/route.ts` | Modify | Also clear `hitpayApiKey` and `hitpayConnectionType` on disconnect |
| `app/api/bookings/route.ts` | Modify | Pass correct auth params to `createPaymentRequest` based on connection type |
| `app/(dashboard)/dashboard/settings/payments/api-key-form.tsx` | Create | Client component: API key input form with save/validation feedback |
| `app/(dashboard)/dashboard/settings/payments/disconnect-button.tsx` | Modify | Call unified disconnect endpoint (already `/api/oauth/disconnect`) |
| `app/(dashboard)/dashboard/settings/payments/page.tsx` | Modify | Two-option layout when disconnected; connection type badge when connected |

---

### Task 1: DB Schema — Add connection type and API key columns

**Files:**
- Modify: `lib/db/schema.ts`
- Modify: `scripts/migrate.ts`

**Interfaces:**
- Produces: `Organization` type gains `.hitpayConnectionType: string | null` and `.hitpayApiKey: string | null`

- [ ] **Step 1: Update Drizzle schema**

Replace the `organizations` table definition in `lib/db/schema.ts` — add two fields after `hitpayBusinessName`:

```typescript
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
  hitpayConnectionType: text('hitpay_connection_type'), // 'oauth' | 'api_key' | null
  hitpayApiKey: text('hitpay_api_key'),
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
```

- [ ] **Step 2: Add migration statements to migrate.ts**

Append two `ALTER TABLE` statements after the existing `CREATE TABLE IF NOT EXISTS` block in `scripts/migrate.ts`:

```typescript
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
```

- [ ] **Step 3: Run migration**

```bash
cd /Users/raymond/HITPAY_GITHUB_REPO/byutee
npm run db:init
```

Expected output: `Database initialized`

- [ ] **Step 4: Verify columns exist**

```bash
cd /Users/raymond/HITPAY_GITHUB_REPO/byutee
node -e "const D=require('better-sqlite3'); const db=new D('./byutee.db'); console.log(db.pragma('table_info(organizations)').map(c=>c.name));"
```

Expected: array includes `hitpay_connection_type` and `hitpay_api_key`

- [ ] **Step 5: Commit**

```bash
cd /Users/raymond/HITPAY_GITHUB_REPO/byutee
git add lib/db/schema.ts scripts/migrate.ts
git commit -m "feat: add hitpayConnectionType and hitpayApiKey columns to organizations"
```

---

### Task 2: Update payment request builder to support both auth methods

**Files:**
- Modify: `lib/hitpay-payments.ts`

**Interfaces:**
- Consumes: (no prior task dependency — standalone change)
- Produces: `createPaymentRequest(params: CreatePaymentRequestParams)` where params now includes `connectionType: 'oauth' | 'api_key'`, `accessToken?: string`, `apiKey?: string` — removes the old required `accessToken` field

- [ ] **Step 1: Rewrite `lib/hitpay-payments.ts`**

```typescript
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
}

export async function createPaymentRequest(
  params: CreatePaymentRequestParams
): Promise<{ id: string; url: string }> {
  const authHeader =
    params.connectionType === 'oauth'
      ? `Bearer ${params.accessToken}`
      : undefined;

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
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
    webhook: params.webhookUrl,
    redirect_url: params.redirectUrl,
  });

  const res = await fetch(`${process.env.HITPAY_API_BASE}/payment-requests`, {
    method: 'POST',
    headers,
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
```

- [ ] **Step 2: Update the bookings route to pass connection type**

Replace `app/api/bookings/route.ts` fully:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { organizations, services, bookings } from '@/lib/db/schema';
import { createPaymentRequest } from '@/lib/hitpay-payments';

export async function POST(req: NextRequest) {
  const { orgSlug, serviceId, customerName, customerEmail, bookingDate, bookingTime } =
    await req.json();

  if (!orgSlug || !serviceId || !customerName || !customerEmail || !bookingDate || !bookingTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const [org] = await db.select().from(organizations).where(eq(organizations.slug, orgSlug));
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  const [service] = await db.select().from(services)
    .where(and(eq(services.id, serviceId), eq(services.orgId, org.id)));
  if (!service) {
    return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  }

  // Guard: HitPay must be connected via either method
  const connectionType = org.hitpayConnectionType as 'oauth' | 'api_key' | null;
  if (!connectionType) {
    return NextResponse.json(
      { error: 'Payments not configured for this business' },
      { status: 400 }
    );
  }
  if (connectionType === 'oauth' && !org.hitpayAccessToken) {
    return NextResponse.json(
      { error: 'Payments not configured for this business' },
      { status: 400 }
    );
  }
  if (connectionType === 'api_key' && !org.hitpayApiKey) {
    return NextResponse.json(
      { error: 'Payments not configured for this business' },
      { status: 400 }
    );
  }

  const bookingId = nanoid();
  await db.insert(bookings).values({
    id: bookingId,
    orgId: org.id,
    serviceId,
    customerName,
    customerEmail,
    bookingDate,
    bookingTime,
    status: 'pending_payment',
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  try {
    const payment = await createPaymentRequest({
      connectionType,
      accessToken: org.hitpayAccessToken ?? undefined,
      apiKey: org.hitpayApiKey ?? undefined,
      amount: service.price.toFixed(2),
      currency: service.currency,
      customerName,
      customerEmail,
      purpose: `${org.name} — ${service.name}`,
      referenceNumber: bookingId,
      webhookUrl: `${appUrl}/api/webhooks/hitpay`,
      redirectUrl: `${appUrl}/book/${org.slug}/success?booking=${bookingId}`,
    });

    await db
      .update(bookings)
      .set({ hitpayPaymentId: payment.id, hitpayCheckoutUrl: payment.url })
      .where(eq(bookings.id, bookingId));

    return NextResponse.json({ checkoutUrl: payment.url });
  } catch (err) {
    await db.delete(bookings).where(eq(bookings.id, bookingId));
    console.error('[Booking] Payment request failed:', err);
    return NextResponse.json({ error: 'Failed to create payment request' }, { status: 502 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/raymond/HITPAY_GITHUB_REPO/byutee
git add lib/hitpay-payments.ts app/api/bookings/route.ts
git commit -m "feat: support oauth and api_key auth methods in payment request builder"
```

---

### Task 3: API route — save/validate API key + unified disconnect

**Files:**
- Create: `app/api/settings/hitpay/api-key/route.ts`
- Modify: `app/api/oauth/disconnect/route.ts`

**Interfaces:**
- Consumes: `Organization.hitpayConnectionType`, `Organization.hitpayApiKey` from Task 1
- Produces:
  - `POST /api/settings/hitpay/api-key` — body: `{ apiKey: string }` → `200 { ok: true }` or `400/401/502`
  - `DELETE /api/settings/hitpay/api-key` → `200 { ok: true }` (same as disconnect)
  - `POST /api/oauth/disconnect` — now also clears `hitpayApiKey` and `hitpayConnectionType`

- [ ] **Step 1: Create the API key route**

Create `app/api/settings/hitpay/api-key/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireSession } from '@/lib/auth';

// POST: validate and save an API key
export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { apiKey } = await req.json();
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return NextResponse.json({ error: 'API key is required' }, { status: 400 });
  }

  // Validate the key works by calling HitPay
  const testRes = await fetch(`${process.env.HITPAY_API_BASE}/payment-requests?per_page=1`, {
    headers: { 'X-BUSINESS-API-KEY': apiKey.trim() },
  });

  if (!testRes.ok) {
    return NextResponse.json(
      { error: 'Invalid API key — HitPay rejected it' },
      { status: 400 }
    );
  }

  // Clear all OAuth fields, save API key
  await db
    .update(organizations)
    .set({
      hitpayApiKey: apiKey.trim(),
      hitpayConnectionType: 'api_key',
      hitpayAccessToken: null,
      hitpayRefreshToken: null,
      hitpayBusinessId: null,
      hitpayBusinessName: null,
    })
    .where(eq(organizations.id, session.orgId!));

  return NextResponse.json({ ok: true });
}

// DELETE: remove API key connection (same effect as disconnect)
export async function DELETE() {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await db
    .update(organizations)
    .set({
      hitpayApiKey: null,
      hitpayConnectionType: null,
      hitpayAccessToken: null,
      hitpayRefreshToken: null,
      hitpayBusinessId: null,
      hitpayBusinessName: null,
    })
    .where(eq(organizations.id, session.orgId!));

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Update the OAuth disconnect route to also clear API key fields**

Replace `app/api/oauth/disconnect/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireSession } from '@/lib/auth';

export async function POST() {
  try {
    const session = await requireSession();
    await db.update(organizations)
      .set({
        hitpayAccessToken: null,
        hitpayRefreshToken: null,
        hitpayBusinessId: null,
        hitpayBusinessName: null,
        hitpayApiKey: null,
        hitpayConnectionType: null,
      })
      .where(eq(organizations.id, session.orgId!));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/raymond/HITPAY_GITHUB_REPO/byutee
git add app/api/settings/hitpay/api-key/route.ts app/api/oauth/disconnect/route.ts
git commit -m "feat: add api-key save/validate route and unify disconnect to clear all connection fields"
```

---

### Task 4: OAuth callback — set connectionType on OAuth connect

**Files:**
- Modify: `app/api/oauth/callback/route.ts`

**Interfaces:**
- Consumes: existing OAuth callback logic
- Produces: sets `hitpayConnectionType = 'oauth'` and clears `hitpayApiKey` when OAuth connects

- [ ] **Step 1: Read the current callback file**

Read `app/api/oauth/callback/route.ts` to understand the existing `db.update()` call.

- [ ] **Step 2: Add `hitpayConnectionType` and clear `hitpayApiKey` in the update set**

Find the `db.update(organizations).set({...})` block inside the callback and add two fields:

```typescript
// Inside the existing db.update().set({}) call, add:
hitpayConnectionType: 'oauth',
hitpayApiKey: null,
```

The full `.set()` call should look like:

```typescript
await db.update(organizations)
  .set({
    hitpayAccessToken: tokens.access_token,
    hitpayRefreshToken: tokens.refresh_token ?? null,
    hitpayBusinessId: businessInfo.id ?? null,
    hitpayBusinessName: businessInfo.name ?? null,
    hitpayConnectionType: 'oauth',
    hitpayApiKey: null,
  })
  .where(eq(organizations.id, session.orgId!));
```

- [ ] **Step 3: Commit**

```bash
cd /Users/raymond/HITPAY_GITHUB_REPO/byutee
git add app/api/oauth/callback/route.ts
git commit -m "feat: set hitpayConnectionType=oauth on OAuth connect, clear apiKey"
```

---

### Task 5: Settings UI — two-option layout + API key form

**Files:**
- Create: `app/(dashboard)/dashboard/settings/payments/api-key-form.tsx`
- Modify: `app/(dashboard)/dashboard/settings/payments/disconnect-button.tsx`
- Modify: `app/(dashboard)/dashboard/settings/payments/page.tsx`

**Interfaces:**
- Consumes: `Organization.hitpayConnectionType`, `Organization.hitpayApiKey`, `Organization.hitpayBusinessName` from Task 1
- Produces: settings page with two connection cards (disconnected state) or status card (connected state)

- [ ] **Step 1: Create the API key form client component**

Create `app/(dashboard)/dashboard/settings/payments/api-key-form.tsx`:

```tsx
'use client';

import { useState } from 'react';

export function ApiKeyForm() {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/settings/hitpay/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });

      if (res.ok) {
        window.location.href = '/dashboard/settings/payments?connected=true';
      } else {
        const data = await res.json();
        setErrorMsg(data.error ?? 'Failed to save API key');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error — please try again');
      setStatus('error');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
        <p className="text-xs text-amber-800">
          <strong>Note:</strong> API keys grant full account access. Use OAuth for production integrations.
        </p>
      </div>
      <div>
        <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-1">
          Merchant API Key
        </label>
        <input
          id="api-key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Paste your HitPay API key"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
      {status === 'error' && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}
      <button
        type="submit"
        disabled={status === 'loading' || !apiKey.trim()}
        className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {status === 'loading' ? 'Validating…' : 'Connect with API Key'}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Update DisconnectButton to handle both connection types**

Replace `app/(dashboard)/dashboard/settings/payments/disconnect-button.tsx`:

```tsx
'use client';

interface DisconnectButtonProps {
  connectionType: 'oauth' | 'api_key';
}

export function DisconnectButton({ connectionType }: DisconnectButtonProps) {
  async function handleDisconnect() {
    try {
      const endpoint =
        connectionType === 'api_key'
          ? '/api/settings/hitpay/api-key'
          : '/api/oauth/disconnect';
      const method = connectionType === 'api_key' ? 'DELETE' : 'POST';

      const res = await fetch(endpoint, { method });
      if (res.ok) {
        window.location.href = '/dashboard/settings/payments';
      } else {
        window.location.href = '/dashboard/settings/payments?error=disconnect_failed';
      }
    } catch {
      window.location.href = '/dashboard/settings/payments?error=disconnect_failed';
    }
  }

  return (
    <button
      onClick={handleDisconnect}
      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
    >
      Revoke Access
    </button>
  );
}
```

- [ ] **Step 3: Rewrite the settings page**

Replace `app/(dashboard)/dashboard/settings/payments/page.tsx`:

```tsx
import { requireSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { DisconnectButton } from './disconnect-button';
import { ApiKeyForm } from './api-key-form';

interface PageProps {
  searchParams: Promise<{ connected?: string; error?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Access was denied. Please try again.',
  invalid_state: 'Security check failed. Please try again.',
  no_code: 'No authorization code received. Please try again.',
  token_exchange_failed: 'Failed to connect to HitPay. Please try again.',
  disconnect_failed: 'Failed to revoke connection. Please try again.',
};

export default async function PaymentsSettingsPage({ searchParams }: PageProps) {
  let session;
  try {
    session = await requireSession();
  } catch {
    redirect('/login');
  }

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, session.orgId!),
  });

  if (!org) redirect('/login');

  const params = await searchParams;
  const connectionType = org.hitpayConnectionType as 'oauth' | 'api_key' | null;
  const isConnected = !!connectionType;
  const showConnectedBanner = params.connected === 'true' && isConnected;
  const errorMessage = params.error ? (ERROR_MESSAGES[params.error] ?? 'An error occurred. Please try again.') : null;

  // Masked API key display: show last 4 chars only
  const maskedApiKey = org.hitpayApiKey
    ? `••••••••${org.hitpayApiKey.slice(-4)}`
    : null;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Payment Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Connect your HitPay account to accept payments through your booking portal
        </p>
      </div>

      {showConnectedBanner && (
        <div className="mb-6 rounded-md bg-green-50 border border-green-200 p-4">
          <p className="text-sm font-medium text-green-800">Successfully connected to HitPay!</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm font-medium text-red-800">{errorMessage}</p>
        </div>
      )}

      {isConnected ? (
        /* ── Connected state: show active connection ── */
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">HitPay Account</h2>
              <p className="mt-1 text-sm text-gray-500">Your account is connected and ready to accept payments.</p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Connected ✓
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500">Connection method</p>
              <p className="font-medium text-gray-900 mt-0.5">
                {connectionType === 'oauth' ? 'OAuth (HitPay Platform)' : 'Direct API Key'}
              </p>
            </div>

            {connectionType === 'oauth' && org.hitpayBusinessName && (
              <div>
                <p className="text-gray-500">Connected business</p>
                <p className="font-medium text-gray-900 mt-0.5">{org.hitpayBusinessName}</p>
              </div>
            )}

            {connectionType === 'api_key' && maskedApiKey && (
              <div>
                <p className="text-gray-500">API key</p>
                <p className="font-medium text-gray-900 font-mono mt-0.5">{maskedApiKey}</p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <DisconnectButton connectionType={connectionType!} />
          </div>
        </div>
      ) : (
        /* ── Disconnected state: show two options ── */
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Choose how to connect your HitPay account:</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Option A: API Key */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-1">API Key</h2>
              <p className="text-sm text-gray-500 mb-4">
                Enter your Merchant API key from HitPay → Developers → API Keys.
              </p>
              <ApiKeyForm />
            </div>

            {/* Option B: OAuth */}
            <div className="bg-white rounded-lg border border-blue-200 p-6">
              <div className="flex items-start justify-between mb-1">
                <h2 className="text-base font-semibold text-gray-900">OAuth</h2>
                <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">Recommended</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Securely authorize byutee via HitPay's OAuth flow. Limited scopes, no stored secret.
              </p>
              <a
                href="/api/oauth/authorize"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Sign in with HitPay
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Start the dev server and manually verify**

```bash
cd /Users/raymond/HITPAY_GITHUB_REPO/byutee
npm run dev
```

Then visit `http://localhost:3000/dashboard/settings/payments`:
- When no connection: two cards side by side — API Key (left) and OAuth (right, blue border + Recommended badge)
- API Key card: amber warning note, password input, "Connect with API Key" button
- OAuth card: "Sign in with HitPay" blue button
- After connecting via API key: status card shows "Direct API Key" method + masked key + "Revoke Access" button
- After connecting via OAuth: status card shows "OAuth (HitPay Platform)" + business name + "Revoke Access" button

- [ ] **Step 5: Commit**

```bash
cd /Users/raymond/HITPAY_GITHUB_REPO/byutee
git add app/(dashboard)/dashboard/settings/payments/
git commit -m "feat: dual-connection settings UI with API key form and OAuth option"
```
