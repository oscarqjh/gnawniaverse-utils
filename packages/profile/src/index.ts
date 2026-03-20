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
  TournamentTier,
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
  ParseWarning,
  ParseResult,
  ProfileTab,
  MiceSubTab,
  RequestOptions,
  ProfileFetcher,
  ProfileParser,
  HunterProfileClientOptions,
  FullHunterProfile,
} from "./types/index.js";

// Errors
export {
  GnawniaVerseError,
  HttpError,
  HunterNotFoundError,
  RateLimitError,
  ParseError,
} from "./errors.js";

// Parsers (for custom HTML sources)
export {
  parseProfile,
  parseMice,
  parseCrowns,
  parseItems,
} from "./parsers/index.js";

// Client
export { HunterProfileClient } from "./client.js";

// Fetcher
export { HttpProfileFetcher } from "./fetcher.js";
export type { HttpFetcherOptions } from "./fetcher.js";
