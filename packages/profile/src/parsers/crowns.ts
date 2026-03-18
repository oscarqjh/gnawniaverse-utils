/**
 * King's Crowns tab parser for MouseHunt public profile pages.
 */

import { load } from "cheerio";
import type { CrownsData, CrownTier, CrownMouse } from "../types/index.js";
import { parseNum } from "./helpers.js";

/** Parse King's Crowns data from the crowns tab HTML. */
export function parseCrowns(html: string): CrownsData {
  const $ = load(html);
  const tiers: CrownTier[] = ["diamond", "platinum", "gold", "silver", "bronze"];
  const crowns: Record<CrownTier, CrownMouse[]> = {
    diamond: [],
    platinum: [],
    gold: [],
    silver: [],
    bronze: [],
  };

  for (const tier of tiers) {
    $(`.mouseCrownsView-group.${tier} .mouseCrownsView-group-mouse`).each(
      (_, el) => {
        const $el = $(el);
        const id = $el.attr("data-mouse-id");
        const type = $el.attr("data-mouse-type");
        if (!id || !type) return;

        const name = $el.find(".mouseCrownsView-group-mouse-name").text().trim();
        const catchesText = $el.find(".mouseCrownsView-group-mouse-catches").text().trim();
        const catches = parseNum(catchesText);
        const imageUrl = $el.find(".mouseCrownsView-group-mouse-image").attr("data-image") || null;
        const largeImageUrl = $el.attr("data-mouse-large") || null;

        crowns[tier].push({ id: parseInt(id, 10), type, name, catches, imageUrl, largeImageUrl });
      },
    );
  }

  const summary = {} as Record<CrownTier, number>;
  for (const tier of tiers) {
    summary[tier] = crowns[tier].length;
  }

  return { crowns, summary };
}
