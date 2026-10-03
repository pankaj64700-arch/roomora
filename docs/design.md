# RoomOra — Design System

## Design direction
RoomOra should feel calm, trustworthy, modern, lightweight, and practical. The interface should prioritize clarity over decoration.

## Design tokens
The canonical tokens live in `src/styles/design-tokens.css`.

### Palette
- Background: `--color-bg`
- Surface: `--color-surface`
- Soft surface: `--color-surface-soft`
- Ink: `--color-ink`
- Muted: `--color-muted`
- Accent: `--color-accent`
- Accent hover: `--color-accent-hover`
- Accent soft: `--color-accent-soft`
- Danger: `--color-danger`
- Warning: `--color-warning`
- Border: `--color-line`

Never introduce a new global color when an existing token expresses the same semantic role.

## Components
Prefer reusable primitives for:
- buttons
- inputs
- cards
- badges/status
- modal/dialog
- empty state
- loading/skeleton
- search
- filters
- toast/notifications

## Marketplace components
Use shared marketplace components for listing images, cards, filters, category labels, prices, and save actions.

## Motion
Use shared easing and duration tokens. Motion should communicate state or hierarchy, not distract. Always support reduced motion.

## Layout
- Use the shared spacing scale.
- Use consistent container widths.
- Use responsive grids/horizontal scrollers intentionally.
- Preserve touch-friendly targets on mobile.

## States
Every reusable interactive component should consider:
- default
- hover
- focus-visible
- active
- disabled
- loading
- error where applicable
- empty where applicable

## Accessibility
- Semantic HTML where practical.
- Visible keyboard focus.
- Labels for form controls.
- Accessible names for icon-only controls.
- Dialogs must manage Escape and focus/scroll behavior appropriately.
