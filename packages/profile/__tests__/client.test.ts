import { describe, it, expect, vi } from "vitest";
import { HunterProfileClient } from "../src/client.js";
import type { ProfileFetcher, ProfileParser, ParseResult, HunterProfile, MiceData, CrownsData, ItemsData } from "../src/types/index.js";

function createMockFetcher(responses: Record<string, string | Error>): ProfileFetcher {
  return {
    fetchTab: vi.fn(async (_hunterId, tab, subTab) => {
      const key = subTab ? `${tab}:${subTab}` : tab;
      const result = responses[key];
      if (result instanceof Error) throw result;
      return result ?? "";
    }),
  };
}

function createMockParser(): ProfileParser {
  return {
    parseProfile: vi.fn((html: string): ParseResult<HunterProfile> => ({
      data: { uid: 123, name: "TestHunter", rank: "Sage" } as HunterProfile,
      warnings: html.includes("warn") ? [{ field: "test", message: "test warning" }] : [],
    })),
    parseMice: vi.fn((_html: string): ParseResult<MiceData> => ({
      data: { mice: [], categories: [] },
      warnings: [],
    })),
    parseCrowns: vi.fn((_html: string): ParseResult<CrownsData> => ({
      data: {
        crowns: { diamond: [], platinum: [], gold: [], silver: [], bronze: [] },
        summary: { diamond: 0, platinum: 0, gold: 0, silver: 0, bronze: 0 },
      },
      warnings: [],
    })),
    parseItems: vi.fn((_html: string): ParseResult<ItemsData> => ({
      data: { items: [], categories: [] },
      warnings: [],
    })),
  };
}

describe("HunterProfileClient", () => {
  describe("getProfile", () => {
    it("uses mock fetcher and returns parsed data", async () => {
      const fetcher = createMockFetcher({ profile: "<html>profile</html>" });
      const parser = createMockParser();
      const client = new HunterProfileClient({ fetcher, parser, requestDelay: 0 });

      const result = await client.getProfile(123);

      expect(fetcher.fetchTab).toHaveBeenCalledWith(123, "profile", undefined, undefined);
      expect(parser.parseProfile).toHaveBeenCalledWith("<html>profile</html>");
      expect(result.data.uid).toBe(123);
      expect(result.data.name).toBe("TestHunter");
    });
  });

  describe("getFullProfile", () => {
    it("returns partial data (null) on non-profile tab failure with warnings", async () => {
      const fetcher = createMockFetcher({
        profile: "<html>profile</html>",
        "mice:group": "<html>mice group</html>",
        "mice:location": new Error("Network timeout"),
        kings_crowns: "<html>crowns</html>",
        items: new Error("Server error"),
      });
      const parser = createMockParser();
      const client = new HunterProfileClient({ fetcher, parser, requestDelay: 0 });

      const result = await client.getFullProfile(456);

      expect(result.data.profile.uid).toBe(123);
      expect(result.data.miceByGroup).not.toBeNull();
      expect(result.data.miceByLocation).toBeNull();
      expect(result.data.crowns).not.toBeNull();
      expect(result.data.items).toBeNull();

      const failWarnings = result.warnings.filter((w) => w.message.includes("Fetch failed"));
      expect(failWarnings).toHaveLength(2);
      expect(failWarnings.some((w) => w.field === "mice_location")).toBe(true);
      expect(failWarnings.some((w) => w.field === "items")).toBe(true);
    });

    it("throws on profile tab failure", async () => {
      const fetcher = createMockFetcher({
        profile: new Error("404 Not Found"),
      });
      const parser = createMockParser();
      const client = new HunterProfileClient({ fetcher, parser, requestDelay: 0 });

      await expect(client.getFullProfile(999)).rejects.toThrow("404 Not Found");
    });
  });
});
