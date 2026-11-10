# Security and privacy

## Data handled

Practice PGN/FEN and timestamps are written to local `.data/chess.sqlite`, or to the Postgres database configured by `DATABASE_URL`. The prototype has no account system and does not intentionally collect contact details. Sample dashboard data is illustrative.

## Safeguards in place

- `.env*`, `.data/`, build output, and dependency directories are ignored by Git.
- Games API inputs are type- and size-checked, move history is parsed with `chess.js`, and the submitted FEN must match the PGN.
- Mentor moves are validated against the supplied chess position before feedback is returned.
- CI uses read-only repository permissions by default; the release job alone receives `contents: write`.
- Third-party workflow actions are pinned to commit SHAs and Dependabot checks npm and GitHub Actions dependencies monthly.

## Known limitations

There is no authentication, rate limiting, per-player data isolation, audit logging, or production privacy policy. On a hosted deployment, saved games are shared through the configured database and the API is publicly reachable unless access to the deployment is protected. Do not submit sensitive personal information. See the [Vercel deployment guide](VERCEL_DEPLOYMENT.md) before exposing a deployment.

## Reporting

Use GitHub's private vulnerability reporting for this private repository. See [`SECURITY.md`](../SECURITY.md).
