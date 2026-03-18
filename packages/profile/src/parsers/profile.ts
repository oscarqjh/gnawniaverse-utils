/**
 * Profile tab parser for MouseHunt public profile pages.
 */

import { load } from "cheerio";
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
} from "../types/index.js";
import {
  parseDurationMs,
  parseNum,
  textOrNull,
  extractBgUrl,
  extractShowArg,
  parseAuraExpiry,
} from "./helpers.js";

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
