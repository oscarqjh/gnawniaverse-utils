/**
 * King's Crowns tab parser for MouseHunt public profile pages.
 */

import { load } from "cheerio";

import type { CrownsData, CrownTier, CrownMouse, ParseResult } from "../types/index.js";
import { parseNum, WarningCollector, isCloudflareChallenge } from "./helpers.js";

/** Parse King's Crowns data from the crowns tab HTML. */
export function parseCrowns(html: string): ParseResult<CrownsData> {
  const w = new WarningCollector();

  if (isCloudflareChallenge(html)) {
    w.add("*", "Received Cloudflare challenge page");
    return {
      data: {
        crowns: { diamond: [], platinum: [], gold: [], silver: [], bronze: [] },
        summary: { diamond: 0, platinum: 0, gold: 0, silver: 0, bronze: 0 },
      },
      warnings: w.warnings,
    };
  }

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
      (_: number, el: any) => {
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

  return { data: { crowns, summary }, warnings: w.warnings };
}
