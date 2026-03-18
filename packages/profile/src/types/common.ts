import type { HunterProfile } from "./profile.js";
import type { MiceData } from "./mice.js";
import type { CrownsData } from "./crowns.js";
import type { ItemsData } from "./items.js";

export interface ParseWarning {
  field: string;
  message: string;
  selector?: string;
}

export interface ParseResult<T> {
  data: T;
  warnings: ParseWarning[];
}

export type ProfileTab = "profile" | "mice" | "kings_crowns" | "items";
export type MiceSubTab = "group" | "location";

export interface RequestOptions {
  signal?: AbortSignal;
}

export interface ProfileFetcher {
  fetchTab(hunterId: string | number, tab: ProfileTab, subTab?: MiceSubTab, signal?: AbortSignal): Promise<string>;
}

export interface ProfileParser {
  parseProfile(html: string): ParseResult<HunterProfile>;
  parseMice(html: string): ParseResult<MiceData>;
  parseCrowns(html: string): ParseResult<CrownsData>;
  parseItems(html: string): ParseResult<ItemsData>;
}

export interface HunterProfileClientOptions {
  fetcher?: ProfileFetcher;
  parser?: ProfileParser;
  requestDelay?: number;
  userAgent?: string;
  baseUrl?: string;
}
