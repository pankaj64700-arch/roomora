# RoomOra

RoomOra is a responsive room/PG discovery and student-essentials marketplace built with **React, Vite, JavaScript and Supabase**.

## Features visible in the frontend

- Public discovery pages for rooms, furniture, stationery and second-hand items.
- Email/password account registration, sign-in, and verification guidance.
- Tenant, owner, shop and administrator workspaces.
- Marketplace publishing, uploaded photos, saved items and listing management.
- Item inquiries, user-to-user chat and realtime message updates.
- Subscription plans, tokens and PhonePe checkout/status integration through Supabase Edge Functions.
- PWA install prompt, responsive navigation and account settings.

**Important:** A frontend route or redirect does not independently confirm email verification, listing publication, or payment settlement. Verify those outcomes through trusted Supabase Auth, database policies and payment functions.

## Local setup

Use a supported Node.js LTS version.

1. Run `npm install`.
2. Copy `.env.example` to `.env` and provide `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Run `npm run dev` for local development.
4. Run `npm test` for dependency-free status-routing checks.
5. Run `npm run build` to generate production assets.

Do not put service-role keys or payment secrets into `VITE_` frontend variables. Database tables, RLS policies, Storage permissions, RPC functions and Edge Functions require separate configuration.

## Status pages

| Route | Purpose |
| --- | --- |
| `/thank-you` and `/success` | Friendly general confirmation guidance. |
| `/thank-you?for=signup` | Email confirmation instructions. |
| `/thank-you?for=listing` | Listing status guidance. |
| `/thank-you?for=inquiry` | Inquiry status guidance. |
| `/email-verified` | Return-to-login guidance; not proof of verification. |
| `/payment/thank-you` | Check verified order and subscription status. |
| `/error` | Error recovery. |
| `/404` and `/not-found` | Missing-page navigation. |

The route copy is centralized in `src/lib/status-content.js` and rendered by `src/pages/StatusPage.jsx`.

## Security and testing notes

- Database Row Level Security and RPC authorization must enforce ownership and administrator privileges independently of client-side navigation.
- Token deductions and PhonePe payment outcomes must be verified and idempotent server-side.
- Confirm file upload limits, storage permissions and safe image handling before production release.
- The Node status tests validate route and copy logic only. Full application build, authenticated browser flows, payment callbacks and database integration must be checked in a configured environment.

## Original source

Repository: https://github.com/pankaj64700-arch/roomora
