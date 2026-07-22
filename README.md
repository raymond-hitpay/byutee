# Byutee — Beauty & Wellness Booking Demo

A modern booking platform demo showcasing **HitPay Platform OAuth integration**. Organizations sign up, create services, connect their HitPay account, and customers book appointments with payments processed seamlessly through HitPay.

## What It Is

Byutee is a full-stack demonstration of:

- **Organization signup & authentication** — Teams create accounts and manage their profile
- **Service management** — Organizations configure their service (duration, price, timezone)
- **HitPay Platform OAuth** — "Sign in with HitPay" integration for secure payment setup
- **Public booking portal** — Customers book services at `/book/[slug]` without authentication
- **Calendar & booking management** — Dual calendar/list view of bookings with status tracking
- **Webhook-driven payments** — Real-time payment confirmation from HitPay webhooks
- **Responsive design** — Built with Next.js, Tailwind CSS, and shadcn/ui components

## Features

- ✅ Organization signup & dashboard
- ✅ Service management (create, edit one service per org)
- ✅ HitPay Platform OAuth ("Sign in with HitPay")
- ✅ Public customer booking portal at `/book/[slug]`
- ✅ Calendar & list view of bookings
- ✅ Webhook-driven payment confirmation
- ✅ Session-based authentication with iron-session
- ✅ SQLite for local development (Turso for production)

## Prerequisites

