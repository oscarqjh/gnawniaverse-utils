import { describe, it, expect } from "vitest";
import { parseItems } from "../../src/parsers/items.js";

// ── Fixtures ────────────────────────────────────────────────────────

const ITEMS_HTML = `
<div class="hunterProfileItemsView-category complete" data-category="weapon">
  <div class="hunterProfileItemsView-category-name">Weapons</div>
  <div class="hunterProfileItemsView-category-progress">12 / 50</div>
</div>
<div class="hunterProfileItemsView-categoryContent" data-category="weapon">
  <div class="hunterProfileItemsView-categoryContent-item collected" data-id="34" data-type="500_pound_spiked_crusher_weapon">
    <div class="hunterProfileItemsView-categoryContent-item-padding">
      <div class="itemImage" style="background-image: url('https://example.com/items/crusher.png');"><div class="quantity">3</div></div>
      <div class="hunterProfileItemsView-categoryContent-item-name"><span>500 Pound Spiked Crusher</span></div>
    </div>
  </div>
  <div class="hunterProfileItemsView-categoryContent-item hidden uncollected" data-id="35" data-type="ambush_trap_weapon">
    <div class="hunterProfileItemsView-categoryContent-item-padding">
      <div class="itemImage"></div>
      <div class="hunterProfileItemsView-categoryContent-item-name"><span>Ambush Trap</span></div>
    </div>
  </div>
  <div class="hunterProfileItemsView-categoryContent-item collected limited_edition" data-id="99" data-type="rare_weapon">
    <div class="hunterProfileItemsView-categoryContent-item-padding">
      <div class="itemImage"></div>
      <div class="hunterProfileItemsView-categoryContent-item-name"><span>Rare Weapon</span></div>
    </div>
  </div>
</div>
`;

// ── Tests ────────────────────────────────────────────────────────────

describe("parseItems", () => {
  it("extracts collected and uncollected items with all fields", () => {
    const { data } = parseItems(ITEMS_HTML);

    expect(data.items).toHaveLength(3);

    expect(data.items[0]).toMatchObject({
      id: 34,
      type: "500_pound_spiked_crusher_weapon",
      name: "500 Pound Spiked Crusher",
      collected: true,
      limitedEdition: false,
      imageUrl: "https://example.com/items/crusher.png",
      quantity: 3,
      category: "weapon",
    });

    expect(data.items[1]).toMatchObject({
      id: 35,
      type: "ambush_trap_weapon",
      name: "Ambush Trap",
      collected: false,
      limitedEdition: false,
      imageUrl: null,
      quantity: null,
      category: "weapon",
    });

    expect(data.items[2]).toMatchObject({
      id: 99,
      type: "rare_weapon",
      name: "Rare Weapon",
      collected: true,
      limitedEdition: true,
      category: "weapon",
    });
  });

  it("extracts categories with progress and completion", () => {
    const { data } = parseItems(ITEMS_HTML);

    expect(data.categories).toHaveLength(1);
    expect(data.categories[0]).toMatchObject({
      key: "weapon",
      name: "Weapons",
      progress: "12 / 50",
      complete: true,
    });
  });

  it("returns empty arrays for empty HTML", () => {
    const { data } = parseItems("<html><body></body></html>");
    expect(data.items).toEqual([]);
    expect(data.categories).toEqual([]);
  });
});
