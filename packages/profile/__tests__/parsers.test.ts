import { describe, it, expect } from "vitest";
import { parseProfile, parseMice, parseCrowns, parseItems } from "../src/parsers/index.js";

// ── Fixtures ────────────────────────────────────────────────────────

const PROFILE_HTML = `
<html><head>
<meta property="og:url" content="https://www.mousehuntgame.com/profile.php?uid=6268658" />
<meta property="og:title" content="MouseHunt - Tey Zi Pin" />
<meta property="og:description" content="Tey Zi Pin is a Sage in MouseHunt.
Mice: 1,040/1,120
Rare Mice: 165/165
Gold: 874,240,861
Points: 9,909,051,391
Location: SUPER|brie+ Factory" />
<meta property="og:image" content="https://www.mousehuntgame.com/images/trapimage.php?base=3150&amp;weapon=3591&amp;skin=3993&amp;bait=98" />
</head><body></body></html>
`;

const MICE_HTML = `
<div class="mouseListView-categoryContent-subgroup-name">Indigenous Mice</div>
<div class="mouseListView-categoryContent-subgroup-mouse stats caught">
  <div class="mouseListView-categoryContent-subgroup-mouse-stats name">
    <a class="mouseListView-categoryContent-subgroup-mouse-thumb"
       onclick="hg.views.MouseView.show('white_mouse')"></a>
    <div class="mouseListView-categoryContent-subgroup-mouse-thumb-name">White Mouse</div>
  </div>
  <div class="mouseListView-categoryContent-subgroup-mouse-stats catches">142</div>
  <div class="mouseListView-categoryContent-subgroup-mouse-stats misses">3</div>
  <div class="mouseListView-categoryContent-subgroup-mouse-stats average_weight">1 oz.</div>
  <div class="mouseListView-categoryContent-subgroup-mouse-stats heaviest_catch">4 oz.</div>
</div>
<div class="mouseListView-categoryContent-subgroup-mouse stats uncaught">
  <div class="mouseListView-categoryContent-subgroup-mouse-stats name">
    <a class="mouseListView-categoryContent-subgroup-mouse-thumb"
       onclick="hg.views.MouseView.show('archduke_mouse')"></a>
    <div class="mouseListView-categoryContent-subgroup-mouse-thumb-name">Archduke Mouse</div>
  </div>
  <div class="mouseListView-categoryContent-subgroup-mouse-stats catches">0</div>
  <div class="mouseListView-categoryContent-subgroup-mouse-stats misses">0</div>
  <div class="mouseListView-categoryContent-subgroup-mouse-stats average_weight"></div>
  <div class="mouseListView-categoryContent-subgroup-mouse-stats heaviest_catch"></div>
</div>
`;

const CROWNS_HTML = `
<div class="mouseCrownsView-group diamond">
  <div class="mouseCrownsView-group-mouse" data-mouse-id="100" data-mouse-type="white_mouse">
    <div class="mouseCrownsView-group-mouse-image"></div>
  </div>
</div>
<div class="mouseCrownsView-group platinum">
  <div class="mouseCrownsView-group-mouse" data-mouse-id="200" data-mouse-type="grey_mouse">
    <div class="mouseCrownsView-group-mouse-image"></div>
  </div>
  <div class="mouseCrownsView-group-mouse" data-mouse-id="201" data-mouse-type="brown_mouse">
    <div class="mouseCrownsView-group-mouse-image"></div>
  </div>
</div>
<div class="mouseCrownsView-group gold">
</div>
<div class="mouseCrownsView-group silver">
</div>
<div class="mouseCrownsView-group bronze">
  <div class="mouseCrownsView-group-mouse" data-mouse-id="300" data-mouse-type="tiny_mouse">
    <div class="mouseCrownsView-group-mouse-image"></div>
  </div>
</div>
<div class="mouseCrownsView-group favourite">
</div>
`;

