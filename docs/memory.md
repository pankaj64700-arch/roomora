# RoomOra — Project Memory

## Purpose
This file records durable project decisions, completed work, important implementation context, and lessons from previous work so future sessions can continue without reconstructing decisions from chat history.

## Current product state
- Signed-in users should land in Marketplace rather than a generic overview.
- Marketplace is for discovery, search, filtering, viewing, saving, and inquiries.
- My Published Items is the dedicated ownership/CRUD area.
- Saved Items contains saved listings across marketplace categories, not only rooms.
- New published listing images should flow from Supabase Storage into marketplace records and then appear on public landing discovery when the listing is active/published/non-expired.
- Marketplace search must work across listing content and location: users can search within a city and within areas/localities of that city.

## Completed project work
### Marketplace
- Marketplace was established as the primary signed-in discovery experience.
- Saved items were expanded from room-only behavior to all supported marketplace categories.
- A dedicated My Published Items area was established for ownership-based edit/delete/CRUD operations.
- Marketplace publishing, saving, and ownership boundaries were separated so marketplace discovery does not become an ownership-management surface.
- The publishing transaction-type constraint issue was identified and addressed at the database/schema level so the marketplace publishing charge can use an allowed transaction type.
- `MarketplacePanel` was audited and refactored into focused `MarketplaceToolbar` and `MarketplaceRows` components while preserving existing marketplace behavior.
- The refactor explicitly preserves search across `title`, `description`, `locality`, and `city`.

### Landing page
- Published marketplace listings are intended to appear on landing-page discovery when their records and image access are valid.
- Empty category sections were identified as a poor UX and the landing experience was changed toward rendering only categories with meaningful results.

### Reusable architecture
- Shared marketplace definitions/utilities were introduced under `src/components/marketplace/marketplace.js`.
- `MarketplaceImage` was introduced to centralize image resolution and fallback behavior.
- `MarketplaceFilters` was introduced for shared category filtering.
- `MarketplaceCard` was introduced for reusable listing presentation and contextual actions.
- `useMarketplaceItems` was introduced for shared marketplace data access.
- `useSavedItems` was introduced for saved-item retrieval and toggle behavior.
- Landing marketplace and Saved Items were migrated toward the shared marketplace components/hooks.
- Shared UI primitives were started with `Modal` and `EmptyState`.
- `MarketplaceToolbar` and `MarketplaceRows` were added as focused marketplace presentation components.

### Design system
- `src/styles/design-tokens.css` was introduced as the canonical visual-token layer.
- `src/styles/ui.css` was introduced for reusable UI primitives, interaction states, transitions, focus treatment, and reduced-motion behavior.
- `docs/design.md` was expanded into the project's design-system specification.
- The design direction is calm, clear, modern, practical, and low-noise rather than visually crowded.
- The UI must feel comfortable-density: neither cramped/tight nor excessively spacious.
- Android/mobile UX is a first-class requirement.
- For naturally card-based discovery collections, horizontal scrolling/rails are preferred over unnecessarily stacking long collections vertically.

## Architecture decisions
- Use reusable components and hooks rather than duplicated page implementations.
- Marketplace category/image/formatting logic is centralized under `components/marketplace/marketplace.js`.
- Shared marketplace data access belongs in hooks rather than page components.
- Global visual decisions belong in design tokens.
- Shared UI primitives belong under `components/ui`.
- Page-specific CSS should consume shared tokens where possible rather than introducing arbitrary colors, spacing, shadows, radii, or motion values.
- Refactors should be incremental so existing working flows are not broken by a large rewrite.
- Marketplace location search is a first-class product requirement: preserve both `locality`/area and `city` in search/filter logic.

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
- A previous design-system update attempt did not commit because the GitHub update call lacked the correct current file SHA. Do not claim a repository change is committed unless the write tool confirms it.

## Current refactor direction
The next production-cleanup work should migrate existing screens gradually onto the shared system:
1. Extract shared Button/Input/Badge/Search/Toast primitives.
2. Migrate My Published Items and publishing/edit forms onto shared marketplace/form components.
3. Migrate dashboard styles onto design tokens.
4. Remove duplicated marketplace CSS and business logic after replacement is verified.
5. Verify responsive behavior, Android touch behavior, horizontal discovery rails, location search, and loading/empty/error/success states.
6. Run build/lint/tests and production verification before declaring a refactor complete.

## Working rules
- Keep changes focused.
- Inspect current files before modifying them.
- Follow `docs/prd.md`, `docs/architecture.md`, `docs/rules.md`, `docs/design.md`, and `docs/tasks.md` before substantial work.
- Work on one clearly defined task at a time.
- Do not silently bundle unrelated features.
- Reuse existing components/hooks before creating new ones.
- Preserve working behavior during refactors.
- Update this memory only for durable decisions, important completed work, significant discoveries, or constraints that future sessions should know.
