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

Apply the two `roommate_expenses` and `roommate_ledger_cleanup` migrations
in order to the Supabase project used by the frontend. Deploy the
`finance-ledger-cleanup` Edge Function with gateway JWT verification disabled.
The function authenticates its scheduled calls with a dedicated Vault secret.
Register cleanup as the database administrator after deploying the function:

```sql
select finance_internal.schedule_cleanup('https://YOUR_PROJECT_REF.supabase.co');
```

Open **Roommate expenses** after signing in. Create a room, copy the invitation
link, and share it with your roommates. Roommates sign in and choose **Join room**.
Anyone with the current link and a RoomOra account can join, so share it privately.
The creator can replace the link after everyone joins.

Expenses count toward balances once every other roommate on the expense approves
them. New roommates split expenses logged after they join. The balances and
suggested payments use approved expenses and allocate any leftover paise so the
full total is accounted for. Roommates can use **Refresh room** to see new activity.

Each monthly ledger uses Asia/Kolkata time and opens on the 1st. Approval
ends at the month boundary and pending expenses stay outside balances. The
previous month is read-only through the 10th of the following month for
roommates who were members before it closed. They can download a PDF statement
during that window. Access ends at midnight starting the 11th. The scheduled
cleanup deletes expired expense rows and removes associated files through the
Storage API, while preserving rooms, members, and invite links.
