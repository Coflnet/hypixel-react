---
title: "Mod settings reference"
description: "Complete reference guide for all SkyCofl mod settings with detailed explanations"
order: 11
---

# Mod Settings Reference

This guide documents every available setting in the SkyCofl mod. Settings are organized by category and include detailed explanations of what each option does, acceptable values, and usage tips.

Access settings with `/cofl set` or `/cl s` to see interactive options, or use `/cofl set <setting> <value>` to change a specific setting directly.

---

## General Settings

These settings control the core flip-finding behavior and filtering rules.

### filters
- **Type:** Dictionary (key-value pairs)
- **Default:** Empty
- **Description:** Advanced filter dictionary for custom flip matching rules. Most users should use blacklist/whitelist commands instead.
- **Usage:** Configured automatically through `/cofl bl` and `/cofl wl` commands.

### lbin (BasedOnLBin)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Calculate profit based on **Lowest BIN** instead of median price. Highly recommended to enable **only** the `sniper` finder when using this setting.
- **Effects:**
  - Changes profit calculation from median-based to lbin-based
  - May show negative profits if whitelist items don't have lbin data
  - Works best with `/cofl set finders sniper`
- **Warning:** Using lbin mode with other finders (FLIPPER, MEDIAN_SNIPER) can cause inaccurate profit estimates.

### finders (AllowedFinders)
- **Type:** FinderType flags
- **Default:** `FLIPPER_AND_SNIPERS` (119)
- **Description:** Controls which flip-finding algorithms are enabled.
- **Options:**
  - `SNIPER` – Lowest BIN-based flips (fast, accurate for instant sales)
  - `FLIPPER` / `FLIPPER_AND_SNIPERS` – Median-based flips (balanced, higher volume)
  - `SNIPER_MEDIAN` – Median sniper (alternative median algorithm)
  - `STONKS` – Risky/experimental flips (high competition, low success rate)
  - `USER` – Whitelist-only flips (custom tracked items)
  - `AI` – AI-predicted flips
  - `CraftCost` – Craft-cost flips
- **Tip:** Use `sniper` alone for maximum speed; use `FLIPPER_AND_SNIPERS` for broader coverage.

### onlyBin (OnlyBin)
- **Type:** Boolean
- **Default:** `true`
- **Description:** Hide all regular auctions and only show **BIN** (Buy It Now) auctions.
- **Reason:** Non-BIN auctions require bidding and waiting, making them impractical for fast flipping.

### whitelistAftermain (WhitelistAfterMain)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Whitelisted items must **also** pass main filters (minProfit, minVolume, etc.).
- **When `false`:** Whitelist bypasses all other filters (recommended for specific targets).
- **When `true`:** Whitelist acts as a "priority" filter that still respects profit/volume thresholds.

### DisableFlips
- **Type:** Boolean
- **Default:** `false`
- **Description:** Stop receiving flip notifications entirely (keeps mod features like `/cofl bazaar` active).
- **Also stops:** The countdown timer display.
- **Use case:** Temporarily pause flipping without logging out.

### DebugMode
- **Type:** Boolean
- **Default:** `false`
- **Description:** Enable verbose logging to help diagnose issues.
- **Output:** Extra information in chat and logs for troubleshooting filter/flip behavior.

### blockHighCompetition (BlockHighCompetitionFlips)
- **Type:** Boolean
- **Default:** `true`
- **Description:** Hide flips that are likely **already purchased** by the time you click them (based on grace period expiry and competition metrics).
- **Recommended:** Keep enabled to avoid wasted clicks on impossible-to-buy flips.

### minProfit (MinProfit)
- **Type:** Long (coins)
- **Default:** `2,500,000` (2.5m)
- **Description:** Minimum **absolute profit** (after taxes) a flip must have to be displayed.
- **Format:** Accepts shorthand like `2.5m`, `500k`, `1b`.
- **Example:** `/cofl set minProfit 5m` to only see flips with at least 5 million profit.

