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
};

/**
 * Parse a MH-style datetime string into an ISO string (UTC).
 * Handles formats like:
 *   "March 17, 2026 @ 11:22pm (Local Time)"
 *   "Mar 17 2026 @ 11:22pm"
 *   "March 20, 2026 03:46pm (UTC)"
 */
export function parseAuraExpiry(raw: string): string | null {
  // Normalize: remove "(Local Time)", "(UTC)", extra whitespace
  const cleaned = raw
    .replace(/\(Local Time\)/i, "")
    .replace(/\(UTC\)/i, "")
    .replace(/@/g, "")
    .replace(/,/g, "")
    .trim();

  // Match: Month Day Year Hour:MinuteAMPM
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
