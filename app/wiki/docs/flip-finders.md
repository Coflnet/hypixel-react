---
title: "Flip Finders"
description: "Understanding different flip finding algorithms and their strengths"
order: 5
---

# Flip Finders

Flip finders are the algorithms that analyze the Hypixel SkyBlock auction house and identify profitable flips. Different finders use different approaches, each with unique strengths and weaknesses. You can enable multiple finders simultaneously for broader coverage.

## Active Finders

### Flipper (FLIP)
- **Status**: ✅ Active
- **Speed**: Slow
- **Coverage**: Comprehensive

Uses the classical flip finding algorithm with the SkyCofl auction history database. It searches for similar items and analyzes their price history, making it slower but capable of finding more complex flips with specific modifiers.

**Best For**: Finding rare modded items, complex enchantment combination flips, detailed analysis

### Sniper (SNIPE)
- **Status**: ✅ Active
- **Speed**: Very Fast (~300x faster than Flipper)
- **Coverage**: High-volume items

A fast dictionary-based algorithm that groups prices by relevant modifiers. Only shows items that are below both the lowest BIN and median price for their modifier combination. Operates at extreme speed making it competitive for obvious flips.

**Best For**: BIN flips, obvious deals, high-competition items, beginners

### Sniper Median (MSNIPE)
- **Status**: ✅ Active
- **Speed**: Very Fast
- **Coverage**: High-volume items

Similar to Sniper but doesn't require items to be below the lowest BIN price. Instead, it shows items that are approximately 5% below the median sell price. This can catch underpriced items in slower markets.

**Best For**: Less competitive markets, median-based flipping, steady profit opportunities

### User/Whitelist (User)
- **Status**: ✅ Active
- **Speed**: Real-time
- **Coverage**: Custom

Shows all new auctions at their starting bid price without pre-filtering. Completely customizable using whitelist/blacklist rules and filters. You define what makes a profitable flip.

**Best For**: Experienced players, niche markets, custom flip criteria, bypassing automatic filters

### AI
- **Status**: ✅ Active
- **Speed**: Fast
- **Coverage**: Varies, only active on complex items

Machine learning-based algorithm that estimates item values based on historical patterns and market sentiment. Attempts to predict fair pricing without requiring exact references.

**Best For**: Experimental users, items with sparse historical data

### Stonks
- **Status**: ✅ Active (Experimental)
- **Speed**: Fast
- **Coverage**: Varies

An experimental finder that attempts to predict item values without historical references. May occasionally overvalue flips due to it calculating it the craft cost from more commonly sold attributes.

**⚠️ Warning**: Use with caution. Test thoroughly before committing significant coins.

**Best For**: Adventure-seeking flippers, experimental strategies

### CraftCost
- **Status**: ✅ Active
- **Speed**: Fast
- **Coverage**: Craftable items only

Identifies auctions that would be at least 5% more expensive to craft than the asking price. Calculates the sum of base item cost plus modifier component costs. You can adjust weights for each attribute.

**Important Note**: This does not guarantee the item will sell for the target price, only that it's underpriced relative to craft cost.

**Best For**: Crafting enthusiasts, fresh market updates, items with known craft paths

### Bazaar
- **Status**: ✅ Active
- **Speed**: Fast
- **Coverage**: Bazaar items only

Identifies profitable buy order → sell order opportunities in the Bazaar. Different market dynamics than auction house flips.

**Best For**: Bazaar traders, quick turnarounds, stable profit margins, extra flip slots when auction house is full

## Sunset/Deprecated Finders

### TFM (TheFlippingMod)
- **Status**: ⛔ Sunset
- **Previous Description**: Integration with TheFlippingMod for flips discovered through that mod

**Reason for Sunset**: The TFM integration was discontinued and is no longer maintained.

### Rust
- **Status**: ⛔ Sunset
- **Previous Description**: High-speed finder built in Rust, using LBIN checks and sales history for accuracy

**Reason for Sunset**: Third-party service no longer available. The cost and maintenance burden were not justified by usage.

### BinMaster
- **Status**: ⛔ Sunset (Previously removed)
- **Previous Description**: Specialized BIN auction finder

**Reason for Sunset**: Functionality superseded by improved Sniper algorithm.

### NEC (NotEnoughCoins)
- **Status**: ⛔ Sunset
- **Previous Description**: Specialized finder for identifying flips of lower-value items

**Reason for Sunset**: Was slow and has been superseded by the updated Sniper Median finder, which now better accounts for lower-value items.

## Using Multiple Finders

You can enable multiple finders simultaneously to cast a wider net:

```
Flipper + Sniper = Best coverage (slow + fast)
Sniper + Sniper Median = Comprehensive price range
All Active Finders = Maximum coverage
```

## Finder Statistics

| Finder         | Speed      | Selectivity | Default | Customizable      |
|----------------|------------|-------------|---------|-------------------|
| Flipper        | Slow       | High        | Yes     | Limited           |
| Sniper         | Very Fast  | High        | Yes     | Limited           |
| Sniper Median  | Very Fast  | Medium      | Yes     | Limited           |
| User           | Real-time  | Total       | No      | Full              |
| AI             | Fast       | Medium      | No      | Limited           |
| Stonks         | Fast       | Low         | No      | Limited           |
| CraftCost      | Fast       | High        | No      | Yes (weights)     |
| Bazaar         | Fast       | Medium      | No      | Limited           |

## Best Practices

### For Beginners
1. Start with **Sniper** + **Sniper Median** - they are the fastest and most reliable for obvious deals
2. Add **Flipper** for more complex items - slower but catches modded items
4. Monitor your profit ratio - not all flips are created equal

### For Experienced Players
1. Use **User/Whitelist** to exploit niche markets
3. Build your own valuations with **CraftCost** finder plus craft cost weight whitelist filter
4. Try **Bazaar** if auction house margins narrow
5. Experiment with **AI** and **Stonks** for emerging trends

### Finder Selection Strategy
- **High Speed Required**: Sniper, Sniper Median, Bazaar
- **Maximum Coverage**: Flipper + Sniper + Sniper Median
- **Niche Markets**: User/Whitelist + CraftCost
- **Learning/Testing**: AI + Stonks
- **Balanced Approach**: Sniper + Sniper Median (default)

## Troubleshooting

### No Flips from Specific Finder
- Some finders may have fewer results depending on current market conditions
- Try combining with other finders
- Check your filters aren't too restrictive
- Use `/cofl blocked` in the mod to see filtering reasons

### Duplicate Flips from Multiple Finders
- This is normal and expected
- Indicates an item multiple finders detected as profitable
- Often a stronger signal of actual profit
- Filter out duplicates in the mod settings if desired

### Finder Not Appearing in Settings
- Sunset finders won't appear in the UI
- If you previously used a sunset finder, switch to alternatives
- Active finders always appear in the finder selection menu

## See Also
- [Item Flipper Guide](/flipper)
- [Filters & Restrictions](/filters)
- [Settings](/settings)
