# Available Data from MouseHunt Profile Scrape

This document catalogs every piece of extractable data from the scraped MouseHunt hunter profile HTML files, organized by tab. Each table shows the CSS selector/attribute used to locate the data, an example value from the sample profile (hunter 6268658), and whether the current parser already extracts it.

---

## 1. Profile Tab (`profile_content.html`)

### 1.1 ID Card Block

| Data Field | CSS Selector / Attribute | Example Value | Currently Parsed? |
|---|---|---|---|
| User ID | `.hunterInfoView-idCardBlock[data-user-id]` | `6268658` | Yes |
| Hunter ID (display) | `.hunterInfoView-hunterId-idText span` | `6268658` | Yes (as `uid`) |
| Hunter Name | `.friendsPage-friendRow-titleBar-name` (text or `data-text`) | `Tey Zi Pin` | Yes |
| Rank (title) | `.friendsPage-friendRow-titleBar-titleDetail` (text) | `Sage (1%)` | Partial (rank only, not %) |
| Rank CSS class | `.friendsPage-friendRow` class list | `sage` | No |
| Rank percentage (exact) | `.friendsPage-friendRow-titleBar-titleDetail[data-text]` | `1.31%` | No |
| Title icon URL | `.friendsPage-friendRow-titleBar-icon` `style` background-image | `https://www.mousehuntgame.com/images/titles/0f12447b...gif` | No |
| Profile image URL | `.friendsPage-friendRow-image` `style` background-image / `data-src` | Facebook graph URL | No |
| Last active | `.friendsPage-friendRow-stat.online .friendsPage-friendRow-stat-value` | `1 hour` | No |
| Golden Shield status | `.hunterInfoView-idCardBlock-goldenShield-container[data-has-shield]` | `1` | No |
| Golden Shield expiry (full) | `.hunterInfoView-idCardBlock-goldenShield-container[data-golden-shield-expiry-full]` | `3 weeks 1 day 7 hours` | No |
| Golden Shield expiry (short) | `.hunterInfoView-idCardBlock-goldenShield-text` | `3 weeks` | No |
| License suspended tooltip | `.hunterInfoView-idCardTooltipBox-content` | `This hunter's Hunting License has been suspended.` | No |

### 1.2 Mice Stats

| Data Field | CSS Selector / Attribute | Example Value | Currently Parsed? |
|---|---|---|---|
| Breeds caught / total | `.hunterInfoView-idCardBlock-stats-item` (1st) span + text | `1040/1120` | Yes |
| Event breeds caught / total | `.hunterInfoView-idCardBlock-stats-item` (2nd) span + text | `165/165` | Yes |
| Total mice caught | `.hunterInfoView-idCardBlock-stats-item` (3rd) span | `194,090` | No |
| Hunting since date | `.hunterInfoView-idCardBlock-stats-huntingSince-text-container span` | `Nov 30, 2011` | No |
| Loyalty badge level | `.loyaltyBadgeView` class (`badgeLevel10`) | `badgeLevel10` | No |
| Loyalty badge years | `.loyaltyBadgeView-years-text` | `14` | No |
| Loyalty badge image | `.loyaltyBadgeView` `style` background-image | `loyalty-badge-10-year.png` | No |

### 1.3 Horn Stats

| Data Field | CSS Selector / Attribute | Example Value | Currently Parsed? |
|---|---|---|---|
| Total horn calls | `.hunterInfoView-idCardBlock-stats-horn span` | `234,480` | No |
| Active turns | `.hunterInfoView-idCardBlock-stats-horn[data-num-active-turns]` | `74,297` | No |
| Passive turns | `.hunterInfoView-idCardBlock-stats-horn[data-num-passive-turns]` | `94,261` | No |
| Linked turns | `.hunterInfoView-idCardBlock-stats-horn[data-num-linked-turns]` | `65,922` | No |
| Total turns | `.hunterInfoView-idCardBlock-stats-horn[data-num-total-turns]` | `234,480` | No |

