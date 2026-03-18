/**
 * Inspect script — fetches all profile tabs for a hunter,
 * saves raw HTML and parsed JSON for manual inspection.
 *
 * Usage: npx tsx scripts/inspect.ts <hunter_id>
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { load } from "cheerio";
import { HunterProfileClient } from "../src/index.js";
import type { ProfileTab, MiceSubTab } from "../src/index.js";

const hunterId = process.argv[2];
if (!hunterId) {
  console.error("Usage: npx tsx scripts/inspect.ts <hunter_id>");
  process.exit(1);
}

const outDir = join(import.meta.dirname!, "output", `hunter_${hunterId}`);
mkdirSync(outDir, { recursive: true });

function save(name: string, content: string) {
  const path = join(outDir, name);
  writeFileSync(path, content, "utf-8");
  console.log(`  Saved ${name} (${(content.length / 1024).toFixed(1)} KB)`);
}

function prettyPrint(html: string): string {
  const $ = load(html);

  const pageContent =
    $(".mousehuntHud-page-tabContentContainer").html() ??
    $(".hunterProfileItemsView").html() ??
    $(".mouseCrownsView").html() ??
    $("body").html() ??
    html;

  return pageContent
    .replace(/></g, ">\n<")
    .replace(/\n(<\/)/g, "\n$1")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

interface TabConfig {
  name: string;
  tab: ProfileTab;
  subTab?: MiceSubTab;
}

const tabs: TabConfig[] = [
  { name: "profile", tab: "profile" },
  { name: "mice_group", tab: "mice", subTab: "group" },
  { name: "mice_location", tab: "mice", subTab: "location" },
  { name: "kings_crowns", tab: "kings_crowns" },
  { name: "items", tab: "items" },
];

const client = new HunterProfileClient({ requestDelay: 300 });

console.log(`\nFetching profile for hunter #${hunterId}...\n`);

// Step 1: Fetch and save raw HTML for each tab
for (const { name, tab, subTab } of tabs) {
  console.log(`-- ${name} --`);

  const html = await client.fetchTab(hunterId, tab, subTab);
  save(`${name}_raw.html`, html);
  save(`${name}_content.html`, prettyPrint(html));
}

// Step 2: Get full parsed profile and save JSON
console.log("\n-- Parsing full profile --");
const { data: fullProfile, warnings } = await client.getFullProfile(hunterId);

save("profile_parsed.json", JSON.stringify(fullProfile.profile, null, 2));
if (fullProfile.miceByGroup) {
  save("mice_group_parsed.json", JSON.stringify(fullProfile.miceByGroup, null, 2));
}
if (fullProfile.miceByLocation) {
  save("mice_location_parsed.json", JSON.stringify(fullProfile.miceByLocation, null, 2));
}
if (fullProfile.crowns) {
  save("kings_crowns_parsed.json", JSON.stringify(fullProfile.crowns, null, 2));
}
if (fullProfile.items) {
  save("items_parsed.json", JSON.stringify(fullProfile.items, null, 2));
}

// Step 3: Display warnings
if (warnings.length > 0) {
  console.log(`\n-- Warnings (${warnings.length}) --`);
  for (const w of warnings) {
    console.log(`  [${w.field}] ${w.message}${w.selector ? ` (${w.selector})` : ""}`);
  }
}

console.log(`\nAll files saved to: ${outDir}`);
console.log("Open the _raw.html files in a browser to inspect the full page.");
console.log("Open the _content.html files to see just the tab content.");
console.log("Open the _parsed.json files to see what the parsers extracted.\n");
