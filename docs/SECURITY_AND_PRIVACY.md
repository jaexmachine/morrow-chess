# Security and privacy

## Data handled

Practice PGN/FEN and timestamps are written to `.data/chess.sqlite` on the local machine. The prototype has no account system and does not intentionally collect contact details. Sample dashboard data is illustrative.

## Safeguards in place

- `.env*`, `.data/`, build output, and dependency directories are ignored by Git.
- Games API inputs are type- and size-checked, move history is parsed with `chess.js`, and the submitted FEN must match the PGN.
- Mentor moves are validated against the supplied chess position before feedback is returned.
- CI uses read-only repository permissions by default; the release job alone receives `contents: write`.
- Third-party workflow actions are pinned to commit SHAs and Dependabot checks npm and GitHub Actions dependencies monthly.

## Known limitations

There is no authentication, rate limiting, remote database isolation, audit logging, or production privacy policy. Treat the prototype as local-only; do not submit sensitive personal information or rely on its local SQLite file for durable storage.

## Reporting

Use GitHub's private vulnerability reporting for this private repository. See [`SECURITY.md`](../SECURITY.md).
