// ── Image metadata ──────────────────────────────────────────────

/** Badge or title image with optional description and artist attribution. */
export interface AchievementImage {
  url: string;
  description: string | null;
  artist: string | null;
}

// ── Tier ────────────────────────────────────────────────────────

/** A single achievement tier within an event (e.g. "Champion", "Participant"). */
export interface AchievementTier {
  name: string;
  description: string | null;
  badge: AchievementImage | null;
  title: AchievementImage | null;
}

// ── Event ───────────────────────────────────────────────────────

/** Metadata for a community event. */
export interface EventMeta {
  name: string;
  organiser: string | null;
  description: string | null;
  date: string | null;
  endDate: string | null;
  participants: number | null;
  /** Any extra key-value metadata from the sheet. */
  extra: Record<string, string>;
}

/** A fully parsed event with its tiers and awarded hunter IDs per tier. */
export interface EventData {
  meta: EventMeta;
  tiers: AchievementTier[];
  /** Map of tier name → array of hunter IDs awarded that tier. */
  awards: Record<string, number[]>;
}

// ── Hunter achievements ─────────────────────────────────────────

/** A single achievement earned by a hunter. */
export interface HunterAchievement {
  event: EventMeta;
  tier: AchievementTier;
}

/** All achievements for a single hunter. */
export interface HunterAchievements {
  hunterId: number;
  achievements: HunterAchievement[];
}

// ── Warnings ────────────────────────────────────────────────────

/** Warning generated during parsing (non-fatal issue). */
export interface ParseWarning {
  sheet: string;
  message: string;
}

/** Result wrapper with warnings. */
export interface ParseResult<T> {
  data: T;
  warnings: ParseWarning[];
}

// ── Fetch options ───────────────────────────────────────────────

/** Options for the Google Sheets fetcher. */
export interface SheetsFetchOptions {
  /** Google Sheets API key. */
  apiKey: string;
  /** The spreadsheet ID (from the sheet URL). */
  spreadsheetId: string;
  /** Optional AbortSignal for cancellation. */
  signal?: AbortSignal;
  /** Optional timeout in milliseconds. Creates an internal AbortController. */
  timeoutMs?: number;
}