### 1.4 Gold & Points

| Data Field | CSS Selector / Attribute | Example Value | Currently Parsed? |
|---|---|---|---|
| Gold | `.friendsPage-friendRow-stat.gold .friendsPage-friendRow-stat-value` | `874,457,369` | Yes |
| Points | `.friendsPage-friendRow-stat.points .friendsPage-friendRow-stat-value` | `9,909,420,671` | Yes |

### 1.5 Team Info

| Data Field | CSS Selector / Attribute | Example Value | Currently Parsed? |
|---|---|---|---|
| Team name | `.hunterInfoView-idCardBlock-teamName span` (or `data-text`) | `Fam Hunters` | No |
| Team ID | `onclick` handler in team link (`team_id:104884`) | `104884` | No |
| Team emblem background | `.teamEmblemView .layer.background` `data-colour`, `data-type`, `style` | `5s`, `background` type | No |
| Team emblem middle | `.teamEmblemView .layer.middle` `data-colour`, `data-type`, `style` | `11`, `wobble_frame` | No |
| Team emblem sigil | `.teamEmblemView .layer.sigil` `data-colour`, `data-type`, `style` | `5`, `dragon` | No |

### 1.6 Favourite Mice (Profile section)

| Data Field | CSS Selector / Attribute | Example Value | Currently Parsed? |
|---|---|---|---|
| Favourite mouse type | `.hunterInfoView-favoritesBlock-content-mouseImage` `onclick` argument | `master_of_the_dojo` | No |
| Favourite mouse name | `.hunterInfoView-favoritesBlock-content-mouseImage[data-mouse-name]` | `Master of the Dojo` | No |
| Favourite mouse catches | `.hunterInfoView-favoritesBlock-content-mouseImage[data-num-catches]` | `654` | No |
| Favourite mouse misses | `.hunterInfoView-favoritesBlock-content-mouseImage[data-num-misses]` | `501` | No |
| Favourite mouse image URL | `.hunterInfoView-favoritesBlock-content-mouseImage` `style` background-image | `https://...thumb/61dc52...gif` | No |
| Favourite mouse crown class | `.hunterInfoView-favoritesBlock-content-mouseImage` class (e.g. `gold`) | `gold` | No |
| Favourite mouse label (catches) | `.hunterInfoView-favoritesBlock-content-mouseLabel` | `654` | No |
| Empty slot detection | `.hunterInfoView-favoritesBlock-content-mouseImage.empty-other` | class presence | No |
| Favourite group number | `.hunterInfoView-favoritesBlock-content[data-group-number]` | `1`, `2`, `3` | No |

### 1.7 Trap Setup

