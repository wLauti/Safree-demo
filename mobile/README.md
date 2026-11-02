# Safree Mobile (React Native / Expo)

Native iOS & Android companion app for Safree. It shares the **same Supabase
backend** as the web app — same database, auth, and Row Level Security — so any
account works across web and mobile.

## Stack
- **Expo** (managed workflow) + React Native + TypeScript
- **@supabase/supabase-js** with AsyncStorage session persistence
- **React Navigation** (auth stack + bottom tabs)
- **Leaflet in a WebView** for the map (CARTO/OpenStreetMap tiles — no API key, no WebGL), matching the web app

## What's implemented
| Area | Status |
|---|---|
| Email/password sign in & sign up | ✅ native |
| Session persistence across launches | ✅ |
| Marketplace (products) browse | ✅ native list |
| Experiences browse | ✅ native list |
| Map of cotos / grounds | ✅ Leaflet WebView |
| Account hub | ✅ (links to web for orders/bookings/settings) |
| Checkout, booking, dashboards | ↗︎ opens the web app for now |

These deep flows (Stripe checkout, booking, store/admin dashboards) open the
deployed web site via `EXPO_PUBLIC_WEB_URL`. They are candidates for future
native screens.

## Setup
```bash
cd mobile
npm install
cp .env.example .env       # fill in the SAME Supabase URL + anon key as the web app
npm start                  # then press i (iOS), a (Android), or scan the QR with Expo Go
```

### Environment variables
Expo only exposes variables prefixed with `EXPO_PUBLIC_`:
- `EXPO_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — the anon public key
- `EXPO_PUBLIC_WEB_URL` — deployed web app URL for fallback flows (default `https://safree.com`)

> Never put the service-role key in the mobile app — only the anon key, exactly
> like the web client.

## Project structure
```
mobile/
├─ App.tsx                  # entry: providers + navigator
├─ app.json                 # Expo config
├─ src/
│  ├─ lib/
│  │  ├─ supabase.ts        # shared client (AsyncStorage session)
│  │  ├─ geo.ts             # PostGIS EWKB → [lng,lat] decoder (ported from web)
│  │  └─ types.ts           # shared shapes + formatCurrency
│  ├─ context/AuthContext.tsx
│  ├─ navigation/RootNavigator.tsx
│  ├─ screens/              # Login, Register, Products, Experiences, Map, Account
│  └─ theme.ts              # colors/spacing mirroring the web theme
```

## Notes
- The app reads `experiences.location_coords`, which PostgREST returns as an EWKB
  hex string; `src/lib/geo.ts` decodes it (same logic as the web `lib/utils/geo.ts`).
- RLS lets the anon key read only `active` listings, so the browse screens work
  without elevated permissions — the same policies the web app relies on.
