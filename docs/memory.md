# RoomOra — Project Memory

## Purpose
This file records durable project decisions and important implementation context so future work can continue without reconstructing decisions from chat history.

## Current product state
- Signed-in users should land in Marketplace rather than a generic overview.
- Marketplace is for discovery, search, filtering, viewing, saving, and inquiries.
- My Published Items is the dedicated ownership/CRUD area.
- Saved Items contains saved listings across marketplace categories, not only rooms.
- New published listing images should flow from Supabase Storage into marketplace records and then appear on public landing discovery when the listing is active/published/non-expired.

## Architecture decisions
- Use reusable components and hooks rather than duplicated page implementations.
- Marketplace category/image/formatting logic is centralized under `components/marketplace/marketplace.js`.
- Shared marketplace data access is moving into hooks.
- Global visual decisions belong in design tokens.
- Shared UI primitives belong under `components/ui`.

## Security decisions
- User-owned marketplace mutations must be protected by Supabase RLS.
- Public landing reads should expose only intentionally public active listings.
- Inquiry creation must be validated and self-inquiry must be blocked.
- Token transactions must use transaction types allowed by the database constraint.

## Known implementation history
- A publishing error occurred because `marketplace_item` was not allowed by the `token_transactions_transaction_type_check`; the schema was updated to support the marketplace charge.
- Landing marketplace image visibility required a public read policy for appropriate marketplace listings.
- Empty category sections were identified as a UX problem; categories with zero results should not render as empty sections.
- The Vercel integration previously returned a 403 for deployment/log access; deployment should not be described as verified unless the integration actually permits verification.

## Working preference
Keep changes focused, inspect current files before modifying them, use the task board to avoid mixing unrelated work, and preserve working behavior during refactors.
