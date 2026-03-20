# Architecture Redesign: @gnawniaverse monorepo

**Date:** 2026-03-19
**Status:** Draft
**Scope:** Restructure `gnawniaverse-utils` into a monorepo with pluggable architecture

---

## 1. Problem

The current `@gnawniaverse/utils` package is a single flat package that:
- Bundles everything (parsers, fetcher, types) into one import
- Has a 600+ line monolithic `parsers.ts`
- Cannot accommodate future packages (e.g., `ntiv-engine`)
- Silently swallows parse failures
- Throws generic errors consumers can't handle programmatically
- Hard-codes fetch behavior with no way to plug in custom fetchers or parsers
- Leaks cheerio internals via `loadHtml`

## 2. Solution Overview

Restructure into a **monorepo** under the `@gnawniaverse` npm scope with:
- Separate packages per feature (`@gnawniaverse/profile`, future `@gnawniaverse/ntiv-engine`)
- Pluggable client architecture (swappable fetcher + parser)
- Subpath exports for tree-shaking
- Custom error hierarchy
- Parse warnings for observability

## 3. Monorepo Structure

```
gnawniaverse/                          # Repo root (rename from gnawniaverse-utils)
├── package.json                       # Root workspace config
├── pnpm-workspace.yaml                # Workspace definition
├── tsconfig.json                      # Shared base TS config
├── packages/
│   ├── profile/                       # @gnawniaverse/profile
│   │   ├── package.json
│   │   ├── tsconfig.json              # Extends root
│   │   ├── tsup.config.ts
│   │   ├── src/
│   │   │   ├── index.ts               # Public API re-exports
│   │   │   ├── client.ts              # HunterProfileClient class
│   │   │   ├── errors.ts              # Custom error classes
│   │   │   ├── types/
│   │   │   │   ├── index.ts
│   │   │   │   ├── profile.ts         # HunterProfile, TrapSetup, TrapStats, etc.
│   │   │   │   ├── mice.ts            # MouseStat, MouseCategory, MiceData
│   │   │   │   ├── crowns.ts          # CrownMouse, CrownTier, CrownsData
│   │   │   │   ├── items.ts           # CollectionItem, ItemCategory, ItemsData
│   │   │   │   ├── full.ts            # FullHunterProfile (uses MiceData)
│   │   │   │   └── common.ts          # ParseResult, ParseWarning, interfaces
│   │   │   ├── parsers/
│   │   │   │   ├── index.ts           # Re-exports all parsers
│   │   │   │   ├── helpers.ts         # Internal: parseNum, textOrNull, etc.
│   │   │   │   ├── profile.ts         # parseProfile
│   │   │   │   ├── mice.ts            # parseMice
│   │   │   │   ├── crowns.ts          # parseCrowns
│   │   │   │   └── items.ts           # parseItems
│   │   │   └── fetcher.ts             # Built-in HTTP fetcher
│   │   ├── __tests__/
│   │   │   ├── parsers/
│   │   │   │   ├── profile.test.ts
│   │   │   │   ├── mice.test.ts
│   │   │   │   ├── crowns.test.ts
│   │   │   │   └── items.test.ts
│   │   │   ├── client.test.ts
│   │   │   └── errors.test.ts
│   │   └── scripts/
│   │       └── inspect.ts             # Dev-only CLI tool
│   └── shared/                        # Internal shared utilities (NOT published)
│       ├── package.json               # { "name": "@gnawniaverse/shared", "private": true }
│       ├── src/
│       │   ├── index.ts
│       │   ├── http.ts                # Shared fetch helpers
│       │   └── html.ts                # Shared cheerio/HTML helpers
│       └── tsconfig.json
├── docs/
│   └── available-data.md
└── scripts/                           # Root-level dev scripts
```

### 3.1 Workspace Configuration

**pnpm-workspace.yaml:**
```yaml
packages:
  - "packages/*"
```

### 3.2 Shared Package Bundling Strategy

`@gnawniaverse/shared` is **private** (`"private": true`) and **never published** to npm. Each consuming package (e.g., `@gnawniaverse/profile`) lists it as `"@gnawniaverse/shared": "workspace:*"` in `devDependencies` and **bundles it inline** via tsup's `noExternal` option:

```ts
// packages/profile/tsup.config.ts
noExternal: ["@gnawniaverse/shared"],
```

This ensures consumers installing `@gnawniaverse/profile` get a self-contained package with no hidden dependency on `@gnawniaverse/shared`.

## 4. Package Exports: `@gnawniaverse/profile`

```json
{
  "name": "@gnawniaverse/profile",
  "exports": {
    ".": {
      "import": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
      "require": { "types": "./dist/index.d.cts", "default": "./dist/index.cjs" }
    },
    "./parsers": {
      "import": { "types": "./dist/parsers/index.d.ts", "default": "./dist/parsers/index.js" },
      "require": { "types": "./dist/parsers/index.d.cts", "default": "./dist/parsers/index.cjs" }
    },
    "./fetcher": {
      "import": { "types": "./dist/fetcher.d.ts", "default": "./dist/fetcher.js" },
      "require": { "types": "./dist/fetcher.d.cts", "default": "./dist/fetcher.cjs" }
    }
  }
}
```