### minProfitPercent (MinProfitPercent)
- **Type:** Integer (percent)
- **Default:** `20`
- **Description:** Minimum **profit percentage** ((sell - cost) / cost × 100) required.
- **Note:** Flips must pass **both** minProfit and minProfitPercent checks.
- **Auto-flip clients:** Percentage is increased to at least 9% when AH slots are nearly full (< 2 open).

### minVolume (MinVolume)
- **Type:** Double (sales per day)
- **Default:** `0.1`
- **Description:** Minimum average **daily sales volume** (how many times the item sells per 24 hours).
- **Low volume risk:** Items with &lt;1 sale/day may take longer to resell.
- **Decimal values:** `0.1` means roughly 1 sale every 10 days.

### maxCost (MaxCost)
- **Type:** Long (coins)
- **Default:** `1,000,000,000` (1 billion)
- **Description:** Maximum **purchase price** you're willing to spend on a single flip.
- **Interaction:** Also respects `modmaxPercentOfPurse` (see Mod Settings).
- **Example:** `/cofl set maxCost 50m` to cap flips at 50 million coins.

---

## Mod Settings

These settings control the **in-game mod behavior**, including UI, sounds, notifications, and automation.

### modjustProfit (DisplayJustProfit)
- **Type:** Boolean
- **Default:** `true`
- **Description:** Show **only profit** in flip messages instead of full price breakdown.
- **When `false`:** Displays cost → sell price → profit.

### modsoundOnFlip (PlaySoundOnFlip)
- **Type:** Boolean
- **Default:** `true`
- **Description:** Play a notification sound when a new flip arrives.
- **Disabled in:** Streamer mode (`modstreamerMode`).

### modsoundOnOutbid (PlaySoundOnOutbid)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Play a sound when your **bazaar order** is outbid.
- **Use case:** Helpful for active bazaar flipping.

### modshortNumbers (ShortNumbers)
- **Type:** Boolean
- **Default:** `true`
- **Description:** Use `k` and `M` abbreviations (e.g., `2.5M` instead of `2,500,000`).
- **When `false`:** Shows full numbers.

### modshortNames (ShortNames)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Remove **reforges** and modifiers from item names in flip messages.
- **Example:** `Renowned Shadow Fury` → `Shadow Fury`.

### modblockTenSecMsg (BlockTenSecondsMsg)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Hide the "Flips in 10 seconds..." countdown message.

### modformat (Format)
- **Type:** String (format template)
- **Default:** `(FLIP) {0}: {1}{2} {3}{4}  -> {5} Volume: {10}`
- **Description:** Custom flip message format using placeholders:
  - `{0}` – Finder type (FLIP, SNIPE, USER, etc.)
  - `{1}` – Rarity color code
  - `{2}` – Item name
  - `{3}` – Profit color
  - `{4}` – Profit amount
  - `{5}` – Target price
  - `{10}` – Volume
- **Advanced:** Edit to customize flip notification appearance.

### modblockedFormat (BlockedFormat)
- **Type:** String (optional)
- **Default:** `null` (uses default format)
- **Description:** Separate format template for **blocked flips** shown via `/cofl blocked`.

### modchat (Chat)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Enable `/fc` **Coflnet chat** integration.
- **Toggle:** `/cofl chat` or `/fc` to turn on/off.

### modcountdown (DisplayTimer)
- **Type:** Boolean
- **Default:** `true`
- **Description:** Show the **countdown timer** until the next Hypixel auction update.
- **Position:** Customizable with `modtimerX` and `modtimerY`.

### modhideNoBestFlip (HideNoBestFlip)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Hide the "No best flip on page" message when using the flip hotkey in AH.

### modtimerX (TimerX)
- **Type:** Integer (percent)
- **Default:** `0`
- **Description:** Horizontal position of timer (percentage of screen width, left/right).

### modtimerY (TimerY)
- **Type:** Integer (percent)
- **Default:** `0`
- **Description:** Vertical position of timer (percentage of screen height, up/down).

