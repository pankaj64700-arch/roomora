# RoomOra — Architecture

## Architecture principles
- Feature-first organization with shared UI primitives.
- Supabase is the source of truth for persistent application data.
- React components own presentation; hooks/services own data operations.
- RLS is the security boundary for user-owned data.
- Shared marketplace behavior lives in one reusable layer.

## Frontend layers
```text
Pages / Panels
  ↓
Feature components
  ↓
Shared UI components
  ↓
Hooks / domain utilities
  ↓
Supabase client
  ↓
Postgres / Storage / Auth
```

## Marketplace structure
```text
components/marketplace/
  marketplace.js
  MarketplaceCard.jsx
  MarketplaceFilters.jsx
  MarketplaceImage.jsx

hooks/
  useMarketplaceItems.js
  useSavedItems.js

pages/panels
  Marketplace
  Saved Items
  My Published Items
  Publish Item
```

## Shared UI
`components/ui` contains reusable Modal, EmptyState, and future Button/Input/Toast/Badge primitives.

## Styling
`styles/design-tokens.css` is the source for colors, spacing, radii, shadows, easing and durations. `styles/ui.css` contains reusable UI behavior. Feature CSS may compose these tokens but should not redefine global design decisions.

## Data model
- `marketplace_items`: listing records.
- `marketplace_favorites`: user saves.
- `marketplace_inquiries`: buyer/user inquiries.
- `token_transactions`: token ledger.
- Supabase Storage: marketplace listing images.

## Security
- Authenticated operations use the current authenticated user.
- Ownership is enforced by Supabase RLS, not only frontend checks.
- Public marketplace reads expose only listings intended to be publicly discoverable.
- Never put service-role secrets in the frontend.

## Data flow
```text
Publish → Storage upload → marketplace_items → public/authorized query
Save → marketplace_favorites
Inquire → validated RPC / marketplace_inquiries
Edit/Delete → owner-only RLS mutation
```
