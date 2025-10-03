---
title: "Mod commands reference"
description: "Comprehensive list of SkyCofl mod commands with options and usage details"
order: 10
---

# Command Reference

This guide groups all public commands so you always know which slash commands are visible in the in-game help menu. Each entry lists aliases, argument syntax, account tier requirements, and the most important tips for Hypixel SkyBlock bazaar flipping, trading, configuration management, and QoL automation.  
By the time you read this there may be new commands available, the tab-auto complete in game will update automatically as we add new commands.

## Quick tips

- Every command works with `/cofl <command>` and the short `/cl <command>` alias.

- `ListCommand`-based tools share a standard toolkit: `add`, `addall`, `edit`, `remove`, `list`, and `help`.

- `ReadOnlyListCommand`-based tools support paging (`/cofl <cmd> 2`), free-text search (`/cofl <cmd> term`), and optional sort keys documented per command.

- Account tier gates are enforced server-side. This reference repeats them so you can plan upgrades.

- Hover text inside the mod UI often shows extra tooltips—clickable links are noted below when relevant.



## Flipping Commands

### AhFlipsCommand

- **Primary syntax:** `/cofl ahflips` (also `/cl ahflips`)

- **Summary:** Shows not yet sold auction house flips

- **In-game blurb:** Flips might still be unavailable due to update lag, just try the next one This command eases the compatitive  nature of ah flipping

- **Account requirements:** Requires at least **Premium**—the command calls `RequirePremium()` and exits politely if you are on the free tier.

- **Arguments & options:**
	- Optional `[search|page]` parameter like every `ReadOnlyListCommand`. Supply a search term (e.g., an item name) or a page number to paginate eight results at a time.
	- Automatically filters out flips the tracker knows already sold; expect fresher opportunities than raw API dumps.
	- Displays clickable `/viewauction <uuid>` shortcuts so you can jump into Hypixel instantly.

- **Note:** Pair this command with tight blacklists/whitelists—your landing page can pitch “unsold flip leads” as a Premium feature using these curated alerts.



### BazaarCommand (alias `bz`)

- **Primary syntax:** `/cofl bazaar` (also `/cl bazaar`)

- **Summary:** A list of the top bazaar flips

- **In-game blurb:** Allows you to see the most profitable bazaar flips currently available It assumes that you make buy and sellers and includes the Â§b1.25% bazaar fee from the free bazaar community upgrade

- **Account requirements:** Open to every user. Free-tier players can view the list, but the first two entries are watermarked as Premium-only if you have no subscription active.

- **Arguments & options:**
	- Optional `[search|page]` input lets you filter by item tag or go straight to another page of results.
	- The command auto-hides “manipulated” items if you toggled `HideManipulated` in settings; it strikes those entries when visibility is forced.
	- Each row exposes `/bz <query>` so you can open Hypixel’s bazaar instantly, plus hover notes covering profit/hour, fees, and hourly volume.

- **Note:** Highlight that the algorithm already subtracts the 1.25% bazaar tax and respects purse size—perfect for long-tail keywords like “best Hypixel bazaar flips per hour Coflnet.”



### BlacklistCommand (alias `bl`)

- **Primary syntax:** `/cofl blacklist` (also `/cl blacklist`)

- **Summary:** No description in attributes

- **Account requirements:** Requires you to be logged in so the server can edit your persisted flip settings.

- **Arguments & options:**
	- `/cl bl add <item> [filter=value ...]` – searches the item API and lets you confirm via clickable chat buttons. Works with filters like `Seller=IGN`, `Enchantment=Sharpness`, or ranges `EnchantLvl=1-5`.
	- `/cl bl addall <search>` – adds every search match in one go when bulk banning modifiers.
	- `/cl bl list <search>` – prints your current rules with enable/disable toggles.
	- `/cl bl rm <id>` – remove a single entry or wipe the list with (easier to click on elements from `search`).
	- `/cl bl edit <id>|enable|disable|remove` – quick inline toggles for existing filters.
	- Special filter helpers: `duration=12h` or `5d` auto-convert to a timed `removeAfter` tag; `tag=` / `tags=` assign custom labels for organization.

- **Note:** Because filters compile to in-game expressions instantly, promote this command as the mod’s “anti-trash firewall”—great keyword fodder for “Coflnet blacklist syntax” tutorials.



### BuyspeedboardCommand (alias `bsb`)

- **Primary syntax:** `/cofl buyspeedboard` (also `/cl buyspeedboard`)

- **Summary:** Fastest buying players

- **In-game blurb:** Ranked by milliseconds after grace period resets weekly you can opt out of showing up with Â§b/cl buyspeedboard disable

- **Account requirements:** You must have a verified Minecraft account connected to Coflnet; otherwise the command throws a `forbidden` error. Premium isn’t required to view the board.

- **Arguments & options:**
	- `[page]` – paginates the weekly leaderboard; omit for the first page.
	- `disable` / `enable` – opt yourself out of (or back into) appearing on the board. The command persists the flag via `disable-buy-speed-board` setting.
	- Invalid arguments trigger a usage reminder, so stick to page numbers or the reserved keywords above.

- **Note:** Ideal for “fastest flippers” bragging rights content—embed the opt-out tip so privacy-conscious readers trust your guide.



### BzMoveCommand

- **Primary syntax:** `/cofl bzmove` (also `/cl bzmove`)

- **Summary:** Lists the top bazaar movers in the last 24 hours

- **In-game blurb:** Sorts by biggest price increase by default You can use /cofl bzmove asc to sort by biggest drop You can also search for items by name or id Use /cofl bzmove help to see usage

- **Account requirements:** Works for any logged-in user; no premium tier required.

- **Arguments & options:**
	- Optional `[asc]` sort key flips the list to show biggest price drops. Default ordering shows the strongest 24h gains.
	- Append `buy` or `sell` to focus on movement driven by buy- or sell-order pressure (`GetMovementAsync(24, val.Contains("buy"))`).
	- Free-text search narrows to specific item tags/names; combine with sorting for “/cofl bzmove asc shark fin”.
	- Hover text reveals weekly volume; low-volume items are greyed with strike-through to flag manipulation risk.

- **Note:** Position it as a daily bazaar trend scanner. Keywords like “24h Hypixel bazaar movers” and “Coflnet bzmove asc” convert well.



### CheapAttribCommand (alias `ca`)

- **Primary syntax:** `/cofl cheapattrib` (also `/cl cheapattrib`)

- **Summary:** Shows you the cheapest attributes to upgrade or unlock

- **Account requirements:** Pulls your personal attribute unlock data, so make sure your account is verified and has synced SkyBlock stats. No paid tier required.

- **Arguments & options:**
	- Optional filters: `unlock` to show only attributes you haven’t unlocked; `upgrade` to surface shards for levelling existing attributes.
	- Any additional search string (e.g., `/cl cheapattrib mana`) narrows to matching attribute names.
	- Each entry links to the bazaar (`/bz <shard>`) and marks whether it’s for unlocking or upgrading.

- **Note:** Because the command cross-references your profile via `PlayerStateApi`, it’s fantastic for personalized “cheapest attribute shards right now” blog content.



