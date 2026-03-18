/**
 * HTML parsers for MouseHunt public profile pages.
 *
 * Uses cheerio for robust HTML parsing. These parse server-rendered HTML
 * from mousehuntgame.com profile pages. No authentication required.
 */

import { load, type CheerioAPI } from "cheerio";
import type {
  HunterProfile,
  TrapSetup,
  TrapComponent,
  TrapStats,
  TrapAura,
  HornStats,
  GoldenShield,
  TeamInfo,
  FavouriteMouse,
  TreasureMapInfo,
  TournamentAward,
  MouseStat,
  MouseCategory,
  CrownsData,
  CrownTier,
  CrownMouse,
  CollectionItem,
  ItemCategory,
  ItemsData,
} from "./types.js";

// ── Helpers ─────────────────────────────────────────────────────────

/** Parse a relative duration like "3 weeks 1 day 6 hours" into milliseconds. */
function parseDurationMs(s: string): number {
  let ms = 0;
  const units: Record<string, number> = {
    week: 7 * 24 * 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    minute: 60 * 1000,
  };
  for (const [unit, factor] of Object.entries(units)) {
    const match = s.match(new RegExp(`(\\d+)\\s*${unit}s?`));
    if (match) ms += parseInt(match[1], 10) * factor;
  }
  return ms;
}

function parseNum(s: string): number {
  return parseInt(s.replace(/,/g, ""), 10) || 0;
}

function textOrNull(s: string | undefined): string | null {
  const trimmed = s?.trim();
  return trimmed || null;
}

function extractBgUrl(style: string | undefined): string | null {
  const match = style?.match(/url\(['"]?([^'")]+)['"]?\)/);
  return match?.[1]?.replace(/&amp;/g, "&") ?? null;
}

function extractShowArg(onclick: string | undefined): string | null {
  const match = onclick?.match(/\.show\('([^']+)'\)/);
  return match?.[1] ?? null;
}

const MONTH_MAP: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  jan: 0, feb: 1, mar: 2, apr: 3, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/**
 * Parse a MH-style datetime string into an ISO string (UTC).
 * Handles formats like:
 *   "March 17, 2026 @ 11:22pm (Local Time)"
 *   "Mar 17 2026 @ 11:22pm"
 *   "March 20, 2026 03:46pm (UTC)"
 */
function parseAuraExpiry(raw: string): string | null {
  // Normalize: remove "(Local Time)", "(UTC)", extra whitespace
  const cleaned = raw
    .replace(/\(Local Time\)/i, "")
    .replace(/\(UTC\)/i, "")
    .replace(/@/g, "")
    .replace(/,/g, "")
    .trim();

  // Match: Month Day Year Hour:MinuteAMPM
  const m = cleaned.match(
    /(\w+)\s+(\d{1,2})\s+(\d{4})\s+(\d{1,2}):(\d{2})\s*(am|pm)/i,
  );
  if (!m) return null;

  const monthIdx = MONTH_MAP[m[1].toLowerCase()];
  if (monthIdx === undefined) return null;

  let hour = parseInt(m[4], 10);
  const minute = parseInt(m[5], 10);
  const isPm = m[6].toLowerCase() === "pm";
  if (isPm && hour !== 12) hour += 12;
  if (!isPm && hour === 12) hour = 0;

  const dt = new Date(parseInt(m[3], 10), monthIdx, parseInt(m[2], 10), hour, minute);
  return isNaN(dt.getTime()) ? null : dt.toISOString();
}

// ── Profile parser ──────────────────────────────────────────────────

