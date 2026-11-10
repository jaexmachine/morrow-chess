# Contributing

This is a private prototype. Coordinate changes with the repository owner before opening a pull request.

## Local checks

Use Node.js 24 or newer, then run:

```bash
npm ci
npm run typecheck
npm run build
npm audit --audit-level=high
```

The project does not yet have an automated unit-test suite. Do not describe the typecheck or build as tests.

## Change expectations

- Keep the black-and-white interface, visible focus states, and reduced-motion support.
- Preserve legal move validation and validate game data on the server.
- Update the relevant `docs/` page when architecture, setup, reliability, or security behavior changes.
- Never commit `.env*` files, credentials, or `.data/` game storage.
