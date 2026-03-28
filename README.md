# GnawniaVerse Utils

A monorepo of TypeScript packages for the [MouseHunt](https://www.mousehuntgame.com/) community.

## Packages

| Package | npm | Description |
|---------|-----|-------------|
| [`@gnawniaverse/profile`](./packages/profile) | [![npm](https://img.shields.io/npm/v/@gnawniaverse/profile)](https://www.npmjs.com/package/@gnawniaverse/profile) | Hunter profile parser and fetcher |
| [`@gnawniaverse/achievements`](./packages/achievements) | [![npm](https://img.shields.io/npm/v/@gnawniaverse/achievements)](https://www.npmjs.com/package/@gnawniaverse/achievements) | Achievement system backed by Google Sheets |

---

## @gnawniaverse/profile

Parse and fetch MouseHunt hunter profiles from public profile pages. No authentication required.

### Install

```bash
npm install @gnawniaverse/profile
```

### Quick Start

```ts
import { HunterProfileClient } from "@gnawniaverse/profile";

const client = new HunterProfileClient();

// Fetch full profile (all tabs)
const { data, warnings } = await client.getFullProfile(6268658);

console.log(data.profile.name);     // "Tey Zi Pin"
console.log(data.profile.rank);     // "Sage"
console.log(data.crowns.summary);   // { diamond: 0, platinum: 20, gold: 63, ... }
console.log(data.items.categories); // [{ key: "weapon", name: "Weapons", progress: "53 of 131" }, ...]
```

### Parse-only (bring your own HTML)

```ts
import { parseProfile, parseCrowns } from "@gnawniaverse/profile/parsers";

const profile = parseProfile(htmlString);
const crowns = parseCrowns(crownsHtmlString);
```

### Custom fetcher (e.g. Chrome extension)

```ts
import { HunterProfileClient } from "@gnawniaverse/profile";

const client = new HunterProfileClient({
  fetcher: {
    fetchTab: async (hunterId, tab, subTab) => {
      // your own HTML source
      return chrome.runtime.sendMessage({ hunterId, tab, subTab });
    },
  },
});
```

### API

#### `HunterProfileClient`

| Method | Returns | Description |
|--------|---------|-------------|
| `getProfile(id)` | `ParseResult<HunterProfile>` | Profile tab only |
| `getFullProfile(id)` | `ParseResult<FullHunterProfile>` | All tabs (profile, mice, crowns, items) |

#### Parsers

| Function | Input | Output |
|----------|-------|--------|
| `parseProfile(html)` | Profile tab HTML | `ParseResult<HunterProfile>` |
| `parseMice(html)` | Mice tab HTML | `ParseResult<MiceData>` |
| `parseCrowns(html)` | Crowns tab HTML | `ParseResult<CrownsData>` |
| `parseItems(html)` | Items tab HTML | `ParseResult<ItemsData>` |

#### Error Classes

| Error | When |
|-------|------|
| `HunterNotFoundError` | Hunter ID doesn't exist (404) |
| `RateLimitError` | Too many requests to MouseHunt |
| `HttpError` | Any other HTTP error |
| `ParseError` | HTML structure changed / parse failure |
| `GnawniaVerseError` | Base error class |

---

## @gnawniaverse/achievements

Read community event achievements from a Google Sheet. Designed for Discord mods to manage records directly in Google Sheets without needing a database or admin interface.

### Install

```bash
npm install @gnawniaverse/achievements
```

### Quick Start

```ts
import { fetchHunterAchievements } from "@gnawniaverse/achievements";

const { data, warnings } = await fetchHunterAchievements(6268658, {
  apiKey: "YOUR_GOOGLE_SHEETS_API_KEY",
  spreadsheetId: "YOUR_SPREADSHEET_ID",
});

for (const achievement of data.achievements) {
  console.log(`${achievement.event.name}: ${achievement.tier.name}`);
  console.log(`Badge: ${achievement.tier.badge?.url}`);
}
```

### Fetch all events

```ts
import { fetchAllEvents } from "@gnawniaverse/achievements";

const { data: events, warnings } = await fetchAllEvents({
  apiKey: "...",
  spreadsheetId: "...",
  timeoutMs: 10000, // optional timeout
});
```

### Parse-only (bring your own data)

```ts
import { parseEventSheet } from "@gnawniaverse/achievements";

const rows = [
  ["Event Name", "Spring Hunt 2026"],
  ["Organiser", "Discord Mods"],
  ["---", "---"],
  ["Tier Name", "Badge URL", "Badge Desc"],
  ["Champion", "https://example.com/badge.png", "Top 3"],
  ["---", "---"],
  ["Hunter Id", "Tier"],
  ["6268658", "Champion"],
];

const event = parseEventSheet(rows);
```

### Google Sheet Format

Each sheet tab represents one event. The sheet has 3 sections separated by `---` rows:

**Section 1: Event metadata** (key-value pairs)

| Key | Value |
|-----|-------|
| Event Name | Spring Hunt 2026 |
| Organiser | Discord Mods |
| Description | Annual spring challenge |
| Start Date | 2026-03-01 |
| End Date | 2026-03-11 |
| Participants | 342 |

Any additional rows are stored in `event.meta.extra`. Keys are normalized to snake_case regardless of casing in the sheet.

**Section 2: Tier definitions** (header + data rows)

| Tier Name | Badge URL | Badge Desc | Badge Art | Title URL | Title Desc | Title Art |
|-----------|-----------|------------|-----------|-----------|------------|-----------|
| Champion | https://... | Top 3 hunters | @ArtistA | https://... | Spring Title | @ArtistB |
| Participant | https://... | Joined event | | | | |

- `Badge Art` / `Title Art` = artist attribution (optional)
- `Title URL` and related columns are optional
- A tier can have a badge, a title, both, or neither

**Section 3: Hunter awards** (header + data rows)

| Hunter Id | Tier |
|-----------|------|
| 6268658 | Champion |
| 1234567 | Participant |
| 6268658 | Participant |

A hunter can have multiple tiers in the same event.

### Options

```ts
interface SheetsFetchOptions {
  apiKey: string;          // Google Sheets API key
  spreadsheetId: string;   // Spreadsheet ID from the URL
  signal?: AbortSignal;    // Optional cancellation
  timeoutMs?: number;      // Optional timeout in ms
}
```

### Error Classes

| Error | When |
|-------|------|
| `SheetsApiError` | Google Sheets API HTTP error |
| `SheetsRateLimitError` | Google Sheets API 429 |
| `SheetParseError` | Malformed sheet structure |
| `ValidationError` | Invalid hunter ID or spreadsheet ID |
| `AchievementsError` | Base error class |

### Google Sheets Setup

1. Create a Google Sheet with the format above
2. Share it: **File > Share > Anyone with the link can view**
3. Get an API key from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
4. Enable the **Google Sheets API** for your project

---

## Development

### Prerequisites

- Node.js >= 18
- npm

### Setup

```bash
git clone https://github.com/oscarqjh/gnawniaverse-utils.git
cd gnawniaverse-utils
```

### Working on a package

```bash
cd packages/profile  # or packages/achievements

npm install           # install dependencies
npm test              # run tests
npm run typecheck     # type check
npm run build         # build dist/
npm run dev           # watch mode
```

### Important: Lock files

Each package has its own `package-lock.json` generated by **npm** (not pnpm). If you use pnpm locally for the monorepo, always regenerate lock files with npm before committing:

```bash
cd packages/profile && npm install --package-lock-only
cd packages/achievements && npm install --package-lock-only
```

This ensures `npm ci` works correctly in CI.

### CI/CD

- **CI**: Tests and typecheck run on every push/PR via GitHub Actions
- **Publishing**: Packages are published to npm automatically when a GitHub release is created, using [Trusted Publishing](https://docs.npmjs.com/generating-provenance-statements) via OIDC (no npm tokens required)

### Creating a release

1. Bump version in `packages/*/package.json`
2. Commit and push
3. Create a GitHub release with tag `vX.Y.Z`
4. The publish workflow handles the rest

---

## License

MIT
