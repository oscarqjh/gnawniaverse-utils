import type {
  AchievementImage,
  AchievementTier,
  EventData,
  EventMeta,
} from "./types";

// ── Section markers ─────────────────────────────────────────────

const SEPARATOR = "---";

/** Known metadata keys (case-insensitive). */
const META_KEYS = new Set([
  "event_name",
  "organiser",
  "description",
  "date",
  "start_date",
  "end_date",
  "participants",
]);

/** Required tier header columns (case-insensitive). */
const TIER_HEADERS = [
  "tier_name",
  "badge_url",
  "badge_desc",
  "badge_art",
  "title_url",
  "title_desc",
  "title_art",
  "description",
];

// ── Helpers ─────────────────────────────────────────────────────

function trimOrNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

function isSeparator(row: string[]): boolean {
  return row.length > 0 && row[0]?.trim() === SEPARATOR;
}

function parseIntOrNull(value: string | undefined): number | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const n = parseInt(trimmed, 10);
  return Number.isNaN(n) ? null : n;
}

/**
 * Normalize a header/key string to snake_case.
 * "Tier Name" → "tier_name", "Badge URL" → "badge_url",
 * "event_name" → "event_name", "Start Date" → "start_date"
 */
function toSnakeCase(s: string): string {
  return s
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1_$2") // camelCase → camel_Case
    .replace(/[()[\]{}]/g, "")            // remove brackets/parens
    .replace(/[\s\-./\\,;:]+/g, "_")      // spaces/hyphens/dots/slashes → underscores
    .replace(/_+/g, "_")                  // collapse multiple underscores
    .replace(/^_|_$/g, "")               // trim leading/trailing underscores
    .toLowerCase();
}

// ── Section splitting ───────────────────────────────────────────

interface SheetSections {
  metaRows: string[][];
  tierRows: string[][];
  awardRows: string[][];
}

/**
 * Split sheet rows into 3 sections separated by `---` rows.
 * Section 1: metadata (key-value pairs)
 * Section 2: tier definitions (header + data rows)
 * Section 3: hunter awards (header + data rows)
 */
export function splitSections(rows: string[][]): SheetSections {
  const sections: string[][][] = [];
  let current: string[][] = [];

  for (const row of rows) {
    if (isSeparator(row)) {
      sections.push(current);
      current = [];
    } else {
      current.push(row);
    }
  }
  // Push the last section
  sections.push(current);

  return {
    metaRows: sections[0] ?? [],
    tierRows: sections[1] ?? [],
    awardRows: sections[2] ?? [],
  };
}

// ── Metadata parser ─────────────────────────────────────────────

export function parseMeta(rows: string[][]): EventMeta {
  const meta: EventMeta = {
    name: "Unknown Event",
    organiser: null,
    description: null,
    date: null,
    endDate: null,
    participants: null,
    extra: {},
  };

  for (const row of rows) {
    const key = toSnakeCase(row[0] ?? "");
    const value = row[1]?.trim();
    if (!key || !value) continue;

    switch (key) {
      case "event_name":
        meta.name = value;
        break;
      case "organiser":
        meta.organiser = value;
        break;
      case "description":
        meta.description = value;
        break;
      case "date":
      case "start_date":
        meta.date = value;
        break;
      case "end_date":
        meta.endDate = value;
        break;
      case "participants":
        meta.participants = parseIntOrNull(value);
        break;
      default:
        // Store any unknown keys as extra metadata
        if (!META_KEYS.has(key)) {
          meta.extra[key] = value;
        }
        break;
    }
  }

  return meta;
}

// ── Tier parser ─────────────────────────────────────────────────

function parseImage(
  url: string | undefined,
  desc: string | undefined,
  artist: string | undefined,
): AchievementImage | null {
  const trimmedUrl = trimOrNull(url);
  if (!trimmedUrl) return null;
  return {
    url: trimmedUrl,
    description: trimOrNull(desc),
    artist: trimOrNull(artist),
  };
}

export function parseTiers(rows: string[][]): AchievementTier[] {
  if (rows.length < 2) return [];

  // First row is the header — normalize to snake_case
  const header = rows[0].map((h) => toSnakeCase(h));
  const col = (name: string): number => header.indexOf(name);

  const tierNameIdx = col("tier_name");
  const badgeUrlIdx = col("badge_url");
  const badgeDescIdx = col("badge_desc");
  const badgeArtIdx = col("badge_art");
  const titleUrlIdx = col("title_url");
  const titleDescIdx = col("title_desc");
  const titleArtIdx = col("title_art");
  const descIdx = col("description");

  if (tierNameIdx === -1) return [];

  const tiers: AchievementTier[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = trimOrNull(row[tierNameIdx]);
    if (!name) continue;

    const badge = badgeUrlIdx >= 0
      ? parseImage(
          row[badgeUrlIdx],
          badgeDescIdx >= 0 ? row[badgeDescIdx] : undefined,
          badgeArtIdx >= 0 ? row[badgeArtIdx] : undefined,
        )
      : null;

    const title = parseImage(
      titleUrlIdx >= 0 ? row[titleUrlIdx] : undefined,
      titleDescIdx >= 0 ? row[titleDescIdx] : undefined,
      titleArtIdx >= 0 ? row[titleArtIdx] : undefined,
    );

    tiers.push({
      name,
      description: descIdx >= 0 ? trimOrNull(row[descIdx]) : null,
      badge,
      title,
    });
  }

  return tiers;
}

// ── Awards parser ───────────────────────────────────────────────

export function parseAwards(rows: string[][]): Record<string, number[]> {
  if (rows.length < 2) return {};

  const header = rows[0].map((h) => toSnakeCase(h));
  const hunterIdIdx = header.indexOf("hunter_id");
  const tierIdx = header.indexOf("tier");

  if (hunterIdIdx === -1 || tierIdx === -1) return {};

  const awards: Record<string, number[]> = {};

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const hunterId = parseIntOrNull(row[hunterIdIdx]);
    const tier = trimOrNull(row[tierIdx]);
    if (hunterId === null || !tier) continue;

    if (!awards[tier]) awards[tier] = [];
    awards[tier].push(hunterId);
  }

  return awards;
}

// ── Full sheet parser ───────────────────────────────────────────

/**
 * Parse a single event sheet (2D array of cell values) into structured EventData.
 *
 * Expected sheet layout:
 * ```
 * event_name    | Spring Hunt 2026
 * organiser     | MouseHunt Discord Mods
 * description   | Annual spring hunting challenge
 * date          | 2026-03-01
 * participants  | 342
 * ---           | ---
 * tier_name     | badge_url | badge_desc | badge_art | title_url | title_desc | title_art | description
 * Champion      | https://..| ...        | @artist   | https://..| ...        | @artist   | Top 3
 * Participant   | https://..| ...        |           |           |            |           | Joined
 * ---           | ---
 * hunter_id     | tier
 * 6268658       | Champion
 * 1234567       | Participant
 * ```
 */
export function parseEventSheet(rows: string[][]): EventData {
  const { metaRows, tierRows, awardRows } = splitSections(rows);

  return {
    meta: parseMeta(metaRows),
    tiers: parseTiers(tierRows),
    awards: parseAwards(awardRows),
  };
}
