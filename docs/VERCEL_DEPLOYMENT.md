# Deploy Morrow Chess to Vercel

## Before deploying

Morrow Chess uses Next.js and is detected automatically by Vercel. It targets Node.js 24.x. No custom build command or output directory is needed.

Saved games need durable storage. Local development uses SQLite in `.data/chess.sqlite`; Vercel deployments use Postgres through `DATABASE_URL`. The app creates the `games` table on its first database request.

## Deploy from GitHub

1. Import `jaexmachine/morrow-chess` from the Vercel dashboard.
2. Keep the project root at `.` and the detected Next.js framework settings.
3. Add a Postgres integration from the Vercel Marketplace, such as Neon, and connect it to the project. Use a pooled connection string if the provider offers one.
4. Set the provider's connection string as `DATABASE_URL` for Production and Preview. Keep the value in Vercel's environment variable settings; never commit it.
5. Deploy. Vercel will build the project and create the `games` table the first time the games API is used.

The same `DATABASE_URL` can be added to `.env.local` when you want to run local development against the hosted database. Otherwise, leave it unset locally and use SQLite.

## Local Vercel preview

Install the Vercel CLI, link the project, pull its environment variables, then run `vercel dev`. The local development server can still be started with `npm run dev` and SQLite.

## Important prototype limitation

The app has no accounts or per-player authorization yet. A deployment connected to a database shares saved practice games between visitors, and the games API is publicly reachable unless the deployment is protected. Use Vercel Deployment Protection for private demos; add authentication and per-user data ownership before using it as a public multi-user service.
