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
  ProfileTab,
  MiceSubTab,
} from "./types/index.js";
import { HttpProfileFetcher } from "./fetcher.js";
import { parseProfile } from "./parsers/profile.js";
import { parseMice } from "./parsers/mice.js";
import { parseCrowns } from "./parsers/crowns.js";
import { parseItems } from "./parsers/items.js";

const DEFAULT_REQUEST_DELAY = 200;

const defaultParser: ProfileParser = { parseProfile, parseMice, parseCrowns, parseItems };

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

  async getProfile(hunterId: number | string, options?: RequestOptions): Promise<ParseResult<HunterProfile>> {
    const html = await this.fetcher.fetchTab(hunterId, "profile", undefined, options?.signal);
    return this.parser.parseProfile(html);
  }

  async getFullProfile(hunterId: number | string, options?: RequestOptions): Promise<ParseResult<FullHunterProfile>> {
    const warnings: ParseWarning[] = [];

    // Profile tab required — throws on failure
    const profileHtml = await this.fetcher.fetchTab(hunterId, "profile", undefined, options?.signal);
    const profileResult = this.parser.parseProfile(profileHtml);
    warnings.push(...profileResult.warnings);

    const fetchOptionalTab = async <T>(
      tabName: string,
      fetchFn: () => Promise<string>,
      parseFn: (html: string) => ParseResult<T>,
    ): Promise<T | null> => {
      try {
        await delay(this.requestDelay);
        const html = await fetchFn();
        const result = parseFn(html);
        warnings.push(...result.warnings.map((w) => ({ ...w, field: `${tabName}.${w.field}` })));
        return result.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        warnings.push({ field: tabName, message: `Fetch failed: ${message}` });
        return null;
      }
    };

    const miceByGroup = await fetchOptionalTab("mice_group",
      () => this.fetcher.fetchTab(hunterId, "mice", "group", options?.signal), this.parser.parseMice);
    const miceByLocation = await fetchOptionalTab("mice_location",
      () => this.fetcher.fetchTab(hunterId, "mice", "location", options?.signal), this.parser.parseMice);
    const crowns = await fetchOptionalTab("crowns",
      () => this.fetcher.fetchTab(hunterId, "kings_crowns", undefined, options?.signal), this.parser.parseCrowns);
    const items = await fetchOptionalTab("items",
      () => this.fetcher.fetchTab(hunterId, "items", undefined, options?.signal), this.parser.parseItems);

    return {
      data: { profile: profileResult.data, miceByGroup, miceByLocation, crowns, items },
      warnings,
    };
  }

  async fetchTab(hunterId: number | string, tab: ProfileTab, subTab?: MiceSubTab): Promise<string> {
    return this.fetcher.fetchTab(hunterId, tab, subTab);
  }
}
