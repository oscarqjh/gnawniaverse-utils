# @gnawniaverse Monorepo Architecture Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `@gnawniaverse/utils` into a pnpm monorepo with `@gnawniaverse/profile` as the first package, featuring pluggable client architecture, custom errors, parse warnings, and subpath exports.

**Architecture:** Monorepo with `packages/profile/` and `packages/shared/`. Profile package exposes a `HunterProfileClient` class with swappable fetcher/parser, plus direct parser imports via subpath exports. All parsers return `ParseResult<T>` with warnings array.

**Tech Stack:** TypeScript, pnpm workspaces, tsup (multi-entry), cheerio, vitest

**Spec:** `docs/superpowers/specs/2026-03-19-architecture-redesign.md`

---

## Chunk 1: Monorepo Scaffolding & File Move

### Task 1: Scaffold monorepo root

**Files:**
- Create: `package.json` (root workspace)
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.json` (root base config)
- Modify: `.gitignore` — add `node_modules` at root level

- [ ] **Step 1: Create root `package.json`**

```json
{
  "name": "gnawniaverse",
  "private": true,
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "typecheck": "pnpm -r typecheck"
  },
  "engines": {
    "node": ">=18"
  }
}
```

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

```yaml
packages:
  - "packages/*"
```

- [ ] **Step 3: Create root `tsconfig.json`**

This is the shared base config that all packages extend.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 4: Update `.gitignore`**

Ensure root-level `node_modules/` and all `dist/` folders are ignored:

```
node_modules/
dist/
*.tsbuildinfo
```

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml tsconfig.json .gitignore
git commit -m "chore: scaffold monorepo root with pnpm workspaces"
```

---

### Task 2: Move current source into `packages/profile/`

**Files:**
- Create: `packages/profile/package.json`
- Create: `packages/profile/tsconfig.json`
- Create: `packages/profile/tsup.config.ts`
- Move: `src/` → `packages/profile/src/`
- Move: `__tests__/` → `packages/profile/__tests__/`
- Move: `scripts/` → `packages/profile/scripts/`
- Delete: old root `src/`, `__tests__/`, `scripts/`, `tsup.config.ts`, old root `tsconfig.json` (replaced in Task 1)

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p packages/profile
```

- [ ] **Step 2: Move source files**

```bash
git mv src packages/profile/src
git mv __tests__ packages/profile/__tests__
git mv scripts packages/profile/scripts
git mv tsup.config.ts packages/profile/tsup.config.ts
```

- [ ] **Step 3: Create `packages/profile/package.json`**

```json
{
  "name": "@gnawniaverse/profile",
  "version": "1.0.0",
  "description": "Hunter profile parser and fetcher for MouseHunt",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
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
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build"
  },
  "keywords": ["mousehunt", "gnawniaverse", "hunter-profile", "game-utils"],
  "author": "oscarqjh",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/oscarqjh/gnawniaverse-utils.git",
    "directory": "packages/profile"
  },
  "devDependencies": {
    "@gnawniaverse/shared": "workspace:*",
    "tsup": "^8.4.0",
    "tsx": "^4.21.0",
    "typescript": "^5.7.0",
    "vitest": "^4.1.0"
  },
  "dependencies": {
    "cheerio": "^1.2.0"
  }
}
```

- [ ] **Step 4: Create `packages/profile/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "__tests__"]
}
```

- [ ] **Step 5: Update `packages/profile/tsup.config.ts`** to multi-entry (just prepare, parsers subpath will work after Task 4)

For now keep single entry — will update to multi-entry after parsers are split:

```ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
});
```

- [ ] **Step 6: Verify root configs are correct**

The old root `package.json` and `tsconfig.json` were already replaced in-place by Task 1 (Steps 1 and 3). No deletion needed — just verify the root files are the monorepo versions, not the old single-package versions.

- [ ] **Step 7: Install dependencies from packages/profile**

```bash
cd packages/profile && pnpm install
cd ../..
pnpm install
```

- [ ] **Step 8: Verify build works**

```bash
cd packages/profile && pnpm build
```

Expected: builds to `packages/profile/dist/` with ESM + CJS + .d.ts

- [ ] **Step 9: Verify tests pass**

```bash
cd packages/profile && pnpm test
```

Expected: some tests may fail (known stale assertions from review). That's OK — we fix them in Chunk 3.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: move source into packages/profile monorepo structure"
```

---

### Task 3: Scaffold `packages/shared/`

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`

- [ ] **Step 1: Create `packages/shared/package.json`**

```json
{
  "name": "@gnawniaverse/shared",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.7.0"
  }
}
```

Note: `private: true` — never published. Source-level imports only, bundled inline by consumers via tsup `noExternal`.

- [ ] **Step 2: Create `packages/shared/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create `packages/shared/src/index.ts`**

```ts
// Shared utilities for @gnawniaverse packages.
// This package is internal-only (private) and bundled inline by consumers.

export {};
```

Empty for now — utilities will be extracted here if/when a second package needs them.

- [ ] **Step 4: Commit**

```bash
git add packages/shared
git commit -m "chore: scaffold packages/shared as internal utility package"
```

---

## Chunk 2: Split Types & Parsers Into Modules

### Task 4: Split `types.ts` into domain files

**Files:**
- Create: `packages/profile/src/types/index.ts`
- Create: `packages/profile/src/types/profile.ts`
- Create: `packages/profile/src/types/mice.ts`
- Create: `packages/profile/src/types/crowns.ts`
- Create: `packages/profile/src/types/items.ts`
- Create: `packages/profile/src/types/full.ts`
- Create: `packages/profile/src/types/common.ts`
- Delete: `packages/profile/src/types.ts`

- [ ] **Step 1: Create `packages/profile/src/types/profile.ts`**

Contains all profile-specific interfaces. Copy from current `types.ts` lines 1-147:

