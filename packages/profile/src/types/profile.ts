/** Hunter profile parsed from public profile page HTML. */
export interface HunterProfile {
  uid: number;
  name: string;
  rank: string;
  rankPercent: number | null;
  rankIconUrl: string | null;
  location: string;
  locationBannerUrl: string | null;
  locationThumbnailUrl: string | null;
  profileImageUrl: string | null;
  lastActive: string | null;

  // Mice stats
  miceCaught: number;
  miceTotal: number;
  rareMiceCaught: number;
  rareMiceTotal: number;
  totalMiceCaught: number;

  // Hunting history
  huntingSince: string | null;
  loyaltyBadgeLevel: number | null;
  loyaltyBadgeYears: number | null;

  // Horn stats
  hornStats: HornStats | null;

  // Currency
  gold: number;
  points: number;

  // Shield
  goldenShield: GoldenShield | null;

  // Team
  team: TeamInfo | null;

  // Trap setup
  trap: TrapSetup | null;
  trapStats: TrapStats | null;
  auras: TrapAura[];

  // Favourite mice
  favouriteMice: FavouriteMouse[];

  // Treasure maps
  treasureMap: TreasureMapInfo | null;

  // Tournament awards
  tournamentAwards: TournamentAward[];
}

/** Horn call breakdown. */
export interface HornStats {
  total: number;
  active: number;
  passive: number;
  linked: number;
}

/** Golden Shield status. */
export interface GoldenShield {
  hasShield: boolean;
  /** Estimated expiry as ISO datetime (computed from relative duration at scrape time). */
  expiryDate: string | null;
  /** Raw relative duration string, e.g. "3 weeks 1 day 6 hours". */
  expiryRaw: string | null;
}

/** Team info with emblem. */
export interface TeamInfo {
  name: string;
  id: number | null;
}

/** Trap component IDs and detailed setup. */
export interface TrapSetup {
  // IDs from OG image URL
  weaponId: number;
  baseId: number;
  skinId: number | null;
  baitId: number | null;
  imageUrl: string;

  // Named components from HTML
  weapon: TrapComponent | null;
  base: TrapComponent | null;
  bait: TrapComponent | null;
  charm: TrapComponent | null;
  skin: TrapComponent | null;
}

/** Individual trap component (weapon, base, bait, charm, skin). */
export interface TrapComponent {
  name: string;
  type: string;
  thumbnailUrl: string | null;
  quantity: number | null;
}

/** Trap stat values. */
export interface TrapStats {
  power: number;
  powerType: string | null;
  luck: number;
  attractionBonus: string | null;
  cheeseEffect: string | null;
}

/** Trap aura status. */
export interface TrapAura {
  type: string;
  active: boolean;
  title: string | null;
  description: string | null;
  /** Expiry as ISO datetime string, or null if unparseable. */
  expiryDate: string | null;
  /** Raw expiry text from HTML. */
  expiryRaw: string | null;
}

/** Favourite mouse on profile. */
export interface FavouriteMouse {
  type: string;
  name: string;
  catches: number;
  misses: number;
  imageUrl: string | null;
  crownTier: string | null;
  group: number;
}

/** Treasure map info. */
export interface TreasureMapInfo {
  currentMapName: string | null;
  currentMapImageUrl: string | null;
  currentMapId: number | null;
  cluesFound: number;
  globalRanking: number | null;
}

/** Tournament award. */
export interface TournamentAward {
  imageUrl: string;
  quantity: number;
}
