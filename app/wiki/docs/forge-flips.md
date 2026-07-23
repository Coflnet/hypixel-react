---
title: "Forge Flips Guide"
description: "How to find and complete SkyCofl forge flips on the website and in game with /cofl forge"
order: 5
---

# Forge Flips Guide

## Quick answer: where do I find forge flips?

There are two ways to open SkyCofl Forge Flips:

- **On the website:** open [sky.coflnet.com/forge](/forge).
- **In Minecraft with the SkyCofl mod:** run **`/cofl forge`**. The shorter `/cl forge` prefix works too.

The website shows the complete live list. The in-game command personalizes the results for your account, including your purse, Heart of the Mountain progress, unlocked recipes, and Quick Forge level.

## What is a forge flip?

A forge flip uses a slot in **The Forge** to turn purchased materials into a more valuable output. Unlike a Bazaar spread flip, the profit is partly payment for locking coins and a forge slot for a fixed duration.

A basic forge flip has four stages:

1. Buy or gather the required ingredients.
2. Start the recipe in The Forge.
3. Wait for the forge timer to finish.
4. Claim and sell the output on the Bazaar or Auction House.

SkyCofl compares the current ingredient cost with the estimated output value. It also divides the estimated profit by the effective forge duration so recipes with very different timers can be compared.

## Using the Forge Flips website

Open [Forge Flips](/forge). Each result can include:

- **Profit per hour:** estimated net profit divided by the effective forge time.
- **Craft profit:** estimated output value minus the displayed material cost.
- **Median sell price:** the market value used for the output estimate.
- **Craft cost:** the estimated price of all required inputs.
- **Volume:** recent sales activity for the output. Higher volume normally means an easier exit.
- **Duration:** the recipe's effective completion time.
- **Required HotM level:** the Heart of the Mountain level needed to use the recipe.
- **Requirements and ingredients:** unlock conditions and the materials needed to start it.

You can sort by profit per hour, duration, required HotM level, total median profit, or volume. Use the minimum-profit and name filters to narrow the list to recipes that fit your budget and unlocks.

### Choosing a website result

Do not choose a recipe from profit alone. Check all of the following:

1. **You can start it.** Confirm the HotM level, collection, recipe, area, and other unlock requirements.
2. **You can afford it comfortably.** Keep enough purse outside the craft for other activity and price changes.
3. **Its output sells.** A high theoretical profit is less useful when volume is low.
4. **The price looks stable.** Long forge timers expose you to more price movement.
5. **It uses your slot well.** Compare profit per hour when deciding between recipes of different lengths.

The displayed prices are estimates, not guaranteed fills. Recheck ingredient and output prices immediately before buying.

## Using forge flips in the SkyCofl mod

Install and connect the [SkyCofl mod](/mod), join Hypixel SkyBlock, and run:

```text
/cofl forge
```

You can also use:

```text
/cl forge
```

The in-game list shows up to five recipes per page. A row contains the output, purchase cost, estimated sale value, estimated profit, profit per hour, volume, and effective duration. Hover the result to see its required ingredients and their estimated costs.

The mod obtains profile-aware forge flips from `ForgeCommand` and `ForgeFlipService` in SkyModCommands. It filters out recipes that cost more than the purse known for your session. The service also accounts for profile requirements and adjusts the effective duration for your Quick Forge level.

### In-game arguments

The Forge command uses the standard SkyCofl list syntax:

```text
/cofl forge [sort] [search-or-page]
```

Useful forms include:

- **`/cofl forge`** — show the first page, normally ordered for strong time-adjusted profit.
- **`/cofl forge 2`** — open page 2.
- **`/cofl forge <item name>`** — search the available result IDs for an item.
- **`/cofl forge profit`** — sort by estimated total craft profit rather than profit per hour.
- **`/cofl forge help`** — display the supported syntax and sort choices.

Page links in chat are clickable. If the command reports that no forge flips are available, verify your unlocks and purse, wait for profile data to update, and try again.

## Completing a forge flip safely

1. Open the website or run `/cofl forge`.
2. Pick a result you have unlocked and can afford.
3. Hover or expand it and write down every ingredient and quantity.
4. Recheck the live Bazaar or Auction House cost of each ingredient.
5. Recheck the output market and recent volume.
6. Buy the materials without exhausting your entire purse.
7. Travel to The Forge, choose an empty slot, and start the correct recipe.
8. When the timer finishes, claim the exact output.
9. Check the market again before listing. Use a realistic price supported by current orders or comparable auctions.
10. Record the actual purchase cost, tax, sale value, and time so you can compare the result with the estimate.

## Profit calculation and fees

The in-game Forge command estimates sale proceeds after a two-percent deduction and subtracts the craft cost. The website exposes its current API estimates. Actual profit can differ because:

- Bazaar orders or Auction House listings move while the forge is running.
- An ingredient fills at a different price than the estimate.
- The output is undercut before it sells.
- Taxes, listing choices, or profile-specific discounts differ.
- A low-volume output takes longer to sell than expected.

Use the estimate to rank opportunities, then make the final decision from current market data.

## Profit per hour versus total profit

**Profit per hour** is best when forge slots are the limiting resource. A shorter recipe can be repeated and may earn more over a day even if each craft has a smaller margin.

**Total profit** is useful when you cannot return frequently. A longer craft can earn more per login even if it uses the slot less efficiently.

Choose based on how often you can claim and restart The Forge:

- Active players can prioritize profit per hour and short timers.
- Players who log in once or twice a day can match recipes to their next login.
- Overnight or multi-day recipes should have enough margin to compensate for extra market exposure.

## Common forge-flipping mistakes

- Sorting only by total profit and ignoring how long the slot is occupied.
- Buying materials before confirming the recipe is unlocked.
- Treating the median output price as a guaranteed instant sale.
- Ignoring low volume or a thin order book.
- Spending the entire purse on one long recipe.
- Forgetting to claim completed crafts, leaving slots idle.
- Using an outdated screenshot or old price instead of the live result.

## Troubleshooting

### `/cofl forge` shows no results

Check that the mod is connected, your profile and purse have updated, and you have unlocked The Forge and relevant recipes. Results that exceed your known purse are intentionally removed.

### The duration differs from another calculator

SkyCofl adjusts the effective time for the profile's Quick Forge level. Confirm that the mod has current profile data and compare effective time rather than only the recipe's base time.

### The estimated profit changed

Forge inputs and outputs trade on live markets. A change in the cheapest ingredients, Bazaar orders, comparable auctions, or sales volume can change the recommendation at any time.

### I need all mod commands

See the [complete SkyCofl mod command reference](/wiki/mod-commands), or run `/cofl help` in game.

## Related pages

- [Forge Flips live website](/forge)
- [Craft Flips](/crafts)
- [Top Movers](/topMovers)
- [SkyCofl mod guide](/wiki/mod)
- [Complete mod command reference](/wiki/mod-commands)
- [All feature guides](/wiki/feature-guides)
