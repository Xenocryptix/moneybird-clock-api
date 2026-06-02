# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A Next.js 16 (App Router, React 19) web app that lets employees clock in/out against the
Moneybird time-tracking API. A user selects who they are, enters a description + optional
project/contact, clocks in (creates a Moneybird time entry), and clocks out (sets `ended_at`).
The page also shows a per-day breakdown of the current week's hours.

## Commands

```powershell
npm run dev      # dev server via custom server.js on http://localhost:3000
npm run build    # next build (output in .next)
npm run start    # production server via server.js
npm run lint     # eslint (eslint-config-next, flat config)
```

There is **no test suite** in this repo.

Deploy to IIS (Windows): `./scripts/deploy.ps1` — runs `npm run build`, copies the build
artifacts + `.env` to `C:\inetpub\wwwroot\TheodenClient\Clock` (override with `-DeployPath`),
and runs `npm install --omit=dev` at the destination. Recycle the IIS App Pool afterward.

## Architecture

- **`server.js`** is a custom Node HTTP server wrapping Next.js. It is the entry point for
  both dev and prod (not `next start`). In production it runs under **iisnode** behind IIS —
  `PORT` is a named pipe, and `web.config` rewrites all non-static requests to `server.js`.
- **`app/actions.ts`** is the data layer: a `'use server'` module with all Server Actions and
  the `fetchMoneybird()` helper. Every Moneybird call goes through it. `BASE_URL` +
  `ADMINISTRATION_ID` form the request prefix; the bearer token comes from either the
  `REQUEST_TOKEN` env var (preferred, via `getPreferredAuthToken()`) or the `moneybird_token`
  cookie (per-user OAuth).
- **`app/page.tsx`** (server component) gates on `checkAuth()`. Unauthenticated → renders the
  login UI (`ClientAuthForm` + `ManualLoginForm`). Authenticated → fetches users/projects/
  contacts via `getData()` and renders `ClockInForm`.
- **`app/components/ClockInForm.tsx`** is the main client component: user picker, clock-in/out
  form, and weekly-hours summary. It calls the Server Actions directly and persists the
  selected user id in `localStorage` (`moneybird_user_id`).

## Authentication

Three ways a token lands in the `moneybird_token` httpOnly cookie:

1. **Built-in OAuth** — `GET /api/auth/login` redirects to Moneybird's authorize page using
   `CLIENT_ID`/`REDIRECT_URI` env vars; `GET /api/auth/callback` exchanges the code for a token.
2. **Bring-your-own OAuth app** — `ClientAuthForm` → `startManualAuth()` stashes the user's
   `clientId`/`clientSecret`/`redirectUri` in the short-lived `moneybird_oauth_config` cookie,
   then redirects to Moneybird. The callback reads that cookie to do the token exchange and
   computes the post-login redirect origin/basePath from `redirectUri` (and `x-forwarded-*`).
3. **Personal Access Token** — `ManualLoginForm` → `setManualToken()` stores a pasted token
   directly (400-day cookie).

OAuth scope requested is `time_entries settings`.

## Moneybird API notes

- Active entry detection (`getActiveEntry`): fetches `time_entries.json` with
  `filter=user_id:<id>,state:all,include_active:true` and finds the one with no `ended_at`.
  Note `user_id == userId` uses loose equality because Moneybird returns numeric ids.
- `clockIn` sets `started_at` to `Date.now() - 15000` (15s in the past) to avoid Moneybird
  "future date" errors from clock skew.
- Weekly data uses `filter=...,period:this_week,state:all`; hour bucketing is done client-side
  in `ClockInForm`.

## Environment variables

Set in `.env` (gitignored, copied to the IIS deploy target by the deploy script):

- `ADMINISTRATION_ID` — Moneybird administration id (**required**; `actions.ts` throws at
  module load if missing).
- `REQUEST_TOKEN` — optional server-side token; when set it overrides the per-user cookie for
  all API calls.
- `CLIENT_ID` / `CLIENT_SECRET` / `REDIRECT_URI` — for the built-in OAuth flow.
- `NEXT_PUBLIC_BASE_PATH` / `BASE_PATH` — app base path. Under iisnode (`IISNODE_VERSION` set)
  it defaults to `/TheodenClient/Clock` (see `next.config.js`). Changing the IIS deploy path
  means updating this default too.