const ITEMS_HTML = `
<div class="hunterProfileItemsView-category-name">Weapons</div>
<div class="hunterProfileItemsView-category-progress">12 / 50</div>
<div class="hunterProfileItemsView-categoryContent-item  collected  " data-id="34" data-type="500_pound_spiked_crusher_weapon">
  <div class="hunterProfileItemsView-categoryContent-item-padding">
    <div class="itemImage"></div>
    <div class="hunterProfileItemsView-categoryContent-item-name"><span>500 Pound Spiked Crusher</span></div>
  </div>
</div>
<div class="hunterProfileItemsView-categoryContent-item hidden  uncollected " data-id="35" data-type="ambush_trap_weapon">
  <div class="hunterProfileItemsView-categoryContent-item-padding">
    <div class="itemImage"></div>
    <div class="hunterProfileItemsView-categoryContent-item-name"><span>Ambush Trap</span></div>
  </div>
</div>
<div class="hunterProfileItemsView-categoryContent-item  collected  limited_edition" data-id="99" data-type="rare_weapon">
  <div class="hunterProfileItemsView-categoryContent-item-padding">
    <div class="itemImage"></div>
    <div class="hunterProfileItemsView-categoryContent-item-name"><span>Rare Weapon</span></div>
  </div>
</div>
`;

// ── Tests ────────────────────────────────────────────────────────────

describe("parseProfile", () => {
  it("extracts all OG meta fields", () => {
    const p = parseProfile(PROFILE_HTML);

    expect(p.uid).toBe(6268658);
    expect(p.name).toBe("Tey Zi Pin");
    expect(p.rank).toBe("Sage");
    expect(p.location).toBe("SUPER|brie+ Factory");
    expect(p.miceCaught).toBe(1040);
    expect(p.miceTotal).toBe(1120);
    expect(p.rareMiceCaught).toBe(165);
    expect(p.rareMiceTotal).toBe(165);
    expect(p.gold).toBe(874240861);
    expect(p.points).toBe(9909051391);
  });

  it("extracts trap setup from image URL", () => {
    const p = parseProfile(PROFILE_HTML);

    expect(p.trap).not.toBeNull();
    expect(p.trap!.baseId).toBe(3150);
    expect(p.trap!.weaponId).toBe(3591);
    expect(p.trap!.skinId).toBe(3993);
    expect(p.trap!.baitId).toBe(98);
    expect(p.trap!.imageUrl).toContain("trapimage.php");
  });

  it("returns defaults for invalid HTML", () => {
    const p = parseProfile("<html><body>nothing here</body></html>");

    expect(p.name).toBe("");
    expect(p.rank).toBe("");
    expect(p.uid).toBe(0);
    expect(p.trap).toBeNull();
  });
});

describe("parseMice", () => {
  it("extracts caught and uncaught mice", () => {
    const result = parseMice(MICE_HTML);

    expect(result.mice).toHaveLength(2);

    expect(result.mice[0]).toEqual({
      type: "white_mouse",
      name: "White Mouse",
      caught: true,
      catches: 142,
      misses: 3,
      averageWeight: "1 oz.",
      heaviestCatch: "4 oz.",
    });

    expect(result.mice[1]).toEqual({
      type: "archduke_mouse",
      name: "Archduke Mouse",
      caught: false,
      catches: 0,
      misses: 0,
      averageWeight: null,
      heaviestCatch: null,
    });
  });

  it("extracts categories", () => {
    const result = parseMice(MICE_HTML);
    expect(result.categories).toEqual(["Indigenous Mice"]);
  });
});

describe("parseCrowns", () => {
  it("extracts crown tiers and mice", () => {
    const result = parseCrowns(CROWNS_HTML);

    expect(result.summary).toEqual({
      diamond: 1,
      platinum: 2,
      gold: 0,
      silver: 0,
      bronze: 1,
    });

    expect(result.crowns.diamond[0]).toEqual({ id: 100, type: "white_mouse" });
    expect(result.crowns.platinum).toHaveLength(2);
    expect(result.crowns.bronze[0]).toEqual({ id: 300, type: "tiny_mouse" });
  });
});

describe("parseItems", () => {
  it("extracts collected and uncollected items", () => {
    const result = parseItems(ITEMS_HTML);

    expect(result.items).toHaveLength(3);

    expect(result.items[0]).toEqual({
      id: 34,
      type: "500_pound_spiked_crusher_weapon",
      name: "500 Pound Spiked Crusher",
      collected: true,
      limitedEdition: false,
    });

    expect(result.items[1]).toEqual({
      id: 35,
      type: "ambush_trap_weapon",
      name: "Ambush Trap",
      collected: false,
      limitedEdition: false,
    });

    expect(result.items[2]).toEqual({
      id: 99,
      type: "rare_weapon",
      name: "Rare Weapon",
      collected: true,
      limitedEdition: true,
    });
  });

  it("extracts categories with progress", () => {
    const result = parseItems(ITEMS_HTML);

    expect(result.categories).toHaveLength(1);
    expect(result.categories[0]).toEqual({
      name: "Weapons",
      progress: "12 / 50",
    });
  });
});
