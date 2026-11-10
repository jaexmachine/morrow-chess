# Morrow Chess

[![CI](https://github.com/jaexmachine/morrow-chess/actions/workflows/ci.yml/badge.svg)](https://github.com/jaexmachine/morrow-chess/actions/workflows/ci.yml)
![Version](https://img.shields.io/badge/version-0.1.0-lightgrey)
![License](https://img.shields.io/badge/license-All%20rights%20reserved-lightgrey)

A focused chess learning workspace that helps players understand the intent behind their moves and turn recurring mistakes into progress.

## Features

- Monochrome landing page with a scroll-responsive ASCII pawn.
- Interactive practice board with legal moves, undo, and position exploration.
- Rule-based mentor notes that explain the idea behind a move.
- Game review, move history, and progress views.
- Practice games saved in this browser, with optional server-side SQLite/Postgres storage.

## Quick start

**Requirements:** Node.js 24.x and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Practice at `/play`, review games at `/review`, view progress at `/progress`, and open the workspace dashboard at `/app`.

## Development

```bash
npm run typecheck
npm run build
npm start
```

Practice games save to this browser so they work on Vercel without a database or account. The games API also stores sessions in `.data/chess.sqlite` locally; set `DATABASE_URL` only if you later want shared server-side Postgres storage. See [Vercel deployment](docs/VERCEL_DEPLOYMENT.md) and [`.env.example`](.env.example).

## Deploy

Import the GitHub repository into Vercel and connect a Postgres Marketplace integration. See the [deployment guide](docs/VERCEL_DEPLOYMENT.md) for the required environment setup and prototype access limitations.

## API

| Endpoint | Purpose |
|---|---|
| `GET /api/chess/summary` | Learner summary, recent games, and skill snapshots |
| `POST /api/chess/mentor` | Validate a move and return a rule-based coaching note |
| `GET /api/chess/games` | List saved practice sessions |
| `POST /api/chess/games` | Save a validated PGN/FEN practice session |

## Documentation

Project architecture, Vercel deployment, reliability, security, roadmap, and contributor guidance are indexed in [`docs/README.md`](docs/README.md).

## Security

This is a private prototype without user accounts. Do not put secrets or real personal data in sample games. See [SECURITY.md](SECURITY.md) for reporting guidance.

## License

Copyright © 2026 Jae Hyun Tukushima. All rights reserved. See [`LICENSE`](LICENSE). No reuse or redistribution rights are granted.

## Project status

Active prototype. Mentor guidance is deterministic and rule-based; the app does not include a chess engine or claim engine analysis.
