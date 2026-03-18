/** King's Crown entry for a single mouse. */
export interface CrownMouse {
  id: number;
  type: string;
  name: string;
  catches: number;
  imageUrl: string | null;
  largeImageUrl: string | null;
}

export type CrownTier = "diamond" | "platinum" | "gold" | "silver" | "bronze";

/** King's Crowns data. */
export interface CrownsData {
  crowns: Record<CrownTier, CrownMouse[]>;
  summary: Record<CrownTier, number>;
}