### modtimerSeconds (TimerSeconds)
- **Type:** Integer (seconds)
- **Default:** `0`
- **Description:** Show timer only when **X seconds** remain before auction update.
- **Example:** Set to `30` to display timer only in the last 30 seconds.

### modtimerScale (TimerScale)
- **Type:** Float (scale multiplier)
- **Default:** `0.0` (uses default size)
- **Description:** Scale factor for timer size (e.g., `1.5` = 150% size).

### modtimerPrefix (TimerPrefix)
- **Type:** String (optional)
- **Default:** `null`
- **Description:** Custom text displayed **before** the timer (e.g., `"Next update: "`).

### modtimerPrecision (TimerPrecision)
- **Type:** Integer (digits)
- **Default:** `0` (auto)
- **Description:** Number of decimal places for timer display (e.g., `3` = `12.345s`).

### modblockedMsg (MinutesBetweenBlocked)
- **Type:** Byte (minutes, 0-127)
- **Default:** `0` (show every time)
- **Description:** Minimum minutes between "X flips blocked" summary messages.
- **Example:** Set to `5` to reduce spam when many flips are blocked.

### modmaxPercentOfPurse (MaxPercentOfPurse)
- **Type:** Short (percent, 0-100)
- **Default:** `0` (disabled)
- **Description:** Maximum **percentage of your purse** to spend on a single flip.
- **Example:** Set to `50` to never spend more than 50% of your coins on one item.
- **Interaction:** Works alongside `maxCost` (stricter limit wins).

### modnoBedDelay (NoBedDelay)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Send **bed flips immediately** without fairness delay.
- **Use case:** Premium feature for beds (applies bed-specific rules).

### modstreamerMode (StreamerMode)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Hide **personal data** (usernames, balances) and reduce sound volume for streaming.

### modautoStartFlipper (AutoStartFlipper)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Automatically **start receiving flips** when joining SkyBlock.
- **Toggle:** Use `/cofl flip always` to enable, `/cofl flip never` to disable.

### modnormalSoldFlips (NormalSoldFlips)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Don't mark sold flips with `[SOLD]` prefix—display them normally.

### modtempBlacklistSpam (TempBlacklistSpam)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Auto-blacklist items for **8 hours** if they appear **>5 times in 2 minutes**.
- **Purpose:** Prevent spam from manipulated or hyper-competitive items.

### moddataOnlyMode (AhDataOnlyMode)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Disable flip delivery; **only add price/lore data** to items.
- **Use case:** Keep mod features (lore extensions, price info) without receiving flips.

### modahListHours (AhListTimeTarget)
- **Type:** Integer (hours)
- **Default:** `0` (uses recommended time)
- **Description:** Target listing duration when posting auctions (in hours).

### modquickSell (QuickSell)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Automatically list flips at **lowest possible price** to sell ASAP.
- **Warning:** Reduces profit for speed.

### modmaxItemsInInventory (MaxFlipItemsInInventory)
- **Type:** Integer (item count)
- **Default:** `0` (when full minus 2 spare slots)
- **Description:** Stop receiving flips when **X flip items** are already in inventory. If set to 101 or higher buying won't be stopped completely but be slowed down a bit.
- **Use case:** Prevent inventory clutter; forces you to sell before buying more.

### moddisableSpamProtection (DisableSpamProtection)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Disable the **5-flip limit per update**—show ALL matching flips.
- **CAUTION:** Can flood chat with dozens of flips; only enable if you have strict filters.

### modtempBlacklistThreshold (TempBlacklistThreshold)
- **Type:** Integer (percent)
- **Default:** `20`
- **Description:** If you **purchase** more than X% of flips seen for an item, auto-blacklist it temporarily.
- **Example:** Default `20` means buying 4 out of 8 seen flips (50% > 20%) triggers temp blacklist.
- **Purpose:** Prevent overspending on a single item type.

---