| Data Field | CSS Selector / Attribute | Example Value | Currently Parsed? |
|---|---|---|---|
| Location name | `.hunterInfoView-trapBlock-header-title` | `SUPER\|brie+ Factory` | Yes |
| Location header image | `.hunterInfoView-trapBlock-header-container` `style` background-image | Environment banner URL | No |
| Location thumbnail image | `.hunterInfoView-trapBlock-header-thumbnail-image` `style` background-image | Environment thumbnail URL | No |
| Trap image user ID | `.trapImageView[data-user-id]` | `6268658` | No |
| Base layer image | `.trapImageView-layer.base` `style` background-image | Base trap_small image URL | No |
| Base layer class (item type) | `.trapImageView-layer.base` class list | `gift_of_the_day_base` | No |
| Weapon layer image | `.trapImageView-layer.weapon` `style` background-image | Weapon trap_small image URL | No |
| Weapon layer class (item type) | `.trapImageView-layer.weapon` class list | `legendary_kingbot_weapon` | No |
| Skin layer class (skin type) | `.trapImageView-layer.weapon` class list (2nd class) | `legendary_kingbot_lny_horse_skin` | No |
| Bait layer image | `.trapImageView-layer.bait` `style` background-image | Bait trap_small image URL | No |
| Bait layer class (item type) | `.trapImageView-layer.bait` class list | `coggy_colby_cheese` | No |
| Weapon item type | `.hunterInfoView-trapBlock-setup-trap-slot.middle` `onclick` ItemView.show arg | `legendary_kingbot_weapon` | No |
| Weapon name | `.hunterInfoView-trapBlock-setup-trap-slot.middle[data-name]` | `Legendary KingBot` | No |
| Weapon thumbnail URL | `.hunterInfoView-trapBlock-setup-trap-slot.middle` `style` background-image | Weapon item image URL | No |
| Base item type | `.hunterInfoView-trapBlock-setup-trap-slot` (2nd) `onclick` ItemView.show arg | `gift_of_the_day_base` | No |
| Base name | `.hunterInfoView-trapBlock-setup-trap-slot` (2nd) `[data-name]` | `Gift of the Day Base` | No |
| Base thumbnail URL | `.hunterInfoView-trapBlock-setup-trap-slot` (2nd) `style` background-image | Base item image URL | No |
| Bait item type | `.hunterInfoView-trapBlock-setup-trap-slot` (3rd) `onclick` ItemView.show arg | `coggy_colby_cheese` | No |
| Bait name | `.hunterInfoView-trapBlock-setup-trap-slot` (3rd) `[data-name]` | `Coggy Colby Cheese` | No |
| Bait thumbnail URL | `.hunterInfoView-trapBlock-setup-trap-slot` (3rd) `style` background-image | Bait item image URL | No |
| Bait quantity | `.hunterInfoView-trapBlock-setup-trap-slot-quantity` (bait slot) | `50` | No |
| Charm item type | `.hunterInfoView-trapBlock-setup-trap-slot` (4th) `onclick` ItemView.show arg | `gilded_trinket` | No |
| Charm name | `.hunterInfoView-trapBlock-setup-trap-slot` (4th) `[data-name]` | `Gilded Charm` | No |
| Charm thumbnail URL | `.hunterInfoView-trapBlock-setup-trap-slot` (4th) `style` background-image | Charm item image URL | No |
| Charm quantity | `.hunterInfoView-trapBlock-setup-trap-slot-quantity` (charm slot) | `1,443` | No |
| Skin item type | `.hunterInfoView-trapBlock-setup-trap-slot` (5th) `onclick` ItemView.show arg | `legendary_kingbot_lny_horse_skin` | No |
| Skin name | `.hunterInfoView-trapBlock-setup-trap-slot` (5th) `[data-name]` | `Legendary HorseBot Trap Skin` | No |
| Skin thumbnail URL | `.hunterInfoView-trapBlock-setup-trap-slot` (5th) `style` background-image | Skin item image URL | No |
| Trap image URL (composite) | `profile_parsed.json` trap.imageUrl | Constructed from base/weapon/skin/bait IDs | Yes |
| Base ID | `profile_parsed.json` trap.baseId | `3150` | Yes |
| Weapon ID | `profile_parsed.json` trap.weaponId | `3591` | Yes |
| Skin ID | `profile_parsed.json` trap.skinId | `3993` | Yes |
| Bait ID | `profile_parsed.json` trap.baitId | `2779` | Yes |

### 1.8 Trap Stats

| Data Field | CSS Selector / Attribute | Example Value | Currently Parsed? |
|---|---|---|---|
| Power value | `.campPage-trap-trapStat.power .value i` | `29,258` | No |
| Power type | `.campPage-trap-trapStat-powerTypeIcon` class | `Physical` | No |
| Luck | `.campPage-trap-trapStat.luck .value span` | `64` | No |
| Attraction bonus | `.campPage-trap-trapStat.attraction_bonus .value span` | `55%` | No |
| Cheese effect | `.campPage-trap-trapStat.cheese_effect .value span` | `Uber Fresh` | No |

### 1.9 Trap Auras

Each aura is in a `.trapImageView-trapAura` div with classes indicating type and `active`/`hidden` status.

