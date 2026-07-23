# SQLite → Supabase (Postgres) Migration

**Date:** 2026-07-23  
**Status:** Approved

## Overview

Migrate the database layer from a local SQLite file (`byutee.db`) to a hosted Supabase Postgres instance, enabling Vercel deployment. The ORM (Drizzle) and all query code remain unchanged — only the driver and schema type imports are swapped.

## Goals

- Replace `better-sqlite3` with `postgres` (postgres.js) as the Drizzle driver
- Update schema from SQLite types to Postgres types
- Use Supabase's Transaction mode connection pooler (port 6543) for Vercel serverless compatibility
- Keep existing custom email/password auth untouched

## Out of Scope

- Supabase Auth, Storage, or Realtime
- Changes to application query logic (all 21 DB-using files stay the same)
- Data migration (no existing production data to migrate)

## Architecture

```
Vercel Serverless Function
        │
        ▼
lib/db/index.ts  (postgres.js driver)
        │
        ▼
Supabase Postgres (Transaction pooler, port 6543)
https://gicxczkoffpmuptiamoq.supabase.co
```

## Changes

### 1. Dependencies

- Remove: `better-sqlite3`, `@types/better-sqlite3`
- Add: `postgres`

### 2. `lib/db/schema.ts`

Replace SQLite imports and table definitions with Postgres equivalents:

| SQLite | Postgres |
|---|---|
| `sqliteTable` | `pgTable` |
| `text` | `text` |
| `integer` | `integer` |
| `real` | `doublePrecision` |
| `sql\`(datetime('now'))\`` | `sql\`now()\`` |

### 3. `lib/db/index.ts`

```ts
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
```

### 4. `drizzle.config.ts`

Change dialect from `sqlite` to `postgresql`. Use `DATABASE_URL` env var for credentials.

### 5. Environment Variables

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase Transaction pooler URL (Settings → Database → Connection string, mode: Transaction, port 6543) |

Set locally in `.env.local`, and in Vercel project settings for deployed environments.

### 6. Schema Push

Run `npx drizzle-kit push` to create tables in Supabase. No migration files needed at this stage.

## Files Changed

- `package.json` — dependency swap
- `lib/db/schema.ts` — SQLite → Postgres types
- `lib/db/index.ts` — driver swap
- `drizzle.config.ts` — dialect + credentials
- `.env.local` — add `DATABASE_URL`