## Visibility Settings

Control which data fields are **shown in flip messages**.

### showcost (Cost)
- **Type:** Boolean
- **Default:** `true`
- **Description:** Display the **purchase cost** of the flip.

### showestProfit (EstimatedProfit)
- **Type:** Boolean
- **Default:** `true`
- **Description:** Show **profit after AH tax** (estimated sell price - cost - fees).

### showlbin (LowestBin)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Display the **current lowest BIN** price.
- **Performance:** Adds a few milliseconds delay to fetch lbin data.
- **Warning:** If you use non-sniper finders, the mod warns that fetching lbin slows flips.

### showslbin (SecondLowestBin)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Show the **second-lowest BIN** price.
- **Performance:** Adds a few milliseconds delay.

### showmedPrice (MedianPrice)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Display the **median/target price** (equals lbin for sniper flips).

### showseller (Seller)
- **Type:** Boolean
- **Default:** `true`
- **Description:** Show the **auction seller's username**.
- **Performance:** Adds a few milliseconds to look up seller name.
- **Privacy:** Disable to reduce data fetching.

### showvolume (Volume)
- **Type:** Boolean
- **Default:** `true`
- **Description:** Display **average sales per 24 hours**.

### showextraFields (ExtraInfoMax)
- **Type:** Integer (number of lines)
- **Default:** `0`
- **Description:** How many **extra info lines** to display below the flip (e.g., enchantments, reforge, modifiers).
- **Example:** Set to `3` to show up to 3 detail lines.

### showprofitPercent (ProfitPercentage)
- **Type:** Boolean
- **Default:** `true`
- **Description:** Show **profit percentage** (%).

### showprofit (Profit)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Show **absolute profit** amount (in coins).
- **Difference from `EstimatedProfit`:** This is a separate toggle for displaying profit explicitly in the message.

### showsellerOpenBtn (SellerOpenButton)
- **Type:** Boolean
- **Default:** `true`
- **Description:** Display a **clickable button** to open the seller's active auctions.

### showlore (Lore)
- **Type:** Boolean
- **Default:** `true`
- **Description:** Show full **item description** in hover tooltip.

### showhideSold (HideSoldAuction)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Prevent **sold auctions** from appearing in flip messages.
- **Use case:** Reduce clutter by hiding auctions that were already purchased by someone else.

### showhideManipulated (HideManipulated)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Hide **manipulated bazaar items** (price ratio > 2× or > 1.5× above 7.5m).
- **Applies to:** `/cofl bazaar` command and bazaar flip lists.

---

## Privacy Settings

Control what data the mod **collects and uploads** for tracking/features.

### privacyCollectChat (CollectChat)
- **Type:** Boolean
- **Default:** `true`
- **Description:** Allow collection of **limited chat messages** to track trades, AH sales, drops, and bazaar events.
- **Required for:** `/cofl profit`, flip tracking, trade history.

### privacyCollectInventory (CollectInventory)
- **Type:** Boolean
- **Default:** `true`
- **Description:** Upload **chest and inventory contents** (required for trade tracking).
- **Required for:** `/cofl search`, lowball matching, trade profit tracking.

### privacyDisableTradeStoring (DisableTradeStoring)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Stop storing **player-to-player trades** in your flip history.

### privacyDisableKuudraTracking (DisableKuudraTracking)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Stop tracking **Kuudra run profit** calculations.

### privacyCollectTab (CollectTab)
- **Type:** Boolean
- **Default:** `true`
- **Description:** Read and upload **tab list** when joining servers to detect profile type, server, and island.
- **Required for:** Auto-profile detection, location-based filters.

### privacyCollectScoreboard (CollectScoreboard)
- **Type:** Boolean
- **Default:** `true`
- **Description:** Read and upload **scoreboard** periodically to detect purse balance.
- **Required for:** Purse-based flip filtering (`modmaxPercentOfPurse`).

