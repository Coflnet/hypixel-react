# SkyCofl growth research — 28 October 2026

## Evidence and limits

- Parallel research covered Bazaar/crafting and auction/mod audiences. Brave supplied search snippets; Google returned an access-help shell, Bing broad mismatches, and YouTube/TikTok no usable recommendations. Reddit/Hypixel threads returned 403; DuckDuckGo presented a challenge; subsequent Brave requests hit 429. No AI-assistant recommendation or private Discord conversation was visible. **No verified Google positions, search volumes, backlinks or social reach.** Priorities are hypotheses, not traffic forecasts.
- Observed pages below explain competitive strengths and gaps; they do **not** establish why Google ranks a page. Validate discovery assumptions before substantial production.
- Additional unavailable sources: `curseforge.com` returned 403; `skyblock.ink` returned a proxy tunnel 502. Neither informs recommendations.

## Product truth and audiences

Repository sources: [tool descriptions](../components/Seo/toolLandingSeoContent.ts), [item history route](../app/item/%5Btag%5D/page.tsx), [mod details](../components/ModDetails/ModDetails.tsx), [tracking guide](../app/guides/tracking-profits-automatically/page.tsx).

| Pain / audience | Existing answer to promote |
|---|---|
| Beginners cannot tell whether a spread survives fees and slow sales | `/bazaar`, `/flipper`, item histories; volume, taxes and liquidity explanations |
| Dungeon/drop sellers and gear buyers do not know a fair price | Item histories; mod median, lowest BIN and price-paid information |
| Frequent traders lose track of actual earnings | Mod-backed tracking, `/cofl profit`, CSV and tax-aware review |
| Crafters and players with limited playtime need another earning route | `/crafts`, `/forge`, `/npc`, `/kat`, `/bookFlips` |
| Minion owners and farmers need a selling decision, not another flipping tutorial | Existing minion guide plus item/Bazaar price history |
| Mod newcomers distrust downloads or need migration help | `/mod`, source/download links, Rat Checker and existing safety guides |

Do not promote [Bazaar Plan](../app/bazaarPlan/page.tsx): the repository explicitly marks it unlisted/noindex pending manual testing. The repository already has many overlapping flipping guides: refresh existing URLs first.

## Observed competitors and distribution surfaces

Search snapshot (Brave, not Google; snippets rather than opened threads/videos):