```ts
/** Hunter profile parsed from public profile page HTML. */
export interface HunterProfile {
  uid: number;
  name: string;
  rank: string;
  rankPercent: number | null;
  rankIconUrl: string | null;
  location: string;
  locationBannerUrl: string | null;
  locationThumbnailUrl: string | null;
  profileImageUrl: string | null;
  lastActive: string | null;
  miceCaught: number;
  miceTotal: number;
  rareMiceCaught: number;
  rareMiceTotal: number;
  totalMiceCaught: number;
  huntingSince: string | null;
  loyaltyBadgeLevel: number | null;
  loyaltyBadgeYears: number | null;
  hornStats: HornStats | null;
  gold: number;
  points: number;
  goldenShield: GoldenShield | null;
  team: TeamInfo | null;
  trap: TrapSetup | null;
  trapStats: TrapStats | null;
  auras: TrapAura[];
  favouriteMice: FavouriteMouse[];
  treasureMap: TreasureMapInfo | null;
  tournamentAwards: TournamentAward[];
}

export interface HornStats {
  total: number;
  active: number;
  passive: number;
  linked: number;
}

export interface GoldenShield {
  hasShield: boolean;
  expiryDate: string | null;
  expiryRaw: string | null;
}

export interface TeamInfo {
  name: string;
  id: number | null;
}

export interface TrapSetup {
  weaponId: number;
  baseId: number;
  skinId: number | null;
  baitId: number | null;
  imageUrl: string;
  weapon: TrapComponent | null;
  base: TrapComponent | null;
  bait: TrapComponent | null;
  charm: TrapComponent | null;
  skin: TrapComponent | null;
}

export interface TrapComponent {
  name: string;
  type: string;
  thumbnailUrl: string | null;
  quantity: number | null;
}

export interface TrapStats {
  power: number;
  powerType: string | null;
  luck: number;
  attractionBonus: string | null;
  cheeseEffect: string | null;
}

export interface TrapAura {
  type: string;
  active: boolean;
  title: string | null;
  description: string | null;
  expiryDate: string | null;
  expiryRaw: string | null;
}

export interface FavouriteMouse {
  type: string;
  name: string;
  catches: number;
  misses: number;
  imageUrl: string | null;
  crownTier: string | null;
  group: number;
}

export interface TreasureMapInfo {
  currentMapName: string | null;
  currentMapImageUrl: string | null;
  currentMapId: number | null;
  cluesFound: number;
  globalRanking: number | null;
}

export interface TournamentAward {
  imageUrl: string;
  quantity: number;
}
```

- [ ] **Step 2: Create `packages/profile/src/types/mice.ts`**

```ts
/** Mouse catch stats from the mice tab. */
export interface MouseStat {
  type: string;
  name: string;
  caught: boolean;
  catches: number;
  misses: number;
  averageWeight: string | null;
  heaviestCatch: string | null;
  imageUrl: string | null;
  category: string;
}

/** Mouse category/group with progress. */
export interface MouseCategory {
  key: string;
  name: string;
  progress: string | null;
  complete: boolean;
}

/** Mice tab data. */
export interface MiceData {
  mice: MouseStat[];
  categories: MouseCategory[];
}
```

- [ ] **Step 3: Create `packages/profile/src/types/crowns.ts`**

```ts
/** King's Crown entry for a single mouse. */
export interface CrownMouse {
  id: number;
  type: string;
  name: string;
  catches: number;
  imageUrl: string | null;
  largeImageUrl: string | null;
}

export type CrownTier = "diamond" | "platinum" | "gold" | "silver" | "bronze";

/** King's Crowns data. */
export interface CrownsData {
  crowns: Record<CrownTier, CrownMouse[]>;
  summary: Record<CrownTier, number>;
}
```

- [ ] **Step 4: Create `packages/profile/src/types/items.ts`**

```ts
/** Item from the items collection tab. */
export interface CollectionItem {
  id: number;
  type: string;
  name: string;
  collected: boolean;
  limitedEdition: boolean;
  imageUrl: string | null;
  quantity: number | null;
  category: string;
}

/** Item category with progress. */
export interface ItemCategory {
  key: string;
  name: string;
  progress: string | null;
  complete: boolean;
}

/** Items tab data. */
export interface ItemsData {
  items: CollectionItem[];
  categories: ItemCategory[];
}
```

- [ ] **Step 5: Create `packages/profile/src/types/common.ts`**

```ts
import type { HunterProfile } from "./profile.js";
import type { MiceData } from "./mice.js";
import type { CrownsData } from "./crowns.js";
import type { ItemsData } from "./items.js";

/** Warning emitted during HTML parsing. */
export interface ParseWarning {
  field: string;
  message: string;
  selector?: string;
}

/** Result wrapper for all parsers — data + warnings. */
export interface ParseResult<T> {
  data: T;
  warnings: ParseWarning[];
}

/** Known profile tabs. */
export type ProfileTab = "profile" | "mice" | "kings_crowns" | "items";

/** Known mice sub-tabs. */
export type MiceSubTab = "group" | "location";

/** Per-call request options. */
export interface RequestOptions {
  signal?: AbortSignal;
}

/** Consumers can implement this to provide their own HTML source. */
export interface ProfileFetcher {
  fetchTab(hunterId: string | number, tab: ProfileTab, subTab?: MiceSubTab, signal?: AbortSignal): Promise<string>;
}

/** Consumers can implement this to provide their own parsing logic. */
export interface ProfileParser {
  parseProfile(html: string): ParseResult<HunterProfile>;
  parseMice(html: string): ParseResult<MiceData>;
  parseCrowns(html: string): ParseResult<CrownsData>;
  parseItems(html: string): ParseResult<ItemsData>;
}

/** Options for HunterProfileClient constructor. */
export interface HunterProfileClientOptions {
  fetcher?: ProfileFetcher;
  parser?: ProfileParser;
  requestDelay?: number;
  userAgent?: string;
  baseUrl?: string;
}
```

- [ ] **Step 6: Create `packages/profile/src/types/full.ts`**

```ts
import type { HunterProfile } from "./profile.js";
import type { MiceData } from "./mice.js";
import type { CrownsData } from "./crowns.js";
import type { ItemsData } from "./items.js";

/** Full hunter profile data from all tabs. */
export interface FullHunterProfile {
  profile: HunterProfile;
  miceByGroup: MiceData | null;
  miceByLocation: MiceData | null;
  crowns: CrownsData | null;
  items: ItemsData | null;
}
```

- [ ] **Step 7: Create `packages/profile/src/types/index.ts`**

```ts
export type {
  HunterProfile,
  HornStats,
  GoldenShield,
  TeamInfo,
  TrapSetup,
  TrapComponent,
  TrapStats,
  TrapAura,
  FavouriteMouse,
  TreasureMapInfo,
  TournamentAward,
} from "./profile.js";

export type { MouseStat, MouseCategory, MiceData } from "./mice.js";
export type { CrownMouse, CrownTier, CrownsData } from "./crowns.js";
export type { CollectionItem, ItemCategory, ItemsData } from "./items.js";
export type { FullHunterProfile } from "./full.js";
export type {
  ParseWarning,
  ParseResult,
  ProfileTab,
  MiceSubTab,
  RequestOptions,
  ProfileFetcher,
  ProfileParser,
  HunterProfileClientOptions,
} from "./common.js";
```

- [ ] **Step 8: Delete old `packages/profile/src/types.ts`**

```bash
git rm packages/profile/src/types.ts
```

- [ ] **Step 9: Update imports in `parsers.ts`**

Change the import at top of `packages/profile/src/parsers.ts` from:

```ts
import type { ... } from "./types.js";
```

To:

```ts
import type { ... } from "./types/index.js";
```

- [ ] **Step 10: Update imports in `fetcher.ts`**