### privacyCollectChatClicks (CollectChatClicks)
- **Type:** Boolean
- **Default:** `true`
- **Description:** Track **clicks on chat messages** (for analytics and improvement).

### privacyExtendDescriptions (ExtendDescriptions)
- **Type:** Boolean
- **Default:** `true`
- **Description:** Enable **lore extensions** (extra info lines in item tooltips).
- **Required for:** `/cofl lore` customization.

### privacyAutoStart (AutoStart)
- **Type:** Boolean
- **Default:** `true`
- **Description:** Automatically **connect to Coflnet** when joining SkyBlock.
- **When `false`:** Must manually run `/cofl start`.

---

## Lore Settings

Customize **in-game lore overlays** (extra information added to item descriptions).

### loreHighlightFilterMatch (HighlightFilterMatch)
- **Type:** Boolean
- **Default:** `true`
- **Description:** **Highlight items** in AH/trade windows that match your black/whitelist filters.
- **Visual:** Green border for matching items.

### loreMinProfitForHighlight (MinProfitForHighlight)
- **Type:** Long (coins)
- **Default:** `5,000,000` (5m)
- **Description:** Minimum profit to **highlight the best flip** on an AH page.
- **When viewing AH:** Items with profit above this threshold get a visual indicator.

### loreDisableHighlighting (DisableHighlighting)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Turn off **all highlighting** (blacklist/whitelist matches, best flips, etc.).

### loreDisableSuggestions (DisableSuggestions)
- **Type:** Boolean
- **Default:** `true`
- **Description:** Disable **sign input suggestions** (e.g., auto-fill prices when listing items).

### loreDisableInfoIn (DisableInfoIn)
- **Type:** HashSet (menu names)
- **Default:** `null` (empty)
- **Description:** List of **menu names** where side info display is disabled, example `Bazaar` or `Crafting` for tips/stats in inventory
- **Commands:**
  - Add: Automatically added when you type into the setting.
  - Remove: Prefix with `rm ` (e.g., `/cofl set loreDisableInfoIn rm Crafting`).
  - Clear: `/cofl set loreDisableInfoIn clear`.
- **Example:** `/cofl set loreDisableInfoIn Crafting` to hide lore info in the crafting table.

### loreDisabled (Disabled)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Completely **disable extra lore** overlays.

### loreLowballMedUndercut (LowballMedUndercut)
- **Type:** Byte (percent, 0-255)
- **Default:** `0` (disabled)
- **Description:** Percentage to **undercut median price** when lowballing.
- **Calculation:** Uses the **lower** of median and lbin, then applies this undercut.
- **Note:** Setting to `1` or higher hides the "lowball setup incomplete" notice.

### loreLowballLbinUndercut (LowballLbinUndercut)
- **Type:** Byte (percent)
- **Default:** `10`
- **Description:** Percentage to **undercut lbin price** when lowballing.
- **Dynamic adjustments:**
  - Items < 10m: +2%
  - Items > 100m: -2%
  - Volume < 1/day: +3%

### lorePreferLbinInSuggestions (PreferLbinInSuggestions)
- **Type:** Boolean
- **Default:** `true`
- **Description:** Use **current lbin** for price suggestions instead of stable median when listing items.

### loreSuggestQuicksell (SuggestQuicksell)
- **Type:** Boolean
- **Default:** `false`
- **Description:** Suggest **quick-sell prices** (lower than market) when listing auctions.
- **Use case:** Fast liquidation at the cost of profit.

---

## Tips & Best Practices

### Optimizing for Speed
- Enable **only `sniper` finder** with `lbin` mode for fastest flips.
- Disable `showseller` and `showlbin` to reduce lookup delays.
- Set `blockHighCompetition` to `true`.

### Reducing Chat Spam
- Increase `minProfit` and `minProfitPercent`.
- Enable `modblockedMsg 5` to reduce blocked flip summaries.
- Keep `moddisableSpamProtection false` (default).

