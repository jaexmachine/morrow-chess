# AI interaction guide

## Source of truth

Treat the checked-in source and package scripts as the current behavior. Mentor feedback is deterministic rule-based copy; do not describe it as engine analysis or model-generated coaching.

## Change boundaries

- Keep user-facing changes within the monochrome Morrow design: black, white, neutral gray, bold non-italic type, and restrained motion.
- Preserve the interactive board's legal-move validation and its server-side PGN/FEN checks.
- Keep game persistence local unless a separately reviewed storage design is introduced.
- Do not move or delete project documentation without an explicit reviewed plan.
- Never expose credentials, private game data, or local `.data` files.

## Validation

Before committing or pushing, run `npm run typecheck`, `npm run build`, and `npm audit --audit-level=high`. This repository currently has no automated behavioral tests; add a real test suite before claiming test coverage.

Update the relevant overview, architecture, reliability, security, or roadmap document when behavior or project scope changes.
