# RoomOra

Student-focused marketplace for rooms/PGs, furniture, stationery, and second-hand items.

## Stack
- React + Vite
- Supabase Auth, Postgres, Storage, and Realtime
- GitHub Actions for remote build verification
- Capacitor Android migration planned (not yet added)

## Run locally
```bash
npm install
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your local environment. Never commit private service-role keys or payment credentials.

## Current audit branch
See [`docs/android-migration-plan.md`](docs/android-migration-plan.md) for confirmed requirements, read-only findings, migration risks, and the staged Android plan.

Google OAuth entry point and a short-screen publishing modal improvement are included on the audit branch. Google provider enablement and Android callback configuration are not yet completed. PhonePe and token gating remain in existing code pending a safe, server-enforced mobile-free policy; they have not been disabled on production.

## Build checks
GitHub Actions uses a hosted runner and Node.js 22 to install dependencies and run `npm run build`. The root package currently uses floating `latest` dependency versions and does not yet have a committed lockfile; pin dependencies and add a lockfile before release.

## Safety / release
The migration under `supabase/migrations/20261016090000_harden_rpc_execute_permissions.sql` is proposed only and has not been applied to Supabase. Do not deploy or apply it until signup, admin token grant, publishing, and maintenance workflows have been reviewed. Production deployment and Play Store release require a separate approval.
