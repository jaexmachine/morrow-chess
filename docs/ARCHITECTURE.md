# Architecture

## System outline

```mermaid
flowchart TD
  Visitor[Browser] --> Pages[Next.js pages]
  Pages --> Landing[Landing page]
  Pages --> Workspace[Dashboard, play, review, progress]
  Workspace --> Summary[Summary API]
  Workspace --> Mentor[Mentor API]
  Workspace --> Games[Games API]
  Mentor --> Rules[chess.js validation and rule-based note]
  Games --> Store[Storage adapter]
  Summary --> Store
  Store --> Local[SQLite .data/chess.sqlite]
  Store --> Cloud[Postgres DATABASE_URL]
```

## Page routes

| Route | Responsibility |
|---|---|
| `/` | Product landing page and interactive pawn board |
| `/app` | Learner dashboard |
| `/play` | Legal move exploration and mentor notes |
| `/review` | Sample game review and key moments |
| `/progress` | Skill and practice progress |

## API routes

- `GET /api/chess/summary` returns the learner overview and recent sessions.
- `POST /api/chess/mentor` validates a candidate move and returns a deterministic note.
- `GET /api/chess/games` lists stored sessions.
- `POST /api/chess/games` validates matching PGN/FEN data and saves the session.

The API handlers live in `app/api/chess/`; shared persistence is in `store.ts` beside those handlers. Local development defaults to SQLite under `.data/`. On Vercel, `DATABASE_URL` selects Postgres so saved games persist across serverless instances. The `games` table is initialized lazily on the first request.

## Runtime boundary

The UI is rendered by Next.js. Interactive screens are client components; API handlers run on the Node.js runtime. Local SQLite is only for development; Vercel uses the hosted Postgres connection configured through `DATABASE_URL`.