### Maximizing Profit
- Use `FLIPPER_AND_SNIPERS` finders for broader coverage.
- Lower `minVolume` to `0.1` to see rare high-profit items.
- Enable `/cofl set finders flipper,sniper,median` for all algorithms.

### Safety & Fairness
- Never disable `blockHighCompetition` (risks wasted clicks).
- Keep `modtempBlacklistSpam` enabled to avoid manipulation traps.
- Set `modmaxPercentOfPurse` to avoid overspending (e.g., `30` = max 30% of purse per flip).

### Customization
- Edit `modformat` to personalize flip messages.
- Adjust timer position with `modtimerX` and `modtimerY`.
- Use `/cofl lore` to configure which stats appear in item descriptions.

---

## Quick Reference Table

| Setting | Category | Type | Default | Description |
|---------|----------|------|---------|-------------|
| `lbin` | General | Boolean | `false` | Use lbin for profit calculation |
| `finders` | General | FinderType | `119` | Which flip algorithms to use |
| `onlyBin` | General | Boolean | `true` | Show only BIN auctions |
| `minProfit` | General | Long | `2500000` | Minimum profit (coins) |
| `minProfitPercent` | General | Integer | `20` | Minimum profit (%) |
| `minVolume` | General | Double | `0.1` | Minimum sales/day |
| `maxCost` | General | Long | `1000000000` | Maximum purchase price |
| `blockHighCompetition` | General | Boolean | `true` | Hide impossible flips |
| `modsoundOnFlip` | Mod | Boolean | `true` | Play flip sound |
| `modcountdown` | Mod | Boolean | `true` | Show timer |
| `modautoStartFlipper` | Mod | Boolean | `false` | Auto-start on join |
| `modstreamerMode` | Mod | Boolean | `false` | Hide personal data |
| `showcost` | Visibility | Boolean | `true` | Show cost |
| `showestProfit` | Visibility | Boolean | `true` | Show profit |
| `showvolume` | Visibility | Boolean | `true` | Show volume |
| `showseller` | Visibility | Boolean | `true` | Show seller name |
| `privacyCollectChat` | Privacy | Boolean | `true` | Track chat for events |
| `privacyCollectInventory` | Privacy | Boolean | `true` | Upload inventory |
| `privacyExtendDescriptions` | Privacy | Boolean | `true` | Enable lore overlay |
| `loreHighlightFilterMatch` | Lore | Boolean | `true` | Highlight matches |
| `loreDisabled` | Lore | Boolean | `false` | Disable all lore |

---

## Related Commands

- **`/cofl set`** – View all settings with interactive toggles
- **`/cofl set <page>`** – Jump to a specific settings page
- **`/cofl set <setting> <value>`** – Change a setting directly
- **`/cofl blocked`** – See why flips are filtered out
- **`/cofl lore`** – Customize item description overlays
- **`/cofl bl` / `/cofl wl`** – Manage blacklist/whitelist filters

---

## Troubleshooting

**Q: Why aren't I seeing any flips?**  
A: Check `/cofl blocked` to see what's being filtered. Common causes:
- `minProfit` or `minProfitPercent` too high
- Wrong `finders` enabled
- `DisableFlips` turned on accidentally
- Purse too low + `maxCost` or `modmaxPercentOfPurse` blocking expensive flips

**Q: Flips are too slow / arrive late**  
A: Run `/cofl delay` to check your current delay. Reduce it by:
- Disabling `showseller` and `showlbin` (reduces lookup time)
- Using only `sniper` finder with `lbin` mode
- Upgrading to Premium/Premium+ (lower base delay)
- Solving captchas with `/cofl captcha`

**Q: How do I reset settings to default?**  
A: Use `/cofl backup add default` to save current settings, then manually change each setting back to documented defaults, or load a fresh config from `/cofl configs`.

---

**Last Updated:** October 2025  
For more help, join the [Coflnet Discord](https://discord.gg/wvKXfTgCfb) or check the [full command reference](/wiki/docs/mod-commands).
