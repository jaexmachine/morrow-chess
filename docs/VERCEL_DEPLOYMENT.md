# Deploy Morrow Chess to Vercel

## Before deploying

Morrow Chess uses Next.js and is detected automatically by Vercel. It targets Node.js 24.x. No custom build command or output directory is needed.

The app can be deployed without a database or accounts. Practice sessions are saved in the visitor’s browser, so they remain on that device and browser only. The dashboard falls back to sample progress when server-side storage is not configured.

## Deploy from GitHub

1. Import `jaexmachine/morrow-chess` from the Vercel dashboard.
2. Keep the project root at `.` and the detected Next.js framework settings.
3. Deploy. Browser-local practice saves work without environment variables.

When you’re ready for shared, cross-device game history, connect a Postgres integration and set its pooled connection string as `DATABASE_URL` in Vercel. The games API creates its table on first use. For local development, leave the variable unset to use `.data/chess.sqlite`.

## Local Vercel preview

Install the Vercel CLI, link the project, pull its environment variables, then run `vercel dev`. The local development server can still be started with `npm run dev` and SQLite.

## Important prototype limitation

The app has no accounts. Browser-local saves are separate per browser profile and are cleared if that browser’s site data is removed. If you connect a shared database later, saved games will be shared between visitors until authentication and per-user ownership are added. Use Vercel Deployment Protection for private demos.
