/**
 * Fetcher for MouseHunt public profile pages.
 *
 * Fetches HTML from mousehuntgame.com and parses it using the parsers.
 * Must run server-side (Node.js, Next.js API routes, etc.) due to
 * cross-origin restrictions in browsers.
 */

import type { HunterProfile, FullHunterProfile } from "./types/index.js";
import { parseProfile, parseMice, parseCrowns, parseItems } from "./parsers/index.js";

/** Options for configuring fetch behavior. */
export interface FetchOptions {
  /** Base URL for MouseHunt. @default "https://www.mousehuntgame.com" */
  baseUrl?: string;
  /** User-Agent header string. @default "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" */
  userAgent?: string;
  /** Delay in ms between sequential requests. @default 200 */
  requestDelay?: number;
  /** AbortSignal for cancellation. */
  signal?: AbortSignal;
}

const DEFAULTS = {
  baseUrl: "https://www.mousehuntgame.com",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  requestDelay: 200,
} as const;

function resolveOptions(opts?: FetchOptions) {
  return {
    baseUrl: opts?.baseUrl ?? DEFAULTS.baseUrl,
    userAgent: opts?.userAgent ?? DEFAULTS.userAgent,
    requestDelay: opts?.requestDelay ?? DEFAULTS.requestDelay,
    signal: opts?.signal,
  };
}

async function fetchPage(
  path: string,
  params: Record<string, string>,
  config: ReturnType<typeof resolveOptions>,
): Promise<string> {
  const url = new URL(path, config.baseUrl);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const resp = await fetch(url.toString(), {
    headers: { "User-Agent": config.userAgent, Accept: "text/html" },
    signal: config.signal,
  });

  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} fetching ${url}`);
  }

  return resp.text();
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Fetch a hunter's basic profile (name, rank, stats, trap setup). */
export async function fetchHunterProfile(
  hunterId: number | string,
  options?: FetchOptions,
): Promise<HunterProfile> {
  const config = resolveOptions(options);
  const html = await fetchPage(
    "/profile.php",
    { tab: "profile", uid: String(hunterId) },
    config,
  );
  return parseProfile(html);
}

/** Fetch a hunter's full profile including mice, crowns, and items. */
export async function fetchFullHunterProfile(
  hunterId: number | string,
  options?: FetchOptions,
): Promise<FullHunterProfile> {
  const config = resolveOptions(options);
  const uid = String(hunterId);

  const profileHtml = await fetchPage(
    "/profile.php",
    { tab: "profile", uid },
    config,
  );
  const profile = parseProfile(profileHtml);

  await delay(config.requestDelay);

  const miceGroupHtml = await fetchPage(
    "/profile.php",
    { tab: "mice", sub_tab: "group", uid },
    config,
  );
  const miceByGroup = parseMice(miceGroupHtml);

  await delay(config.requestDelay);

  const miceLocHtml = await fetchPage(
    "/profile.php",
    { tab: "mice", sub_tab: "location", uid },
    config,
  );
  const miceByLocation = parseMice(miceLocHtml);

  await delay(config.requestDelay);

  const crownsHtml = await fetchPage(
    "/profile.php",
    { tab: "kings_crowns", uid },
    config,
  );
  const crowns = parseCrowns(crownsHtml);

  await delay(config.requestDelay);

  const itemsHtml = await fetchPage(
    "/profile.php",
    { tab: "items", uid },
    config,
  );
  const items = parseItems(itemsHtml);

  return { profile, miceByGroup, miceByLocation, crowns, items };
}
