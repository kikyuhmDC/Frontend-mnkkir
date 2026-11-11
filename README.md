# Orderly — Frontend

Next.js 16 + ShadCN UI frontend for **Orderly**, an e-commerce order &
inventory management system. It authenticates against the NestJS backend
(`../Backend`) using JWT access/refresh tokens and manages every backend
entity: users, categories, products, orders, order items, customers,
addresses, deliveries and payments.

## Requirements

- Node.js 20+
- The NestJS backend running on `http://localhost:3001`
  (see `../Backend/README.md` — the MySQL schema must be imported first)

## Setup

```bash
npm install
```

The API base URL is configured in `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the frontend runs on
port **3000** and the backend occupies **3001**.

Sign in with the seeded demo account:

| Username | Password   | Role  |
| -------- | ---------- | ----- |
| `admin`  | `admin123` | admin |
| `cashier`| `cashier123` | user |

## Features

- **Authentication** — register, login, logout and silent token refresh
  (`/auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh`).
  Tokens live in `localStorage`; a lightweight `orderly_session` cookie lets
  `proxy.ts` guard `/dashboard/*` routes optimistically, while
  `components/auth-guard.tsx` re-verifies the session on the client.
- **Auto-refresh on 401** — the API client (`lib/api.ts`) retries failed
  requests once after refreshing the access token (single-flight).
- **Dashboard** — KPI cards (products, orders, customers, completed revenue),
  recent orders and a payments-by-status breakdown.
- **Full CRUD on all 9 entities** — one generic `EntityCrud` component driven
  by declarative configs in `lib/entities.tsx` powers every entity page
  (search, create, edit, delete, dynamic dropdowns backed by related tables).
- **ShadCN UI** — dialog, alert-dialog, select, dropdown-menu, sidebar,
  table, card, badge, sonner toasts, light/dark/system theming.

## Project structure

```
app/
  page.tsx                  # Landing page (marketing)
  login/, register/         # Auth forms
  dashboard/
    layout.tsx              # Sidebar + header + auth guard shell
    page.tsx                # Overview stats
    products/ categories/ orders/ order-items/
    customers/ addresses/ deliveries/ payments/ users/
components/
  auth-provider.tsx        # Auth context (login/register/logout)
  auth-guard.tsx            # Client-side route guard
  entity-crud.tsx           # Generic CRUD table + form dialog
  app-nav.tsx               # Sidebar navigation
  app-header.tsx            # Dashboard header (user menu, theme toggle)
  providers.tsx             # Theme + auth + toaster providers
lib/
  api.ts                    # Fetch client w/ Bearer token + refresh-on-401
  auth-storage.ts           # Token storage + session cookie sync
  entities.tsx              # Entity configs (fields, columns, options)
  types.ts, format.ts       # Shared types & formatters
proxy.ts                    # Route protection (Next 16 middleware)
```

## Notes

- The backend answers invalid credentials with HTTP 200 + `{ error }` — the
  login form checks for this before treating the response as a success.
- Duplicate usernames on `/auth/register` surface as MySQL 500 errors —
  mapped to a friendly "username already taken" message.
- Blank password on the Users page means "keep the current password".
