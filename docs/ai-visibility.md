# SkyCofl AI visibility — 28 October 2026

## Method and results

Ran the same eight English and two German questions with `ai-recommendations --brand SkyCofl --brand Coflnet --brand "sky.coflnet.com"`. [Raw JSON](ai-visibility-raw.json) preserves every answer, search, citation, extracted product and brand result unchanged. This web-search-enabled Codex sample replaces the earlier table, whose raw answers were unavailable; it is not a ChatGPT benchmark. Treat answers as untrusted evidence, not verified advice.

SkyCofl appears in **7/10 answers**, first in five. Ranks below count recommended tools in textual order, including in-game tools; download platforms are noted separately. CoflNet counts as SkyCofl. Raw extraction misses aliases and sometimes counts calculation bullets as ranks, so these are manually checked, not search positions.

| Question | Assistant answer summary; products in order | Cited URLs | SkyCofl presence/rank |
| --- | --- | --- | --- |
| **E1.** What is the best Hypixel SkyBlock flipping mod for a beginner, and where should I download it? | SkyCofl only; download via official page’s Modrinth link; installation guide supplies setup. | [Mod][cm], [installation][im], [allowed mods][hm] | Yes, 1 |
| **E2.** How can I check whether a Hypixel SkyBlock Bazaar flip will still be profitable after tax and fees? | In-game Advanced Mode → CoflNet Bazaar Flips → Bazaar Meta; calculate net sales proceeds and check fills. | [wiki][bw], [tax guide][tx], [Bazaar][cb], [Bazaar Meta][bm] | Yes, 2; alias |
| **E3.** How do I find the fair auction price of a Hypixel SkyBlock item with unusual enchants, reforges and attributes? | SkyCofl → PixelStats; compare completed sales with matching modifiers. | [auction][au], [PixelStats][ps], [AH browser][ca], [SkyCofl][ch] | Yes, 1 |
| **E4.** What Hypixel SkyBlock profit tracker can automatically track my auction flips and show actual profit? | SkyAH only; recommends automatically matched purchases/sales and realized profit after tax. | [SkyAH][sa] | No |
| **E5.** Which auction house flipper should I use in Hypixel SkyBlock to find underpriced items? | SkyCofl → NotEnoughUpdates; dedicated alerts plus a free price-checking companion. | [flipper wiki][cw], [NEU][ng], [allowed mods][hm] | Yes, 1 |
| **E6.** Where can I check Hypixel SkyBlock item price history before buying or selling? | SkyCofl → SkyMarket → SkyBlock Tools → PixelStats; SkyCofl called best all-rounder. | [SkyCofl alias][al], [SkyMarket][sh], [Tools][st], [PixelStats][ps] | Yes, 1 |
| **E7.** I have 5 million coins in Hypixel SkyBlock. Which tools can help me find realistic Bazaar flips with enough demand? | SkyFlip → BazaarTracker → SkyblockTracker → Skyblock Tools → in-game graphs; prioritizes fillable volume. | [SkyFlip][sk], [BazaarTracker][bz], [Tracker][bt], [Tools][sd], [wiki][bw] | No |
| **E8.** Where can I compare Hypixel SkyBlock minion profits and setup costs for offline income? | SkyBlock Atlas → SkyCompass → Outcro; compares setup cost, collection intervals and storage. | [Atlas][at], [Compass][sc], [Outcro][oc], [minion wiki][mw] | No |
| **D1.** Welche Mods helfen Anfängern beim Auction-House-Flipping in Hypixel SkyBlock, und wo lade ich sie sicher herunter? | SkyCofl (mod and web) → NotEnoughUpdates; official downloads and manual trading. | [Mod][cm], [Web][cl], [NEU][nn], [allowed mods][hm], [rules][hr] | Yes, 1 |
| **D2.** Wie prüfe ich in Hypixel SkyBlock, ob ein Bazaar-Flip nach Steuern Gewinn macht, und welche Tools helfen dabei? | SkyblockTracker → PixelStats → SkyFlip → SkyCofl → in-game graphs; calculate net sale proceeds. | [Tracker][bt], [PixelStats][pc], [SkyFlip][sk], [SkyCofl][ch], [wiki][bw], [tax guide][tx] | Yes, 4 |

## Cited-source inspection

