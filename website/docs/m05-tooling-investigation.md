# M05 tooling investigation: Astro, Vite, and picomatch

## Reproduction

On this workspace, `npm run check` fails in Astro's implicit content synchronization before Astro's TypeScript diagnostics start. The error is:

```text
GenerateContentTypesError: require is not defined
  at .../picomatch/index.js
  at .../vite/dist/node/module-runner.js
```

`npm run build` succeeds and synchronizes the same content collection. After a successful build, `npx astro check --noSync` also succeeds with 0 errors, warnings, or hints. This isolates the failure to the `astro check` command's sync/module-runner path rather than the content schema, generated page code, or a general Node CommonJS import failure.

## Environment and dependency resolution

- Node: `v24.21.0`
- npm: `11.19.0`
- Astro: `7.3.5` (requires Node `>=22.12.0`; depends on Vite `^8.0.13`)
- Vite: `8.3.2` (requires Node `^20.19.0 || >=22.12.0`)
- `@astrojs/check`: `0.9.10` resolved from the website range `^0.9.6`
- TypeScript: `6.0.3`
- picomatch: `4.0.7`, CommonJS (`main: index.js`, no package `type` field); a nested `2.3.2` remains under Astro's `anymatch` dependency
- Website package type: `module`

The root project dependency graph resolves the Astro/Vite/tinyglobby branches to one `picomatch@4.0.7`; no conflicting root duplicate was found. Node 24 and Vite 8 satisfy Astro's declared engine and dependency ranges. The failing source is the standard `glob()` content loader in `src/content.config.ts`, which imports `picomatch`. The Vite `ModuleRunner` stack shows the CommonJS source being evaluated in an ESM module context during `astro check`'s sync step. The build path handles the same loader successfully.

## Workaround

The website `check` script now runs a production build first, then runs `astro check --noSync`. The build refreshes Astro's generated content types; `--noSync` skips the failing duplicate sync phase while still running Astro/TypeScript diagnostics against those generated types. This does not patch or upgrade Astro, Vite, picomatch, or Node, and it does not claim the underlying Astro module-runner issue is fixed.

## Verification

Verified in this environment:

- `npm run check`: production build followed by Astro diagnostics (0 errors, warnings, or hints).
- `npm run build`: static build completes and generates all configured routes.
- `npm run check:links`: builds the static site and runs `scripts/verify-content.mjs`.

If default `astro check` is invoked directly without `--noSync`, the `require is not defined` failure remains reproducible here. Revisit this workaround when upgrading Astro/Vite or when Astro changes its content-sync module loading path; do not mask other check failures with `--noSync` unless a successful build has generated the types first.
