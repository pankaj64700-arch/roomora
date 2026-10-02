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
