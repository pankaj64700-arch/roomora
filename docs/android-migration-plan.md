# RoomOra Android migration and audit plan

## Current approach

- Keep the existing React/Vite application as the shared UI source.
- Add Capacitor Android project files in a later, reviewed change.
- Use cloud CI (GitHub Actions hosted runners) for builds so the developer computer does not need Android Studio or a local emulator.
- Reuse the existing Supabase project only after auth, publishing, RLS and chat checks pass.
- Use the supplied Android screen designs as the UI reference: warm neutral backgrounds, green accent, image-led cards, horizontal category chips, compact bottom navigation, and clear listing details.
- Build/test a debug APK first; create a signed Android App Bundle (AAB) only after end-to-end testing.

## Decisions confirmed by product owner

- Google OAuth should be the recommended login flow.
- The mobile app should not offer PhonePe or QR-based subscriptions and should be free to use.
- Keep the existing web experience and historical payment/subscription records intact unless a separate reviewed change is approved.
- Required features: login/logout, saved items, publishing, token accounting, search/filter, navigation, and two-way chat.
- Add clear feedback screens/states: welcome, saved, published, deleted, verified, 404, email not verified where applicable, and generic errors.
- Publishing form must remain usable with the Android keyboard visible.
- Do not modify production or deploy during this branch review.

## Read-only audit findings

1. `src/main.jsx` used email/password as the only visible authentication method. A Google OAuth button has been added on this branch, but provider enablement and Android redirect/deep-link setup are still external configuration steps.
2. `src/PublishItemPanel.jsx` charges five tokens and the database `publish_item` functions also enforce a five-token balance. Removing only the UI check would not make publishing free.
3. `src/SubscriptionsPanel.jsx` still contains PhonePe checkout, payment verification, and AutoPay cancellation code. It has not been removed because web/mobile separation must be implemented without accidentally changing web billing or historical records.
4. `token_transactions_transaction_type_check` allows `initial_free`, `premium_monthly`, `advertisement`, `refund`, `adjustment`, and `marketplace_item`. The earlier publishing failure should be reproduced and traced through the exact RPC and grant path before changing the constraint.
5. `useSavedItems`, `SavedItemsPanel`, `MyListingsPanel`, and `ChatPanel` exist. Their presence is not proof of end-to-end success; they need functional tests against the actual backend.
6. The security advisor reports exposed `SECURITY DEFINER` functions with broad execute grants, tables with RLS enabled but no policies, a security-definer view warning, and leaked-password protection disabled. A branch-only migration was added to restrict several RPC execute grants. It has not been applied to Supabase.
7. Existing CI uses `npm install` and has no checked-in lockfile in the root configuration. CI was updated on this branch to use Node 22 and to run on fix branches. Dependency versions still need to be pinned and a lockfile committed before release.
8. Android-specific OAuth callback handling, keyboard resizing, safe areas, file selection/upload, back navigation, and chat realtime behavior have not yet been tested on a device.

## Important security design constraint: free mobile access

A client-side `isAndroid` flag or an arbitrary RPC parameter is not trustworthy: a web client can imitate it. Do not remove the server-side token requirement or make publishing globally free until a safe server-enforced policy is chosen.

Options to evaluate:
- Make publishing free on every platform (simplest, but changes web behavior).
- Keep tokens for web and implement a server-verified mobile entitlement/attestation strategy (more work and platform-specific testing).
- Make mobile usage free but retain tokens as informational bookkeeping only, if all token-spending actions are deliberately removed from the mobile product and server authorization is designed accordingly.

The current branch does not yet implement any of these choices server-side.

## Security migration notes

`supabase/migrations/20261016090000_harden_rpc_execute_permissions.sql` is proposed only. It restricts anonymous execution and limits arbitrary-user free-token allocation and maintenance functions to `service_role`. Review all application and signup flows before applying it. Do not apply migrations to production as part of this branch audit.

## Phases

1. **Audit/fix branch:** correct Google sign-in entry point and short-screen publishing modal; review the proposed SQL permission changes; stabilize dependencies; run remote CI.
2. **Backend contract:** resolve the transaction constraint issue, choose the mobile-free policy, verify RLS and privileged functions, and test publish/save/delete/chat against a non-production environment.
3. **Capacitor shell:** add pinned Capacitor dependencies, Android project files, app ID, icon/splash, status/navigation bars, keyboard resize and app back behavior.
4. **Device QA:** install debug APK on a real Android phone; test Google login, session restore, image picker/upload, publishing, search, saved items, edit/delete, and two-way chat.
5. **Release:** signed AAB, privacy/data-safety declarations, store listing, screenshots, and Play Console review. Do not publish before owner approval.

## Release gate

No production deployment, Supabase migration, subscription/payment deletion, or Play Store release without a separate review and explicit approval.
