import type {
  EventData,
  HunterAchievement,
  HunterAchievements,
  ParseWarning,
  ParseResult,
  SheetsFetchOptions,
} from "./types";
import { parseEventSheet } from "./parser";
import {
  AchievementsError,
  SheetsApiError,
  SheetsRateLimitError,
  ValidationError,
} from "./errors";

// ── Google Sheets API types ─────────────────────────────────────

interface SheetProperties {
  title: string;
  sheetId: number;
}

interface SpreadsheetMeta {
  sheets: { properties: SheetProperties }[];
}

interface SheetValuesResponse {
  values?: string[][];
}

// ── Constants ───────────────────────────────────────────────────

const SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";
const SPREADSHEET_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

// ── Validation ──────────────────────────────────────────────────

function validateOptions(options: SheetsFetchOptions): void {
  if (!options.apiKey || typeof options.apiKey !== "string") {
    throw new ValidationError("API key is required and must be a non-empty string");
  }
  if (!options.spreadsheetId || !SPREADSHEET_ID_PATTERN.test(options.spreadsheetId)) {
    throw new ValidationError(
      `Invalid spreadsheet ID: must match ${SPREADSHEET_ID_PATTERN}`,
    );
  }
}

function validateHunterId(hunterId: number | string): number {
  const id = typeof hunterId === "string" ? parseInt(hunterId, 10) : hunterId;
  if (!Number.isFinite(id) || id <= 0) {
    throw new ValidationError(`Invalid hunter ID: ${String(hunterId)}`);
  }
  return id;
}

// ── Internal fetch helpers ──────────────────────────────────────

/**
 * Create an AbortSignal that merges an optional user signal with an optional timeout.
 */
function createSignal(options: SheetsFetchOptions): AbortSignal | undefined {
  if (!options.timeoutMs && !options.signal) return undefined;

  const controller = new AbortController();

  // Merge user's signal
  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort(options.signal.reason);
    } else {
      options.signal.addEventListener("abort", () => controller.abort(options.signal!.reason), {
        once: true,
      });
    }
  }

  // Add timeout
  if (options.timeoutMs) {
    const timer = setTimeout(
      () => controller.abort(new AchievementsError(`Request timed out after ${options.timeoutMs}ms`)),
      options.timeoutMs,
    );
    // Clear timeout if aborted by user signal
    controller.signal.addEventListener("abort", () => clearTimeout(timer), { once: true });
  }

  return controller.signal;
}

/**
 * Wrap fetch() to prevent API key leakage in error messages.
 */
async function safeFetch(
  url: string,
  signal: AbortSignal | undefined,
  context: string,
): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, signal ? { signal } : undefined);
  } catch (err: unknown) {
    // Network errors may contain the URL (which has the API key).
    // Re-throw with a safe message.
    if (err instanceof Error && err.name === "AbortError") {
      throw new AchievementsError("Request was aborted", { cause: err });
    }
    throw new AchievementsError(`Network error: ${context}`, { cause: err });
  }

  if (res.status === 429) {
    throw new SheetsRateLimitError();
  }
  if (!res.ok) {
    throw new SheetsApiError(res.status, `${context}: ${res.status} ${res.statusText}`);
  }

  return res;
}

// ── Fetcher ─────────────────────────────────────────────────────

/**
 * Fetch the list of sheet tab names from a spreadsheet.
 */
async function fetchSheetNames(
  options: SheetsFetchOptions,
  signal: AbortSignal | undefined,
): Promise<string[]> {
  const url = `${SHEETS_API_BASE}/${options.spreadsheetId}?key=${options.apiKey}&fields=sheets.properties.title`;
  const res = await safeFetch(url, signal, "Failed to fetch spreadsheet metadata");
  const data: SpreadsheetMeta = await res.json();
  return data.sheets.map((s) => s.properties.title);
}

/**
 * Fetch all cell values from a single sheet tab.
 */
async function fetchSheetValues(
  sheetName: string,
  options: SheetsFetchOptions,
  signal: AbortSignal | undefined,
): Promise<string[][]> {
  const encodedName = encodeURIComponent(sheetName);
  const url = `${SHEETS_API_BASE}/${options.spreadsheetId}/values/${encodedName}?key=${options.apiKey}&valueRenderOption=FORMATTED_VALUE`;
  const res = await safeFetch(url, signal, `Failed to fetch sheet "${sheetName}"`);
  const data: SheetValuesResponse = await res.json();
  return data.values ?? [];
}

/**
 * Fetch and parse ALL events from the spreadsheet.
 * Each sheet tab is treated as one event.
 * Fetches all tabs in parallel for performance.
 *
 * @returns ParseResult containing array of EventData and any warnings.
 */
export async function fetchAllEvents(
  options: SheetsFetchOptions,
): Promise<ParseResult<EventData[]>> {
  validateOptions(options);

  const signal = createSignal(options);
  const sheetNames = await fetchSheetNames(options, signal);

  // Fetch all tabs in parallel
  const allRows = await Promise.all(
    sheetNames.map((name) => fetchSheetValues(name, options, signal).then(
      (rows) => ({ name, rows, error: null as string | null }),
      (err) => ({ name, rows: [] as string[][], error: String(err) }),
    )),
  );

  const events: EventData[] = [];
  const warnings: ParseWarning[] = [];

  for (const { name, rows, error } of allRows) {
    if (error) {
      warnings.push({ sheet: name, message: `Failed to fetch: ${error}` });
      continue;
    }
    if (rows.length === 0) {
      warnings.push({ sheet: name, message: "Sheet is empty" });
      continue;
    }

    const event = parseEventSheet(rows);
    if (event.tiers.length === 0) {
      warnings.push({ sheet: name, message: "No valid tiers found — sheet may be malformed" });
      continue;
    }

    events.push(event);
  }

  return { data: events, warnings };
}

/**
 * Fetch all events and filter to achievements for a specific hunter.
 *
 * @param hunterId - The MouseHunt hunter ID (number or numeric string).
 * @param options - Google Sheets API options.
 * @returns ParseResult containing the hunter's achievements and any warnings.
 * @throws {ValidationError} If hunterId is not a valid positive integer.
 */
export async function fetchHunterAchievements(
  hunterId: number | string,
  options: SheetsFetchOptions,
): Promise<ParseResult<HunterAchievements>> {
  const id = validateHunterId(hunterId);
  const { data: events, warnings } = await fetchAllEvents(options);

  const achievements: HunterAchievement[] = [];

  for (const event of events) {
    for (const tier of event.tiers) {
      const hunterIds = event.awards[tier.name] ?? [];
      if (hunterIds.includes(id)) {
        achievements.push({
          event: event.meta,
          tier,
        });
      }
    }
  }

  return { data: { hunterId: id, achievements }, warnings };
}