### FlipCommand

- **Primary syntax:** `/cofl flip` (also `/cl flip`)

- **Summary:** Toggles flipping on or off

 - **In-game blurb:** Usage: /cl flip &lt;never|always&gt;

- **Account requirements:** Available to all users with a saved flip configuration.

- **Arguments & options:**
	- `never` – permanently disables flip delivery, forces AH-data-only mode, and stops auto-start on login.
	- `always` – enables flips, toggles auto-start on, and reminds you how to disable autostart via `/cofl set modAutoStartFlipper false`.
	- `off`, `disable`, `false` – temporary off switch without changing stored autostart.
	- No argument – simple toggle that flips the current state.
	- After every change the mod confirms the new status and, for auto-flipper clients, warns that flips remain on until the client stops.

- **Note:** Mention this command in “pause flipping safely” guides—especially for users sharing licenses or troubleshooting filter changes.



### FlipsCommand

- **Primary syntax:** `/cofl flips` (also `/cl flips`)

- **Summary:** No description in attributes

- **Account requirements:** Works for any verified account. Requesting more than 14 days of history requires **Premium Plus**; otherwise the command throws `not_allowed`.

- **Arguments & options:**
	- Syntax: `/flips [sort] [days] [page]`
	- Sort keys: `profit`, `best`, `time`, `recent`, `name`, `price` (defaults to `recent`).
	- `days` defaults to 7 if omitted and can be any integer—subject to the tier limit above.
	- `page` paginates through results. Mix in search text to filter item names before paging.
	- Each entry links to both the buy and sell auction pages with hover breakdowns showing profit modifiers and finder type.

- **Note:** Great anchor for “track your Hypixel flip profit” articles—call out that Premium Plus unlocks 180 days when combined with `/cl profit`.



### LeaderboardCommand (alias `lb`)

- **Primary syntax:** `/cofl leaderboard` (also `/cl leaderboard`)

- **Summary:** Flippers with the most profit

- **In-game blurb:** Most profit in the current week Supports pagination with /cl lb &lt;page&gt;

- **Account requirements:** Viewable by everyone, but you need **Premium Plus** to see the top-ten list. Without it you still receive your personal rank summary.

- **Arguments & options:**
	- `[page]` – optional 1-based page number. Leaving it blank defaults to page 1.
	- Output includes clickable links to each player’s public flip history.
	- Behind the scenes the command refreshes stale leaderboard rows (>1 hour old), so running it regularly keeps the global board up to date.

- **Note:** Anchor community “top flip profit” roundups to this command—encourage readers to upgrade for full access.



### LoserboardCommand

- **Primary syntax:** `/cofl loserboard` (also `/cl loserboard`)

- **Summary:** Flippers with the highest loss

- **In-game blurb:** The flippers who lost the most coins in the last week Supports pagination with /cl lb &lt;page&gt;

- **Account requirements:** Same as the main leaderboard—Premium Plus unlocks the scrolling list, while everyone can still check their personal rank.

- **Arguments & options:**
	- `[page]` – navigate the weekly “biggest loss” board.
	- Entries display losses as negative profit values and link to each player’s flips so you can audit mistakes.

- **Note:** Perfect cautionary content—create “what not to do” guides referencing real leaderboard data each week.



### MayorFlipsCommand

- **Primary syntax:** `/cofl mayorflips` (also `/cl mayorflips`)

- **Summary:** List of price changes based on mayor

- **In-game blurb:** shows you the most likely price changes for when the mayor changes This is based on historical data and can not be guranteed as game updates may distort the data

- **Account requirements:** None beyond a verified session.

- **Arguments & options:**
	- Optional search text filters items by name or tag; otherwise the command shows up to 500 items ordered by highest historical deviation.
	- Hover text reveals the current vs. expected price, plus which mayor term the data references.
	- Clicking opens the item on sky.coflnet.com for deeper analysis.

- **Note:** Use this data in election-prep articles—“next mayor price predictions” is a high-converting keyword cluster.



### PingCommand

- **Primary syntax:** `/cofl ping` (also `/cl ping`)

- **Summary:** Checks your ping to the Coflnet server

- **Account requirements:** Available to all logged-in players.

- **Arguments & options:**
	- Run without arguments to start a timed handshake. The mod sends multiple `/cofl ping <sessionId> <ticks>` packets, averages four round trips, and prints your effective flip latency.
	- If you supply any text accidentally, the command warns you it should be used without arguments.
	- When average ping is high and you’re on the EU region, it suggests switching to US servers (auto-switches for Premium Plus auto flippers when thresholds are met).

- **Note:** Include `/cofl ping` in latency troubleshooting posts—it’s the definitive way to measure actual flip delivery delay.



### ProfitCommand

- **Primary syntax:** `/cofl profit` (also `/cl profit`)

- **Summary:** How much profit you made through flipping

 - **In-game blurb:** Usage: `/cl profit {days}` The default is 7 days Flip tracking includes modifications to items and craft flips

- **Account requirements:** Anyone can check their last 14 days of profit; **Premium Plus** extends the window to 180 days.

- **Arguments & options:**
	- Syntax: `/cofl profit [ign] {days}`
	- `[ign]` (optional) – calculate profit for a specific player you have access to; otherwise the command aggregates every verified account on your license.
	- `{days}` (optional, default `7`) – number of days to analyze, capped according to your tier. Non-numeric input triggers a usage error.
	- Output includes total profit, spend volume, average margin, and the best/worst flips with clickable links. Hover text breaks down contributions by finder type (TFM, Sniper, etc.).

- **Note:** This is the command readers expect in “track Coflnet flip profit” tutorials—mention the Premium Plus upsell for longer retrospectives.



### SetTimezoneCommand

- **Primary syntax:** `/cofl settimezone` (also `/cl settimezone`)

- **Summary:** Set the timezone offset for the current user

- **Account requirements:** Any verified account can set a timezone; the offset is stored in your account profile for consistent scheduling.

- **Arguments & options:**
	- `<offset>` – integer hour offset from UTC (e.g., `-6` for CST, `1` for CET). Non-integers throw an `invalid_arguments` error.
	- After success the command echoes the localized current time using your configured locale (falls back to `en-US`).

- **Note:** Mention it alongside reminder commands—accurate timezone data keeps notification schedules aligned across continents.



### SwitchRegionCommand

- **Primary syntax:** `/cofl switchregion` (also `/cl switchregion`)

- **Summary:** Switches your region

- **In-game blurb:** currently supported: eu, us

- **Account requirements:** Anyone can switch to the EU region. Moving to the US shard requires **Premium Plus**; otherwise you get an upgrade prompt.

- **Arguments & options:**
	- No argument – prints your current region and a clickable toggle to swap.
	- `<region>` – accept `eu` or `us` (case-insensitive). Invalid values return a friendly error.
	- Auto-detects scriptable macro clients that can’t reconnect and warns you instead of breaking the session.
	- US routing picks the best endpoint (`sky-us` or `us-linode`) after verifying reachability.