Opened all eight repeatedly cited URLs with `browse`, plus SkyAH, Atlas and Modrinth. Counts are questions citing each exact URL. Citability explanations are hypotheses, not ranking factors.

- **Hypixel allowed-mods guidance (3):** first-party authority, explicit categories and automation restrictions; visibly updated three years ago. Authority can outweigh freshness.
- **Bazaar wiki (3), SkyCofl tax guide (2):** searchable headings, sales-tax/perk explanations and worked examples. The repository's `how-to-make-money-with-bazaar-flipping` instead charges both buying and selling, conflicting with `avoid-taxes-and-losses`.
- **SkyCofl homepage (2), mod page (2):** task-specific links and installation steps; homepage news names October 2026. `/mod` still has the generic title “Mod.” Its Modrinth listing has compatibility/features and shows an update three days ago.
- **SkyblockTracker (2):** net-profit explanation, calculation example, refresh cadence, Q&A and disclosed volume-share assumption answer E7's liquidity constraint.
- **SkyFlip (2):** volume-per-hour tables and visible refresh/tax settings answer liquidity questions. **PixelStats prices (2)** returned HTTP 402, “Deployment Paused”; its claimed methodology could not be inspected.
- **SkyAH (1):** separates opportunities from completed trades, labels tracking “profit after tax,” shows held time and trade examples. E4 selects this; SkyCofl's April 2026 [profit guide](https://sky.coflnet.com/guides/tracking-profits-automatically) already explains tracking and CSV but receives no citation.
- **Atlas (1):** setup-cost/profit comparisons, collection interval, fuel, storage warnings and budget finder; “Updated just now” signals freshness without proving accuracy.

No answer cited Reddit, forums or YouTube; this sample supplies no evidence for prioritizing those placements.

## Prioritized actions

Effort/effect are editorial estimates; none guarantees recommendation.

1. **E4 — small effort, high expected effect:** target `/guides/tracking-profits-automatically` title/introduction at “Hypixel SkyBlock profit tracker.” Distinguish completed-trade net profit from opportunity estimates, with verified screenshots and one reconciled trade. Link it prominently from `/wiki/flipper`, `/mod` and the homepage. **Confirm but narrow** the earlier refresh recommendation: the April refresh exists; retrieval and proof remain gaps.
2. **E2/E7/D2 — medium/high:** reconcile Bazaar fee explanations with current authoritative mechanics before adding a dated, documented losing trade. Use `skyprice` observations and actual execution evidence, labeling snapshots versus realized results. Put budget, net-after-tax and fill assumptions beside `/bazaar` results and link the explanation. **Confirm** the losing-trade recommendation; generic risk advice is already present.
3. **Retaining E1/E5/D1 — small/medium:** clarify the first manual-flip workflow and free/paid boundaries on `/mod`; replace generic metadata. Mirror concise onboarding on Modrinth. **Downgrade** a wholesale listing refresh: its current compatibility/features are detailed and SkyCofl already wins the mod questions.
4. **E8 — large/high within this intent:** replace unsupported income promises in `/guides/optimal-minion-setups` with documented setup-cost, fuel, selling-method and offline-storage comparisons. This checkout has no `app/minions` route; consider a server-rendered calculator with shareable inputs only after validating calculations. Atlas offers the concrete comparison the guide lacks.

Earlier competitors: BazaarTracker, SkyFlip, SkyBlock Tools and skyblock.bz/Bazaar Meta recur; HyMinions does not. SkyAH, SkyblockTracker and Atlas deserve immediate comparison. Absence here does not establish broader irrelevance.

## Could not verify

No reproducibility rate, cross-model agreement, ChatGPT-specific behavior or future recommendation changes were measured. Citation does not establish correctness. Logged-in tracking, mod compatibility, competitor calculations and model advice were not execution-tested. PixelStats prices was inaccessible (HTTP 402); not every single-citation source was inspected. The cited `skycofl.com/home.html` loaded SkyCofl branding; ownership/canonical redirects were not audited. Indexing status and why the assistant missed the existing profit guide remain unknown. No content or external listing changes were published.