/** Parse full hunter profile from profile tab HTML. */
export function parseProfile(html: string): HunterProfile {
  const $ = load(html);

  // ── OG meta tags (fallback data) ──
  const ogTitle = $('meta[property="og:title"]').attr("content") ?? "";
  const ogDesc = $('meta[property="og:description"]').attr("content") ?? "";
  const ogImage = $('meta[property="og:image"]').attr("content") ?? "";
  const ogUrl = $('meta[property="og:url"]').attr("content") ?? "";

  const titleMatch = ogTitle.match(/MouseHunt - (.+)/);
  const rankMatch = ogDesc.match(/is an? (.+?) in MouseHunt/);
  const miceMatch = ogDesc.match(/Mice:\s*([\d,]+)\/([\d,]+)/);
  const rareMatch = ogDesc.match(/Rare Mice:\s*([\d,]+)\/([\d,]+)/);
  const goldMatch = ogDesc.match(/Gold:\s*([\d,]+)/);
  const pointsMatch = ogDesc.match(/Points:\s*([\d,]+)/);
  const locationMatch = ogDesc.match(/Location:\s*(.+?)(?:\n|$)/);
  const uidMatch = ogUrl.match(/uid=(\d+)/);

  // ── ID card block (HTML) ──
  const uid = parseInt($(".hunterInfoView-idCardBlock").attr("data-user-id") ?? "0", 10)
    || (uidMatch ? parseInt(uidMatch[1], 10) : 0);
  const name = $(".friendsPage-friendRow-titleBar-name").text().trim()
    || (titleMatch?.[1]?.trim() ?? "");

  // Rank + percentage
  const rankDetailEl = $(".friendsPage-friendRow-titleBar-titleDetail");
  const rankText = rankDetailEl.text().trim(); // e.g. "Sage (1%)"
  const rankFromHtml = rankText.replace(/\s*\([\d.]+%\)/, "").trim();
  const rankPercentStr = rankDetailEl.attr("data-text"); // e.g. "1.31%"
  const rankPercent = rankPercentStr ? parseFloat(rankPercentStr) : null;
  const rankIconUrl = extractBgUrl($(".friendsPage-friendRow-titleBar-icon").attr("style"));

  // Location
  const location = $(".hunterInfoView-trapBlock-header-title").text().trim()
    || (locationMatch?.[1]?.trim() ?? "");
  const locationBannerUrl = extractBgUrl($(".hunterInfoView-trapBlock-header-container").attr("style"));
  const locationThumbnailUrl = extractBgUrl($(".hunterInfoView-trapBlock-header-thumbnail-image").attr("style"));

  // Profile image
  const profileImageUrl = extractBgUrl($(".friendsPage-friendRow-image").attr("style"));

  // Last active
  const lastActive = textOrNull($(".friendsPage-friendRow-stat.online .friendsPage-friendRow-stat-value").text());

  // ── Mice stats ──
  const statsItems = $(".hunterInfoView-idCardBlock-stats-item");
  const miceCaught = miceMatch ? parseNum(miceMatch[1]) : 0;
  const miceTotal = miceMatch ? parseNum(miceMatch[2]) : 0;
  const rareMiceCaught = rareMatch ? parseNum(rareMatch[1]) : 0;
  const rareMiceTotal = rareMatch ? parseNum(rareMatch[2]) : 0;
  // Total mice caught is the 3rd stats item
  const totalMiceCaughtText = statsItems.eq(2).find("span").first().text().trim();
  const totalMiceCaught = totalMiceCaughtText ? parseNum(totalMiceCaughtText) : 0;

  // ── Hunting since + loyalty ──
  const huntingSinceRaw = $(".hunterInfoView-idCardBlock-stats-huntingSince-text-container span").text().trim();
  let huntingSince: string | null = null;
  if (huntingSinceRaw) {
    // Parse "Nov 30, 2011" manually to avoid timezone offset issues
    const months: Record<string, string> = {
      Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
      Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
    };
    const dateMatch = huntingSinceRaw.match(/(\w{3})\s+(\d{1,2}),\s*(\d{4})/);
    if (dateMatch && months[dateMatch[1]]) {
      const day = dateMatch[2].padStart(2, "0");
      huntingSince = `${dateMatch[3]}-${months[dateMatch[1]]}-${day}`;
    } else {
      huntingSince = huntingSinceRaw;
    }
  }
  const loyaltyClass = $(".loyaltyBadgeView").attr("class") ?? "";
  const loyaltyLevelMatch = loyaltyClass.match(/badgeLevel(\d+)/);
  const loyaltyBadgeLevel = loyaltyLevelMatch ? parseInt(loyaltyLevelMatch[1], 10) : null;
  const loyaltyYearsText = $(".loyaltyBadgeView-years-text").text().trim();
  const loyaltyBadgeYears = loyaltyYearsText ? parseInt(loyaltyYearsText, 10) : null;

  // ── Horn stats ──
  const hornEl = $(".hunterInfoView-idCardBlock-stats-horn");
  let hornStats: HornStats | null = null;
  if (hornEl.length) {
    hornStats = {
      total: parseNum(hornEl.attr("data-num-total-turns") ?? "0"),
      active: parseNum(hornEl.attr("data-num-active-turns") ?? "0"),
      passive: parseNum(hornEl.attr("data-num-passive-turns") ?? "0"),
      linked: parseNum(hornEl.attr("data-num-linked-turns") ?? "0"),
    };
  }

  // ── Gold & Points (from HTML, more precise than OG) ──
  const goldHtml = $(".friendsPage-friendRow-stat.gold .friendsPage-friendRow-stat-value").text().trim();
  const pointsHtml = $(".friendsPage-friendRow-stat.points .friendsPage-friendRow-stat-value").text().trim();
  const gold = goldHtml ? parseNum(goldHtml) : (goldMatch ? parseNum(goldMatch[1]) : 0);
  const points = pointsHtml ? parseNum(pointsHtml) : (pointsMatch ? parseNum(pointsMatch[1]) : 0);

  // ── Golden Shield ──
  const shieldEl = $(".hunterInfoView-idCardBlock-goldenShield-container");
  let goldenShield: GoldenShield | null = null;
  if (shieldEl.length && shieldEl.attr("data-has-shield") === "1") {
    const expiryRaw = textOrNull(shieldEl.attr("data-golden-shield-expiry-full"));
    let expiryDate: string | null = null;
    if (expiryRaw) {
      const ms = parseDurationMs(expiryRaw);
      if (ms > 0) {
        expiryDate = new Date(Date.now() + ms).toISOString();
      }
    }
    goldenShield = {
      hasShield: true,
      expiryDate,
      expiryRaw,
    };
  }

  // ── Team info ──
  let team: TeamInfo | null = null;
  const teamName = $(".hunterInfoView-idCardBlock-teamName span").text().trim();
  if (teamName) {
    const teamOnclick = $(".hunterInfoView-idCardBlock-teamInfo a[onclick]").attr("onclick") ?? "";
    const teamIdMatch = teamOnclick.match(/team_id:(\d+)/);
    team = {
      name: teamName,
      id: teamIdMatch ? parseInt(teamIdMatch[1], 10) : null,
    };
  }

  // ── Trap setup ──
  let trap: TrapSetup | null = null;
  const trapImgMatch = ogImage.match(
    /base=(\d+)&weapon=(\d+)(?:&skin=(\d+))?(?:&bait=(\d+))?/,
  );
  if (trapImgMatch) {
    // Parse named components from trap slots
    const parseSlotEl = (selector: string): TrapComponent | null => {
      const el = $(selector);
      const name = el.attr("data-name");
      if (!name) return null;
      const onclick = el.attr("onclick") ?? "";
      const type = extractShowArg(onclick) ?? "";
      const thumbnailUrl = extractBgUrl(el.attr("style"));
      const qtyText = el.find(".hunterInfoView-trapBlock-setup-trap-slot-quantity").text().trim();
      return {
        name,
        type,
        thumbnailUrl,
        quantity: qtyText ? parseNum(qtyText) : null,
      };
    };

    // Collect non-middle slots in order (base, bait, charm, skin)
    const nonMiddleSlots: TrapComponent[] = [];
    $(".hunterInfoView-trapBlock-setup-trap-slot").each((_, el) => {
      const $el = $(el);
      if (($el.attr("class") ?? "").includes("middle")) return;
      const name = $el.attr("data-name");
      if (!name) return;
      const onclick = $el.attr("onclick") ?? "";
      const type = extractShowArg(onclick) ?? "";
      const thumbnailUrl = extractBgUrl($el.attr("style"));
      const qtyText = $el.find(".hunterInfoView-trapBlock-setup-trap-slot-quantity").text().trim();
      nonMiddleSlots.push({
        name,
        type,
        thumbnailUrl,
        quantity: qtyText ? parseNum(qtyText) : null,
      });
    });

    trap = {
      baseId: parseInt(trapImgMatch[1], 10),
      weaponId: parseInt(trapImgMatch[2], 10),
      skinId: trapImgMatch[3] ? parseInt(trapImgMatch[3], 10) : null,
      baitId: trapImgMatch[4] ? parseInt(trapImgMatch[4], 10) : null,
      imageUrl: ogImage,
      weapon: parseSlotEl(".hunterInfoView-trapBlock-setup-trap-slot.middle"),
      base: nonMiddleSlots[0] ?? null,
      bait: nonMiddleSlots[1] ?? null,
      charm: nonMiddleSlots[2] ?? null,
      skin: nonMiddleSlots[3] ?? null,
    };
  }

  // ── Trap stats ──
  let trapStats: TrapStats | null = null;
  const powerEl = $(".campPage-trap-trapStat.power .value i");
  if (powerEl.length) {
    const powerTypeClass = $(".campPage-trap-trapStat-powerTypeIcon").attr("class") ?? "";
    const powerType = powerTypeClass.replace("campPage-trap-trapStat-powerTypeIcon", "").trim() || null;

    trapStats = {
      power: parseNum(powerEl.text()),
      powerType,
      luck: parseNum($(".campPage-trap-trapStat.luck .value span").text()),
      attractionBonus: textOrNull($(".campPage-trap-trapStat.attraction_bonus .value span").text()),
      cheeseEffect: textOrNull($(".campPage-trap-trapStat.cheese_effect .value span").text()),
    };
  }

  // ── Auras ──
  const auras: TrapAura[] = [];
  $(".trapImageView-trapAura").each((_, el) => {
    const $el = $(el);
    const classList = $el.attr("class") ?? "";
    // Extract aura type from class (skip generic classes)
    const classes = classList.split(/\s+/).filter(
      (c) => c !== "trapImageView-trapAura" && c !== "mousehuntTooltipParent" && c !== "active" && c !== "hidden",
    );
    const type = classes[0] ?? "";
    if (!type) return;

    const active = classList.includes(" active");
    const title = textOrNull($el.find(".trapImageView-tooltip-trapAura-title").text());
    const description = textOrNull($el.find(".trapImageView-tooltip-trapAura.active").text()
      ?.replace($el.find(".trapImageView-tooltip-trapAura-title").text() ?? "", "")
      ?.replace($el.find(".trapImageView-tooltip-trapAura-expiry").text() ?? "", "")
      ?.trim());
    const expiryRaw = textOrNull($el.find(".trapImageView-tooltip-trapAura-expiry span").text());
    const expiryDate = expiryRaw ? parseAuraExpiry(expiryRaw) : null;

    auras.push({ type, active, title, description, expiryDate, expiryRaw });
  });

  // ── Favourite mice ──
  const favouriteMice: FavouriteMouse[] = [];
  $(".hunterInfoView-favoritesBlock-content").each((_, groupEl) => {
    const group = parseInt($(groupEl).attr("data-group-number") ?? "0", 10);
    $(groupEl).find(".hunterInfoView-favoritesBlock-content-mouseImage").each((_, mouseEl) => {
      const $m = $(mouseEl);
      const classList = $m.attr("class") ?? "";
      if (classList.includes("empty-other")) return;

      const mouseName = $m.attr("data-mouse-name") ?? "";
      if (!mouseName) return;

      const onclick = $m.attr("onclick") ?? "";
      const mouseType = extractShowArg(onclick) ?? "";
      // Crown tier from class (gold, silver, bronze, platinum, diamond)
      const crownClasses = ["diamond", "platinum", "gold", "silver", "bronze"];
      const crownTier = crownClasses.find((c) => classList.split(/\s+/).includes(c)) ?? null;

      favouriteMice.push({
        type: mouseType,
        name: mouseName,
        catches: parseInt($m.attr("data-num-catches") ?? "0", 10),
        misses: parseInt($m.attr("data-num-misses") ?? "0", 10),
        imageUrl: extractBgUrl($m.attr("style")),
        crownTier,
        group,
      });
    });
  });

  // ── Treasure map ──
  let treasureMap: TreasureMapInfo | null = null;
  const mapTitle = $(".hunterInfoView-treasureMaps-left-currentMap-content-title").text().trim();
  if (mapTitle) {
    const mapOnclick = $(".hunterInfoView-treasureMaps-left-currentMap-image").attr("onclick") ?? "";
    const mapIdMatch = mapOnclick.match(/show\((\d+)\)/);
    treasureMap = {
      currentMapName: mapTitle,
      currentMapImageUrl: extractBgUrl($(".hunterInfoView-treasureMaps-left-currentMap-image").attr("style")),
      currentMapId: mapIdMatch ? parseInt(mapIdMatch[1], 10) : null,
      cluesFound: parseNum($(".hunterInfoView-treasureMaps-right-cluesFound").text()),
      globalRanking: (() => {
        const rankingText = $(".hunterInfoView-treasureMaps-right-cluesFound-ranking").text().trim();
        const m = rankingText.match(/#?([\d,]+)/);
        return m ? parseNum(m[1]) : null;
      })(),
    };
  }

  // ── Tournament awards ──
  const tournamentAwards: TournamentAward[] = [];
  $(".hunterInfoView-teamTab-content .itemImage").each((_, el) => {
    const $el = $(el);
    const imageUrl = extractBgUrl($el.attr("style"));
    const quantity = parseNum($el.find(".quantity").text());
    if (imageUrl) {
      tournamentAwards.push({ imageUrl, quantity });
    }
  });

  return {
    uid,
    name,
    rank: rankFromHtml || (rankMatch?.[1] ?? ""),
    rankPercent,
    rankIconUrl,
    location,
    locationBannerUrl,
    locationThumbnailUrl,
    profileImageUrl,
    lastActive,
    miceCaught,
    miceTotal,
    rareMiceCaught,
    rareMiceTotal,
    totalMiceCaught,
    huntingSince,
    loyaltyBadgeLevel,
    loyaltyBadgeYears,
    hornStats,
    gold,
    points,
    goldenShield,
    team,
    trap,
    trapStats,
    auras,
    favouriteMice,
    treasureMap,
    tournamentAwards,
  };
}

// ── Mice parser ─────────────────────────────────────────────────────

/** Parse mouse catch statistics from the mice tab HTML. */
export function parseMice(html: string): {
  mice: MouseStat[];
  categories: MouseCategory[];
} {
  const $ = load(html);
  const mice: MouseStat[] = [];
  const categories: MouseCategory[] = [];

  // Parse categories from the directory sidebar
  $(".mouseListView-category").each((_, el) => {
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
  $(".mouseListView-categoryContent-category").each((_, catEl) => {
    const category = $(catEl).attr("data-category") ?? "";

    $(catEl).find(".mouseListView-categoryContent-subgroup-mouse.stats").each((_, el) => {
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

  return { mice, categories };
}

// ── Crowns parser ───────────────────────────────────────────────────

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

// ── Items parser ────────────────────────────────────────────────────

/** Parse item collection from the items tab HTML. */
export function parseItems(html: string): ItemsData {
  const $ = load(html);
  const items: CollectionItem[] = [];

  // Iterate over each category content block to associate items with their category
  $(".hunterProfileItemsView-categoryContent").each((_, catEl) => {
    const category = $(catEl).attr("data-category") ?? "";

    $(catEl).find(".hunterProfileItemsView-categoryContent-item").each((_, el) => {
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
  $(".hunterProfileItemsView-category").each((_, el) => {
    const $el = $(el);
    const key = $el.attr("data-category") ?? "";
    const name = $el.find(".hunterProfileItemsView-category-name").text().trim();
    const progress = textOrNull($el.find(".hunterProfileItemsView-category-progress").text());
    const complete = ($el.attr("class") ?? "").includes("complete");
    if (name) {
      categories.push({ key, name, progress, complete });
    }
  });

  return { items, categories };
}

// ── Debug helper ────────────────────────────────────────────────────

/**
 * Load HTML into cheerio for manual inspection.
 *
 * @example
 * ```ts
 * const $ = loadHtml(rawHtml);
 * console.log($.html()); // full parsed HTML
 * console.log($('.mouseCrownsView-group.diamond').html()); // diamond crowns section
 * console.log($('meta[property="og:description"]').attr('content')); // OG description
 * ```
 */
export function loadHtml(html: string): CheerioAPI {
  return load(html);
}
