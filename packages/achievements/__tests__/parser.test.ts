import { describe, it, expect } from "vitest";
import {
  splitSections,
  parseMeta,
  parseTiers,
  parseAwards,
  parseEventSheet,
} from "../src/parser";

describe("splitSections", () => {
  it("splits rows by --- separator", () => {
    const rows = [
      ["event_name", "Test Event"],
      ["---", "---"],
      ["tier_name", "badge_url"],
      ["Gold", "https://img.png"],
      ["---", "---"],
      ["hunter_id", "tier"],
      ["123", "Gold"],
    ];

    const { metaRows, tierRows, awardRows } = splitSections(rows);
    expect(metaRows).toEqual([["event_name", "Test Event"]]);
    expect(tierRows).toEqual([
      ["tier_name", "badge_url"],
      ["Gold", "https://img.png"],
    ]);
    expect(awardRows).toEqual([
      ["hunter_id", "tier"],
      ["123", "Gold"],
    ]);
  });

  it("handles missing sections gracefully", () => {
    const rows = [["event_name", "Test"]];
    const { metaRows, tierRows, awardRows } = splitSections(rows);
    expect(metaRows).toEqual([["event_name", "Test"]]);
    expect(tierRows).toEqual([]);
    expect(awardRows).toEqual([]);
  });
});

describe("parseMeta", () => {
  it("parses known metadata keys", () => {
    const rows = [
      ["event_name", "Spring Hunt 2026"],
      ["organiser", "Discord Mods"],
      ["description", "Annual challenge"],
      ["date", "2026-03-01"],
      ["participants", "342"],
    ];

    const meta = parseMeta(rows);
    expect(meta.name).toBe("Spring Hunt 2026");
    expect(meta.organiser).toBe("Discord Mods");
    expect(meta.description).toBe("Annual challenge");
    expect(meta.date).toBe("2026-03-01");
    expect(meta.participants).toBe(342);
  });

  it("stores unknown keys in extra", () => {
    const rows = [
      ["event_name", "Test"],
      ["custom_field", "custom_value"],
    ];

    const meta = parseMeta(rows);
    expect(meta.extra).toEqual({ custom_field: "custom_value" });
  });

  it("returns defaults for empty rows", () => {
    const meta = parseMeta([]);
    expect(meta.name).toBe("Unknown Event");
    expect(meta.organiser).toBeNull();
  });
});

describe("parseTiers", () => {
  it("parses tier definitions with badge and title", () => {
    const rows = [
      ["tier_name", "badge_url", "badge_desc", "badge_art", "title_url", "title_desc", "title_art", "description"],
      ["Champion", "https://badge.png", "Champion Badge", "@artist1", "https://title.png", "Champion Title", "@artist2", "Top 3"],
      ["Participant", "https://badge2.png", "Participated", "", "", "", "", "Joined event"],
    ];

    const tiers = parseTiers(rows);
    expect(tiers).toHaveLength(2);

    expect(tiers[0].name).toBe("Champion");
    expect(tiers[0].badge.url).toBe("https://badge.png");
    expect(tiers[0].badge.description).toBe("Champion Badge");
    expect(tiers[0].badge.artist).toBe("@artist1");
    expect(tiers[0].title?.url).toBe("https://title.png");
    expect(tiers[0].title?.artist).toBe("@artist2");
    expect(tiers[0].description).toBe("Top 3");

    expect(tiers[1].name).toBe("Participant");
    expect(tiers[1].title).toBeNull();
    expect(tiers[1].badge.artist).toBeNull();
  });

  it("skips rows without badge_url", () => {
    const rows = [
      ["tier_name", "badge_url"],
      ["NoBadge", ""],
      ["HasBadge", "https://ok.png"],
    ];

    const tiers = parseTiers(rows);
    expect(tiers).toHaveLength(1);
    expect(tiers[0].name).toBe("HasBadge");
  });

  it("returns empty for missing header", () => {
    const tiers = parseTiers([["wrong_col", "other"]]);
    expect(tiers).toEqual([]);
  });
});

describe("parseAwards", () => {
  it("groups hunter IDs by tier", () => {
    const rows = [
      ["hunter_id", "tier"],
      ["6268658", "Champion"],
      ["1234567", "Participant"],
      ["7654321", "Champion"],
    ];

    const awards = parseAwards(rows);
    expect(awards["Champion"]).toEqual([6268658, 7654321]);
    expect(awards["Participant"]).toEqual([1234567]);
  });

  it("skips invalid hunter IDs", () => {
    const rows = [
      ["hunter_id", "tier"],
      ["abc", "Gold"],
      ["123", "Gold"],
    ];

    const awards = parseAwards(rows);
    expect(awards["Gold"]).toEqual([123]);
  });
});

describe("parseEventSheet", () => {
  it("parses a complete event sheet", () => {
    const rows = [
      ["event_name", "Spring Hunt 2026"],
      ["organiser", "Mods"],
      ["participants", "100"],
      ["---", "---"],
      ["tier_name", "badge_url", "description"],
      ["Gold", "https://gold.png", "Winner"],
      ["Silver", "https://silver.png", "Runner up"],
      ["---", "---"],
      ["hunter_id", "tier"],
      ["6268658", "Gold"],
      ["1111111", "Silver"],
      ["2222222", "Silver"],
    ];

    const event = parseEventSheet(rows);

    expect(event.meta.name).toBe("Spring Hunt 2026");
    expect(event.meta.participants).toBe(100);
    expect(event.tiers).toHaveLength(2);
    expect(event.tiers[0].name).toBe("Gold");
    expect(event.awards["Gold"]).toEqual([6268658]);
    expect(event.awards["Silver"]).toEqual([1111111, 2222222]);
  });
});
