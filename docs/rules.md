# RoomOra — Engineering Rules

## Scope control
1. Work on one clearly defined task at a time.
2. Do not silently bundle unrelated features.
3. Before changing an existing feature, inspect the current implementation.
4. Preserve working behavior unless the task explicitly changes it.

## Reuse
5. Reuse existing components, hooks, utilities, and tokens before creating new ones.
6. Do not duplicate marketplace category definitions, image logic, formatting, or CRUD logic.
7. New global UI patterns belong in `components/ui` and shared styles.
8. Feature-specific behavior belongs with the feature, not in global CSS.

## Data and security
9. Supabase is the persistent source of truth.
10. Never rely on frontend ownership checks as the only security control.
11. Add/maintain RLS for user-owned data.
12. Do not expose secrets or service-role credentials client-side.
13. Validate transactional operations in the database where appropriate.

## UX
14. Every async operation needs loading/error/success handling where relevant.
15. Empty states should be intentional and contextual.
16. Do not render empty category sections when no data exists.
17. Images need graceful fallback behavior.
18. Interactive controls need keyboard/focus states.
19. Respect `prefers-reduced-motion`.
20. Maintain responsive behavior.

## Code quality
21. Prefer small components with one responsibility.
22. Keep business/data logic out of presentation components where a hook/service is appropriate.
23. Avoid magic values; use design tokens/configuration.
24. Remove obsolete code after migration instead of leaving competing implementations.
25. Verify builds/tests and relevant production paths before declaring a task complete.

## Git
26. Make focused commits with descriptive messages.
27. Do not overwrite a file based on stale content; fetch current content first.
28. Do not claim deployment verification without actually verifying deployment.
