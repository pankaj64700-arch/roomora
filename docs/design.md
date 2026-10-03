# RoomOra — Design System

## 1. Design principles
RoomOra should feel calm, trustworthy, modern, lightweight, practical, and human. Clarity takes priority over decoration.

### Core principles
1. **Clarity first** — users should understand what a page does within seconds.
2. **Consistency** — the same action looks and behaves the same everywhere.
3. **Progressive disclosure** — show essential information first; reveal detail when useful.
4. **Low visual noise** — avoid excessive borders, shadows, gradients, animation, and competing colors.
5. **Content first** — marketplace imagery and listing information are the visual focus.
6. **Responsive by default** — desktop and mobile are first-class layouts.
7. **Accessible by default** — keyboard, screen-reader, contrast, reduced-motion, and touch considerations belong in component design.

## 2. Source of truth
Canonical visual tokens live in `src/styles/design-tokens.css`.
Reusable UI primitives live under `src/components/ui/`.
Reusable marketplace components live under `src/components/marketplace/`.
Shared marketplace logic belongs in hooks/utilities rather than page components.

Do not create one-off visual values when an existing token expresses the same semantic role.

## 3. Color system
Use semantic tokens rather than hard-coded colors.

- `--color-bg` — application background.
- `--color-surface` — cards, panels, inputs, modals.
- `--color-surface-soft` — subtle secondary surfaces.
- `--color-ink` — primary text.
- `--color-muted` — secondary text and metadata.
- `--color-accent` — primary RoomOra action/brand color.
- `--color-accent-hover` — hover/pressed accent state.
- `--color-accent-soft` — low-emphasis accent backgrounds.
- `--color-danger` / `--color-danger-soft` — destructive/error states.
- `--color-warning` — warning/incomplete state.
- `--color-line` — borders and dividers.

Do not use color alone to communicate meaning; pair it with text, iconography, or state.

## 4. Typography
Use the project's established typography rather than page-specific font stacks.

Hierarchy:
- Display — landing/product hero only.
- H1 — page title.
- H2 — major section.
- H3/H4 — cards and subsections.
- Body — primary content.
- Small — metadata/helper text.
- Label — controls/status/eyebrows.

Headings should have clear hierarchy and restrained letter spacing. Body text should optimize readability. Metadata may be smaller but must remain readable on mobile. Avoid all-caps for long user-facing copy.

## 5. Spacing and layout
Use the shared spacing tokens rather than arbitrary margins/padding.

Preferred structure:
```text
Page
 └── Container
      ├── Header / toolbar
      ├── Main content
      └── Supporting content
```

Keep content widths readable, align repeated sections to shared container edges, maintain vertical rhythm, avoid unnecessary nested cards, and preserve safe page padding on narrow screens.

## 6. Radius, borders, and elevation
Use shared radius tokens consistently: small for controls, medium for inputs/compact cards, large for major cards/panels, and XL for prominent feature surfaces.

Use borders for structure and shadows for hierarchy. Do not stack heavy borders and heavy shadows without a clear reason.

## 7. Buttons
Use shared button primitives.

- **Primary** — one main action per local context.
- **Secondary** — alternative/supporting action.
- **Danger** — destructive action.
- **Quiet/icon** — low-emphasis actions.

Buttons need clear labels unless an icon has an accessible name. Disabled states must remain readable. Destructive actions must not look identical to primary actions. Avoid multiple competing primary buttons in one compact context.

## 8. Forms and inputs
Reusable form controls provide visible labels, useful placeholders, clear focus, validation/error state, disabled/loading state where needed, appropriate input types, and keyboard-friendly interaction.

Errors should explain what went wrong and, where possible, how to fix it.

## 9. Cards
Cards should group related information, not merely decorate.

Marketplace cards consistently support image, category/status, title, short description, price, location, relevant date/expiry, and contextual actions.

Do not create separate visual implementations of the same marketplace card for landing, marketplace, saved items, and my listings unless their interaction requirements genuinely differ.

## 10. Marketplace imagery
Use the shared `MarketplaceImage` component and image resolver.

Image priority:
1. uploaded `image_url`
2. first available `image_urls` entry
3. category fallback only when an uploaded image is unavailable

