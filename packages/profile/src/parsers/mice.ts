/**
 * Mice tab parser for MouseHunt public profile pages.
 */

import { load } from "cheerio";

import type { MouseStat, MouseCategory, MiceData, ParseResult } from "../types/index.js";
import { textOrNull, extractBgUrl, extractShowArg, WarningCollector, isCloudflareChallenge } from "./helpers.js";

/** Parse mouse catch statistics from the mice tab HTML. */
export function parseMice(html: string): ParseResult<MiceData> {
  const w = new WarningCollector();

  if (isCloudflareChallenge(html)) {
    w.add("*", "Received Cloudflare challenge page");
    return { data: { mice: [], categories: [] }, warnings: w.warnings };
  }

  const $ = load(html);
  const mice: MouseStat[] = [];
  const categories: MouseCategory[] = [];

  // Parse categories from the directory sidebar
  $(".mouseListView-category").each((_: number, el: any) => {
    const $el = $(el);
    const key = $el.attr("data-category") ?? "";
    const name = $el.find(".mouseListView-category-name").text().trim();
    const progress = textOrNull($el.find(".mouseListView-category-progress").text());
    const complete = ($el.attr("class") ?? "").includes("complete");
    if (name) {
      categories.push({ key, name, progress, complete });
    }
  });

  // Parse mice within each category content block
  $(".mouseListView-categoryContent-category").each((_: number, catEl: any) => {
    const category = $(catEl).attr("data-category") ?? "";

    $(catEl).find(".mouseListView-categoryContent-subgroup-mouse.stats").each((_: number, el: any) => {
      const $el = $(el);
      const classList = $el.attr("class") ?? "";
      if (classList.includes("header")) return;
      const caught = classList.includes("caught") && !classList.includes("uncaught");

      const onclick = $el.find("a[onclick*='MouseView.show']").attr("onclick") ?? "";
      const typeMatch = onclick.match(/show\('([^']+)'\)/);

      const name = $el.find("[class*='thumb-name']").text().trim();
      const catches = $el.find("[class*='stats catches']").text().trim();
      const misses = $el.find("[class*='stats misses']").text().trim();
      const avgWeight = $el.find("[class*='average_weight']").text().trim();
      const heaviest = $el.find("[class*='heaviest_catch']").text().trim();
      const imageUrl = extractBgUrl(
        $el.find(".mouseListView-categoryContent-subgroup-mouse-thumb").attr("style"),
      );

      if (typeMatch || name) {
        mice.push({
          type: typeMatch?.[1] ?? "",
          name,
          caught,
          catches: /^\d+$/.test(catches) ? parseInt(catches, 10) : 0,
          misses: /^\d+$/.test(misses) ? parseInt(misses, 10) : 0,
          averageWeight: textOrNull(avgWeight),
          heaviestCatch: textOrNull(heaviest),
          imageUrl,
          category,
        });
      }
    });
  });

  return { data: { mice, categories }, warnings: w.warnings };
}
