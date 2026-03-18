import { describe, it, expect } from "vitest";
import { parseMice } from "../../src/parsers/mice.js";

// ── Fixtures ────────────────────────────────────────────────────────

const MICE_HTML = `
<div class="mouseListView-categoryContent-category" data-category="indigenous">
  <div class="mouseListView-categoryContent-subgroup-name">Indigenous Mice</div>
  <div class="mouseListView-categoryContent-subgroup-mouse stats caught">
    <div class="mouseListView-categoryContent-subgroup-mouse-stats name">
      <a class="mouseListView-categoryContent-subgroup-mouse-thumb"
         onclick="hg.views.MouseView.show('white_mouse')"
         style="background-image: url('https://www.mousehuntgame.com/images/mice/thumb/white.gif');"></a>
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
</div>
`;

// ── Tests ────────────────────────────────────────────────────────────

describe("parseMice", () => {
  it("extracts caught and uncaught mice with all fields", () => {
    const { data } = parseMice(MICE_HTML);

    expect(data.mice).toHaveLength(2);

    expect(data.mice[0]).toMatchObject({
      type: "white_mouse",
      name: "White Mouse",
      caught: true,
      catches: 142,
      misses: 3,
      averageWeight: "1 oz.",
      heaviestCatch: "4 oz.",
      imageUrl: "https://www.mousehuntgame.com/images/mice/thumb/white.gif",
      category: "indigenous",
    });

    expect(data.mice[1]).toMatchObject({
      type: "archduke_mouse",
      name: "Archduke Mouse",
      caught: false,
      catches: 0,
      misses: 0,
      averageWeight: null,
      heaviestCatch: null,
      imageUrl: null,
      category: "indigenous",
    });
  });

  it("returns empty arrays for empty HTML", () => {
    const { data } = parseMice("<html><body></body></html>");
    expect(data.mice).toEqual([]);
    expect(data.categories).toEqual([]);
  });
});