- **Note:** Pair `/cofl switchregion` with your ping optimization guides—especially when recommending Premium Plus for low-latency US routing.



### TradesCommand

- **Primary syntax:** `/cofl trades` (also `/cl trades`)

- **Summary:** Recorded item movements (WIP)

- **In-game blurb:** Shows you item movements the mod detected Targets recoginizing more kinds of flips Eg. lowballing through trade menu

- **Account requirements:** Requires an account with transaction tracking enabled (automatically true once you’ve verified and traded items recently).

- **Arguments & options:**
	- Runs without arguments. Fetches the past 48 hours of tracked player trades and prints gains/losses with time-since information.
	- Coin transfers appear as `coins` entries; items show as “an item” until attribution improves (the feature is still marked WIP).

- **Note:** Promote this command when teaching lowballers how to audit flips done via direct trades instead of auctions.



### WhitelistCommand (alias `wl`)

- **Primary syntax:** `/cofl whitelist` (also `/cl whitelist`)

- **Summary:** No description in attributes

- **Account requirements:** Same as `BlacklistCommand`—requires logged-in flip settings.

- **Arguments & options:**
	- Identical subcommands to `/cl bl` (`add`, `addall`, `list`, `rm`, `edit`), but entries act as overrides that bypass matching blacklist rules.
	- Suggested use: add high-priority items or sellers you always want to see, even if a broad blacklist would block them.

- **Note:** Market this as the “VIP override” system—great for long-tail phrases like “Coflnet whitelist filters for Hypixel flips.”



## Core Gameplay Commands

### AhTaxCommand (alias `t`)

- **Primary syntax:** `/cofl ahtax` (also `/cl ahtax`)

- **Summary:** Calculates the auction house tax for a given sell amount

- **In-game blurb:** Honors fee changes of Derpy Usage: /cofl ahtax &lt;sellAmount&gt;

- **Account requirements:** Available to every user; no login, verification, or premium tier is required.

- **Arguments & subcommands:**
	- `&lt;sellAmount&gt;` – required. Accepts any number the mod understands (plain integers or shorthand such as `2.5m`, `350k`, `1b`).
	- The command applies the current auction fee table—including Derpy’s discounted rates—and prints the fee percentage plus the exact coin cost.
	- Output is formatted with `/cofl` price formatting so you can copy the result straight into guides or calculator spreadsheets.



### ApiCommand

- **Primary syntax:** `/cofl api` (also `/cl api`)

- **Summary:** Generate an API key for accessing external services

- **Account requirements:** You must be logged in on the official mod (session user ID present) to view or generate keys. Creating a new key additionally needs mod version ≥ 1.7.3, an active profile ID (swap islands once so the mod can read it), and a verified Minecraft account.

- **Arguments & subcommands:**
	- No argument – if you already have an active key, prints the newest ones (up to five) with creation/usage timestamps and copy buttons. If you have none, the command generates one automatically.
	- `generate` / `create` / `new` – always creates a fresh key (expiring after 180 days) once the version and profile ID checks pass.
	- `list` / `show` – lists every active API key tied to your account, including copy actions and last-used timestamps.
	- `help` – opens an in-game help dialog reiterating each subcommand and safety tips.
	- Any other string falls back to `help`.
	- Errors (missing login, profile ID, outdated mod) are surfaced as clickable prompts so you can resolve them.



### BackupCommand

- **Primary syntax:** `/cofl backup` (also `/cl backup`)

- **Summary:** Create a backup of your settings

- **In-game blurb:** to create use /cofl backup add &lt;name&gt; to restore use /cofl restore &lt;name&gt; You can create 3 to 10 backups

- **Account requirements:** Requires you to be logged in so the backup list can be stored in your cloud settings. Free users can keep up to three backups; Starter Premium raises the cap to ten.

- **Arguments & subcommands:**
	- No argument – lists every saved backup with restore and update buttons that copy the name into `/cofl restore <name>` or `/cofl backup add <name>` for you.
	- `add <name>` – snapshots your current flip settings under `<name>`. Re-using an existing name overwrites it after a confirmation message.
	- Backups are validated against the plan limits (3 for free, 10 maximum). Trying to exceed the limit throws a descriptive error so you can delete another entry first.
	- Backup names become the identifiers in `/cofl restore` and can be restored on any device once you log in.



### BalanceCommand

- **Primary syntax:** `/cofl balance` (also `/cl balance`)

- **Summary:** Check how many CoflCoins you have

- **Account requirements:** Requires a logged-in Coflnet account so the Payments API can look up your balance. Any tier works.

- **Arguments & subcommands:**
	- Runs without arguments. Fetches your CoflCoin wallet and prints the total in formatted coins.
	- This is a read-only call—there are no hidden options or extra filters.



### BlockedCommand

- **Primary syntax:** `/cofl blocked` (also `/cl blocked`)

- **Summary:** No description in attributes

- **Account requirements:** You need to be logged in, standing in SkyBlock with flips enabled (not in dungeons or AH-data-only mode). Premium Plus is required only when looking up the history for a specific auction UUID.

- **Arguments & subcommands:**
	- No argument – prints a curated sample of recent blocked flips plus hover text explaining the filter that matched. The command first sanity-checks that you are in SkyBlock, flips are enabled, and your purse/settings allow flips to send.
	- `profit` – shows the top blocked flips sorted by absolute profit.
	- `<search>` – filters the session’s blocked cache by item name, reason text, or finder. Supports the same key/value syntax as `/cofl set` (for example `minProfit=1m volume>=2`).
	- `<uuid>` – if you paste an exact auction UUID and have Premium Plus, the command fetches the stored block reasons from the server and replays the flip so you can inspect it.
	- Any time you lack prerequisites (not in SkyBlock, flips disabled, macro client, etc.) the command returns a targeted prompt instead of a blank list.
	- Every entry includes quick links to view the auction in-game, open it on the website, or jump into the flip options dialog.



### ChatCommand (alias `c`)

- **Primary syntax:** `/cofl chat` (also `/cl chat`)

- **Summary:** Writes a message to the chat

- **In-game blurb:** Alias /fc &lt;msg&gt; Writes a message to the cofl chat Be nice and don't advertise or you may get muted

- **Account requirements:** You must be logged in to send chat messages, and Coflnet now requires a verified Minecraft account before talking in `/fc`. Users without chat enabled will be prompted to toggle it on.

- **Arguments & subcommands:**
	- No argument or `toggle` – flips the in-mod chat toggle on/off and reports the new state. Macro-only clients get a warning instead of reconnecting.
	- `<message>` – sends the message to Coflnet chat (max 150 characters). The command rate-limits you to one message per second, rejects strings starting with `/cofl`, and reminds you to re-run `/cofl chat` if you typed `disable`.
	- If chat is currently disabled in your mod settings, the command automatically toggles it on before delivering the message.
	- Messages inherit your nickname when you are Premium Plus; otherwise your Minecraft name is shown.



### CraftBreakDownCommand

- **Primary syntax:** `/cofl craftbreakdown` (also `/cl craftbreakdown`)

- **Summary:** Shows breakdown of cost for items applied to the main item.