- [`Hypixel Skyblock bazaar flipping`](https://search.brave.com/search?q=Hypixel+Skyblock+bazaar+flipping): Bazaar Meta appeared before SkyCofl; Reddit questions included “How tf do you bazaar flip” and “how do i learn”; recent video results promised working flips. Intent spans immediate tools and beginner instruction. Pair a live tool with a reproducible walkthrough.
- [`Hypixel Skyblock NPC Flipping`](https://search.brave.com/search?q=Hypixel+Skyblock+NPC+Flipping): Fandom tutorial, SkyHelper forum tool, Reddit questions and guide videos appeared. Step-by-step teaching plus tool access is the format to match; explain limits and execution instead of promising guaranteed income.
- [`Hypixel Skyblock forge profit calculator`](https://search.brave.com/search?q=Hypixel+Skyblock+forge+profit+calculator): HyMinions, SkyCofl, Reddit and an older forum calculator appeared. Refresh `/forge` with **“Forge Profit: Coins per Slot-Hour and Time to Sell”**: requirements → ingredient costs → duration → exit liquidity. Medium qualitative difficulty; focused calculator intent and limited-playtime audience.

| Source | Observed advantage; actionable gap |
|---|---|
| [Bazaar Meta](https://skyblock.bz/) | Live tables, crafts/NPC routes, stability positioning and a no-account preview match immediate decision intent. Its explanatory copy also promises guaranteed resale profit. Differentiate with a documented **losing** example, fill uncertainty and realized proceeds; freshness alone is insufficient. |
| [Skyblock Tools](https://skyblocktools.dev/) | Competition calculator, craft calculator spanning AH/Bazaar, and skill/farming tools capture adjacent progression intent. Enter through “sell drops or craft?” decisions; another generic margin table adds little. |
| [HyMinions](https://hyminions.herokuapp.com/minions) | Offline-time, tax, sell-method and NPC-only controls answer specific constraints; price timestamp is visible. Match that specificity in a minion-output selling walkthrough, linking actual item histories. |
| [SkyCrypt](https://sky.shiiyu.moe/) | Shareable profiles, open-source positioning and a Discord link provide a relevant adjacent audience. Propose an optional price-history link for profile equipment; no partnership or demand is established. |
| [SkyCofl on Modrinth](https://modrinth.com/mod/skycofl) | Listing exposes source links, supported loaders, recent update, pricing and tracking features. Improve task-led onboarding here before seeking generic launch-directory traffic. |
| [SkyClient](https://skyclient.co/) | Public migration notice points to OneClient; Discord/support links meet installation intent. Repository mod copy still links SkyClient. Verify current compatibility, then propose a migration walkthrough and maintainer collaboration. |

## Search opportunities: exact queries and briefs

Difficulty is qualitative: **H** = broad tool/category competition; **M** = narrower decision; **L–M** = branded query. Opportunity describes audience fit, not traffic estimates.

| Keyword / intent | Difficulty; opportunity | Exact proposed title → destination and outline |
|---|---|---|
| `hypixel skyblock bazaar flipping` / choose a method | H; broad, costly | **Bazaar Flipping: Calculate Profit After Tax and Failed Fills** → refresh `/guides/how-to-make-money-with-bazaar-flipping`; timestamped order → fee math → unfilled/loss case → live `/bazaar`. Answers Bazaar Meta's certainty gap. |
| `hypixel skyblock auction price checker` / value gear or drops | M; high task fit | **Lowest BIN vs Median: What Is My SkyBlock Item Worth?** → refresh `/guides/how-to-flip`; comparable upgrades → asking versus sold prices → history → mod tooltip. Uses existing item/mod data rather than generic earning advice. |
| `hypixel skyblock profit tracker` / audit earnings | M; strong activation fit | **Track SkyBlock Profit: /cofl profit, Taxes and CSV** → refresh `/guides/tracking-profits-automatically`; install → one completed trade → reconcile CSV → explain missing/unrealized results. Modrinth already advertises tracking. |
| `hypixel skyblock craft flip calculator` / choose a craft | H; strong tool intent | **Craft Flips: Ingredient Cost, Requirements and Exit Liquidity** → strengthen `/crafts`; priced ingredients → unlocks → fees → sell volume → shareable craft state. Competes with Skyblock Tools on explanation, not table presence. |
| `skyblock minion sell to npc or bazaar` / sell output | M; adjacent audience | **Minion Output: Sell to NPC or Bazaar?** → refresh `/guides/optimal-minion-setups`; collection interval → sale method → dated net comparison → item history. HyMinions' controls demonstrate the decision dimensions. |
| `skycofl mod safe` / verify installation | L–M; smaller, high intent | **Install SkyCofl Safely: Official Downloads and Manual Actions** → refresh `/guides/safe-tracker-tools`; official source → verified version/loader → permissions → Rat Checker limitations. Avoid “safest” or guaranteed-safety claims; reconcile version guidance with Modrinth. |

## Data, distribution and measurement

- For every published worked example, use `skyprice now`, `trend` and, for crafts, `recipe`; include item link and observation date. Attribute price-move explanations to dated `skyprice changes` evidence. Separate estimated profit from completed-sale profit; do not recycle competitors' numbers.
- Reuse `/topMovers` for a weekly **“What Changed in SkyBlock Prices—and What the Patch Actually Changed”** card: one item chart, dated obtaining/recipe change, alternative explanations and item-history link. Pitch it to guild Discord moderators; this tests demand for explanation beyond competitors' live tables.
- Pilot richer **existing** `/item/<TAG>` pages before generating new routes: dated market summary, comparable sales, liquidity caveats and related recipes. Show uncertainty for sparse data. Link from relevant guides; verify server-rendered answers, canonical URLs and sitemap coverage. Clear definitions and cited tables also make answers extractable by assistants, but no AI citation benefit was observed.
- For creator outreach, first identify three active channels from accessible, recent AH/Bazaar videos; propose a recorded losing-versus-winning trade audit using the creator's own data. No creator shortlist is justified by the unavailable video results.
- Measure first useful actions—item lookup, craft inspection, mod-download click—and returning users by tagged channel. Establish a baseline, then compare cohorts after four weeks; do not optimize on impressions alone. Use Search Console query/page data to test overlap among existing guides before consolidation.

## Top 10 actions — expected qualified users per effort

Ordinal priorities, not forecasts; effort estimates assume one owner and existing data access. Re-rank after the first measurement cycle.

1. **Refresh Modrinth onboarding** (half-day): lead with “price a drop / audit profit”; link the official install and tracking guides. Existing listing is the shortest observed discovery-to-install path.
2. **Refresh the profit-tracking guide** (one day): execute the brief above, with a completed trade/CSV reconciliation; link from `/mod`.
3. **Publish a YouTube Short + TikTok pilot** (one day): “Your listed profit is not your realized profit”; show buy → sell → `/cofl profit`. Link the tracking guide; distribution remains unvalidated.
4. **Refresh Bazaar guide + losing example** (two days): demonstrate a wide spread failing after fees or delayed filling; end at `/bazaar`.
5. **Answer community questions** (half-day weekly): in r/HypixelSkyblock and Hypixel SkyBlock Community Help, find current price-check/tax questions, answer fully, disclose affiliation and link only where permitted. Brave surfaced beginner questions; full threads and posting rules still need inspection.
6. **Pilot five enriched item pages** (three days): select items from actual search impressions/support demand; implement the dated comparison/history brief before scaling.
7. **Run creator trade audits** (two days outreach): validate three channels, offer the audit above, use tagged item/guide links; pay for demonstrated qualified engagement, not promised views.
8. **Publish the minion-output walkthrough** (two days): refresh the existing guide; offer a concise NPC-versus-Bazaar example to relevant guild Discord moderators for an approved help post.
9. **Validate OneClient collaboration** (two days): ask maintainers about supported installation; propose “Check a drop's price after migrating to OneClient” for their public Discord support resources.
10. **Prototype one partner link/widget** (three–five days): pitch SkyCrypt maintainers an opt-in equipment price-history link, then a timestamped card if useful. Test one integration before building an embed platform or pursuing generic launch sites.
