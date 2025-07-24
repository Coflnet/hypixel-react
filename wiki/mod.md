---
title: "Minecraft Mod"
description: "Enhance your in-game experience with the SkyCofl mod"
order: 7
---

# SkyCofl Minecraft Mod

The SkyCofl mod brings auction house data, ah flips, bazaar flips, craft flips etc directly into your Minecraft client so you don't have to switch windows.

## Installation

### Requirements
On minecraft 1.8.9 Forge, on Minecraft 1.21+ Fabric (like most skyblock mods)

### Recommended setup
1. **Install Prism Launcher**: from [prismlauncher.org](https://prismlauncher.org/).
2. **Create a new `Instance`**: Use the `Create Instance` button (may be localized, but on the top left)
3. **Select `1.21.5` as Version and Fabric as Modloader**: For best compatability with other mods 1.21.5 is recommended.
3. **Save configuration**: Click `Create Instance` to save, then select the instance you just created and click `Edit Instance`.
4. **Add mods**: Click `Mods`, then `Download mods`, search for `Fabric API` and select it, then search for `SkyCofl` and select it, then click `Download and Install`.
5. **Launch Minecraft**: Click `Play` to start Minecraft with the mod installed. Optionally add other mods like `SkyHanni` or `Skyblocker` for additional features.

The setup is the same for 1.8.9 Forge, just select `1.8.9` as version and `Forge` as modloader in step 3, other mods are available in 4th step that way.

## Core Features

### Price Information
- **Item Tooltips**: See median prices, lowest BIN, and volume
- **Bazaar Prices**: Real-time buy/sell prices on all items and highlighting if you have the top order in the bazaar order menu
- **Crafting Prices**: View prices of clean craft cost and full craft cost (including enchant value etc.)
- **Profit Estimates**: Highlights potential flip profits while browsing the ah
- **Coins per bit**: See how many coins you can make per bit items in the community center or buying skins/firesales

### Flip Notifications
- **Real-time Flips**: Get notified of profitable auctions
- **Custom Filters**: Set your own flip criteria in game with `/cofl blacklist add <item> filter=xy`
- **Sound Alerts**: Audio notifications for new flips
- **Chat Integration**: Flips appear in chat with clickable links
- **BIN Gui Overlay**: to help you buy flips faster you can enable a custom overlay that make the buy start and buy confirm buttons bigger and easier to click so you can buy flips faster

### Lowballing
Lowballing is one of the most profitable money making methods in hypixel skyblock. We added features to help users reduce losses and make more coins.
- **Trade warning**: If you overpay according to our price estimations a warning is displayed on the trade confirm button
- **Value estimation**: The sum of left and right side of trade items values is also displayed on the confirm button
- **Market Value**: The median market value of items with similar valuable modifiers is displayed on every item
- **/cofl lowball**: Allows you to register as lowballer and be notified if anybody trying to sell an item that matches your filters
- **Insta sell price**: With `/cofl lore` you can configure to see the estimated instasell price on every item and make an educated offer accordingly
- **Trade tracking**: Completed trades will be stored and used to set a purchase price for tracked flips

## Commands

### Basic Commands
- `/cofl help commands` - List all commands (there are multiple pages of them)
- `/fc <message>` - Write in flipper chat that syncs with discord
- `/cofl lore` - Edit what lore is shown in the item tooltip (when hovering)
- `/cofl set` - show current settings

### Flip Commands
- `/cofl flip` - Toggle ah flip notifications
- `/cofl set <setting> <value>` - Configure settings
- `/cofl forge` - Shows profitable forge flips
- `/cofl bazaar` - Shows bazaar buy order sell order flips
- `/cofl ananke` - Shows most profitable items to use ananke feathers on
- `/cofl attributeflip` - Shows auction items that can be bought, some enchant or other modifier applied and solf for profit
- `/cofl crafts` - Shows profitable auction house, bazaar and bazaar to ah craft flips
- `/cofl fusionflip` - Displays the most profitable buy order, fusion machine combining and sell order flips
- `/cofl task` - Shows a breakdown of what is the most profitable money making method for you currently (tracks items you collect to update estimate in real time)
- `/cofl profit` - Ah profit you made recently
- `/cofl lowball` - Allows you to register as a lowballer or offer an item to lowballers for a good price, you can decide if you want more coins or a faster buyer

### Utility Commands
- `/cofl ahtax <amount>` - get the tax amount for a given amount
- `/cofl reminder add <time> <note>` - Set a reminder
- `/cofl craftbreakdown` - Shows cost of modifiers for a given item
- `/cofl networth` - Shows your networth with up to date bazaar and ah prices
- `/cofl minion` - Displays the most profitable minions

### Advanced Commands
- `/cofl cheapmuseum` - Calculates and shows the cheapest way to get skyblock exp via museum donations
- `/cofl leaderbaord` - Profit leaderboards (Premium+)
- `/cofl configs` - Get configs from other users
- `/cofl bzmove` - Shows biggest price movement on the bazaar in the last 24 hours



## Safety and Security

### Allowed Modifications
The SkyCofl mod follows all server rules:
- No gameplay advantages
- No automation features
- Only displays public information
- Complies with Hypixel's mod policy

## Updates and Support

### Automatic Updates
- Mod checks for updates automatically
- Notifications appear in-game
- Download links provided
- Changelog available on the release page
- Most calculation commands don't require mod updates as they are done on our servers

### Getting Help
- **Discord**: Join our community server
- **Commands**: Use `/cofl help` in-game
- **Website**: Look around in our documentation

### Contributing
- **Bug Reports**: Help us improve
- **Feature Requests**: Suggest new features and upvote existing ones that you like so we can prioritize them
- **Feedback**: Share your experience any time good or bad

## Advanced Features

### API Integration
- (planed) API access for developers, let us know if you want to use it

### Customization
- Custom chat formats
- Personalized filters

### Analytics
- Detailed profit tracking
- Market trend analysis
- Performance metrics
- Success rate statistics