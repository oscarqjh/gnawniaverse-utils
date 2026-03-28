/**
 * Items tab parser for MouseHunt public profile pages.
 */

import { load } from "cheerio";

import type { CollectionItem, ItemCategory, ItemsData, ParseResult } from "../types/index.js";
import { parseNum, textOrNull, extractBgUrl, WarningCollector, isCloudflareChallenge } from "./helpers.js";

/** Parse item collection from the items tab HTML. */
export function parseItems(html: string): ParseResult<ItemsData> {
  const w = new WarningCollector();

  if (isCloudflareChallenge(html)) {
    w.add("*", "Received Cloudflare challenge page");
    return { data: { items: [], categories: [] }, warnings: w.warnings };
  }

  const $ = load(html);
  const items: CollectionItem[] = [];

  // Iterate over each category content block to associate items with their category
  $(".hunterProfileItemsView-categoryContent").each((_: number, catEl: any) => {
    const category = $(catEl).attr("data-category") ?? "";

    $(catEl).find(".hunterProfileItemsView-categoryContent-item").each((_: number, el: any) => {
      const $el = $(el);
      const classList = $el.attr("class") ?? "";

      const name =
        $el.find(".hunterProfileItemsView-categoryContent-item-name span").text().trim() ||
        $el.find(".hunterProfileItemsView-categoryContent-item-name").text().trim();
      if (!name) return;

      const imageUrl = extractBgUrl($el.find(".itemImage").attr("style"));
      const qtyText = $el.find(".itemImage .quantity").text().trim();
      const quantity = qtyText ? parseNum(qtyText) : null;

      items.push({
        id: parseInt($el.attr("data-id") ?? "0", 10),
        type: $el.attr("data-type") ?? "",
        name,
        collected: !classList.includes("uncollected"),
        limitedEdition: classList.includes("limited_edition"),
        imageUrl,
        quantity,
        category,
      });
    });
  });

  const categories: ItemCategory[] = [];
  $(".hunterProfileItemsView-category").each((_: number, el: any) => {
    const $el = $(el);
    const key = $el.attr("data-category") ?? "";
    const name = $el.find(".hunterProfileItemsView-category-name").text().trim();
    const progress = textOrNull($el.find(".hunterProfileItemsView-category-progress").text());
    const complete = ($el.attr("class") ?? "").includes("complete");
    if (name) {
      categories.push({ key, name, progress, complete });
    }
  });

  return { data: { items, categories }, warnings: w.warnings };
}