- **In-game blurb:** This command allows you to see the total cost of crafting an item It will show you the total cost and the individual costs of each component This represents the induvidual costs in TotalCraftCost in lore

- **Account requirements:** Works for every logged-in mod user. No premium tier needed—the command uses your cached inventory to build the request.

- **Arguments & subcommands:**
	- Run without arguments to open the interactive selector. Pick an item from your inventory and the command posts a per-component price breakdown plus the summed craft cost.
	- If you previously chose an item slot, re-running the command skips straight to the breakdown.
	- Hovering each ingredient line shows its source (Bazaar, AH price, manual estimate) so you can spot negative/unknown values quickly.
	- Pricing uses the `/cofl` API (Median/Bazaar) at the moment you run the command.



### FactCommand

- **Primary syntax:** `/cofl fact` (also `/cl fact`)

- **Summary:** Gives you a random fact

- **Account requirements:** None—every user can run it.

- **Arguments & subcommands:**
	- No arguments. Picks a random fact from the curated list (some use your current settings, whitelist size, or flip history for flavor) and prints it to chat.
	- There are no hidden toggles; spam it for more trivial facts.



### HelpCommand (alias `h`)

- **Primary syntax:** `/cofl help` (also `/cl help`)

- **Summary:** No description in attributes

- **Account requirements:** Public command—no login required to browse the help pages.

- **Arguments & subcommands:**
	- No argument – opens the topic selector with clickable entries for the most popular help articles.
	- `login` – explains the web login flow, verification, and how to log out again.
	- `verify` – details the auction bid verification process and why it matters.
	- `commands` (alias `c`) – lists every public `/cofl` command, ten per page, with short hover descriptions. Add a page number (e.g. `/cofl help commands 2`) to jump to later pages.
	- Unknown topics fall back to the selector and suggest the closest match.



### LogoutCommand

- **Primary syntax:** `/cofl logout` (also `/cl logout`)

- **Summary:** logout all minecraft accounts

- **In-game blurb:** Security command in case you think someone else has access to your account

- **Account requirements:** You must be logged in; the command clears the session list stored for your user account.

- **Arguments & subcommands:**
	- No arguments. Logs out every Minecraft connection associated with your account (including the current one) by deleting the stored session IDs.
	- Useful if you suspect a compromised session—run it once to invalidate all devices.



### LoreCommand

- **Primary syntax:** `/cofl lore` (also `/cl lore`)

- **Summary:** Change whats appended to item lore

- **In-game blurb:** Displays a chat menu to modify whats put in what line Some options may take longer to load than others

- **Account requirements:** Requires a logged-in account plus the “extend descriptions” privacy toggle enabled. The command caches your lore layout for one minute to reduce API calls.

- **Arguments & subcommands:**
	- No argument – opens the interactive lore editor showing every line, drag controls (`⬆`, `⬇`, `<-`), and available stats to add.
	- `enable` / `true` – turns the lore overlay back on. `disable` / `false` switches it off globally.
	- `add <line> <field>` – inserts a new `DescriptionField` (for example `add 0 LBIN`). Lines are zero-indexed; the command grows the list automatically.
	- `rm <line> <field>` – removes a field. If the line becomes empty it’s deleted.
	- `up|down <line> <field>` – moves a field between lines; `left <line> <field>` moves it to the first slot on the same line.
	- Passing a full JSON export (e.g. copy from another profile) imports and saves the entire layout instantly.
	- If privacy settings block lore edits the command explains how to re-enable the feature before proceeding.



### LowballCommand

- **Primary syntax:** `/cofl lowball` (also `/cl lowball`)

- **Summary:** Offer items to or register as lowballer

- **In-game blurb:** Simplifies lowballing by not requiring you to advertise anymore as a buyer. And allows you to compare multiple offers and be visited by the highest as a seller

- **Account requirements:** You must be logged in; enabling lowballing updates your account settings so offers can reach you. Premium is not required, but macro clients are ignored when matching buyers.

- **Arguments & subcommands:**
	- No argument – opens the inventory picker and shows instructions for enabling lowballing. Clicking an item offers it to registered buyers at one of the suggested prices.
	- `offer <price>` – skip straight to the picker with a pre-filled price. The command suggests high/medium/low presets after it reads price estimates.
	- `on` / `off` – temporarily enable or disable receiving lowball visits for the current session.
	- `always` / `never` – toggle the permanent account flag that auto-enables or blocks lowballers every time you connect.
	- `help` – prints a quick summary of every subcommand.
	- When you confirm an offer, the command pings all eligible lowballers with visit links to your island.



### MuteCommand

- **Primary syntax:** `/cofl mute` (also `/cl mute`)

- **Summary:** Mutes a user

- **In-game blurb:** Muting an user will hide their chat messages from you This does not prevent their auctions from showing up as flips For that use /cl bl add Seller=PlayerName

- **Account requirements:** Requires login because muted players are stored in your account settings and sync to every device.

- **Arguments & subcommands:**
	- No argument – lists everyone you currently have muted with quick buttons to unmute them.
	- `<player>` – resolves the IGN to a UUID and adds it to your mute list (self-mutes are rejected). Messages from the player disappear immediately across chat and DMs.
	- If you are not logged in, the command explains that the mute cannot be stored.



### NickNameCommand (alias `nick`)

- **Primary syntax:** `/cofl nickname` (also `/cl nickname`)

- **Summary:** Set your account nickname

- **In-game blurb:** This will be displayed in chat instead of your minecraft name You can clear it by typing `/cofl nickname clear` Note that if your nickname contains inappropriate words your account may be suspended

- **Account requirements:** Requires login. Setting a nickname (anything other than `clear`) is gated behind Premium Plus and can only be changed once every two days.

- **Arguments & subcommands:**
	- No argument – shows usage information along with a shortcut to clear your nickname.
	- `clear` – removes the custom nickname and restores your Minecraft name.
	- `<nickname>` – validates the string (max 16 characters, alphanumeric + underscore, no spaces). The command also checks for name collisions via Mojang/Redis before saving it.
	- If validation fails or you lack Premium Plus, the command returns a descriptive error and stops.



### OnlineCommand

- **Primary syntax:** `/cofl online` (also `/cl online`)

- **Summary:** Shows the number of players online

- **Account requirements:** None—the command is public.

- **Arguments & subcommands:**
	- Runs without arguments. Prints the live number of connected mod users, how many have clicked a flip in the last three minutes, and (when available) how many players currently hold Pre-API access.
	- Additional context is shown if you already own Pre-API so you can keep track of remaining time.



### PreApiCommand

- **Primary syntax:** `/cofl preapi` (also `/cl preapi`)

- **Summary:** Pre api submenu

- **In-game blurb:** Usage: /cofl preapi &lt;notify|profit&gt;

- **Account requirements:** Public command, but some branches require specific tiers—`notify` and `profit` work for everyone, while status information about your own license depends on whether you currently own Pre-API (Super Premium) or not.

