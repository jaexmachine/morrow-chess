# Refactoring plan

## Current organization

The project follows the Next.js App Router layout: route modules and API handlers live under `app/`, static material belongs in `public/`, and maintainer documents live in `docs/`. Root-level package and framework configuration stays at the repository root.

## Initial extraction

The chess application was copied from the portfolio workspace into this standalone repository. Route pages were lifted to the root app routes (`/`, `/app`, `/play`, `/review`, `/progress`); the portfolio source, assets, Git history, and local database were not copied. No existing files in this destination were moved or deleted.

## Planned work

- Add focused unit and API tests for move validation, persistence validation, and mentor responses.
- Separate chess UI components from the central workspace module as the screens evolve.
- Decide on durable database hosting before any public deployment.
- Review whether the app needs account support before storing player identity or remote games.
