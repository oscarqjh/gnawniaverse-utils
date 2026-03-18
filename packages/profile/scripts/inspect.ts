/**
 * Inspect script — fetches all profile tabs for a hunter,
 * saves raw HTML and parsed JSON for manual inspection.
 *
 * Usage: npx tsx scripts/inspect.ts <hunter_id>
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { parseProfile, parseMice, parseCrowns, parseItems, loadHtml } from "../src/index.js";

const MH_BASE = "https://www.mousehuntgame.com";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const DELAY_MS = 300;

const hunterId = process.argv[2];
if (!hunterId) {
  console.error("Usage: npx tsx scripts/inspect.ts <hunter_id>");
  process.exit(1);
}

const outDir = join(import.meta.dirname!, "output", `hunter_${hunterId}`);
mkdirSync(outDir, { recursive: true });

async function fetchPage(params: Record<string, string>): Promise<string> {
  const url = new URL("/profile.php", MH_BASE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const resp = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  return resp.text();
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function save(name: string, content: string) {
  const path = join(outDir, name);
  writeFileSync(path, content, "utf-8");
  console.log(`  Saved ${name} (${(content.length / 1024).toFixed(1)} KB)`);
}

interface TabConfig {
  name: string;
  params: Record<string, string>;
  parser: (html: string) => unknown;
}

const tabs: TabConfig[] = [
  {
    name: "profile",
    params: { tab: "profile", uid: hunterId },
    parser: parseProfile,
  },
  {
    name: "mice_group",
    params: { tab: "mice", sub_tab: "group", uid: hunterId },
    parser: parseMice,
  },
  {
    name: "mice_location",
    params: { tab: "mice", sub_tab: "location", uid: hunterId },
    parser: parseMice,
  },
  {
    name: "kings_crowns",
    params: { tab: "kings_crowns", uid: hunterId },
    parser: parseCrowns,
  },
  {
    name: "items",
    params: { tab: "items", uid: hunterId },
    parser: parseItems,
  },
];

console.log(`\nFetching profile for hunter #${hunterId}...\n`);

for (const tab of tabs) {
  console.log(`── ${tab.name} ──`);

  const html = await fetchPage(tab.params);
  save(`${tab.name}_raw.html`, html);

  // Also save a pretty-printed version via cheerio
  const $ = loadHtml(html);

  // Extract just the page content (skip scripts, nav, etc.)
  const pageContent = $(".mousehuntHud-page-tabContentContainer").html()
    ?? $(".hunterProfileItemsView").html()
    ?? $(".mouseCrownsView").html()
    ?? $("body").html()
    ?? html;

  // Pretty-print: add newlines before each opening tag and indent
  const formatted = pageContent
    .replace(/></g, ">\n<")
    .replace(/\n(<\/)/g, "\n$1")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((acc: string[], line) => {
      // Simple indentation based on tag depth
      const indent = acc.length > 0 ? "  " : "";
      acc.push(line);
      return acc;
    }, [])
    .join("\n");
  save(`${tab.name}_content.html`, formatted);

  // Parse and save JSON
  const parsed = tab.parser(html);
  save(`${tab.name}_parsed.json`, JSON.stringify(parsed, null, 2));

  await delay(DELAY_MS);
}

console.log(`\nAll files saved to: ${outDir}`);
console.log("Open the _raw.html files in a browser to inspect the full page.");
console.log("Open the _content.html files to see just the tab content.");
console.log("Open the _parsed.json files to see what the parsers extracted.\n");