- **Arguments & subcommands:**
	- `notify [threshold]` – registers a notification when the number of active Pre-API users drops below the current count (or a custom integer). Handy for night sniping.
	- `profit` – fetches the last-day Pre-API profit stats (total profit, average per hour, best flip, etc.).
	- `online` – shows how many players currently use Pre-API and offers upgrade buttons if you lack access.
	- No argument – if you have Super Premium it displays your remaining time plus a button to extend. Otherwise it opens an explainer with quick-purchase links and, when the service is saturated, a one-click `notify` shortcut.
	- The command also nudges you to activate your license if your tier owns Pre-API but isn't assigned to the current IGN.



### PurchaseCommand (alias `buy`)

- **Primary syntax:** `/cofl purchase` (also `/cl purchase`)

- **Summary:** No description in attributes

- **Account requirements:** Requires login and enough CoflCoins in your wallet. The command automatically adjusts pricing based on any discounts you own.

- **Arguments & subcommands:**
	- No argument – opens a menu of popular plans (Premium, Premium+, Starter) with 1-click purchase links for different durations.
	- `<productSlug> [count]` – starts a purchase flow for the given plan. Recognizes shorthand like `prem+`/`premium+` and normalizes them. If you add a `count`, the total duration stacks (e.g. `premium_plus 3`).
	- After the initial confirmation, the command sends you a clickable “Yes/No” dialog that includes your connection ID. Clicking **Yes** reruns the command with the generated `connectionId timestamp` signature to complete the transaction safely.
	- Upon success the command refreshes your tier, ensures the correct IGN is the default for the license, and warns about insufficient balance or duplicate references when needed.
	- All errors from the Payments API are surfaced with actionable follow-ups (e.g. quick link to `/cofl topup`).



### ReportCommand

 **Tier requirement:** None (works for every verified user).

- **In-game blurb:** /cofl report &lt;message&gt; When executed returns you a case id. Please use that id to post into the bug report channel on discord. Isses can be fixed very quickly if you include as much information as possible.



### SetCommand (alias `s`)

- **Primary syntax:** `/cofl set` (also `/cl s`)

- **Summary:** Sets a setting

 - **In-game blurb:** Usage: /cl set &lt;setting&gt; &lt;value&gt; Suggests corrections in case you have a typo Use only /cl set to get a list of all settings The default view allows you to change settings by clicking on the options next to them

- **Account requirements:** Requires login to persist changes. The command still works offline, but settings reset when you disconnect.

- **Arguments & subcommands:**
	- No argument – opens the first settings page (10 entries) with clickable toggles and increment/decrement buttons.
	- `&lt;page&gt;` – if the first token is a number, shows that page before applying further edits (`/cofl set 2` or `/cofl set 2 minProfit 5m`).
	- `&lt;setting&gt; &lt;value&gt;` – updates the requested setting. The parser accepts shorthand like `1m`, `true`, or finder masks; typos prompt a correction button using the closest known key.
	- Many numeric settings expose quick `+/-` buttons in the UI that re-run the command with adjusted values.
	- Changing privacy-related keys triggers a state broadcast so other features update instantly.
	- When you flip a setting such as `modTimer`, the command also restarts the relevant timer automatically.



### SetGuiCommand

- **Primary syntax:** `/cofl setgui` (also `/cl setgui`)

- **Summary:** Sets a custom ah gui overlay

- **In-game blurb:** Usage: /cofl setgui &lt;gui&gt;

- **Account requirements:** Intended for the official client; if you run a fork or external loader the command just reminds you that the GUI overlay is client-side.

- **Arguments & subcommands:**
	- Any argument – currently responds with a notice that custom GUI layouts only work on the bundled mod. There are no functional subcommands yet.



### TransactionsCommand

- **Primary syntax:** `/cofl transactions` (also `/cl transactions`)

- **Summary:** Past /cofl buy transactions

- **In-game blurb:** A list of transactions of CoflCoins Allows you to check where they came from and went to

- **Account requirements:** Requires login because it queries your CoflCoin ledger via the Payments API.

- **Arguments & subcommands:**
	- Runs without arguments. Displays your most recent purchases, transfers, refunds, and compensations with contextual hover text and clickable follow-ups.
	- The list automatically summarizes total coins spent vs. earned at the bottom, including how many Pre-API hours you bought.
	- Sorting and pagination are handled by the base list UI—use the built-in navigation buttons the command prints after the first page.



### TransferCoinsCommand

- **Primary syntax:** `/cofl transfercoins` (also `/cl transfercoins`)

- **Summary:** No description in attributes

- **Account requirements:** Must be logged in with sufficient CoflCoin balance. Transfers use the Payments API, so both sender and receiver need Coflnet accounts.

- **Arguments & subcommands:**
	- `<amount> <player>` – moves the specified number of CoflCoins to another user. The amount must be a positive integer; the command rejects non-numeric input and amounts ≤ 0.
	- The recipient is looked up by IGN; behind the scenes the command resolves the user ID and creates a transfer reference (`<ign>-<connId>`).
	- Any API error (insufficient funds, unknown player) is surfaced as a Coflnet error code so you know what to fix.



## State Commands

### AttributeFlipCommand

- **Primary syntax:** `/cofl attributeflip` (also `/cl attributeflip`)

- **Summary:** Lists flips that a modifier can be applied to for profit

- **In-game blurb:** This command is experimental and not all modifiers list correctly. It uses the median sniper flip finder to find price differences between modifiers on the ah

- **Account requirements:** Requires Premium (the command explicitly checks and offers an upgrade link if you do not own it).

- **Arguments & subcommands:**
	- No argument – lists the best attribute/essence upgrade flips your profile can perform, complete with cost breakdowns and volume estimates.
	- `price` / `profit` / `vol` / `volume` / `age` – change the sort order to suit your goal (high sell price, raw profit, daily volume, or newest finds first).
	- Hover each entry to see the ingredients you must apply before selling the upgraded item.
	- The command automatically filters out pet-experience edge cases that would be unrealistic to flip.



### CraftsCommand (alias `craft`)

- **Primary syntax:** `/cofl crafts` (also `/cl craft`)

- **Summary:** Displays craft flips you can do.

- **In-game blurb:** Based on unlocked collectionsAnd slayer level

- **Account requirements:** Requires login so the server can filter crafts by your unlocked collections, slayers, purse size, and purchased tiers. Starter Premium or higher reveals the top entries without obfuscation.

- **Arguments & subcommands:**
	- No argument – shows the best crafts you can complete right now, already filtered to fits-your-purse items. Free users see redacted top-three entries until they upgrade to Starter Premium.
	- `profit` / `cost` / `volume` / `percent` / `median` – change the sort order by desired metric.
	- `bazaar` – limits the list to craft flips that finish on the Bazaar (requires the command to have loaded Bazaar tags once).
	- `craft` – replaces auctions with strictly craftable recommendations, displaying the ingredient recipe (Premium only).
	- Each entry carries a `[Open Recipe]` button that links to `/cofl recipe <itemId>` so you can inspect the exact crafting steps.



### ForgeCommand

- **Primary syntax:** `/cofl forge` (also `/cl forge`)

- **Summary:** Displays forge flips you can do based on hotM level