**Note:** No `./types` subpath export. Type-only modules compile to empty JS files which confuse bundlers. All types are re-exported from the root `"."` entry — consumers use `import type { HunterProfile } from "@gnawniaverse/profile"`.

### 4.1 tsup Configuration

```ts
// packages/profile/tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "parsers/index": "src/parsers/index.ts",
    fetcher: "src/fetcher.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  noExternal: ["@gnawniaverse/shared"],
});
```

The entry keys must match the paths in the `exports` map exactly. tsup generates `dist/index.js`, `dist/parsers/index.js`, and `dist/fetcher.js` with corresponding `.d.ts` files at the same paths.

## 5. Pluggable Client Architecture

### 5.1 Interfaces

```ts
/** Known profile tabs and their sub-tabs. */
export type ProfileTab = "profile" | "mice" | "kings_crowns" | "items";
export type MiceSubTab = "group" | "location";

/** Consumers can implement this to provide their own HTML source. */
export interface ProfileFetcher {
  /**
   * Fetch raw HTML for a specific profile tab.
   * @param hunterId - Numeric hunter ID
   * @param tab - Tab name (maps to ?tab= query param)
   * @param subTab - Sub-tab name (maps to ?sub_tab= query param), used for mice tab
   */
  fetchTab(hunterId: string | number, tab: ProfileTab, subTab?: MiceSubTab, signal?: AbortSignal): Promise<string>;
}

/** Consumers can implement this to provide their own parsing logic. */
export interface ProfileParser {
  parseProfile(html: string): ParseResult<HunterProfile>;
  parseMice(html: string): ParseResult<MiceData>;
  parseCrowns(html: string): ParseResult<CrownsData>;
  parseItems(html: string): ParseResult<ItemsData>;
}
```

**Built-in fetcher implementation:** The default `HttpProfileFetcher` translates `subTab` (camelCase) to `sub_tab` (snake_case) in the URL query parameters: `?tab=mice&sub_tab=group&uid=123`.

### 5.2 Client Class

```ts
export interface RequestOptions {
  signal?: AbortSignal;
}

export interface HunterProfileClientOptions {
  fetcher?: ProfileFetcher;       // default: built-in HTTP fetcher
  parser?: ProfileParser;         // default: built-in cheerio parsers
  requestDelay?: number;          // default: 200ms
  userAgent?: string;
  baseUrl?: string;
}

export class HunterProfileClient {
  constructor(options?: HunterProfileClientOptions);

  /** Fetch + parse profile tab only. */
  async getProfile(
    hunterId: number | string,
    options?: RequestOptions,
  ): Promise<ParseResult<HunterProfile>>;

  /** Fetch + parse all tabs. */
  async getFullProfile(
    hunterId: number | string,
    options?: RequestOptions,
  ): Promise<ParseResult<FullHunterProfile>>;

  /** Fetch raw HTML for a specific tab. */
  async fetchTab(
    hunterId: number | string,
    tab: ProfileTab,
    subTab?: MiceSubTab,
  ): Promise<string>;
}
```

**`AbortSignal` is per-call, not per-constructor.** This allows a long-lived client instance to be reused across requests, with each call independently cancellable.

### 5.3 Full Profile Warning & Error Behavior

`getFullProfile` makes 5 sequential fetches (profile, mice/group, mice/location, crowns, items). Behavior:

- **Parse warnings** from all tabs are merged into a single flat `warnings` array, with each warning's `field` prefixed by the tab name (e.g., `"mice_group.catches"`, `"crowns.diamond"`, `"items.quantity"`).
- **Fetch failure on profile tab** → throws immediately (profile is required).
- **Fetch failure on any other tab** → that tab's data is set to `null` in `FullHunterProfile`, and a warning is added: `{ field: "mice_group", message: "Fetch failed: 429 Too Many Requests" }`. The call does NOT throw.

This means `getFullProfile` returns partial data gracefully when non-critical tabs fail.

### 5.4 Usage Patterns

```ts
// Batteries-included (most users)
const client = new HunterProfileClient();
const { data, warnings } = await client.getProfile(6268658);

// Custom fetcher (Chrome extension) — note: subTab is forwarded
const client = new HunterProfileClient({
  fetcher: {
    fetchTab: async (id, tab, subTab) =>
      chrome.runtime.sendMessage({ id, tab, subTab }),
  },
});

// Custom parser
const client = new HunterProfileClient({
  parser: myCustomParser,
});

// Per-call abort signal
const controller = new AbortController();
const { data } = await client.getProfile(6268658, { signal: controller.signal });

// Parse-only (no client needed, direct import)
import { parseProfile } from "@gnawniaverse/profile/parsers";
const { data, warnings } = parseProfile(rawHtml);
```

## 6. Type Definitions

### 6.1 Split into domain files