- **Node.js 18 or higher** (with npm)
- **HitPay sandbox account** with a Platform OAuth application registered
  - Client ID and Client Secret from [HitPay App Builder](https://dashboard.sandbox.hit-pay.com/developers/apps)

## Quick Start

### 1. Clone & Install

```bash
cd byutee
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Then edit `.env.local` and fill in your values (see [Environment Variables](#environment-variables) table below).

### 3. Initialize the Database

```bash
npm run db:init
```

This creates a local SQLite database (`./byutee.db`) with the schema.

### 4. Start the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | Your app's base URL (public, used in emails/redirects) | `http://localhost:3000` |
| `SESSION_SECRET` | 32-character secret for iron-session (generate: `openssl rand -hex 32`) | `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` |
| `HITPAY_OAUTH_CLIENT_ID` | Client ID from HitPay App Builder | `your-client-id` |
| `HITPAY_OAUTH_CLIENT_SECRET` | Client Secret from HitPay App Builder | `your-client-secret` |
| `HITPAY_OAUTH_AUTHORIZE_URL` | HitPay sandbox authorization endpoint | `https://dashboard.sandbox.hit-pay.com/oauth/authorize` |
| `HITPAY_OAUTH_TOKEN_URL` | HitPay sandbox token exchange endpoint | `https://api.sandbox.hit-pay.com/v1/open/oauth/token` |
| `HITPAY_API_BASE` | HitPay sandbox API base URL | `https://api.sandbox.hit-pay.com/v1` |
| `HITPAY_WEBHOOK_SALT` | Webhook signature salt from HitPay dashboard | `your-webhook-salt` |
| `DATABASE_URL` | Path to SQLite database (local dev) or Turso URL (production) | `./byutee.db` |

## HitPay OAuth Setup

1. **Create a HitPay Sandbox Account**
   - Go to [https://dashboard.sandbox.hit-pay.com/register](https://dashboard.sandbox.hit-pay.com/register)
   - Sign up and verify your email

2. **Create a Platform OAuth Application**
   - Navigate to **Developers → App Builder**
   - Click **Create New App**
   - Set App Name to "Byutee" (or your preference)
   - Register **Redirect URI**: `http://localhost:3000/api/oauth/callback`
   - Request scopes: `business:read`, `payments:create`, `payments:read`
   - Click **Create** and copy your **Client ID** and **Client Secret**

3. **Add to `.env.local`**
   ```
   HITPAY_OAUTH_CLIENT_ID=<your-client-id>
   HITPAY_OAUTH_CLIENT_SECRET=<your-client-secret>
   HITPAY_WEBHOOK_SALT=<your-webhook-salt>
   ```

4. **Generate SESSION_SECRET**
   ```bash
   openssl rand -hex 32
   ```
   Copy the output and paste it into `.env.local` as `SESSION_SECRET`.

## End-to-End Demo Flow

Test the full booking and payment flow locally:

1. **Sign Up as Organization**
   - Go to [http://localhost:3000/signup](http://localhost:3000/signup)
   - Create an account (e.g., email: `salon@test.com`, password: `Test123!`)

2. **Create a Service**
   - Go to **Services** in the dashboard
   - Click **New Service**
   - Fill in details:
     - Name: "Deep Tissue Massage"
     - Duration: 60 minutes
     - Price: 85 SGD
     - Timezone: Your local timezone
   - Click **Save**

3. **Connect HitPay**
   - Go to **Settings → Payments**
   - Click **"Sign in with HitPay"**
   - You'll be redirected to HitPay sandbox to authorize
   - After approval, you'll be redirected back with status "Connected"

4. **Get Your Booking Link**
   - Go to **Services** → click your service → copy the **Public Link**
   - Example: `/book/salon-test-com`

5. **Book as a Customer**
   - Open the booking link in an **incognito/private window**
   - Fill in customer details (name, email, phone, date, time)
   - Click **Book Now**

6. **Complete Payment**
   - You'll be redirected to HitPay checkout
   - Use HitPay test card: **4111 1111 1111 1111** (Exp: any future date, CVC: any 3 digits)
   - Click **Pay** to simulate successful payment

7. **Confirm Booking**
   - A webhook fires from HitPay (in sandbox)
   - Return to the dashboard → **Bookings**
   - Your booking appears with status "Confirmed"

8. **View Bookings**
   - Toggle between **Calendar** and **List** views
   - See all confirmed bookings with customer details

## Testing Webhooks Locally

HitPay webhooks are fired to your app's webhook endpoint. For local testing with ngrok:

```bash
# In a new terminal, start ngrok
ngrok http 3000

# Copy the ngrok URL (e.g., https://abc123.ngrok.io)
# Update .env.local
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io

# Restart your dev server
npm run dev
```

HitPay webhook events will now be delivered to your local app through the ngrok tunnel.

## Deploying to Vercel

### 1. Prepare Turso Database

SQLite is not suitable for Vercel's serverless environment. Use [Turso](https://turso.tech/) instead:

```bash
# Install Turso CLI (if not already installed)
curl -sSfL https://get.tur.so/install.sh | bash
# or on macOS:
brew install tursodatabase/tap/turso

# Create a Turso database
turso db create byutee

# Get the database URL and auth token
turso db show byutee --url
turso db tokens create byutee

# Save these values; you'll need them for Vercel env vars
```

### 2. Update Database Driver

Install the libSQL client:

```bash
npm install @libsql/client
```

Replace the contents of `lib/db/index.ts`:

```typescript
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
```

Update `drizzle.config.ts` to use libSQL:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  driver: 'turso',
  schema: './lib/db/schema.ts',
  out: './drizzle',
});
```

### 3. Configure Vercel Project

1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **Add New → Project**
3. Connect your GitHub repository
4. Set **Root Directory** to `byutee` (since this is a monorepo)
5. Click **Deploy**

### 4. Add Environment Variables

In your Vercel project settings → **Environment Variables**, add:

```
NEXT_PUBLIC_APP_URL=https://your-vercel-url.vercel.app
SESSION_SECRET=<your-32-char-secret>
HITPAY_OAUTH_CLIENT_ID=<your-client-id>
HITPAY_OAUTH_CLIENT_SECRET=<your-client-secret>
HITPAY_OAUTH_AUTHORIZE_URL=https://dashboard.sandbox.hit-pay.com/oauth/authorize
HITPAY_OAUTH_TOKEN_URL=https://api.sandbox.hit-pay.com/v1/open/oauth/token
HITPAY_API_BASE=https://api.sandbox.hit-pay.com/v1
HITPAY_WEBHOOK_SALT=<your-webhook-salt>
TURSO_DATABASE_URL=<your-turso-database-url>
TURSO_AUTH_TOKEN=<your-turso-auth-token>
```

### 5. Update HitPay OAuth Redirect URI

1. Go to [HitPay App Builder](https://dashboard.sandbox.hit-pay.com/developers/apps)
2. Edit your Byutee app
3. Update **Redirect URI** to: `https://your-vercel-url.vercel.app/api/oauth/callback`
4. Save

Your app is now deployed and ready for testing in production!

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 15** | React framework with App Router & API routes |
| **TypeScript** | Type-safe development |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Pre-built accessible UI components |
| **iron-session** | HTTP-only cookie-based sessions |
| **Drizzle ORM** | Type-safe database queries |
| **better-sqlite3** | SQLite driver for local development |
| **libSQL/Turso** | SQLite-compatible cloud database for production |
| **HitPay API** | Payment processing & OAuth |

## Project Structure

```
byutee/
├── app/                      # Next.js app router
│   ├── (auth)/              # Auth pages (signup, login)
│   ├── (dashboard)/         # Protected dashboard routes
│   ├── api/                 # API routes (OAuth, webhooks)
│   ├── book/[slug]/         # Public booking portal
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── bookings/            # Booking calendar & list
│   └── forms/               # Form components
├── lib/
│   ├── db/                  # Database schema & client
│   ├── auth/                # Authentication helpers
│   ├── hitpay/              # HitPay API client & OAuth
│   └── utils.ts             # Utility functions
├── middleware.ts            # Route protection middleware
├── vercel.json              # Vercel deployment config
├── drizzle.config.ts        # Drizzle ORM config
├── .env.example             # Environment variables template
└── README.md                # This file
```

## Troubleshooting

### "Invalid session" on every page

- Ensure `SESSION_SECRET` is set and is exactly 32 characters (hex format)
- Restart the dev server after updating `.env.local`

### HitPay OAuth redirect loop

- Confirm `NEXT_PUBLIC_APP_URL` matches your current domain (localhost:3000 or Vercel URL)
- Verify the **Redirect URI** in HitPay App Builder matches `{NEXT_PUBLIC_APP_URL}/api/oauth/callback`

### Webhooks not firing

- Webhooks require `HITPAY_WEBHOOK_SALT` to be set correctly
- For local testing, use ngrok and update `NEXT_PUBLIC_APP_URL`
- Check browser console and server logs for signature verification errors

### Database errors after deployment

- Ensure `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set in Vercel env vars
- Run migrations: `npm run db:migrate` before or after deployment

## License

MIT

## Support

For questions or issues, open an issue on GitHub or contact the HitPay team.