Change:
```ts
import type { HunterProfile, FullHunterProfile } from "./types.js";
```
To:
```ts
import type { HunterProfile, FullHunterProfile } from "./types/index.js";
```

- [ ] **Step 11: Update `index.ts` type re-exports**

Change:
```ts
export type { ... } from "./types.js";
```
To:
```ts
export type { ... } from "./types/index.js";
```

Also add the new types to the export list: `MiceData`, `ParseWarning`, `ParseResult`, `ProfileTab`, `MiceSubTab`, `RequestOptions`, `ProfileFetcher`, `ProfileParser`, `HunterProfileClientOptions`.

- [ ] **Step 12: Verify typecheck passes**

```bash
cd packages/profile && pnpm typecheck
```

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "refactor: split types.ts into domain-specific modules"
```

---

### Task 5: Split `parsers.ts` into modules

**Files:**
- Create: `packages/profile/src/parsers/helpers.ts`
- Create: `packages/profile/src/parsers/profile.ts`
- Create: `packages/profile/src/parsers/mice.ts`
- Create: `packages/profile/src/parsers/crowns.ts`
- Create: `packages/profile/src/parsers/items.ts`
- Create: `packages/profile/src/parsers/index.ts`
- Delete: `packages/profile/src/parsers.ts`

- [ ] **Step 1: Create `packages/profile/src/parsers/helpers.ts`**

Extract all helper functions from current `parsers.ts` lines 33-108. These are **internal only** — not exported from the package.

```ts
/** Parse a relative duration like "3 weeks 1 day 6 hours" into milliseconds. */
export function parseDurationMs(s: string): number {
  let ms = 0;
  const units: Record<string, number> = {
    week: 7 * 24 * 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    minute: 60 * 1000,
  };
  for (const [unit, factor] of Object.entries(units)) {
    const match = s.match(new RegExp(`(\\d+)\\s*${unit}s?`));
    if (match) ms += parseInt(match[1], 10) * factor;
  }
  return ms;
}

export function parseNum(s: string): number {
  return parseInt(s.replace(/,/g, ""), 10) || 0;
}

export function textOrNull(s: string | undefined): string | null {
  const trimmed = s?.trim();
  return trimmed || null;
}

export function extractBgUrl(style: string | undefined): string | null {
  const match = style?.match(/url\(['"]?([^'")]+)['"]?\)/);
  return match?.[1]?.replace(/&amp;/g, "&") ?? null;
}

export function extractShowArg(onclick: string | undefined): string | null {
  const match = onclick?.match(/\.show\('([^']+)'\)/);
  return match?.[1] ?? null;
}

export const MONTH_MAP: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  jan: 0, feb: 1, mar: 2, apr: 3, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  // "may" is already covered by the full-name entry above
};

export function parseAuraExpiry(raw: string): string | null {
  const cleaned = raw
    .replace(/\(Local Time\)/i, "")
    .replace(/\(UTC\)/i, "")
    .replace(/@/g, "")
    .replace(/,/g, "")
    .trim();

  const m = cleaned.match(
    /(\w+)\s+(\d{1,2})\s+(\d{4})\s+(\d{1,2}):(\d{2})\s*(am|pm)/i,
  );
  if (!m) return null;

  const monthIdx = MONTH_MAP[m[1].toLowerCase()];
  if (monthIdx === undefined) return null;

  let hour = parseInt(m[4], 10);
  const minute = parseInt(m[5], 10);
  const isPm = m[6].toLowerCase() === "pm";
  if (isPm && hour !== 12) hour += 12;
  if (!isPm && hour === 12) hour = 0;

  const dt = new Date(parseInt(m[3], 10), monthIdx, parseInt(m[2], 10), hour, minute);
  return isNaN(dt.getTime()) ? null : dt.toISOString();
}
```

Note: `MONTH_MAP` now includes explicit `may: 4` in the abbreviation block (fixing the fragile assumption flagged in review).

- [ ] **Step 2: Create `packages/profile/src/parsers/profile.ts`**

Move the `parseProfile` function from current `parsers.ts` lines 112-426. Update imports:

```ts
import { load } from "cheerio";
import type {
  HunterProfile,
  TrapSetup,
  TrapComponent,
  TrapStats,
  TrapAura,
  HornStats,
  GoldenShield,
  TeamInfo,
  FavouriteMouse,
  TreasureMapInfo,
  TournamentAward,
} from "../types/index.js";
import {
  parseDurationMs,
  parseNum,
  textOrNull,
  extractBgUrl,
  extractShowArg,
  parseAuraExpiry,
} from "./helpers.js";

export function parseProfile(html: string): HunterProfile {
  // ... exact same body as current parsers.ts lines 114-426
}
```

- [ ] **Step 3: Create `packages/profile/src/parsers/mice.ts`**

Move the `parseMice` function. Update imports:

```ts
import { load } from "cheerio";
import type { MouseStat, MouseCategory, MiceData } from "../types/index.js";
import { parseNum, textOrNull, extractBgUrl, extractShowArg } from "./helpers.js";

export function parseMice(html: string): MiceData {
  // ... exact same body as current parsers.ts lines 431-490
  // Return type changes from anonymous to MiceData (same shape)
}
```

- [ ] **Step 4: Create `packages/profile/src/parsers/crowns.ts`**

Move the `parseCrowns` function. Update imports:

```ts
import { load } from "cheerio";
import type { CrownsData, CrownTier, CrownMouse } from "../types/index.js";
import { parseNum } from "./helpers.js";

export function parseCrowns(html: string): CrownsData {
  // ... exact same body as current parsers.ts lines 495-531
}
```

- [ ] **Step 5: Create `packages/profile/src/parsers/items.ts`**

Move the `parseItems` function. Update imports:

```ts
import { load } from "cheerio";
import type { CollectionItem, ItemCategory, ItemsData } from "../types/index.js";
import { parseNum, textOrNull, extractBgUrl } from "./helpers.js";

export function parseItems(html: string): ItemsData {
  // ... exact same body as current parsers.ts lines 536-583
}
```

- [ ] **Step 6: Create `packages/profile/src/parsers/index.ts`**

```ts
export { parseProfile } from "./profile.js";
export { parseMice } from "./mice.js";
export { parseCrowns } from "./crowns.js";
export { parseItems } from "./items.js";
```

Note: `loadHtml` is NOT exported here — removed from public API per spec section 9.

- [ ] **Step 7: Delete old `packages/profile/src/parsers.ts`**

```bash
git rm packages/profile/src/parsers.ts
```

- [ ] **Step 8: Remove `loadHtml` and update `packages/profile/src/index.ts`**

First, search for any `loadHtml` usage in `__tests__/` and `scripts/` and remove those references (inspect script uses it — will be rewritten in Task 10).

Change parser imports from:
```ts
export { parseProfile, parseMice, parseCrowns, parseItems, loadHtml } from "./parsers.js";
```
To:
```ts
export { parseProfile, parseMice, parseCrowns, parseItems } from "./parsers/index.js";
```

- [ ] **Step 9: Update `packages/profile/src/fetcher.ts`**

Change:
```ts
import { parseProfile, parseMice, parseCrowns, parseItems } from "./parsers.js";
```
To:
```ts
import { parseProfile, parseMice, parseCrowns, parseItems } from "./parsers/index.js";
```

- [ ] **Step 10: Update tsup config for multi-entry**

Replace `packages/profile/tsup.config.ts`:

```ts
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
});
```

- [ ] **Step 11: Verify typecheck and build**

```bash
cd packages/profile && pnpm typecheck && pnpm build
```

- [ ] **Step 12: Verify tests still run** (some may fail due to stale assertions — that's expected)

```bash
cd packages/profile && pnpm test
```

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "refactor: split parsers.ts into per-domain modules with subpath exports"
```

