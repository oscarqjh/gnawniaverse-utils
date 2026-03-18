import { describe, it, expect } from "vitest";
import { parseProfile } from "../../src/parsers/profile.js";

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

const CLOUDFLARE_HTML = `
<html><head><title>Just a moment</title></head>
<body>Checking your browser...</body></html>
`;

// ── Tests ────────────────────────────────────────────────────────────

describe("parseProfile", () => {
  it("extracts all OG meta fields", () => {
    const { data, warnings } = parseProfile(PROFILE_HTML);

    expect(data.uid).toBe(6268658);
    expect(data.name).toBe("Tey Zi Pin");
    expect(data.rank).toBe("Sage");
    expect(data.location).toBe("SUPER|brie+ Factory");
    expect(data.miceCaught).toBe(1040);
    expect(data.miceTotal).toBe(1120);
    expect(data.rareMiceCaught).toBe(165);
    expect(data.rareMiceTotal).toBe(165);
    expect(data.gold).toBe(874240861);
    expect(data.points).toBe(9909051391);
    expect(warnings).toEqual([]);
  });

  it("extracts trap setup from image URL", () => {
    const { data } = parseProfile(PROFILE_HTML);

    expect(data.trap).not.toBeNull();
    expect(data.trap!.baseId).toBe(3150);
    expect(data.trap!.weaponId).toBe(3591);
    expect(data.trap!.skinId).toBe(3993);
    expect(data.trap!.baitId).toBe(98);
    expect(data.trap!.imageUrl).toContain("trapimage.php");
  });

  it("returns defaults for invalid HTML", () => {
    const { data } = parseProfile("<html><body>nothing here</body></html>");

    expect(data.name).toBe("");
    expect(data.rank).toBe("");
    expect(data.uid).toBe(0);
    expect(data.trap).toBeNull();
  });

  it("detects Cloudflare challenge page and adds warning", () => {
    const { data, warnings } = parseProfile(CLOUDFLARE_HTML);

    expect(data.uid).toBe(0);
    expect(data.name).toBe("");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatchObject({
      field: "*",
      message: "Received Cloudflare challenge page",
    });
  });
});
