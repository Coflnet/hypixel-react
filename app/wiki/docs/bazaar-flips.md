---
title: "Bazaar Flipping Guide"
description: "How to bazaar flip with SkyCofl on the website and in game using /cofl bazaar"
order: 5
---

# Bazaar Flipping Guide

## Quick answer: how do I bazaar flip?

Open [SkyCofl Bazaar Flips](/bazaar), or run **`/cofl bazaar`** in Minecraft with the SkyCofl mod. `/cofl bz`, `/cl bazaar`, and `/cl bz` are shorter aliases.

For a normal order flip:

1. Pick a liquid item with enough profit after fees.
2. Place a competitive **buy order**.
3. Wait for it to fill and claim the items.
4. Place a competitive **sell offer**.
5. Claim the coins after it fills.

SkyCofl ranks current opportunities, estimates profit per hour and fees, and warns about likely manipulated items.

## What Bazaar flipping means

The Hypixel SkyBlock Bazaar has buy orders and sell offers:

- A **buy order** waits for another player to sell items into your order.
- A **sell offer** waits for another player to buy the items you listed.
- **Instant buy** and **instant sell** trade against existing orders immediately, usually sacrificing the spread for speed.

A spread flip normally buys with a buy order and exits with a sell offer. The difference between those prices is the gross spread. Your actual net profit also depends on fees, order priority, filled quantity, and market movement.

## Finding Bazaar flips on the website

Open [sky.coflnet.com/bazaar](/bazaar). The free Bazaar Flips page uses the live spread plus market activity to present candidates. Each result can show:

- **Buy-order price:** the approximate price at which you would place the entry order.
- **Sell-order price:** the approximate exit price.
- **Median:** recent market context for checking whether the current price is unusual.
- **Profit per hour:** estimated time-adjusted profit under the model's assumptions.
- **Sells per hour:** an easier-to-read liquidity estimate derived from volume.
- **Manipulation warning:** an indication that the current price is unusually far from its normal range.

You can sort by profit per hour, profit, volume, price, or price multiplied by volume. Use item-name and minimum-profit filters to reduce the list.

### Free spread flips versus Premium Bazaar Flips

The free [Bazaar Flips page](/bazaar) is spread based and uses broadly available market statistics. [Premium Bazaar Flips](/premiumBazaar) uses more detailed real-time demand and order-book analysis.

Use the free page to learn the workflow and scan stable, liquid markets. Demand-based results are more useful when fill speed, order-book pressure, and fast market changes matter.

## Finding Bazaar flips in the mod

Install and connect the [SkyCofl mod](/mod), join Hypixel SkyBlock, and run:

```text
/cofl bazaar
```

The Bazaar command is also registered with the `bz` alias:

```text
/cofl bz
```

The list is profile aware. It uses your known purse for the default results, hides likely manipulated items when that visibility setting is enabled, estimates fees using the free Bazaar community-upgrade rate, and marks the leading free results that require Starter Premium.

Each result links directly to Hypixel's `/bz <item>` search. Hover it to see the estimated entry and exit prices, fees, average sales, manipulation warning, and other context.

### Searching and paging

The Bazaar command uses the normal SkyCofl list behavior:

- **`/cofl bazaar`** — show the top affordable current flips.
- **`/cofl bazaar 2`** — show page 2.
- **`/cofl bazaar <item name>`** — search for an item. Searching permits a larger comparison purse so matching results are not hidden merely by the normal affordable-results limit.
- **`/cofl bazaar help`** — show list syntax.

### Bazaar profit history

The mod can track completed Bazaar flips across verified Minecraft accounts:

- **`/cofl bazaar history`** or **`/cofl bz h`** — summarize recent Bazaar profit.
- **`/cofl bz history 30`** — summarize the last 30 days.
- **`/cofl bz history <account> <days>`** — restrict the summary to one verified account.
- **`/cofl bz list`** or **`/cofl bz l`** — list recent completed flips.
- **`/cofl bz list <account> <days>`** — list completed flips for one verified account and time window.

The default history window is seven days and can be fractional; for example, `0.5` means twelve hours. A flip is only complete after the relevant orders are filled and claimed, so outstanding value can remain separate from realized profit.