---

## Chunk 3: Custom Errors, Parse Warnings & Client

### Task 6: Add custom error classes

**Files:**
- Create: `packages/profile/src/errors.ts`
- Create: `packages/profile/__tests__/errors.test.ts`

- [ ] **Step 1: Write error tests**

```ts
// packages/profile/__tests__/errors.test.ts
import { describe, it, expect } from "vitest";
import {
  GnawniaVerseError,
  HttpError,
  HunterNotFoundError,
  RateLimitError,
  ParseError,
} from "../src/errors.js";

describe("errors", () => {
  it("HunterNotFoundError is instanceof hierarchy", () => {
    const err = new HunterNotFoundError(123);
    expect(err).toBeInstanceOf(HunterNotFoundError);
    expect(err).toBeInstanceOf(HttpError);
    expect(err).toBeInstanceOf(GnawniaVerseError);
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(404);
    expect(err.message).toContain("123");
  });

  it("RateLimitError has status 429", () => {
    const err = new RateLimitError();
    expect(err.statusCode).toBe(429);
    expect(err).toBeInstanceOf(HttpError);
  });

  it("ParseError carries parser name", () => {
    const err = new ParseError("profile", "Missing element");
    expect(err.parser).toBe("profile");
    expect(err.message).toContain("profile");
    expect(err.message).toContain("Missing element");
    expect(err).toBeInstanceOf(GnawniaVerseError);
  });

  it("HttpError carries status code", () => {
    const err = new HttpError(500, "Internal Server Error");
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe("Internal Server Error");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd packages/profile && pnpm test -- __tests__/errors.test.ts
```

Expected: FAIL — `errors.ts` doesn't exist yet.

- [ ] **Step 3: Implement `packages/profile/src/errors.ts`**

```ts
/** Base error for all @gnawniaverse errors. */
export class GnawniaVerseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GnawniaVerseError";
  }
}

/** HTTP fetch error with status code. */
export class HttpError extends GnawniaVerseError {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** Hunter not found (HTTP 404). */
export class HunterNotFoundError extends HttpError {
  constructor(hunterId: string | number) {
    super(404, `Hunter ${hunterId} not found`);
    this.name = "HunterNotFoundError";
  }
}

/** Rate limited by MouseHunt (HTTP 429). */
export class RateLimitError extends HttpError {
  constructor() {
    super(429, "Rate limited by MouseHunt");
    this.name = "RateLimitError";
  }
}

/** HTML parsing error. */
export class ParseError extends GnawniaVerseError {
  constructor(
    public readonly parser: string,
    message: string,
  ) {
    super(`[${parser}] ${message}`);
    this.name = "ParseError";
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd packages/profile && pnpm test -- __tests__/errors.test.ts
```

Expected: PASS

- [ ] **Step 5: Export errors from `index.ts`**

Add to `packages/profile/src/index.ts`:

```ts
export {
  GnawniaVerseError,
  HttpError,
  HunterNotFoundError,
  RateLimitError,
  ParseError,
} from "./errors.js";
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add custom error hierarchy (HttpError, ParseError, etc.)"
```

---

### Task 7: Add `ParseResult<T>` wrapper to all parsers

**Files:**
- Modify: `packages/profile/src/parsers/profile.ts`
- Modify: `packages/profile/src/parsers/mice.ts`
- Modify: `packages/profile/src/parsers/crowns.ts`
- Modify: `packages/profile/src/parsers/items.ts`
- Modify: `packages/profile/src/parsers/helpers.ts` — add Cloudflare detection helper

- [ ] **Step 1: Add warning collector helper to `helpers.ts`**

Add `import type { ParseWarning }` at the **top** of `packages/profile/src/parsers/helpers.ts` (with other imports), then add the following classes/functions at the end of the file:

```ts
import type { ParseWarning } from "../types/index.js";

/** Mutable warning collector used during parsing. */
export class WarningCollector {
  readonly warnings: ParseWarning[] = [];

  add(field: string, message: string, selector?: string): void {
    this.warnings.push({ field, message, selector });
  }
}

/** Check if HTML is a Cloudflare challenge page. */
export function isCloudflareChallenge(html: string): boolean {
  return html.includes("<title>Just a moment</title>");
}
```

- [ ] **Step 2: Update `parseProfile` return type**

In `packages/profile/src/parsers/profile.ts`:

- Change return type from `HunterProfile` to `ParseResult<HunterProfile>`
- Add `import type { ParseResult } from "../types/index.js";`
- Add `import { WarningCollector, isCloudflareChallenge } from "./helpers.js";`
- Create a `WarningCollector` at the start
- Add Cloudflare check at the start: if detected, add warning and return empty profile
- At key parse points, add warnings when expected selectors return empty (e.g., if `ogTitle` is empty, add warning for `name`)
- Return `{ data: profile, warnings: w.warnings }`

Key warning points to add:
- Cloudflare challenge detected → `{ field: "*", message: "Received Cloudflare challenge page" }`
- `ogTitle` empty → `{ field: "name", message: "OG title not found", selector: 'meta[property="og:title"]' }`
- `ogImage` has no trap params → `{ field: "trap", message: "Trap IDs not found in OG image URL" }`

- [ ] **Step 3: Update `parseMice` return type**

Change return type from `MiceData` to `ParseResult<MiceData>`. Same pattern: create collector, check Cloudflare, return `{ data, warnings }`.

- [ ] **Step 4: Update `parseCrowns` return type**

Change return type from `CrownsData` to `ParseResult<CrownsData>`. Same pattern.

- [ ] **Step 5: Update `parseItems` return type**

Change return type from `ItemsData` to `ParseResult<ItemsData>`. Same pattern.

- [ ] **Step 6: Update `parsers/index.ts` re-exports** (no change needed — same function names)

- [ ] **Step 7: Update `fetcher.ts`** to destructure `{ data }` from parse results

In `fetchHunterProfile`:
```ts
return parseProfile(html).data;  // temporary — will be replaced by client in Task 8
```

