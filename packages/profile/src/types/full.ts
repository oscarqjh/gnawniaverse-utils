import type { HunterProfile } from "./profile.js";
import type { MiceData } from "./mice.js";
import type { CrownsData } from "./crowns.js";
import type { ItemsData } from "./items.js";

/** Full hunter profile data from all tabs. */
export interface FullHunterProfile {
  profile: HunterProfile;
  miceByGroup: MiceData | null;
  miceByLocation: MiceData | null;
  crowns: CrownsData | null;
  items: ItemsData | null;
}