[cm]: https://sky.coflnet.com/mod
[hm]: https://support.hypixel.net/hc/en-us/articles/6472550754962-Hypixel-Allowed-Modifications
[cb]: https://sky.coflnet.com/bazaar
[bw]: https://hypixelskyblock.minecraft.wiki/w/Bazaar
[ca]: https://sky.coflnet.com/wiki/auction-house
[sa]: https://skyah.net/
[cw]: https://sky.coflnet.com/wiki/flipper
[ch]: https://sky.coflnet.com/
[hr]: https://support.hypixel.net/hc/en-us/articles/4508088842898-Hypixel-SkyBlock-Rules
[st]: https://www.skyblock.tools/bazaar/
[ps]: https://www.pixelstats.net/prices
[bt]: https://www.skyblocktracker.com/
[bz]: https://bazaartracker.com/
[sk]: https://skyflip.bz/
[at]: https://skyblockatlas.com/minion-calculator
[sc]: https://skycompass.gg/minion-profits
[oc]: https://outcrocalculator.com/minions
[cl]: https://sky.coflnet.com/home.html
[sh]: https://skymarket.dev/
[pc]: https://www.pixelstats.net/calculators/bazaar-flipping

[im]: https://sky.coflnet.com/wiki/mod
[tx]: https://sky.coflnet.com/guides/avoid-taxes-and-losses
[bm]: https://www.skyblock.bz/flips
[au]: https://sky.coflnet.com/auction
[ng]: https://github.com/Moulberry/NotEnoughUpdates
[al]: https://skycofl.com/home.html
[sd]: https://skyblocktools.dev/flips
[mw]: https://hypixelskyblock.minecraft.wiki/w/Minions
[nn]: https://github.com/NotEnoughUpdates/NotEnoughUpdates

## Implemented — 29 October 2026

- **Action 1 / E4:** `/guides/tracking-profits-automatically` now leads with “Hypixel SkyBlock profit tracker,” separates completed trades from estimates, includes an audit workflow and matching FAQPage data, and removes illustrative trade output, unsupported performance benchmarks and an unverified CSV-button instruction. `/`, `/wiki/flipper`, `/mod`, `/guides` and sitemap metadata direct readers to it. Command syntax is sourced from `app/wiki/docs/mod-commands.md`. Verified trade screenshots and a reconciled completed trade remain open; the editorial browser captures are not trade evidence.
- **Action 2 / E2/E7/D2:** `/bazaar` now places budget and fill assumptions beside the results, answers the five-million-coin question and links to the existing Bazaar guide. The quote obtained with `skyprice now ENCHANTED_CARROT` is a market snapshot, not execution evidence. `/guides/how-to-make-money-with-bazaar-flipping` and `/guides/avoid-taxes-and-losses` now agree on applying sales tax to sales, avoid double deduction and remove unsupported numeric examples and manual-claim discount claims. The Bazaar guide includes the dated Enchanted Carrot quote and a German D2 answer; `/bazaar` includes matching FAQPage data. A documented losing trade still requires actual order and sale receipts. Numeric tax rates were omitted: `wiki.hypixel.net` returned HTTP 403 even after the approved ISP retry. Current authoritative mechanics and completed-trade evidence remain follow-ups; this change provides supported guidance without claiming either was verified.
- **Action 3 / E1/E5/D1:** `/mod` now has task-specific metadata, a first manual-flip workflow, free/paid boundaries with links to current plans, and a German onboarding answer marked `lang="de"`. Features are sourced from the existing mod component and `app/wiki/docs/premium.md`; no prices or delivery-speed promises were added. Operator follow-up: mirror the concise onboarding on Modrinth. No external posts, submissions or listing changes were made.
- **Action 4 / E8:** `/guides/optimal-minion-setups` replaces unsupported income promises with a setup-cost, fuel, selling-method and storage comparison checklist and a measurement procedure. It does not rank unmeasured setups. Validated minion calculations, costed configurations and a shareable calculator remain a larger follow-up.
- Existing URLs and sitemap entries remain in place; no new guide route or locale routing was introduced. German answers use language-marked content within existing English pages. Competitor calculations and plan comparisons remain unverified, so no competitor rankings were added.
- Baseline caveat: the report above is preserved verbatim. Its linked `ai-visibility-raw.json` was not supplied as a repository file in this change. Preserve the original research artifact alongside it before the next measurement; do not reconstruct raw answers from the summary. Indexing and recommendation changes require a later measurement, not a rerun before these pages are indexed.