In `fetchFullHunterProfile`:
```ts
const profile = parseProfile(profileHtml).data;
const miceByGroup = parseMice(miceGroupHtml).data;
// ... etc
```

- [ ] **Step 8: Update `index.ts`** re-exports — no changes needed (parser functions still re-exported)

- [ ] **Step 9: Verify typecheck and build**

```bash
cd packages/profile && pnpm typecheck && pnpm build
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: wrap all parsers with ParseResult<T> + warnings"
```

---

### Task 8: Create `HunterProfileClient` class

**Files:**
- Create: `packages/profile/src/client.ts`
- Modify: `packages/profile/src/fetcher.ts` — refactor into `HttpProfileFetcher` class
- Create: `packages/profile/__tests__/client.test.ts`

- [ ] **Step 1: Write client tests**

```ts
// packages/profile/__tests__/client.test.ts
import { describe, it, expect, vi } from "vitest";
import { HunterProfileClient } from "../src/client.js";
import type { ProfileFetcher } from "../src/types/index.js";

const MOCK_PROFILE_HTML = `
<html><head>
<meta property="og:url" content="https://www.mousehuntgame.com/profile.php?uid=123" />
<meta property="og:title" content="MouseHunt - TestHunter" />
<meta property="og:description" content="TestHunter is a Novice in MouseHunt.
Mice: 10/100
Rare Mice: 0/10
Gold: 1,000
Points: 500
Location: Meadow" />
</head><body></body></html>
`;

const mockFetcher: ProfileFetcher = {
  fetchTab: vi.fn().mockResolvedValue(MOCK_PROFILE_HTML),
};

describe("HunterProfileClient", () => {
  it("uses default fetcher and parser", async () => {
    const client = new HunterProfileClient({ fetcher: mockFetcher });
    const { data, warnings } = await client.getProfile(123);

    expect(data.name).toBe("TestHunter");
    expect(data.uid).toBe(123);
    expect(mockFetcher.fetchTab).toHaveBeenCalledWith(123, "profile", undefined);
  });

  it("getFullProfile returns partial data on non-profile tab failure", async () => {
    const failingFetcher: ProfileFetcher = {
      fetchTab: vi.fn().mockImplementation(async (id, tab) => {
        if (tab === "profile") return MOCK_PROFILE_HTML;
        throw new Error("Network error");
      }),
    };

    const client = new HunterProfileClient({ fetcher: failingFetcher });
    const { data, warnings } = await client.getFullProfile(123);

    expect(data.profile.name).toBe("TestHunter");
    expect(data.miceByGroup).toBeNull();
    expect(data.miceByLocation).toBeNull();
    expect(data.crowns).toBeNull();
    expect(data.items).toBeNull();
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("getFullProfile throws on profile tab failure", async () => {
    const failingFetcher: ProfileFetcher = {
      fetchTab: vi.fn().mockRejectedValue(new Error("404")),
    };

    const client = new HunterProfileClient({ fetcher: failingFetcher });
    await expect(client.getFullProfile(123)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd packages/profile && pnpm test -- __tests__/client.test.ts
```

- [ ] **Step 3: Refactor `fetcher.ts` into `HttpProfileFetcher`**

Rewrite `packages/profile/src/fetcher.ts`:

```ts
import type { ProfileFetcher, ProfileTab, MiceSubTab } from "./types/index.js";
import { HttpError, HunterNotFoundError, RateLimitError } from "./errors.js";

const DEFAULTS = {
  baseUrl: "https://www.mousehuntgame.com",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
} as const;

export interface HttpFetcherOptions {
  baseUrl?: string;
  userAgent?: string;
  signal?: AbortSignal;
}

/** Built-in HTTP fetcher for MouseHunt profile pages. */
export class HttpProfileFetcher implements ProfileFetcher {
  private readonly baseUrl: string;
  private readonly userAgent: string;

  constructor(options?: HttpFetcherOptions) {
    this.baseUrl = options?.baseUrl ?? DEFAULTS.baseUrl;
    this.userAgent = options?.userAgent ?? DEFAULTS.userAgent;
  }

  async fetchTab(
    hunterId: string | number,
    tab: ProfileTab,
    subTab?: MiceSubTab,
    signal?: AbortSignal,
  ): Promise<string> {
    const url = new URL("/profile.php", this.baseUrl);
    url.searchParams.set("tab", tab);
    url.searchParams.set("uid", String(hunterId));
    if (subTab) url.searchParams.set("sub_tab", subTab);

    const resp = await fetch(url.toString(), {
      headers: { "User-Agent": this.userAgent, Accept: "text/html" },
      signal,
    });

    if (resp.status === 404) throw new HunterNotFoundError(hunterId);
    if (resp.status === 429) throw new RateLimitError();
    if (!resp.ok) throw new HttpError(resp.status, `HTTP ${resp.status} fetching ${url}`);

    return resp.text();
  }
}
```

Note: `fetchTab` has an extra `signal` parameter beyond the interface — the client passes it through. The interface signature `ProfileFetcher.fetchTab` doesn't include signal (custom fetchers handle cancellation their own way).

- [ ] **Step 4: Implement `packages/profile/src/client.ts`**

