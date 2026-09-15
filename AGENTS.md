# AGENTS.md

Guidance for AI coding agents working in this repository. Read this before making any changes.

`@snyk/cloud-config-parser` is a small TypeScript utility library used by Snyk's cloud configuration product. It does two independent things: (1) maps an "issue path" from a Snyk cloud-config finding back to a real line number in the original YAML/JSON/HCL file, so the issue can be highlighted for the user, and (2) parses a serialized issue-path string (e.g. `foo.bar[abc].baz`) into its components for use with (1). See `README.md` for the full behavioral spec (path-matching rules, 1-based line numbers, array-index handling) — it's detailed and authoritative; don't reimplement matching behavior without reading it first.

## Architecture

| Path | Purpose |
|---|---|
| `lib/index.ts` | Public entry point / exports |
| `lib/types.ts` | Shared types |
| `lib/issue-to-line/` | Path → line-number engine, split by format: `json/`, `yaml/`, `tf/` (Terraform/HCL), plus shared `utils.ts` |
| `lib/yaml-parser/` | The standalone `parseFileContent` YAML/JSON parser — see note below, this is a **separate** implementation from `issue-to-line`'s tree builder |
| `lib/parsers/path.ts` | The serialized-path-string parser: an inline PEG grammar (via `peggy`), compiled at runtime, with a plain `.split('.')` fallback if grammar parsing throws |
| `test/fixtures/{json,tf,yaml}/` | Fixture files, mirroring the three supported formats |
| `test/lib/` | Unit tests |

**Known inconsistency (not a bug to "fix" reflexively):** `lib/issue-to-line` and `lib/yaml-parser` intentionally use different underlying YAML parsers today (`yaml-js` vs. the newer `yaml` package). The README says this is a deliberate in-progress migration, not an oversight — don't assume the two share logic, and don't unify them as a drive-by change.

## Generated — do not hand-edit

- `dist/`, `dist-test/` — build output (`npm run build` → `tsc`), gitignored, never committed
- `test/fixtures/**/build` — generated during test runs, gitignored
- `.eslintcache` at repo root is gitignored going forward, but a stale committed copy already exists in git history — don't worry about "fixing" it if you see it as modified after linting locally

## Building and testing

```sh
npm install
npm run build        # tsc → dist/
npm test             # runs `npm run lint` FIRST, then `jest` — a lint failure blocks the unit-test run
```

Useful sub-commands: `npm run test:unit` (jest alone, skips lint), `npm run format` (prettier --write, fixes what `lint` would flag), `npm run test:coverage`, `npm run test:watch`.

**Node version:** `.nvmrc` pins `v24.16`, matching the `cimg/node:24.16` CircleCI image exactly. `package.json`'s `engines` field only requires `>=20` — treat `.nvmrc` as the version to actually develop against, not the looser floor in `engines`.

`package-lock.json` is gitignored in this repo — if `npm install` regenerates one, don't commit it.

## Releasing

Fully automated: merging to `main` triggers the `release` job in `.circleci/config.yml`, which runs `semantic-release` and publishes to npm via OIDC trusted publishing (no stored npm token). **This means commit messages on `main` directly determine the version bump** — `fix:` → patch, `feat:` → minor, a `BREAKING CHANGE:` footer → major. Never hand-edit the version in `package.json`.

## Conventions

- Commit style seen on `main`: `<type>(<optional-scope>): <description> [TICKET-ID]`, e.g. `fix(ci): migrate to NPM OIDC trusted publishing [IAC-3519]`. Ticket prefixes seen: `IAC-`, `PRODSEC-`. Because of the release automation above, getting the `type` right isn't cosmetic — it changes what gets published.
- PR template (`.github/PULL_REQUEST_TEMPLATE.md`) has two sections — "What this does" and "Notes for the reviewer" — fill both.
- Line numbers returned by this library are **1-based**, and path matching looks for the *deepest existing ancestor* of a path, not an exact-match-or-fail. If you touch `getLineNumber`, preserve that fallback behavior — it's load-bearing per the README's own examples.

## Before you finish

- [ ] `npm test` passes (lint + jest)
- [ ] `npm run build` still compiles cleanly if you touched anything under `lib/`
- [ ] New `issue-to-line` behavior has a fixture under the matching `test/fixtures/{json,yaml,tf}/` plus a test under `test/lib/`
- [ ] Commit message follows `<type>(<scope>): <description> [TICKET-ID]` — it drives the next published version, not just changelog cosmetics
- [ ] `dist/`, `dist-test/`, and `test/fixtures/**/build` are untouched by hand