- **In-game blurb:** Recognizes your quick forge level and adjusts time accordingly

- **Account requirements:** Works for all logged-in users; the flips are tailored to your HotM level, Quick Forge perk, and purse value.

- **Arguments & subcommands:**
	- No argument – shows up to five forge recipes per page, including craft costs, AH sell prices, duration, and estimated coins/hour.
	- `profit` – sorts by profit per hour (the only explicit sorter exposed in code). Other keywords defer to the base list implementation.
	- Hovering each entry shows the ingredient shopping list with Bazaar/AH costs, and the command filters out recipes you cannot afford.



### FusionFlipCommand

- **Primary syntax:** `/cofl fusionflip` (also `/cl fusionflip`)

- **Summary:** Lists flips that can be made with fusionmachine

- **In-game blurb:** Assumes you have top buy order, fuse it and then have top sell order to sell the shard

- **Account requirements:** Public command. Free users see the top entries partially redacted until they upgrade to Starter Premium.

- **Arguments & subcommands:**
	- No argument – lists profitable Fusion Module flips, showing the output shard, input items, per-unit volumes, and direct Bazaar shortcuts.
	- The base list controls provide search and pagination. There are no special keywords beyond what `ReadOnlyListCommand` already supports.
	- Every row includes hover text that calls out the assumed buy/sell order setup (top buy/top sell).



### LicensesCommand (alias `license`)

- **Primary syntax:** `/cofl licenses` (also `/cl licenses`)

- **Summary:** Allows you to manage your account licenses

- **In-game blurb:** Licenses allow you to open multiple connections at once If you have multiple accounts and want to configure which one takes the premium on your email first use /cofl license default &lt;userName&gt;

- **Account requirements:** Requires login and at least one verified Minecraft account tied to your email. Buying or extending licenses obviously spends CoflCoins.

- **Arguments & subcommands:**
	- No argument – shows every license slot you own, the IGN currently assigned, expiry time, and quick buttons to extend or renew.
	- `add <ign>` – opens a tier picker (Premium, Premium+ week/4 weeks/11 weeks). Clicking a tier re-runs the command with a signed confirmation containing your connection ID to finalize the purchase.
	- `add <ign> <tier> <connectionId>` – internal confirmation step triggered when you press the UI button; you normally never type this by hand.
	- `default <ign>` – changes which Minecraft account consumes your personal premium tier by default.
	- `use <id> <ign>` – moves a specific license (by numeric ID or target name) to another IGN.
	- `useconfig &lt;id&gt; &lt;config|backup:name|reset&gt;` – binds a purchased config or backup to the license so it auto-loads when that slot connects.
	- `refresh` – forces a re-sync of expiry times and tiers from the backend.
	- `refund` – if you bought a Premium+ 4-week bundle in the last ten days, triggers a refund workflow.
	- `help` – prints the full usage reference.



### NetworthCommand

- **Primary syntax:** `/cofl networth` (also `/cl networth`)

- **Summary:** Get a breakdown of networth

- **In-game blurb:** Based on current market prices

- **Account requirements:** Works for everyone; the command queries Hypixel profiles directly and doesn’t require you to be logged in.

- **Arguments & subcommands:**
	- `<username>` – required. Looks up the player, fetches their active profile (or the last one used), and prints total networth plus the top categories.
	- `profile=<profileName>` – optional suffix to target a specific profile (as shown on Hypixel). If omitted or the profile can’t be matched, the command falls back to the currently active profile.
	- Results are rate limited—expect ~10 seconds of cooldown after each lookup to stay inside API limits.



### SearchCommand

- **Primary syntax:** `/cofl search` (also `/cl search`)

- **Summary:** No description in attributes

- **Account requirements:** Requires login and an active profile ID (swap islands once if the mod hasn’t captured it yet). The command scans your stored chests, inventory and more.

- **Arguments & subcommands:**
	- No argument – enumerates every item the mod knows about, grouped by container (chests, wardrobes, backpacks, etc.). Click an entry to auto-run the command that opens the container and highlights the slot.
	- Use the built-in search box from `ReadOnlyListCommand` to filter by item name if you’re looking for something specific.
	- If the command hasn’t learned your profile ID yet, it politely asks you to change islands and try again.



## Tasks Commands

### TaskCommand

- **Primary syntax:** `/cofl task` (also `/cl task`)

- **Summary:** Lists tasks that can be done for profit

- **In-game blurb:** Tasks are calculated based on your current progress and try to self adjust based on how many items you managed to collect recently (active tasks) Passive tasks include flips from other commands

- **Account requirements:** Requires login so the task engine can read your player stats, purse, bazaar history, and recent activity.

- **Arguments & subcommands:**
	- No argument – compiles all available profit tasks (Kat upgrades, forge jobs, location grinds, etc.) and sorts them by coins/hour. Each entry includes a clickable shortcut to start or learn more.
	- The base list search lets you filter tasks by name (e.g. “Garden” or “Kat”).
	- After the list prints, the command posts a follow-up reminding you to report incorrect numbers; on old mod versions it suggests an update.



## Utility Commands

### AddReminderTimeCommand

- **Primary syntax:** `/cofl addremindertime` (also `/cl addremindertime`)

- **Summary:** Add time to a reminder

 - **In-game blurb:** Usage: /cl reminder add &lt;reminder&gt; &lt;time&gt;

- **Account requirements:** Requires login so the reminder list can be updated in your account storage.

- **Arguments & subcommands:**
	- `&lt;reminder&gt; &lt;time&gt;` – selects the reminder whose text matches `&lt;reminder&gt;` and pushes its trigger time back by `&lt;time&gt;` (supports formats like `10m`, `1h30m`).
	- Great for extending existing reminders without recreating them; the command confirms the new fire time in chat.



### AdventCommand

- **Primary syntax:** `/cofl advent` (also `/cl advent`)

- **Summary:** Daily advent calendar

- **In-game blurb:** Run to get a trivia question Answer the question to get a reward

- **Account requirements:** Available to logged-in users during the Advent event (the command is disabled outside November/December). Owning the paid Advent Calendar product multiplies your rewards.

- **Arguments & subcommands:**
	- No argument – if today’s question hasn’t been answered yet, prints a multiple-choice trivia prompt with buttons for each answer. Picking the correct one grants 5 CoflCoins (50 if you bought the calendar).
	- Re-running after you answered shows your previous choice and, if necessary, re-issues the reward.
	- During the early days of the event you’ll see an upsell button offering the 10× reward bundle.



### AnankeCommand

- **Primary syntax:** `/cofl ananke` (also `/cl ananke`)

- **Summary:** Lists the top potential flips for

- **In-game blurb:** RNG meter progress granted by Ananke Feathers

- **Account requirements:** Public command; it only needs price data from the clean-price service.

- **Arguments & subcommands:**
	- No argument – ranks Ananke Feather redeemables by coins-per-feather (after deducting unlock costs when known). Each entry links to the web viewer so you can inspect recent sales.
	- Use the list’s built-in search if you want to focus on a specific drop (e.g. “Handle”).
	- The summary line estimates the average feather price assumed in the calculations.



