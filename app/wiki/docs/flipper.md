---
title: "Item Flipper"
description: "Master the art of auction house flipping"
order: 4
---

# Item Flipper

The Item Flipper is SkyCofl's flagship feature that helps you find profitable auction house flips in Hypixel SkyBlock.

## How It Works

The flipper analyzes every new auction and compares it to:
- Historical sale prices of similar items
- Current lowest BIN prices
- Market trends and volume data

When an auction is significantly underpriced, it appears as a "flip" with estimated profit.

## Getting Started

1. Visit the [Flipper page](/flipper)
2. Log in with Google for full features
3. Wait for flips to appear
4. Click on flips to copy the auction command
5. Use `/viewauction <uuid>` in-game

## Understanding Flip Information

Each flip shows:
- **Cost**: What you need to pay
- **Target Price**: Expected selling price
- **Estimated Profit**: Potential profit after taxes
- **Volume**: How often this item sells
- **Seller**: Who's selling the item

### Flip Badges
- **BIN**: Buy It Now auction
- **SOLD**: Auction already ended

## Flip Finders

Different algorithms find different types of flips:

### Flipper (FLIP)
- Uses historical auction database
- Searches for similar items with modifiers
- Slower but finds more complex flips

### Sniper (SNIPE)
- Fast dictionary-based algorithm
- Only shows items below lowest BIN
- 3000x faster than Flipper
- Higher competition

### Sniper Median (MSNIPE)
- Similar to Sniper
- Doesn't require below lowest BIN
- Shows items 5% below median, [video explanation](https://www.youtube.com/watch?v=nfMo5CeJDgc)

### User (Whitelist)
- Shows all new auctions at starting bid
- Use with custom whitelist rules
- Create your own flip criteria
- **Caution**: You might whitelist something that is not profitable, so be careful with this one

## Customization

### Display Options
- Hide/show cost, profit, volume
- Customize number formatting
- Adjust extra information fields
- Toggle seller information

### Filters
- Minimum profit amount
- Minimum profit percentage
- Maximum cost limit
- Minimum volume threshold
- BIN-only auctions

### Restrictions
Create blacklists and whitelists:
- **Blacklist**: Hide specific items/sellers
- **Whitelist**: Skip blacklist and show items matching filter rules
- **Filters**: Use complex criteria
- **Tags**: Organize your restrictions and add one filter group to another with the `ForTag` meta filter


## Best Practices

### For Beginners
1. Start with higher profit margins (1M+)
2. Focus on items you know
3. Check volume before buying
4. Verify prices manually at first until you trust the estimates (or report wrong estimates if you see any, there is a reward for correct reports)

### Advanced Tips
1. Use multiple finders for coverage
2. Set up item-specific whitelists
3. Monitor market trends to adjust what you flip
4. Adjust filters based on your budget. In the mod, only items costing less than your purse are shown.

### Risk Management
- Never invest more than you can afford to lose
- Diversify across different item types, about 10 items are recommended, update announcements can tank item values
- Be cautious with low-volume items
- Keep some liquid coins for opportunities

## Common Issues

### No Flips Showing
- Check your filters aren't too restrictive, you can use `/cofl blocked` in game to get a list of most common reasons why flips are not showing
- Ensure you're logged in for premium features
- Lower your minimum profit threshold

### Flips Already Sold
- This is common on the free version and lower tiers. If you want to compete for obvious high-profit flips, such as sub-500M Hyperions, you will need Premium+.
- Consider upgrading to premium
- Focus on lower-value flips with less competition

### Profit Calculations Wrong
- Estimates are based on historical data
- Market conditions change rapidly due to game updates
- Report consistently wrong estimates

## Mod Integration

Use our Minecraft mod for the best experience:
- Flips appear directly in chat
- One-click auction viewing
- Customizable notifications
- Profit tracking

Commands:
- `/cofl` - Main menu
- `/cofl help` - List all commands
- `/cofl profit` - View your profits