Use `object-fit: cover` for listing thumbnails, lazy-load below-the-fold images, provide a meaningful fallback, and reserve known image dimensions to reduce layout shift.

## 11. Filters, search, and sorting
Use shared filter components and centralized category definitions.

- Show only meaningful categories/results in discovery layouts.
- Do not render empty category sections when browsing all categories.
- Make the active filter obvious.
- Provide a clear empty state for a selected category with no results.
- Search and filters must compose predictably.

## 12. Modals and dialogs
Use the shared `Modal` component.

Dialogs must have an accessible name, support Escape where appropriate, prevent accidental background interaction, manage page scroll, provide an obvious close action, and remain usable on small screens. Use modals for focused tasks rather than whole pages that deserve navigation.

## 13. Loading, empty, error, and success states
Every data-driven screen must explicitly design these states.

**Loading:** prefer skeletons when layout is predictable; avoid unnecessary full-page spinners.

**Empty:** explain what is empty and what the user can do next when useful.

**Error:** explain the failed operation in plain language, preserve input where practical, and offer retry/recovery where possible. Never expose raw database errors as the primary user-facing message.

**Success:** confirm meaningful mutations such as publish, save, update, or delete without unnecessary interruption.

## 14. Motion and transitions
Canonical motion tokens live in `design-tokens.css`.

Motion should communicate cause/effect, reinforce hierarchy, clarify state changes, and remain short/subtle for routine interactions.

Preferred uses include hover elevation, filter transitions, modal entrance/exit, skeleton shimmer, list/item reveal, and save-state feedback.

Avoid continuous decorative animation, large unexpected movement, animation that delays core tasks, or competing motion effects. Always honor `prefers-reduced-motion`.

## 15. Interaction states
Every reusable interactive component should consider: default, hover, focus-visible, active/pressed, disabled, loading, success, error, and empty where applicable.

Keyboard focus must remain visible and must not rely only on color.

## 16. Accessibility baseline
- Use semantic HTML whenever practical.
- Every form control needs an accessible label.
- Icon-only controls need an accessible name.
- Interactive elements must be keyboard reachable.
- Focus indicators must be visible.
- Do not rely on color alone for state.
- Maintain readable contrast.
- Touch targets should be comfortably usable on mobile.
- Respect reduced-motion preferences.
- Informative images need useful alternative text; decorative images should not create unnecessary screen-reader noise.
- Dialogs and menus must expose appropriate semantics.

## 17. Responsive behavior
Design from content constraints, not device-specific hacks.

### Mobile
Prioritize one-column layouts, use horizontal scrolling for compact collections where appropriate, keep actions reachable without precision tapping, avoid dense toolbars, and allow long content to wrap.

### Tablet
Progressively increase grid columns and content width while preserving comfortable spacing.

### Desktop
Use available width without excessively long reading lines, support multi-column discovery layouts, and keep primary actions visually anchored.

## 18. Notifications and feedback
Use one consistent notification/toast pattern for transient feedback. Notifications should be short, specific, non-blocking unless action is required, and distinguishable by semantic state.

Do not duplicate the same success message in both a toast and persistent banner without a clear reason.

## 19. Content and microcopy
Use plain, direct language. Prefer action labels such as `Save`, `Edit`, `Delete`, `Publish`, and `Send inquiry`. Avoid ambiguous labels such as `Proceed` when the actual action can be named. Empty states should be helpful rather than apologetic. User-facing errors should describe the failed operation rather than expose raw database errors.

## 20. Component reuse rule
Before creating a new UI component, check whether an existing primitive can be extended safely.

Before creating page-specific marketplace UI, check `MarketplaceCard`, `MarketplaceImage`, `MarketplaceFilters`, marketplace utilities, marketplace hooks, and shared UI primitives.

If the same behavior appears in two or more surfaces, prefer extracting a reusable component or hook.

## 21. Production quality gate
A design change is not complete until it considers:
- responsive behavior
- loading/empty/error/success states
- keyboard/focus behavior
- reduced motion
- visual consistency with tokens
- reuse opportunities
- no unnecessary duplicated CSS
- no accidental regression of existing flows