| Data Field | CSS Selector / Attribute | Example Value | Currently Parsed? |
|---|---|---|---|
| Aura type (class name) | `.trapImageView-trapAura` class (e.g. `QuestAnniversaryAura`) | `QuestAnniversaryAura` | No |
| Aura active/hidden | `.trapImageView-trapAura` class `active` or `hidden` | `active` | No |
| Aura title | `.trapImageView-tooltip-trapAura-title` | `You have the Anniversary Aura!` | No |
| Aura description | `.trapImageView-tooltip-trapAura.active` text content | Aura effect description | No |
| Aura expiry date | `.trapImageView-tooltip-trapAura-expiry span` | `September 30, 2026 @ 1:56am (Local Time)` | No |

Known aura types in HTML: `MiniEventLabyrinthLostChest`, `MiniEventFestiveAura`, `QuestRelicHunter`, `MiniEventPillowcase`, `QuestChromeAura`, `QuestSpookyAura`, `QuestLightningAura`, `QuestAnniversaryAura`, `QuestJetStreamAura`, `QuestMillenniaura`, `QuestDragonsMightAura`

### 1.10 Treasure Maps

| Data Field | CSS Selector / Attribute | Example Value | Currently Parsed? |
|---|---|---|---|
| Current map name | `.hunterInfoView-treasureMaps-left-currentMap-content-title` | `Rare Birthday Event Map` | No |
| Current map image URL | `.hunterInfoView-treasureMaps-left-currentMap-image` `style` background-image | Map convertible image URL | No |
| Current map ID | `.hunterInfoView-treasureMaps-left-currentMap-image` `onclick` arg | `7348057` | No |
| Clues found (total) | `.hunterInfoView-treasureMaps-right-cluesFound` | `8666` | No |
| Global clues ranking | `.hunterInfoView-treasureMaps-right-cluesFound-ranking` | `#1605 in Global Clues` | No |

### 1.11 Tournament Awards

| Data Field | CSS Selector / Attribute | Example Value | Currently Parsed? |
|---|---|---|---|
| Award icon URL | `.hunterInfoView-teamTab-content .itemImage` `style` background-image | Collectible image URL | No |
| Award quantity | `.hunterInfoView-teamTab-content .itemImage .quantity` | `2`, `7`, `5`, `43`, `241`, `77` | No |

### 1.12 Journal Entries

| Data Field | CSS Selector / Attribute | Example Value | Currently Parsed? |
|---|---|---|---|
| Entry ID | `.entry[data-entry-id]` | `316326` | No |
| Entry mouse type | `.entry[data-mouse-type]` | `time_punk` | No |
| Entry class (type) | `.entry` class list | `catchsuccessloot`, `catchsuccess`, `log_summary`, `passive`, `linked`, `active` | No |
| Journal date | `.journaldate` | `3:28pm -` | No |
| Journal environment | `.journalenvironment` | `SUPER\|brie+ Factory` | No |
| Journal text (full HTML) | `.journaltext` | Full hunt result text with loot links | No |
| Mouse thumb image | `.journalimage img[src]` | Mouse thumb image URL | No |
| Loot item types | `.journaltext a.loot` `onclick` ItemView.show arg | `party_trinket`, `super_brie_cheese`, etc. | No |
| Loot item names | `.journaltext a.loot` text | `Party Charm`, `SUPER\|brie+`, etc. | No |
| Lucky loot indicator | `.journaltext a.lucky` class presence | Indicates luck-based drop | No |
| Linked hunter name/ID | `.journaltext a[href*=hunterprofile]` | Hunter snuid in URL | No |

### 1.13 Journal - Hunter's Progress Report

