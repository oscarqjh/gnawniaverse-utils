/**
 * HTTP fetcher for MouseHunt public profile pages.
 *
 * Fetches HTML from mousehuntgame.com.
 * Must run server-side (Node.js, Next.js API routes, etc.) due to
 * cross-origin restrictions in browsers.
 */

import type { ProfileFetcher, ProfileTab, MiceSubTab } from "./types/index.js";
import { HttpError, HunterNotFoundError, RateLimitError } from "./errors.js";

const DEFAULTS = {
  baseUrl: "https://www.mousehuntgame.com",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
} as const;

export interface HttpFetcherOptions {
  baseUrl?: string;
  userAgent?: string;
}

export class HttpProfileFetcher implements ProfileFetcher {
  private readonly baseUrl: string;
  private readonly userAgent: string;

  constructor(options?: HttpFetcherOptions) {
    this.baseUrl = options?.baseUrl ?? DEFAULTS.baseUrl;
    this.userAgent = options?.userAgent ?? DEFAULTS.userAgent;
  }

  async fetchTab(hunterId: string | number, tab: ProfileTab, subTab?: MiceSubTab, signal?: AbortSignal): Promise<string> {
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
