/** Mouse catch stats from the mice tab. */
export interface MouseStat {
  type: string;
  name: string;
  caught: boolean;
  catches: number;
  misses: number;
  averageWeight: string | null;
  heaviestCatch: string | null;
  imageUrl: string | null;
  category: string;
}

/** Mouse category/group with progress. */
export interface MouseCategory {
  key: string;
  name: string;
  progress: string | null;
  complete: boolean;
}

/** Mice tab data. */
export interface MiceData {
  mice: MouseStat[];
  categories: MouseCategory[];
}