```ts
import type {
  HunterProfile,
  FullHunterProfile,
  MiceData,
  CrownsData,
  ItemsData,
  ParseResult,
  ParseWarning,
  ProfileFetcher,
  ProfileParser,
  HunterProfileClientOptions,
  RequestOptions,
} from "./types/index.js";
import { HttpProfileFetcher } from "./fetcher.js";
import { parseProfile } from "./parsers/profile.js";
import { parseMice } from "./parsers/mice.js";
import { parseCrowns } from "./parsers/crowns.js";
import { parseItems } from "./parsers/items.js";

const DEFAULT_REQUEST_DELAY = 200;

/** Default parser implementation using built-in cheerio parsers. */
const defaultParser: ProfileParser = {
  parseProfile,
  parseMice,
  parseCrowns,
  parseItems,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main client for fetching and parsing MouseHunt hunter profiles.
 *
 * Batteries-included with built-in HTTP fetcher and cheerio parser,
 * but both are swappable via constructor options.
 */
export class HunterProfileClient {
  private readonly fetcher: ProfileFetcher;
  private readonly parser: ProfileParser;
  private readonly requestDelay: number;

  constructor(options?: HunterProfileClientOptions) {
    this.fetcher = options?.fetcher ?? new HttpProfileFetcher({
      baseUrl: options?.baseUrl,
      userAgent: options?.userAgent,
    });
    this.parser = options?.parser ?? defaultParser;
    this.requestDelay = options?.requestDelay ?? DEFAULT_REQUEST_DELAY;
  }

  /** Fetch + parse profile tab only. */
  async getProfile(
    hunterId: number | string,
    options?: RequestOptions,
  ): Promise<ParseResult<HunterProfile>> {
    const html = await this.fetcher.fetchTab(hunterId, "profile", undefined, options?.signal);
    return this.parser.parseProfile(html);
  }

  /** Fetch + parse all tabs. Non-critical tab failures return null + warning. */
  async getFullProfile(
    hunterId: number | string,
    options?: RequestOptions,
  ): Promise<ParseResult<FullHunterProfile>> {
    const warnings: ParseWarning[] = [];

    // Profile tab is required — throws on failure
    const profileHtml = await this.fetcher.fetchTab(hunterId, "profile", undefined, options?.signal);
    const profileResult = this.parser.parseProfile(profileHtml);
    warnings.push(...profileResult.warnings);

    // Helper for optional tabs
    const fetchOptionalTab = async <T>(
      tabName: string,
      fetchFn: () => Promise<string>,
      parseFn: (html: string) => ParseResult<T>,
    ): Promise<T | null> => {
      try {
        await delay(this.requestDelay);
        const html = await fetchFn();
        const result = parseFn(html);
        warnings.push(
          ...result.warnings.map((w) => ({ ...w, field: `${tabName}.${w.field}` })),
        );
        return result.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        warnings.push({ field: tabName, message: `Fetch failed: ${message}` });
        return null;
      }
    };

    const miceByGroup = await fetchOptionalTab(
      "mice_group",
      () => this.fetcher.fetchTab(hunterId, "mice", "group"),
      this.parser.parseMice,
    );

    const miceByLocation = await fetchOptionalTab(
      "mice_location",
      () => this.fetcher.fetchTab(hunterId, "mice", "location"),
      this.parser.parseMice,
    );

    const crowns = await fetchOptionalTab(
      "crowns",
      () => this.fetcher.fetchTab(hunterId, "kings_crowns"),
      this.parser.parseCrowns,
    );

    const items = await fetchOptionalTab(
      "items",
      () => this.fetcher.fetchTab(hunterId, "items"),
      this.parser.parseItems,
    );

    return {
      data: {
        profile: profileResult.data,
        miceByGroup,
        miceByLocation,
        crowns,
        items,
      },
      warnings,
    };
  }

  /** Fetch raw HTML for a specific tab (no parsing). */
  async fetchTab(
    hunterId: number | string,
    tab: import("./types/index.js").ProfileTab,
    subTab?: import("./types/index.js").MiceSubTab,
  ): Promise<string> {
    return this.fetcher.fetchTab(hunterId, tab, subTab);
  }
}
```

- [ ] **Step 5: Export client from `index.ts`**

Add to `packages/profile/src/index.ts`:

```ts
export { HunterProfileClient } from "./client.js";
export { HttpProfileFetcher } from "./fetcher.js";
```

- [ ] **Step 6: Run client tests**

```bash
cd packages/profile && pnpm test -- __tests__/client.test.ts
```

Expected: PASS

- [ ] **Step 7: Verify full build**

```bash
cd packages/profile && pnpm typecheck && pnpm build
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add HunterProfileClient with pluggable fetcher/parser"
```

---

## Chunk 4: Fix Tests, Update Scripts & Final Polish

### Task 9: Rewrite and fix all parser tests

**Files:**
- Delete: `packages/profile/__tests__/parsers.test.ts`
- Create: `packages/profile/__tests__/parsers/profile.test.ts`
- Create: `packages/profile/__tests__/parsers/mice.test.ts`
- Create: `packages/profile/__tests__/parsers/crowns.test.ts`
- Create: `packages/profile/__tests__/parsers/items.test.ts`

All tests must:
1. Use `{ data, warnings }` destructuring from `ParseResult<T>`
2. Match full object shapes (include all fields like `imageUrl`, `category`, `quantity`)
3. Test Cloudflare detection warning

- [ ] **Step 1: Create `packages/profile/__tests__/parsers/profile.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { parseProfile } from "../../src/parsers/profile.js";

const PROFILE_HTML = `
<html><head>
<meta property="og:url" content="https://www.mousehuntgame.com/profile.php?uid=6268658" />
<meta property="og:title" content="MouseHunt - Tey Zi Pin" />
<meta property="og:description" content="Tey Zi Pin is a Sage in MouseHunt.
Mice: 1,040/1,120
Rare Mice: 165/165
Gold: 874,240,861
Points: 9,909,051,391
Location: SUPER|brie+ Factory" />
<meta property="og:image" content="https://www.mousehuntgame.com/images/trapimage.php?base=3150&amp;weapon=3591&amp;skin=3993&amp;bait=98" />
</head><body></body></html>
`;

describe("parseProfile", () => {
  it("extracts all OG meta fields", () => {
    const { data: p, warnings } = parseProfile(PROFILE_HTML);

    expect(p.uid).toBe(6268658);
    expect(p.name).toBe("Tey Zi Pin");
    expect(p.rank).toBe("Sage");
    expect(p.location).toBe("SUPER|brie+ Factory");
    expect(p.miceCaught).toBe(1040);
    expect(p.miceTotal).toBe(1120);
    expect(p.rareMiceCaught).toBe(165);
    expect(p.rareMiceTotal).toBe(165);
    expect(p.gold).toBe(874240861);
    expect(p.points).toBe(9909051391);
  });

  it("extracts trap setup from image URL", () => {
    const { data: p } = parseProfile(PROFILE_HTML);

    expect(p.trap).not.toBeNull();
    expect(p.trap!.baseId).toBe(3150);
    expect(p.trap!.weaponId).toBe(3591);
    expect(p.trap!.skinId).toBe(3993);
    expect(p.trap!.baitId).toBe(98);
    expect(p.trap!.imageUrl).toContain("trapimage.php");
  });

  it("returns defaults for invalid HTML", () => {
    const { data: p } = parseProfile("<html><body>nothing here</body></html>");

    expect(p.name).toBe("");
    expect(p.rank).toBe("");
    expect(p.uid).toBe(0);
    expect(p.trap).toBeNull();
  });

  it("warns on Cloudflare challenge page", () => {
    const { data, warnings } = parseProfile("<html><head><title>Just a moment</title></head><body></body></html>");

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0].message).toContain("Cloudflare");
  });
});
```

