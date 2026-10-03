# RoomOra — Task Board

## Current focus
### Production design-system and architecture cleanup
- [x] Add centralized design tokens.
- [x] Add reusable UI transition primitives.
- [x] Add reusable Modal and EmptyState.
- [x] Add reusable marketplace utilities.
- [x] Add reusable marketplace image/filter/card components.
- [x] Add shared marketplace and saved-items hooks.
- [x] Migrate landing marketplace to shared marketplace infrastructure.
- [x] Migrate saved-items UI to shared marketplace infrastructure.
- [x] Audit `MarketplacePanel` and split discovery controls/listing rails into focused components.
- [x] Preserve marketplace search across title, description, locality/area, and city during the refactor.
- [x] Extract reusable Button/Input/Badge/Search/Toast primitives.
- [x] Add Android-friendly shared touch sizing to UI primitives.

## Next
- [ ] Migrate My Published Items to shared marketplace card/form components.
- [ ] Migrate Publish Item to shared form primitives.
- [ ] Migrate dashboard styles onto design tokens.
- [ ] Remove duplicated/obsolete marketplace CSS and logic.
- [ ] Verify responsive states, especially Android touch and horizontal discovery rails.
- [ ] Run build/lint/tests.
- [ ] Verify production deployment separately from source changes.

## Backlog
- [ ] Centralize typography tokens.
- [ ] Centralize toast/notification system.
- [ ] Add standardized skeleton components.
- [ ] Add error boundary strategy.
- [ ] Add route/page loading states.
- [ ] Add automated UI smoke checks for core flows.

## Product-specific requirement
Marketplace search must support finding items within a city and its local areas/localities. Search behavior must continue to include both `locality` and `city` fields when filtering listings.

## Rule
Tasks should be completed in focused batches. Do not start multiple unrelated workstreams without recording them here.
