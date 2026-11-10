# Testing and reliability

## Current checks

| Check | Command | What it covers |
|---|---|---|
| Type checking | `npm run typecheck` | TypeScript compilation without emitting files |
| Production build | `npm run build` | Next.js production compilation and route generation |
| Dependency audit | `npm audit --audit-level=high` | Known high- and critical-severity npm advisories |

There is no automated unit, integration, or browser-test suite yet. Do not report the checks above as behavioral tests or coverage.

## Continuous integration

`.github/workflows/ci.yml` runs type checking and the dependency audit in parallel, then runs the production build if both succeed. It runs on pushes to `main`, version tags, and pull requests. The release workflow repeats type checking and the production build before creating a GitHub Release.

## Local verification

```bash
npm ci
npm run typecheck
npm audit --audit-level=high
npm run build
```

For behavior changes, manually verify the affected route and legal move/save flow until an automated test suite is added.

## Reliability limits

SQLite persistence is local to the Node process filesystem. It is suitable for local development and is not a durable storage strategy for ephemeral or horizontally scaled hosting.