### `/cofl getbazaarflips` is different

`/cofl getbazaarflips` controls the continuous Bazaar finder used by compatible auction-flipper setups. On current AFv3 setups, enabled Bazaar recommendations are distributed automatically. The command now mainly confirms that the Bazaar finder is enabled or offers a clickable setting change when it is disabled.

Use **`/cofl bazaar`** when you want the on-demand ranked Bazaar list. Use the Bazaar finder setting when you want compatible recommendations delivered continuously.

## A detailed first-flip walkthrough

1. Open `/bazaar` or run `/cofl bazaar`.
2. Prefer an item with meaningful hourly sales and a stable recent price.
3. Reject suspiciously large margins with thin volume or a manipulation warning.
4. Decide how much to allocate. Start small and do not commit the entire purse.
5. Click the in-game result or open the item in the Bazaar.
6. Inspect the first several buy and sell orders, not just the top number.
7. Place a competitive buy order near the displayed entry price.
8. Watch the order. If it does not fill, reassess instead of repeatedly chasing the price.
9. Claim filled items.
10. Inspect the market again because the exit can change while the buy order fills.
11. Place a competitive sell offer near the displayed exit price.
12. Claim the coins when sold.
13. Compare realized profit with the estimate, including all fees and partially filled orders.

## How to choose a good Bazaar item

A good candidate usually has:

- Enough spread to remain profitable after fees and small price changes.
- Consistent volume on both sides of the market.
- Multiple orders near the top price rather than one fragile wall.
- A stable recent median and no obvious manipulation spike.
- A position size small enough to exit without overwhelming normal demand.

A huge percentage margin is not automatically good. Low-volume items can show attractive spreads precisely because few players trade them.

## Fees and net profit

Always judge **net** profit. The mod's list includes its estimated Bazaar fee rather than presenting the entire spread as spendable profit. Your actual result can still differ when:

- Your fee rate differs from the assumption.
- You move or cancel orders.
- Only part of an order fills.
- Another player outbids or undercuts you.
- The spread changes before the exit order fills.
- You use an instant transaction instead of an order.

Keep a margin buffer. A flip that is profitable only at the exact displayed prices is fragile.

## Manipulation and market risk

SkyCofl compares current prices with its long Bazaar history. A price far above its normal range can be marked as likely manipulated. The warning is not proof: updates and genuine demand spikes can also move a market.

When an item is flagged:

1. Check the recent price graph and median.
2. Inspect order depth.
3. Look for a plausible game update or event.
4. Reduce the position or skip it when the move cannot be explained.

You can hide likely manipulated items in the mod with the `hideManipulated` visibility setting.

## Common Bazaar-flipping mistakes

- Reversing the workflow by instant-buying and instant-selling.
- Reading gross spread as guaranteed net profit.
- Choosing the largest margin without checking volume.
- Spending the whole purse on one item.
- Constantly outbidding by large amounts and destroying the margin.
- Holding after the market changes because an old estimate looked profitable.
- Forgetting to claim filled orders, so tracked profit remains outstanding.
- Confusing `/cofl bazaar` with the continuous `/cofl getbazaarflips` finder.

## Troubleshooting

### `/cofl bazaar` returns no useful matches

Try a page number or item search, check your purse update, and confirm that `hideManipulated` is not removing the market you expected. The normal list prioritizes flips affordable with the purse known to the mod.

### A displayed result no longer has the same profit

Bazaar prices and order priority change continuously. The list is a discovery tool, not a locked quote. Recheck both sides immediately before every order.

### Profit history is empty

Confirm the Minecraft account is verified, the mod observed the Bazaar orders, and both sides were filled and claimed within the selected time window.

### I need every command and setting

See the [complete mod command reference](/wiki/mod-commands) and [settings reference](/wiki/settings), or run `/cofl help` in game.

## Related pages

- [Live Bazaar Flips](/bazaar)
- [Premium Bazaar Flips](/premiumBazaar)
- [What is Bazaar Flipping?](/guides/what-is-bazaar-flipping)
- [How to Make Money with Bazaar Flipping](/guides/how-to-make-money-with-bazaar-flipping)
- [Complete mod command reference](/wiki/mod-commands)
- [All feature guides](/wiki/feature-guides)
