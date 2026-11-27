# RoomOra

Responsive room discovery and marketplace application.

## Stack
- React.js + JavaScript
- Supabase
- Vercel
- GitHub
- Anime.js

## Current milestone
Initial responsive UI shell based on the RoomOra requirements and supplied reference notes. Supabase/auth/data flows are intentionally not wired until project credentials and the final token/subscription rules are configured.

## Run
```bash
npm install
npm run dev
```

## Automated build verification
GitHub Actions runs `npm install` and `npm run build` on pushes to `main` and pull requests targeting `main`. This provides a clean remote environment for dependency installation and production-build verification when local network access is unavailable.

## Roommate expenses

Apply `supabase/migrations/20261128090000_roommate_expenses.sql` to the
Supabase project used by the frontend before deploying the feature. It creates
the room and expense functions and the private receipt bucket.

Open **Roommate expenses** after signing in. Create a room, copy the invitation
link, and share it with your roommates. Roommates sign in and choose **Join room**.
Anyone with the current link and a RoomOra account can join, so share it privately.
The creator can replace the link after everyone joins.

Expenses count toward balances once every other roommate on the expense approves
them. New roommates split expenses logged after they join. The balances and
suggested payments use approved expenses and allocate any leftover paise so the
full total is accounted for. Roommates can use **Refresh room** to see new activity.