- [ ] **Step 2: Create `packages/profile/__tests__/parsers/mice.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { parseMice } from "../../src/parsers/mice.js";

const MICE_HTML = `
<div class="mouseListView-categoryContent-category" data-category="indigenous">
  <div class="mouseListView-categoryContent-subgroup-mouse stats caught">
    <div class="mouseListView-categoryContent-subgroup-mouse-stats name">
      <a class="mouseListView-categoryContent-subgroup-mouse-thumb"
         onclick="hg.views.MouseView.show('white_mouse')"></a>
      <div class="mouseListView-categoryContent-subgroup-mouse-thumb-name">White Mouse</div>
    </div>
    <div class="mouseListView-categoryContent-subgroup-mouse-stats catches">142</div>
    <div class="mouseListView-categoryContent-subgroup-mouse-stats misses">3</div>
    <div class="mouseListView-categoryContent-subgroup-mouse-stats average_weight">1 oz.</div>
    <div class="mouseListView-categoryContent-subgroup-mouse-stats heaviest_catch">4 oz.</div>
  </div>
  <div class="mouseListView-categoryContent-subgroup-mouse stats uncaught">
    <div class="mouseListView-categoryContent-subgroup-mouse-stats name">
      <a class="mouseListView-categoryContent-subgroup-mouse-thumb"
         onclick="hg.views.MouseView.show('archduke_mouse')"></a>
      <div class="mouseListView-categoryContent-subgroup-mouse-thumb-name">Archduke Mouse</div>
    </div>
    <div class="mouseListView-categoryContent-subgroup-mouse-stats catches">0</div>
    <div class="mouseListView-categoryContent-subgroup-mouse-stats misses">0</div>
    <div class="mouseListView-categoryContent-subgroup-mouse-stats average_weight"></div>
    <div class="mouseListView-categoryContent-subgroup-mouse-stats heaviest_catch"></div>
  </div>
</div>
<div class="mouseListView-category" data-category="indigenous">
  <div class="mouseListView-category-name">Indigenous Mice</div>
  <div class="mouseListView-category-progress">2 of 5</div>
</div>
`;

describe("parseMice", () => {
  it("extracts caught and uncaught mice with full fields", () => {
    const { data } = parseMice(MICE_HTML);

    expect(data.mice).toHaveLength(2);

    expect(data.mice[0]).toMatchObject({
      type: "white_mouse",
      name: "White Mouse",
      caught: true,
      catches: 142,
      misses: 3,
      averageWeight: "1 oz.",
      heaviestCatch: "4 oz.",
      category: "indigenous",
    });

    expect(data.mice[1]).toMatchObject({
      type: "archduke_mouse",
      name: "Archduke Mouse",
      caught: false,
      catches: 0,
      misses: 0,
      averageWeight: null,
      heaviestCatch: null,
      category: "indigenous",
    });
  });

  it("extracts categories with full fields", () => {
    const { data } = parseMice(MICE_HTML);

    expect(data.categories).toHaveLength(1);
    expect(data.categories[0]).toMatchObject({
      key: "indigenous",
      name: "Indigenous Mice",
      progress: "2 of 5",
    });
  });
});
```

- [ ] **Step 3: Create `packages/profile/__tests__/parsers/crowns.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { parseCrowns } from "../../src/parsers/crowns.js";

const CROWNS_HTML = `
<div class="mouseCrownsView-group diamond">
  <div class="mouseCrownsView-group-mouse" data-mouse-id="100" data-mouse-type="white_mouse">
    <div class="mouseCrownsView-group-mouse-name">White Mouse</div>
    <div class="mouseCrownsView-group-mouse-catches">500</div>
    <div class="mouseCrownsView-group-mouse-image" data-image="https://example.com/white.png"></div>
  </div>
</div>
<div class="mouseCrownsView-group platinum">
  <div class="mouseCrownsView-group-mouse" data-mouse-id="200" data-mouse-type="grey_mouse">
    <div class="mouseCrownsView-group-mouse-name">Grey Mouse</div>
    <div class="mouseCrownsView-group-mouse-catches">100</div>
    <div class="mouseCrownsView-group-mouse-image"></div>
  </div>
</div>
<div class="mouseCrownsView-group gold"></div>
<div class="mouseCrownsView-group silver"></div>
<div class="mouseCrownsView-group bronze"></div>
`;

describe("parseCrowns", () => {
  it("extracts crown tiers with full mouse data", () => {
    const { data } = parseCrowns(CROWNS_HTML);

    expect(data.summary).toEqual({
      diamond: 1,
      platinum: 1,
      gold: 0,
      silver: 0,
      bronze: 0,
    });

    expect(data.crowns.diamond[0]).toMatchObject({
      id: 100,
      type: "white_mouse",
      name: "White Mouse",
      catches: 500,
      imageUrl: "https://example.com/white.png",
    });

    expect(data.crowns.platinum[0]).toMatchObject({
      id: 200,
      type: "grey_mouse",
      name: "Grey Mouse",
      catches: 100,
    });
  });
});
```

- [ ] **Step 4: Create `packages/profile/__tests__/parsers/items.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { parseItems } from "../../src/parsers/items.js";

const ITEMS_HTML = `
<div class="hunterProfileItemsView-categoryContent" data-category="weapon">
  <div class="hunterProfileItemsView-categoryContent-item collected" data-id="34" data-type="500_pound_spiked_crusher_weapon">
    <div class="hunterProfileItemsView-categoryContent-item-padding">
      <div class="itemImage" style="background-image: url('https://example.com/weapon.jpg');">
        <span class="quantity">1</span>
      </div>
      <div class="hunterProfileItemsView-categoryContent-item-name"><span>500 Pound Spiked Crusher</span></div>
    </div>
  </div>
  <div class="hunterProfileItemsView-categoryContent-item uncollected" data-id="35" data-type="ambush_trap_weapon">
    <div class="hunterProfileItemsView-categoryContent-item-padding">
      <div class="itemImage"></div>
      <div class="hunterProfileItemsView-categoryContent-item-name"><span>Ambush Trap</span></div>
    </div>
  </div>
  <div class="hunterProfileItemsView-categoryContent-item collected limited_edition" data-id="99" data-type="rare_weapon">
    <div class="hunterProfileItemsView-categoryContent-item-padding">
      <div class="itemImage"></div>
      <div class="hunterProfileItemsView-categoryContent-item-name"><span>Rare Weapon</span></div>
    </div>
  </div>
</div>
<div class="hunterProfileItemsView-category complete" data-category="weapon">
  <div class="hunterProfileItemsView-category-name">Weapons</div>
  <div class="hunterProfileItemsView-category-progress">12 / 50</div>
</div>
`;

describe("parseItems", () => {
  it("extracts items with full fields", () => {
    const { data } = parseItems(ITEMS_HTML);

    expect(data.items).toHaveLength(3);

    expect(data.items[0]).toMatchObject({
      id: 34,
      type: "500_pound_spiked_crusher_weapon",
      name: "500 Pound Spiked Crusher",
      collected: true,
      limitedEdition: false,
      imageUrl: "https://example.com/weapon.jpg",
      quantity: 1,
      category: "weapon",
    });

    expect(data.items[1]).toMatchObject({
      id: 35,
      collected: false,
      limitedEdition: false,
      category: "weapon",
    });

    expect(data.items[2]).toMatchObject({
      id: 99,
      collected: true,
      limitedEdition: true,
    });
  });

  it("extracts categories with full fields", () => {
    const { data } = parseItems(ITEMS_HTML);

    expect(data.categories).toHaveLength(1);
    expect(data.categories[0]).toMatchObject({
      key: "weapon",
      name: "Weapons",
      progress: "12 / 50",
      complete: true,
    });
  });
});
```