| Data Field | CSS Selector / Attribute | Example Value | Currently Parsed? |
|---|---|---|---|
| Report period | `.reportSubtitle` | `Last 1 day, 12 hours` | No |
| Catches | `.entry.log_summary` table: Catches value | `123` | No |
| Misses | `.entry.log_summary` table: Misses value | `0` | No |
| Fail to Attract | `.entry.log_summary` table: FTA value | `0` | No |
| Stale Bait | `.entry.log_summary` table: Stale value | `0` | No |
| Gold gained | `.entry.log_summary` table: Gold Gained | `352,125` | No |
| Gold lost | `.entry.log_summary` table: Gold Lost | `0` | No |
| Points gained | `.entry.log_summary` table: Points Gained | `607,725` | No |
| Points lost | `.entry.log_summary` table: Points Lost | `0` | No |
| Detailed log data (JSON in onclick) | `showLogSummary()` onclick arg | Mouse IDs + catch counts, bait usage, loot IDs + quantities | No |

### 1.14 Journal Pagination

| Data Field | CSS Selector / Attribute | Example Value | Currently Parsed? |
|---|---|---|---|
| Journal theme | `#journalContainer` class list | `theme_lny_2025`, `jlarge` | No |
| Journal owner ID | `#journalContainer[data-owner]` | `6268658` | No |
| Journal page | `.pagerView-container[data-page]` | `1` | No |
| Journal total items | `.pagerView-container[data-total-items]` | `72` | No |
| Journal total pages | `.pagerView-section-totalPages` | `6` | No |

---

## 2. Mice Tab - Group View (`mice_group_content.html`)

### 2.1 Category Directory (Sidebar)

| Data Field | CSS Selector / Attribute | Example Value | Currently Parsed? |
|---|---|---|---|
| Category key | `.mouseListView-category[data-category]` | `common`, `dock`, `event`, etc. | No (empty array) |
| Category name | `.mouseListView-category-name` | `Indigenous Mice`, `Event Mice`, etc. | No |
| Category progress | `.mouseListView-category-progress` | `36 of 36`, `5 of 6`, etc. | No |
| Category complete status | `.mouseListView-category` class `complete` presence | `complete` or absent | No |
| Category title | `.mouseListView-category[title]` | `Indigenous Mice` | No |

### 2.2 Category Content (only loaded for active category - Event Mice in sample)

| Data Field | CSS Selector / Attribute | Example Value | Currently Parsed? |
|---|---|---|---|
| Category description | `.mouseListView-categoryContent-description` | `These mice are released occasionally...` | No |
| Subgroup key | `.mouseListView-categoryContent-subgroupContainer[data-subgroup]` | `misc` | No |

### 2.3 Individual Mouse Stats (per mouse row)

| Data Field | CSS Selector / Attribute | Example Value | Currently Parsed? |
|---|---|---|---|
| Mouse type | `.mouseListView-categoryContent-subgroup-mouse-thumb` `onclick` MouseView.show arg | `hween_2018_boss` | Yes |
| Mouse name | `.mouseListView-categoryContent-subgroup-mouse-thumb-name` | `Admiral Arrrgh` | Yes |
| Mouse thumbnail URL | `.mouseListView-categoryContent-subgroup-mouse-thumb` `style` background-image | `https://...mice/thumb/cc8e4b...gif` | No |
| Caught/uncaught status | `.mouseListView-categoryContent-subgroup-mouse` class `caught` or `uncaught` | `caught` | Yes |
| Catches count | `.mouseListView-categoryContent-subgroup-mouse-stats.catches` | `64` | Yes |
| Misses count | `.mouseListView-categoryContent-subgroup-mouse-stats.misses` | `1` | Yes |
| Average weight | `.mouseListView-categoryContent-subgroup-mouse-stats.average_weight` | `6 oz.` | Yes |
| Heaviest catch | `.mouseListView-categoryContent-subgroup-mouse-stats.heaviest_catch` | `12 oz.` | Yes |

**Note:** Only the active/expanded category has mouse data loaded. Other categories only have empty shells with loading divs. The current parser only extracts data from the one loaded category (Event Mice in the sample).

---

## 3. Mice Tab - Location View (`mice_location_content.html`)

### 3.1 Location Category Directory (Sidebar)

