# RoomOra — Product Requirements Document

## Product
RoomOra is a marketplace and room-discovery platform for students and young renters. The product combines room discovery with a broader marketplace for rooms, furniture, stationery, second-hand goods, and other useful items.

## Product goals
- Make marketplace discovery the primary signed-in experience.
- Let users publish, manage, save, and inquire about marketplace listings.
- Keep public landing-page discovery useful without requiring sign-in for basic browsing.
- Make the product production-ready, consistent, accessible, responsive, and maintainable.

## Core user journeys
1. Visitor → landing page → browse marketplace → sign in → marketplace.
2. User → marketplace → search/filter → open listing → save or inquire.
3. User → publish → upload images → listing becomes published → listing appears in marketplace and landing page.
4. User → My Published Items → edit/delete/manage own listings.
5. User → Saved Items → view/remove any saved marketplace category.

## Marketplace rules
- Categories include rooms, furniture, stationery, second-hand items, and other marketplace items where supported by the database.
- Only active, published, non-expired listings are publicly discoverable.
- Saving is separate from ownership and is available from marketplace discovery surfaces.
- Users can CRUD only their own published listings.
- Inquiry creation must verify listing availability and prevent self-inquiries.

## Quality requirements
- Responsive desktop/mobile UX.
- Reusable components and design tokens.
- Supabase-backed persistence and RLS.
- Clear loading, empty, error, and success states.
- Reduced-motion support.
- No duplicate business logic where a shared abstraction is appropriate.

## Non-goals
Do not add unrelated product features while a task is in progress unless explicitly requested or required for correctness/security.