- [ ] **Step 5: Delete old test file**

```bash
git rm packages/profile/__tests__/parsers.test.ts
```

- [ ] **Step 6: Run all tests**

```bash
cd packages/profile && pnpm test
```

Expected: ALL PASS

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "test: rewrite all parser tests for ParseResult<T> and full field shapes"
```

---

### Task 10: Update inspect script

**Files:**
- Modify: `packages/profile/scripts/inspect.ts`

- [ ] **Step 1: Rewrite inspect script to use `HunterProfileClient`**

```ts
/**
 * Inspect script — fetches all profile tabs for a hunter,
 * saves raw HTML and parsed JSON for manual inspection.
 *
 * Usage: npx tsx scripts/inspect.ts <hunter_id>
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { load } from "cheerio";
import { HunterProfileClient } from "../src/index.js";

const hunterId = process.argv[2];
if (!hunterId) {
  console.error("Usage: npx tsx scripts/inspect.ts <hunter_id>");
  process.exit(1);
}

const outDir = join(import.meta.dirname!, "output", `hunter_${hunterId}`);
mkdirSync(outDir, { recursive: true });

function save(name: string, content: string) {
  const path = join(outDir, name);
  writeFileSync(path, content, "utf-8");
  console.log(`  Saved ${name} (${(content.length / 1024).toFixed(1)} KB)`);
}

function prettyPrint(html: string): string {
  return html
    .replace(/></g, ">\n<")
    .replace(/\n(<\/)/g, "\n$1")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

const client = new HunterProfileClient({ requestDelay: 300 });

type TabConfig = {
  name: string;
  tab: "profile" | "mice" | "kings_crowns" | "items";
  subTab?: "group" | "location";
};

const tabs: TabConfig[] = [
  { name: "profile", tab: "profile" },
  { name: "mice_group", tab: "mice", subTab: "group" },
  { name: "mice_location", tab: "mice", subTab: "location" },
  { name: "kings_crowns", tab: "kings_crowns" },
  { name: "items", tab: "items" },
];

console.log(`\nFetching profile for hunter #${hunterId}...\n`);

for (const t of tabs) {
  console.log(`── ${t.name} ──`);

  const html = await client.fetchTab(parseInt(hunterId, 10), t.tab, t.subTab);
  save(`${t.name}_raw.html`, html);

  // Pretty-print content
  const $ = load(html);
  const pageContent = $(".mousehuntHud-page-tabContentContainer").html()
    ?? $(".hunterProfileItemsView").html()
    ?? $(".mouseCrownsView").html()
    ?? $("body").html()
    ?? html;
  save(`${t.name}_content.html`, prettyPrint(pageContent));
}

// Now parse everything using the client
const { data: full, warnings } = await client.getFullProfile(parseInt(hunterId, 10));

save("profile_parsed.json", JSON.stringify(full.profile, null, 2));
save("mice_group_parsed.json", JSON.stringify(full.miceByGroup, null, 2));
save("mice_location_parsed.json", JSON.stringify(full.miceByLocation, null, 2));
save("kings_crowns_parsed.json", JSON.stringify(full.crowns, null, 2));
save("items_parsed.json", JSON.stringify(full.items, null, 2));

if (warnings.length > 0) {
  console.log(`\n⚠ ${warnings.length} warnings:`);
  for (const w of warnings) {
    console.log(`  [${w.field}] ${w.message}`);
  }
}

console.log(`\nAll files saved to: ${outDir}`);
```

Note: The script now fetches twice (once for raw HTML, once via client). This is acceptable for a dev tool. A future optimization could fetch once and use parsers directly.

- [ ] **Step 2: Verify script runs**

```bash
cd packages/profile && npx tsx scripts/inspect.ts 6268658
```

Expected: All files saved, parsed JSON uses new `ParseResult` structure.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: update inspect script to use HunterProfileClient"
```

---

### Task 11: Update `index.ts` final exports & verify full build

**Files:**
- Modify: `packages/profile/src/index.ts`

- [ ] **Step 1: Write final `index.ts`**

```ts
// Types
export type {
  HunterProfile,
  HornStats,
  GoldenShield,
  TeamInfo,
  TrapSetup,
  TrapComponent,
  TrapStats,
  TrapAura,
  FavouriteMouse,
  TreasureMapInfo,
  TournamentAward,
  MouseStat,
  MouseCategory,
  MiceData,
  CrownMouse,
  CrownTier,
  CrownsData,
  CollectionItem,
  ItemCategory,
  ItemsData,
  FullHunterProfile,
  ParseWarning,
  ParseResult,
  ProfileTab,
  MiceSubTab,
  RequestOptions,
  ProfileFetcher,
  ProfileParser,
  HunterProfileClientOptions,
} from "./types/index.js";

// Parsers (for direct parse-only usage)
export { parseProfile } from "./parsers/profile.js";
export { parseMice } from "./parsers/mice.js";
export { parseCrowns } from "./parsers/crowns.js";
export { parseItems } from "./parsers/items.js";

// Errors
export {
  GnawniaVerseError,
  HttpError,
  HunterNotFoundError,
  RateLimitError,
  ParseError,
} from "./errors.js";

// Client
export { HunterProfileClient } from "./client.js";
export { HttpProfileFetcher } from "./fetcher.js";
```

- [ ] **Step 2: Full build + typecheck + test**

```bash
cd packages/profile && pnpm typecheck && pnpm build && pnpm test
```

Expected: ALL PASS, build produces `dist/index.js`, `dist/parsers/index.js`, `dist/fetcher.js` with `.d.ts` files.

- [ ] **Step 3: Verify subpath imports work**

Create a quick smoke test:

```bash
cd packages/profile && node -e "
  import('./dist/index.js').then(m => console.log('root:', Object.keys(m).slice(0, 5)));
  import('./dist/parsers/index.js').then(m => console.log('parsers:', Object.keys(m)));
  import('./dist/fetcher.js').then(m => console.log('fetcher:', Object.keys(m)));
"
```

Expected: Each import resolves and lists exported names.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: finalize @gnawniaverse/profile v1.0.0 with full public API"
```

---

## Summary

| Chunk | Tasks | What it delivers |
|-------|-------|-----------------|
| 1 | Tasks 1-3 | Monorepo structure, files moved, packages scaffolded |
| 2 | Tasks 4-5 | Types split into domain files, parsers split into modules, subpath exports |
| 3 | Tasks 6-8 | Custom errors, ParseResult<T> warnings, HunterProfileClient |
| 4 | Tasks 9-11 | All tests rewritten, inspect script updated, final polish |
