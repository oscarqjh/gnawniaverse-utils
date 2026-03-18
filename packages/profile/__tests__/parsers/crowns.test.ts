import { describe, it, expect } from "vitest";
import { parseCrowns } from "../../src/parsers/crowns.js";

// ── Fixtures ────────────────────────────────────────────────────────

const CROWNS_HTML = `
<div class="mouseCrownsView-group diamond">
  <div class="mouseCrownsView-group-mouse" data-mouse-id="100" data-mouse-type="white_mouse" data-mouse-large="https://example.com/large/white.png">
    <div class="mouseCrownsView-group-mouse-image" data-image="https://example.com/thumb/white.png"></div>
    <div class="mouseCrownsView-group-mouse-name">White Mouse</div>
    <div class="mouseCrownsView-group-mouse-catches">2,500</div>
  </div>
</div>
<div class="mouseCrownsView-group platinum">
  <div class="mouseCrownsView-group-mouse" data-mouse-id="200" data-mouse-type="grey_mouse">
    <div class="mouseCrownsView-group-mouse-image"></div>
    <div class="mouseCrownsView-group-mouse-name">Grey Mouse</div>
    <div class="mouseCrownsView-group-mouse-catches">1,000</div>
  </div>
  <div class="mouseCrownsView-group-mouse" data-mouse-id="201" data-mouse-type="brown_mouse">
    <div class="mouseCrownsView-group-mouse-image"></div>
    <div class="mouseCrownsView-group-mouse-name">Brown Mouse</div>
    <div class="mouseCrownsView-group-mouse-catches">750</div>
  </div>
</div>
<div class="mouseCrownsView-group gold"></div>
<div class="mouseCrownsView-group silver"></div>
<div class="mouseCrownsView-group bronze">
  <div class="mouseCrownsView-group-mouse" data-mouse-id="300" data-mouse-type="tiny_mouse">
    <div class="mouseCrownsView-group-mouse-image"></div>
    <div class="mouseCrownsView-group-mouse-name">Tiny Mouse</div>
    <div class="mouseCrownsView-group-mouse-catches">50</div>
  </div>
</div>
`;

// ── Tests ────────────────────────────────────────────────────────────

describe("parseCrowns", () => {
  it("extracts crown tiers with summary counts", () => {
    const { data } = parseCrowns(CROWNS_HTML);

    expect(data.summary).toEqual({
      diamond: 1,
      platinum: 2,
      gold: 0,
      silver: 0,
      bronze: 1,
    });
  });

  it("extracts full CrownMouse fields", () => {
    const { data } = parseCrowns(CROWNS_HTML);

    expect(data.crowns.diamond[0]).toMatchObject({
      id: 100,
      type: "white_mouse",
      name: "White Mouse",
      catches: 2500,
      imageUrl: "https://example.com/thumb/white.png",
      largeImageUrl: "https://example.com/large/white.png",
    });

    expect(data.crowns.platinum).toHaveLength(2);
    expect(data.crowns.platinum[0]).toMatchObject({
      id: 200,
      type: "grey_mouse",
      name: "Grey Mouse",
      catches: 1000,
    });

    expect(data.crowns.bronze[0]).toMatchObject({
      id: 300,
      type: "tiny_mouse",
      name: "Tiny Mouse",
      catches: 50,
    });
  });

  it("returns empty tiers for empty HTML", () => {
    const { data } = parseCrowns("<html><body></body></html>");
    expect(data.crowns.diamond).toEqual([]);
    expect(data.summary.diamond).toBe(0);
  });
});