Same structure as Group view but with location-based categories.

| Data Field | CSS Selector / Attribute | Example Value | Currently Parsed? |
|---|---|---|---|
| Location category key | `.mouseListView-category[data-category]` | `acolyte_realm`, `balacks_cove`, etc. | No |
| Location category name | `.mouseListView-category-name` | `Acolyte Realm`, `Balack's Cove`, etc. | No |
| Location category progress | `.mouseListView-category-progress` | `12 of 13`, `10 of 10`, etc. | No |
| Location complete status | `.mouseListView-category` class `complete` | `complete` or absent | No |

### 3.2 Individual Mouse Stats (per mouse row)

Same structure as Group view (section 2.3). Only one location category's mice are loaded at a time.

**Note:** `mice_location_parsed.json` has the same fields as `mice_group_parsed.json` (type, name, caught, catches, misses, averageWeight, heaviestCatch). The `categories` array is empty in both parsed files, meaning location/group directory data is not currently extracted.

---

## 4. King's Crowns Tab (`kings_crowns_content.html`)

### 4.1 Favourites Section

| Data Field | CSS Selector / Attribute | Example Value | Currently Parsed? |
|---|---|---|---|
| Favourites count | `.mouseCrownsView-numFavourites` | `1` | No |
| Favourites max | Header text parsing (`/12`) | `12` | No |

### 4.2 Crown Groups

| Data Field | CSS Selector / Attribute | Example Value | Currently Parsed? |
|---|---|---|---|
| Crown tier | `.mouseCrownsView-group` class | `platinum`, `gold`, `silver`, `bronze` | Yes |
| Crown tier count | `.mouseCrownsView-group-header-name b` text | `Platinum Crowns (20)` | Yes (as counts) |
| Crown tier threshold | `.mouseCrownsView-group-header-subtitle` | `Earned at 1,000 catches` | No |

### 4.3 Individual Mouse Crown Entry

| Data Field | CSS Selector / Attribute | Example Value | Currently Parsed? |
|---|---|---|---|
| Mouse ID (numeric) | `.mouseCrownsView-group-mouse[data-mouse-id]` | `1036` | Yes |
| Mouse type | `.mouseCrownsView-group-mouse[data-mouse-type]` | `kite_flyer` | Yes |
| Mouse large image URL | `.mouseCrownsView-group-mouse[data-mouse-large]` | `https://...silhouette_large/0d8cb9...jpg` | No |
| Mouse medium image URL | `.mouseCrownsView-group-mouse-image[data-image]` | `https://...silhouette_medium/03eff4...jpg` (favourites) or `silhouette_small/...` | No |
| Mouse name | `.mouseCrownsView-group-mouse-name` | `Kite Flyer` | No |
| Catches count | `.mouseCrownsView-group-mouse-catches` | `1,851` | No |
| Landscape orientation | `.mouseCrownsView-group-mouse` class `landscape` | Present for landscape mice | No |
| Favourite indicator | `.mouseCrownsView-group-mouse` class `favourite` | Present for favourite mice | No |
| Highlight indicator | `.mouseCrownsView-group-mouse` class `highlight` | Present in favourites section | No |
| Empty slot | `.mouseCrownsView-group-mouse` class `empty` | Present for empty favourite slots | No |
| Crown inside favourite | `.mouseCrownsView-crown` class inside mouse image (e.g. `gold`) | `gold` (for favourite mice) | No |

**Currently parsed:** The `kings_crowns_parsed.json` extracts crown tier groupings (diamond/platinum/gold/silver/bronze) with mouse `id` and `type` for each, plus aggregate counts. It does NOT extract mouse names, catch counts, image URLs, or landscape/favourite metadata.

---

## 5. Items Tab (`items_content.html`)

### 5.1 Item Category Directory (Sidebar)