| File | Interfaces |
|------|-----------|
| `types/profile.ts` | `HunterProfile`, `TrapSetup`, `TrapComponent`, `TrapStats`, `TrapAura`, `HornStats`, `GoldenShield`, `TeamInfo`, `FavouriteMouse`, `TreasureMapInfo`, `TournamentAward` |
| `types/mice.ts` | `MouseStat`, `MouseCategory`, `MiceData` |
| `types/crowns.ts` | `CrownMouse`, `CrownTier`, `CrownsData` |
| `types/items.ts` | `CollectionItem`, `ItemCategory`, `ItemsData` |
| `types/full.ts` | `FullHunterProfile` — uses `MiceData`, `CrownsData`, `ItemsData` (no inline anonymous types) |
| `types/common.ts` | `ParseResult<T>`, `ParseWarning`, `ProfileFetcher`, `ProfileParser`, `ProfileTab`, `MiceSubTab`, `RequestOptions`, `HunterProfileClientOptions` |

### 6.2 New types

```ts
export interface MiceData {
  mice: MouseStat[];
  categories: MouseCategory[];
}

export interface ParseWarning {
  field: string;
  message: string;
  selector?: string;
}

export interface ParseResult<T> {
  data: T;
  warnings: ParseWarning[];
}
```

### 6.3 FullHunterProfile update

```ts
export interface FullHunterProfile {
  profile: HunterProfile;
  miceByGroup: MiceData | null;
  miceByLocation: MiceData | null;
  crowns: CrownsData | null;
  items: ItemsData | null;
}
```

All tab fields are `| null` (not optional `?`) — null means the fetch or parse failed, with details in the warnings array.

## 7. Custom Error Hierarchy

```
GnawniaVerseError (base)
├── HttpError (statusCode, message)
│   ├── HunterNotFoundError (404)
│   └── RateLimitError (429)
└── ParseError (parser, message)
```

All errors extend `GnawniaVerseError` so consumers can catch broadly or specifically:

```ts
try {
  await client.getProfile(123);
} catch (e) {
  if (e instanceof HunterNotFoundError) { /* 404 */ }
  if (e instanceof RateLimitError) { /* 429 */ }
  if (e instanceof HttpError) { /* any HTTP error */ }
  if (e instanceof GnawniaVerseError) { /* any library error */ }
}
```

## 8. Parse Warnings

Parsers return `ParseResult<T>` with best-effort data + warnings array.

**When warnings are emitted:**
- Expected HTML element is missing (selector returned no matches)
- Cloudflare challenge page detected (heuristic: `$('title').text().includes('Just a moment')`)
- Number field has unexpected format
- Date/time string couldn't be parsed

**Parsers never throw.** They always return data with nulls for unparseable fields, plus warnings explaining why.

## 9. `loadHtml` Removal

`loadHtml` is removed from the public API. It leaked cheerio internals and would be a breaking change if the HTML parser is swapped.

The `scripts/inspect.ts` dev tool continues to use cheerio directly — it's not part of the published package.

## 10. Migration Path

1. Fix existing failing tests (mice, crowns, items tests have stale assertions against updated types)
2. Rename GitHub repo from `gnawniaverse-utils` to `gnawniaverse`
3. Scaffold monorepo root (workspace config, shared tsconfig, pnpm-workspace.yaml)
4. Move current source into `packages/profile/src/`
5. Refactor `parsers.ts` into `parsers/*.ts` modules
6. Split `types.ts` into `types/*.ts` modules — update `FullHunterProfile` to use `MiceData`
7. Add `errors.ts` with custom error classes
8. Add `ParseResult<T>` wrapper to all parsers
9. Create `HunterProfileClient` class in `client.ts`
10. Update `fetcher.ts` to implement `ProfileFetcher` interface
11. Configure subpath exports in `package.json`
12. Configure tsup for multiple entry points (see section 4.1)
13. Rewrite and split tests — all assertions must use `{ data }` destructuring
14. Update `scripts/inspect.ts` to use new client
15. Scaffold `packages/shared/` as private internal package
16. Fix `MONTH_MAP` — add explicit `may` abbreviation key for robustness

## 11. Versioning & Deprecation

- `@gnawniaverse/profile` starts at **1.0.0** (clean break, new package name)
- `@gnawniaverse/utils` **0.1.x** gets a final patch release with a deprecation notice in README pointing to `@gnawniaverse/profile`
- `@gnawniaverse/utils` is marked deprecated on npm via `npm deprecate`
- No compatibility shim — this is a clean cut-over since the package has no external consumers yet

## 12. What's NOT Changing

- **Parsing logic** — all CSS selectors, data extraction stays the same
- **Cheerio** — remains the built-in parser (just not exposed publicly)
- **Dual ESM/CJS output** — stays via tsup
- **Public parser functions** — still importable directly, same signatures (wrapped in `ParseResult`)
- **Fetching strategy** — same HTTP GET to profile.php, same delay logic
- **`MONTH_MAP`** — `May` works today because full and abbreviated forms are identical, but an explicit `may` key will be added for robustness