### CheapMuseumCommand (alias `cm`)

- **Primary syntax:** `/cofl cheapmuseum` (also `/cl cheapmuseum`)

- **Summary:** Lists the cheapest items per exp for museum donations

- **In-game blurb:** Honors tierd donations and tries to suggest the biggest exp donation first so you don't double spend. Also respects armor set requirements

- **Account requirements:** Requires login so the command can read your donated items and profile progress. Starter Premium (or higher) unlocks real-time caching and reveals more than the default 100 entries; Premium+ exposes up to 1000.

- **Arguments & subcommands:**
	- No argument – shows the cheapest donations you still need, with direct `/viewauction` links or armor set breakdowns when multiple pieces are required.
	- `craft` – switches to the craft-only list (premium required) and displays the recipe plus ingredient list for each donation.
	- If your profile ID is missing, the command first prompts you to switch islands so it can sync accurately.
	- Hover text explains total exp, coin cost, and whether the recommendation comes from an auction or a craft.



### ConfigsCommand (alias `config`)

- **Primary syntax:** `/cofl configs` (also `/cl configs`)

- **Summary:** A list of the top configs

- **In-game blurb:** Allows you to see the most popular configs You can upvote and downvote configs You can also see stats for each config and buy them if you don't own them yet Note that configs are not required to use the flipper

- **Account requirements:** Requires login; voting and purchasing is restricted to configs you actually own (free or paid).

- **Arguments & subcommands:**
	- No argument – lists the highest-rated configs with inline buttons to upvote, downvote, view stats, or buy.
	- `rating` / `rep` / `price` / `name` / `new` / `newest` / `oldest` / `updated` / `lastupdated` – resort the list by the chosen metric.
	- `+rep <owner> <config>` – upvote a config you own. Automatically removes a previous downvote if you flip sides.
	- `-rep <owner> <config>` – downvote the config (only allowed for legitimately purchased copies).
	- `stats <owner> <config>` – prints usage metrics such as unique users, flips per day, and best flip stats from the last two days.
	- `autoupdate` – toggles whether configs you load auto-update when the author publishes changes.
	- `unload` – stops using the currently loaded marketplace config but keeps your settings intact.
	- `reset` – unloads and restores the default flip settings.
	- `help` – prints a reminder of every subcommand.
	- All confirmation prompts use clickable buttons; you rarely need to type the long forms manually.



### EmojiCommand

- **Primary syntax:** `/cofl emoji` (also `/cl emoji`)

- **Summary:** Lists available emojis for Â§b/fc

- **Account requirements:** None—you can browse the emoji list without logging in.

- **Arguments & subcommands:**
	- No argument – prints every available `/fc` emoji as clickable buttons. Clicking one pastes the emoji token into chat via `/cofl chat`.
	- There are no additional filters; just scroll or use the chat search feature to find the entry you need.



### FiltersCommand

- **Primary syntax:** `/cofl filters` (also `/cl filters`)

- **Summary:** List filters and their options

- **In-game blurb:** Supports pages and search Example: /cl filters sharpness

- **Account requirements:** Public command; it needs to fetch filter metadata from the items API, so expect a brief loading message the first time.

- **Arguments & subcommands:**
	- No argument – enumerates every filter available in CoflNet’s filter engine, including sample values and whether they accept ranges or numeric comparisons.
	- `<search>` – type a keyword such as `sharpness` or `volume` to narrow the list. Pagination buttons let you browse deeper pages.
	- Numeric filters show min/max bounds and note when the syntax supports ranges like `1-10` or `>2`.



### MinionCommand

- **Primary syntax:** `/cofl minion` (also `/cl minion`)

- **Summary:** No description in attributes

- **Account requirements:** Public command; it simply pulls the current bazaar/clean prices and feeds them into the minion calculator.

- **Arguments & subcommands:**
	- No argument – shows the top minions by profit per day, including craft cost estimates. Each entry is informative only; there are no extra buttons.
	- Use the list search if you want to double-check a specific minion (e.g. “Snow”).



### OwnConfigsCommand

- **Primary syntax:** `/cofl ownconfigs` (also `/cl ownconfigs`)

- **Summary:** Lists configs you purchased from /cofl configs

- **In-game blurb:** This command allows you to see the configs you own You can load them with /cl loadconfig &lt;ownerId&gt; &lt;name&gt; or by clicking on the output of the command

- **Account requirements:** Requires login; the list is built from the configs you purchased or claimed on your account.

- **Arguments & subcommands:**
	- No argument – lists every owned config with version, price paid, and a `[Load]` button that re-runs `/cofl loadconfig` for you.
	- `remove <config>` – deletes a free config from your library (paid configs can’t be removed).
	- All other management (buying, gifting, updating) is handled through sibling commands like `/cofl buyconfig`; this command is the read-only library view.



### ReminderCommand

- **Primary syntax:** `/cofl reminder` (also `/cl reminder`)

- **Summary:** Manage your reminders

- **In-game blurb:** Reminders are messages that will be sent to you after a certain time to add use /cofl reminder add 1h30m &lt;message&gt; to remove use /cofl reminder remove &lt;message&gt;

- **Account requirements:** Requires login since reminders are stored in your account settings.

- **Arguments & subcommands:**
	- No argument – lists every reminder with clickable shortcuts to add +5 minutes or +1 hour.
	- `add &lt;time&gt; &lt;message&gt;` – creates a new reminder that fires after `&lt;time&gt;` (supports `1h30m`, `15m`, etc.) with the given message.
	- `remove &lt;message&gt;` – deletes reminders whose text matches `&lt;message&gt;` (same matching rules as the list output).
	- You can also run `/cofl addremindertime` to adjust a reminder by arbitrary durations; the buttons in this command pass the required JSON context for you.



### UnVerifyCommand

- **Primary syntax:** `/cofl unverify` (also `/cl unverify`)

- **Summary:** Allows you to unverify one of your minecraft accounts

- **In-game blurb:** You can only unverify accounts that fufill requirements Eg. blacklisted accounts can't be unverfied Unless you shared an account with someone else there is no reason to unverify an account

- **Account requirements:** You must be logged in and the account you’re trying to remove must currently be linked to your email. Blacklisted accounts or accounts still tied to your email cannot be unverified.

- **Arguments & subcommands:**
	- `<ign>` – attempts to unverify the specified Minecraft account. The command verifies that the IGN belongs to you, checks that none of your linked accounts are blacklisted, and ensures the account has been re-linked to another email with at least seven days of premium remaining before proceeding.
	- Errors (not found, wrong email, insufficient premium, API failure) are displayed as friendly chat dialogs.



### UpdateCurrentConfigCommand

- **Primary syntax:** `/cofl updatecurrentconfig` (also `/cl updatecurrentconfig`)

- **Summary:** Updates the current config to the latest version

- **In-game blurb:** This command applies all changes from the config seller This is done by checking what the seller changed and applying  those changes. This keeps any filter changes you made in tact. You can skip settings by using /cl updateconfig skipSettings=true

- **Account requirements:** Requires login and an active marketplace config loaded via `/cofl loadconfig`. If no config is active, the command exits early.