| Data Field | CSS Selector / Attribute | Example Value | Currently Parsed? |
|---|---|---|---|
| Category key | `.hunterProfileItemsView-category[data-category]` | `weapon`, `base`, `map_piece`, `collectible`, `skin` | Yes (as name) |
| Category name | `.hunterProfileItemsView-category-name` | `Weapons`, `Bases`, etc. | Yes |
| Category progress | `.hunterProfileItemsView-category-progress` | `53 of 131 (+50 LE)` | Yes |
| Category complete status | `.hunterProfileItemsView-category` class `complete` | Present for complete categories | No |
| Active category | `.hunterProfileItemsView-category` class `active` | Indicates which category is displayed | No |

### 5.2 Individual Item Entry

| Data Field | CSS Selector / Attribute | Example Value | Currently Parsed? |
|---|---|---|---|
| Item numeric ID | `.hunterProfileItemsView-categoryContent-item[data-id]` | `34` | Yes |
| Item type | `.hunterProfileItemsView-categoryContent-item[data-type]` | `500_pound_spiked_crusher_weapon` | Yes |
| Item name | `.hunterProfileItemsView-categoryContent-item-name span` | `500 Pound Spiked Crusher` | Yes |
| Collected status | `.hunterProfileItemsView-categoryContent-item` class `collected` | Present if owned | Yes |
| Uncollected status | `.hunterProfileItemsView-categoryContent-item` class `uncollected` | Present if not owned | Yes (inverted) |
| Limited edition | `.hunterProfileItemsView-categoryContent-item` class `limited_edition` | Present for LE items | Yes |
| Hidden (filtered out) | `.hunterProfileItemsView-categoryContent-item` class `hidden` | Present for filtered-out items | No |
| Item image URL | `.itemImage` `style` background-image | `https://...weapons/9975a5...jpg` (color) or `.../gray/...` (uncollected) | No |
| Item quantity | `.itemImage .quantity` | `1` (for collected items) | No |
| Limited edition badge | `.itemImage .limitedEdition` div presence | Present for LE items | No |
| Gray image (uncollected) | `.itemImage` style URL contains `/gray/` | Indicates uncollected visual | No |

**Note:** Only the active category (Weapons in the sample) has item entries loaded. Other categories would need to be activated to scrape their items. The `items_parsed.json` contains items from the loaded category only.

---

## 6. Summary of Unparsed Data Opportunities

### High-value data NOT currently extracted:

1. **Profile:**
   - Total mice caught (194,090) -- different from breeds caught
   - Hunting since date
   - Loyalty badge level/years
   - Horn call breakdown (active/passive/linked/total turns)
   - Rank percentage (exact: 1.31%)
   - Team name and ID
   - Golden Shield status and expiry
   - Trap stats (power, luck, attraction, cheese effect, power type)
   - Active trap auras and their expiry dates
   - Trap component names and item types (weapon/base/bait/charm/skin)
   - Bait and charm quantities
   - Treasure map info (current map, clues found, global ranking)
   - Tournament awards
   - Favourite mice details
   - Journal entries (recent hunt history)

2. **Mice (Group & Location):**
   - Category directory with progress (e.g. "36 of 36 Indigenous Mice")
   - Category completion status
   - Mouse thumbnail image URLs
   - **Critical limitation:** Only one category's mice data is loaded per scrape. All other categories show empty loading shells.

3. **King's Crowns:**
   - Mouse names for each crown entry
   - Catch counts per mouse (visible in crown view)
   - Mouse image URLs (large and small silhouettes)
   - Favourite mice section details
   - Landscape orientation flag per mouse

4. **Items:**
   - Item image URLs
   - Item quantities
   - Category completion status
   - Gray/color image distinction for collected vs uncollected
   - **Critical limitation:** Only one item category is loaded per scrape. Others show empty content.

### Data that requires multiple scrapes:

- **Mice Group:** Need to click/load each of the ~45 group categories to get all mouse stats
- **Mice Location:** Need to click/load each of the ~80 location categories to get all mouse stats
- **Items:** Need to click/load each of the 5 item categories (weapon, base, map_piece, collectible, skin) to get all items