- **Arguments & subcommands:**
	- No argument – downloads every diff between your current version and the seller’s latest release, applies the changes (without overwriting your manual blacklist/whitelist edits), and bumps the stored version.
	- `skipSettings=true` – applies only list changes (blacklist/whitelist) while leaving scalar settings untouched.
	- After each diff the command prints how many entries were updated and confirms when you are fully up to date.



### VerifyCommand

- **Primary syntax:** `/cofl verify` (also `/cl verify`)

- **Summary:** Helps you verify your minecraft account

- **In-game blurb:** This command checks if your minecraft account is verified. If it is not, it will prompt you to verify it You can also use this command to check if you are verified

- **Account requirements:** Requires you to be logged in so the command can check your verification status and recent purchases.

- **Arguments & subcommands:**
	- No argument – if you are not logged in, the command sends a login prompt. Otherwise it checks whether your IGN has completed the verification bid. Verified players get confirmation plus a reminder about chat access; unverified players receive instructions to complete the process.
	- When verification is missing but your session token is stale, the command restarts `/cofl start` to refresh it automatically.
	- If you’re verified but not eligible to send CoflCoins (e.g. multiple emails) the command explains why and suggests upgrading to Premium Plus to lift the restriction.

## Fairness Commands

### CaptchaCommand

- **Primary syntax:** `/cofl captcha` (also `/cl captcha`)

- **Summary:** Solve a captcha

- **In-game blurb:** You will be asked to solve a captcha if you are afk for too long You can also use this command to get a new captcha Example: /cl captcha another Use /cl captcha vertical to letters below each other Which helps if you have a mod with different font Captchas are necesary to prevent bots from using the flipper

- **Account requirements:** Available to every logged-in player. Captcha data is only stored while your account is verified; otherwise the command tells you to log in.

- **Arguments & options:**
	- `another` – immediately requests a fresh captcha challenge, counting the current attempt as failed (used after a misread).
	- `vertical`, `big`, `optifine`, `short` – switch the captcha font to match your resource pack so characters align correctly.
	- `config` workflows – `/cofl captcha config full|part` opens chooser menus for bold/slim glyphs; `/cofl captcha config set &lt;full|part&gt; &lt;chars&gt;` applies manual overrides when custom fonts break alignment.
	- `debug` – prints diagnostic glyph tables to help the developers replicate rendering issues.
	- Any other token is treated as a captcha answer. Correct answers lower the required solve counter; incorrect ones increment it and requeue a new puzzle.

- **Note:** Solving the captcha resets AFK delay, so mention it in your flipping guides when teaching users how to clear 12s penalties quickly.



### DelayCommand

- **Primary syntax:** `/cofl delay` (also `/cl delay`)

- **Summary:** Shows your current delay

- **In-game blurb:** To allow everyone to get some flips, each user gets delayed when he is found to buy too fast The delay decreases over time and is not fully applied to all flips You can reduce this by buying slower Very high profit flips are excepted from this

- **Account requirements:** Works for all connected users. If you're unverified or using the free tier the response explains your baseline delay and links to upgrades when appropriate.

- **Arguments & options:**
	- No arguments are needed. Each invocation recalculates your current queue delay, macro delay, license modifiers, and fairness penalties, then prints contextual tooltips.
	- The command auto-detects when flips are disabled and offers a clickable `/cofl flip` toggle.
	- If captchas are outstanding it injects a `/cofl captcha` shortcut; if certain settings (e.g., showing seller name) slow down processing, it surfaces `/cofl set` quick actions to disable them.
	- Internal counters add slight randomness after spammy use—wait a few seconds before re-running for identical values.

- **Note:** Mention this command in fairness and macro compliance articles—it's the fastest way to diagnose why flips arrive late and how premium tiers, licenses, or captcha solves influence latency.


## External Commands

### ImportTfmCommand

- **Primary syntax:** `/cofl importtfm` (also `/cl importtfm`)

- **Summary:** Import blacklists from tfm

- **In-game blurb:** Usage: /cofl importtfm &lt;identifier&gt; &lt;userName&gt; where &lt;identifier&gt; is one of user, enchant or item (counter part to /tfm export &lt;identifier&gt;)

- **Account requirements:** Available to all verified accounts. No premium tier needed.

- **Arguments & options:**
	- `<identifier>` – choose `user`, `item`, or `enchant` to mirror the `/tfm export` namespace you're importing from. The command validates the value case-insensitively.
	- `<userName>` – the TFManager profile name that published the blacklist. The server pulls `https://tfm.thom.club/get_blacklist?blacklist_id=<userName>&type=<identifier>` and converts the JSON payload into Coflnet filters.
	- On success the entries are appended to your `/cl bl list` blacklist and immediately saved. Existing entries are left untouched.
	- If the request fails or arguments are missing you'll receive a usage prompt explaining the proper syntax.

- **Note:** Importing an item blacklist will automatically map TFManager rarities, pet level flags (`==MAX`, `==CANDIED`) and seller filters into Coflnet's `ItemTag`, `Rarity`, `PetLevel`, and other metadata so you can start filtering Hypixel auctions instantly.



### ReplayActiveCommand

- **Primary syntax:** `/cofl replayactive` (also `/cl replayactive`)

- **Summary:** Replay all active auctions against your filter

- **In-game blurb:** Useful to recheck auctions that have been listed while you were offline This will take a while to dearchive all active auctions

- **Account requirements:** Requires **Premium Plus** (`AccountTier.PREMIUM_PLUS`) and an active whitelist entry using the USER finder. The command aborts with a clickable upgrade prompt if you don't meet the requirements.

- **Arguments & options:**
	- Runs without arguments. The mod streams every still-active auction from the Hypixel archive and replays it through the USER finder, honouring your current whitelist filters.
	- Progress feedback appears in 10 steps (10% increments). Expect a lengthy run while old auctions are reprocessed.
	- Make sure `/cofl set sniper,user` is enabled—otherwise the command prompts you to toggle the finder before replaying.

- **Note:** Use this after downtime to backfill missed deals; pairing it with tight whitelists ensures only personally curated flips reach your chat.



### ReplayFlips

- **Primary syntax:** `/cofl replayflips` (also `/cl replayflips`)

- **Summary:** Replay all flips from the last x hours

- **In-game blurb:** Meant for config creators to test their config

- **Account requirements:** Requires **Premium Plus** (`socket.ReguirePremPlus()`). Also blocked if your config has `BlockExport` enabled—intended for authors testing their own profiles.

- **Arguments & options:**
	- `[hours={2}]` – optional number of hours (float accepted) to rewind, defaulting to `2`. Maximum window is `48` hours; higher values return an in-game error message.
	- The command streams archived flip events from Kafka in chronological order. Every 40 auctions the system pauses briefly to avoid flood protection, and it clears spam counters to keep your session healthy.
	- If your flipping is disabled or blocked (e.g., `/cofl blocked` issues) the command surfaces a helper message instead of replaying.

- **Note:** Ideal for config sellers—replay a fresh dataset after tweaking filters to confirm the mod still flags the right profit windows.

