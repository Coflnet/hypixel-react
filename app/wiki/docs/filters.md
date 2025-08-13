---
title: "Auction and Flip filters"
description: "Documentation about all filters for our Skyblock Auction house explorer and Flipper "
order: 8
---


# Flip filters
These are filters only available for flip filtering as part of configs. Multiple filters can be combined in one filter group, here after shortened to only group. All filters in one group are combined with AND logic, so all filters must match for the flip to be selected. Filters can be combined with OR logic by creating multiple groups.

## ForTag
This meta filter allows you to put filters from the group into all other groups that have the selected tag.
This is useful for when you want to have one filter eg minprofit on many groups that target different items but you may want to change the value.  
In the case of the main filters (minprofit, maxcost, minvolume and min profit percent) this can be done simpler with variables in the filter value.

### Variables
In all filter values you can put `{{MIN_PROFIT}}`, `{{MAX_COST}}`, `{{MIN_VOLUME}}` and `{{MIN_PROFIT_PERCENT}}` followed by a multiplier (if you want to use the same value put `1` there) to use the values of the main filters. This allows you to add whitelists that still obey your minprofit setting while you don't have to update it manually.  
Example:
```
{{MIN_PROFIT}}*1-{{MIN_PROFIT}}*2
```
Select flips with profit between 1 and 2 times the minprofit value.

## Volume
Volume represents the sales per day, so how many items sell in 24 hours on average. It supports values smaller than 1, eg. 0.2 means once every 5 days. Volume has anti market manipulation applied to it, so one user selling 20 items won't increase the volume by a full 20. Volume is approximately accurate based on the last 80 sales, if an item has more than 80 sales volume will usually not increase and stay at around 30 which is considered high volume and marks flips that sell often.

## Profit
Selects estimated profit of a flip (which depends on the [flip finder](#flipfinder) that found the flip). You may place [variables](#variables) in the value to use the main filter values. Profit is calculated as `profit = target - cost - taxes`, so if you buy an item for 100m and sell it for 120m profit is ~17m.

## ProfitPerUnit
Selects estimated profit devided by stack size. So for a stack of 64 items with 128k coins profit it would be 1.97k coins profit per item (again including ah taxes). This is useful for items that are sold in stacks and not (yet) on the bazaar, like runes.

## ProfitPercentage
Selects estimated profit percentage of a flip, so how much profit you make compared to the cost. It is calculated as `profit_percentage = (target - cost - taxes) / cost * 100`, so if you buy an item for 100m and sell it for 120m profit is ~17%.

## FlipFinder
Selects the algorithm that found the flip. Allows you to blacklist certain items from one algorithm. For example you might want to have a different minprofit for the sniper finder so you could add:
```
WHITELIST
Minprofit: {{MIN_PROFIT}}*0.5
FlipFinder: sniper
```
To set the minprofit to just half for all flips found by the sniper finder (lbin based flips)

## BedFlip
Selects flips still in the 20 seconds in grace period after start. As they are not directly purchaseable they have more competition than flips that can be directly purchased. This filter can be used both to select flips that are still in grace period and ones that are not.

## PreApi
Pre api flips are flips that we found based before the 1 minute api update. They have less competition because most bots are not able to find them before the api updates. The fairness system delays users that buy suspiciously fast extra on these flips to give other users a better chance to buy them. This filter allows you to select those flips. 

## PremPlus
Targets flips found found by one of the prem+ instances, marked with a gray `!`. The prem+ instances run a hyper optimized version of the flip finder that is able to find flips faster than the normal finder. It was built following user requests and forwards its flips after a 1 second delay in case the main instance didn't find them yet. This filter allows you to select those flips.

## CurrentMayor
This meta filter allows you to define groups that only trigger when a certain mayor is in office in skyblock.

## LastMayor
This meta filter allows you to define groups that only trigger when a certain mayor was in office last. This is useful for items are sold off at the end of a mayor term.

## NextMayor
This meta filter allows you to define groups that only trigger when a certain mayor is in office next. Based on public election data, it will not trigger on hidden elextions. This is useful for items that raise/fall in value when a mayor is elected.

## ActivePerk
Triggers when either the current mayor or minister has a given perk active

## NextPerk
Matches leading candidate perks in active public elections, both mayor and minister

## DoNotOpen
This meta filter will tell the mod to ignore this flip with the open next/best flip hotkey. Useful for lower profit flips that you only maybe want to look at if there is no higher profit flip after an api update.

## MinProfitPercentage
Minimum profit percent (%) of a flip. Will block all flips that have a lower [profit percentage](#profitpercentage) than the value. This is useful for whitelists that should only trigger on flips with a certain profit percentage.

## ItemCategory
Allows you to select multiple items from a specific category at once to keep your config smaller.

## AhCategory
Allows you to select items in a specific auction house category, eg to block all weapons.

## IntroductionAgeDays
Selects all items added in the last X days to the game. Allows you to define how long you want to wait for new items to settle in price (usually new items drop in value, which is handled by the sniper median finder but not the flipper finder)
For firesales this starts when the firesale starts even if the item tag is known ahead of time. For all other items this starts when either the item api lists it (after an update) or the first time an item is seen on the auction house.

## ArmorSet
Select full armor sets at once, so you can select all pieces of a set with one filter.

## ArmorSetNoHelmet
Same as [ArmorSet](#armorset) but without the helmet piece. This is useful for items that are not part of a set but you want to select all pieces of the set.

## MinProfit
Minimum profit of a flip, same as [profit](#profit) but only "bigger than" instead of a range. Exists for backwards compatibility and was introduced to match the main filter.

## MaxCost
Maximum cost of a flip, same as [cost](#cost) but only "lower than" instead of a range. Exists for backwards compatibility and was introduced to match the main filter.

## ReferenceAge
The maximum age of the 3rd most recent reference (called short term median) Useful for selecting items that sell rarely and are thus more risky as price estimates may have not adjusted yet.

## ForceBlacklist
Moves a blacklist group before all whitelist groups to make sure whatever matches is always blocked even if it would be whitelisted. Best used for blacklisting items that have a bugged price estimation. Is the default for blacklisting for a week with the flip options menu in game.

## AfterMainFilter
Moves this whitelist after the main filters (minprofit, maxcost etc) Allows you to selectively require flips to match all the main filters without needing to add them to the group.

## PriorityOpen
Prioritizes opening matching flips with the open best/next flip hotkey (ie making them "better" in the calculation which flip to open) Only works if the hotkey is pressed after flips are received as if the hotkey is in open next mode it will always open the next flip that comes in.

## UtcHourOfDay
Meta filter that only matches in specific hour(s) of the day based on UTC time. 8-12 includes 12:59 as its the 12th hour. Useful for enabling filters on "peak" activity hours on the auction house.

## UtcDayOfWeek
Meta filter to enly enable groups in specific day of the week based on UTC time. Sunday is 0, Saturday is 6

## CurrentEvent
Meta filter to enable filer groups only when a specific event is currently active. This is useful for items that are only available during an event, like spooky festival items.

## YearOfThe
Meta filter to enable a group during a year of the X. Eg year of the seal or year of the pig.

## PerfectArmorTier
Select any piece of perfect armor with a specific tier.

## Volatility
Normalized volatility, this metric on sniper and sniper median flips quantifies how much an item price fluctuates.
Price changes from 20k to 19k are result in a volatility of `2`, from 20 to 5 would be a volatility of `74`.  
Filtering for <10 would be considered rather stable items and >30 rather volatile items.

## ReferenceCount
Count of references used for flip, together with high volume indicates that item is new and may be volatilie

## OldestReferenceAge
How many days ago the oldest reference used for anit market manipulation was sold. 0 is today. This is similar to [ReferenceAge](#referenceage) but for the oldest reference instead of the short term median which is the 3rd (or on high volume items 5th) recent one. This allows you to distinglish if a references for price finding are recent indicating that somebody tries to manipulate the price.

## DoNotRelist
Meta filter to mark items to not recommend relisting on automatic flipping clients like BAF

## ReduceTargetBy
Meta filter to reduce the target price. Values above 1 reduces by absolute number, from 0-1 uses percentage. For example 0.2 removes 20%, matches all flips and can cause flips to show up as negative profit!

## RelistAt
Sets a static price to relist at (by modifying the flip target price), mostly useful for user finder. Target values are remembered and suggested when listing items for the first time (will not if it didn't sell and you relist the item).

## TargetPrice
Allows filtering for the price estimation of aflip. This will always filter for the original value before [ReduceTargetBy](#reducetargetby),[CapTargetPirceAt](#captargetpriceat) or [RelistAt](#relistat) changes are applied.

## CapTargetPriceAt
Limit target price at a certain value. If a flip estimate is lower than this it would be used, if its higher its capped.

## ListingSlotsLeft
Meta filter to enable group based on how many ah spaces are left, is -1 if not supported and 0 if not known (or really full)

## KeepOnImport
Filters marked with this meta filter are copied over to other imported configs. This filter is never exported to avoid giant filters.

## AverageTimeToSell
Average time to sell range, supports 1m,2h,3d,4w x-y &lt;x. Eg. &lt;4d (less than 4 days) This is calculated based on actual sales or approximated by volume if exact numbers are not available.

## Fragged
Meta filter to trigger on fragged items. Relatively slow so use with caution or let us know if you use it more than once in your config so we can optimize it.

## CraftCostWeight
Adjusts target price based on craft cost of ingredients multiplied by weight. This is a filter which only works with the craft cost finder.  
Example value:
```
sharpness:0.5,sharpness.7:1.5,cleanItem:0.9,default:0.8
```
Assuming an Aspect of the Dragon is listed clean cost 1m with sharpness 7 on it and ultimate one for all 1.
The calculation is as follows:
* Clean item: 1m * 0.9 = 900k
* Sharpness 7: 80m * 1.5 = 120m
* Ultimate one for all: 2m * 0.8 = 1.6m

=> in total target price is 122.5m  

If there is any other modifier like another enchantment or art of the war its anti market manipulated value is used, multiplied with the default weight value and then added to the target price.  
For modifiers that commonly use more value than just 20% lower default weights are in place.  
* Talisman enrichments: 0.1
* Recombobulator: 0.5
* Skins and runes: 0.5

You can override them by specifying them in the weight list. Clean item values are 1 by default.
You can receive the current craft cost values of every craft cost finder flip by using the `Flip options menu ✥` -> `Get references`.  
The complete list of valuable modifiers that can receive a weight is [here on github](https://github.com/Coflnet/SkyBackendForFrontend/blob/main/Helper/FlipFilters/CraftCostWeightDetailedFlipFilter.cs#L139)

## CleanCost
How much the item usually sells for without any modifiers, available for sniper, sniper median and craft cost finder flips.

## LegacyReforge
Matches unobtainable reforges, hurtful, demoinc, forceful strong, on swords also rich and bows also odd. They have collectors value

## HasUuuidFilter
Item has a uuid and is stackable or not (stacksizes can also be filtered with [Count](#count)).

## UserPremiumTier
Meta filter that triggers a group if the currently connected users premium tier matches

## ConnectedMcUser
Meta filter that triggers a group if the currently connected user has the name/uuid in this filter.

## Purse
Meta filter to filter for amount in purse, can have a bit of delay if it changed recently

## HasRune
Has the item any rune applied

## IsFarmingItem
Matches multiple item used by or related to farming

## EstProfitPerHour
Range based profit per hour based on [AverageSellTime](#averagetimetosell), recommended for whitelisting high values. Helps get fast selling lower profit items that would be blocked by minprofit but are generally considered good flips.

## ScorpiusDays
Days until next Scorpius, gets calculated once on load

## DerpyDays
Days until next Derpy, gets calculated once on load

## JerryDays
Days until next Jerry, gets calculated once on load


# Auction filters
These are filters available for all auctions so history, active and flip filtering.  
These are autogenerated from the documentation and the name generaly tells you all you need to know about the filter.

## Reforge
- **Type:** `Equal`
- **Description:** Reforge of the item

## Rarity
- **Type:** `Equal`
- **Description:** aka Tier (Rare, Epic, etc)

## PetLevel
- **Type:** `NUMERICAL, RANGE`
- **Description:** Level of the pet, supports 1x for place holder and 1-200 for range. Lvl 100 means 100+ exp, so don't use on gdrag

## PetItem
- **Type:** `Equal, AppliedItem`
- **Description:** Item held by the pet

## CakeYear
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## Candy
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## Clean
- **Type:** `BOOLEAN`
- **Description:** No description available.

## PricePerLevel
- **Type:** `NUMERICAL, RANGE`
- **Description:** Uses another filter to select a (enchant or attribute) level and estimates a level 1 price

## Bin
- **Type:** `BOOLEAN`
- **Description:** No description available.

## Stars
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## IsShiny
- **Type:** `Equal`
- **Description:** Is X applied onto the item

## Recombobulated
- **Type:** `BOOLEAN`
- **Description:** Is the item rarity upgraded with a recombobulator

## HotPotatoCount
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## Enchantment
- **Type:** `Equal`
- **Description:** No description available.

## EnchantLvl
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## SecondEnchantment
- **Type:** `Equal`
- **Description:** No description available.

## SecondEnchantLvl
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## Color
- **Type:** `Equal`
- **Description:** No description available.

## ExoticColor
- **Type:** `Equal`
- **Description:** Exotic colors, not default or most common one

## FairyColor
- **Type:** `Equal`
- **Description:** Exotic colors, not default or most common one

## CrystalColor
- **Type:** `Equal`
- **Description:** Exotic colors, not default or most common one

## HexColorList
- **Type:** `RANGE`
- **Description:** Allows selecting a comma separated list of hex colors

## CrabHatColor
- **Type:** `Equal`
- **Description:** No description available.

## Seller
- **Type:** `TEXT`
- **Description:** Seller uuid or username (slower)

## WinningBid
- **Type:** `NUMERICAL, RANGE`
- **Description:** The highest bid on dark auction items, aka full bid

## Ethermerge
- **Type:** `Equal`
- **Description:** Is X applied onto the item

## TunedTransmission
- **Type:** `NUMERICAL, RANGE`
- **Description:** Tuned transmission on aotv

## Skin
- **Type:** `Equal, AppliedItem`
- **Description:** Applied skin on an item

## PetSkin
- **Type:** `Equal, AppliedItem`
- **Description:** This filter restricts applied skins to just pets. For more skin name options use the skin filter.

## DragonArmorSkin
- **Type:** `Equal, AppliedItem`
- **Description:** Applied skin on an item

## ReaperMaskSkin
- **Type:** `Equal, AppliedItem`
- **Description:** Applied skin on an item

## SnowSuiteSkin
- **Type:** `Equal, AppliedItem`
- **Description:** Applied skin on an item

## TarantulaHelmetSkin
- **Type:** `Equal, AppliedItem`
- **Description:** Applied skin on an item

## FrozenBlazeSkin
- **Type:** `Equal, AppliedItem`
- **Description:** Applied skin on an item

## PerfectHelmetSkin
- **Type:** `Equal, AppliedItem`
- **Description:** Applied skin on an item

## DiversMaskSkin
- **Type:** `Equal, AppliedItem`
- **Description:** Applied skin on an item

## ShadowAssasinSkin
- **Type:** `Equal, AppliedItem`
- **Description:** Applied skin on an item

## MusicRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## EnchantRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## TidalRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## EndRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## ZombieKills
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## SpiderKills
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## EmanKills
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## ExpertiseKills
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## RaiderKills
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## SwordKills
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## BloodGodKills
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## BlazeKills
- **Type:** `NUMERICAL, RANGE`
- **Description:** aka Bulwark on frost wisp

## YogsKilled
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## BlazeConsumer
- **Type:** `NUMERICAL, RANGE`
- **Description:** Blaze kills

## StartingBid
- **Type:** `NUMERICAL, RANGE`
- **Description:** aka item Cost or price

## PricePerUnit
- **Type:** `NUMERICAL, RANGE`
- **Description:** Price per unit (for stackable items)

## HighestBid
- **Type:** `NUMERICAL, RANGE`
- **Description:** The amount an auction has been sold for, including bin

## Count
- **Type:** `NUMERICAL, RANGE`
- **Description:** Stack item count

## JyrreMax
- **Type:** `HIGHER`
- **Description:** No description available.

## UId
- **Type:** `Equal, RANGE`
- **Description:** Filter auction history by unique id. This is the part of a uuid after the last dash (-)

## CapturedPlayer
- **Type:** `Equal, TEXT, PLAYER_WITH_RANK`
- **Description:** No description available.

## CakeOwner
- **Type:** `Equal, TEXT, PLAYER_WITH_RANK`
- **Description:** Cake owner name

## ArtOfTheWar
- **Type:** `Equal`
- **Description:** Art of the War applied or not

## WoodSingularity
- **Type:** `Equal`
- **Description:** Was wood singularity applied

## EndBefore
- **Type:** `LOWER, DATE`
- **Description:** No description available.

## EndAfter
- **Type:** `HIGHER, DATE`
- **Description:** No description available.

## ItemCreatedBefore
- **Type:** `HIGHER, DATE`
- **Description:** Targets item creation time

## ItemCreatedAfter
- **Type:** `HIGHER, DATE`
- **Description:** No description available.

## ItemId
- **Type:** `Equal, NUMERICAL`
- **Description:** No description available.

## ItemTag
- **Type:** `Equal`
- **Description:** No description available.

## UnlockedSlots
- **Type:** `NUMERICAL, RANGE`
- **Description:** Amount of unlocked slots

## UnlockedSlotsMatch
- **Type:** `Equal`
- **Description:** Exact unlocked slots

## PerfectGemsCount
- **Type:** `NUMERICAL, RANGE`
- **Description:** How many perfect gems are on the item

## FlawlessGemsCount
- **Type:** `NUMERICAL, RANGE`
- **Description:** How many flawless gems are on the item

## Everything
- **Type:** `Equal, SIMPLE, BOOLEAN`
- **Description:** Meta filter allowing you to select all items, does nothing essentially

## DyeItem
- **Type:** `Equal`
- **Description:** Dye item that changed the color

## PartyHatYear
- **Type:** `Equal`
- **Description:** Year of the party hat, some hats may be different items

## PartyHatColor
- **Type:** `Equal`
- **Description:** Color of the party hat

## PartyHatEmoji
- **Type:** `Equal`
- **Description:** Emoji on the 2023 party hat

## Edition
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## BaseStatBoost
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## ManaDisintegrator
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## DrillPartEngine
- **Type:** `Equal`
- **Description:** Engine of the drill

## DrillPartFuelTank
- **Type:** `Equal`
- **Description:** Fuel tank of the drill

## DrillPartUpgradeModule
- **Type:** `Equal`
- **Description:** Upgrade module on a drill

## AbilityScroll
- **Type:** `Equal`
- **Description:** Wither shield, Implosion and/or Shadow Warp

## ArtOfPeace
- **Type:** `Equal`
- **Description:** Art of Peace applied or not

## Model
- **Type:** `Equal`
- **Description:** Abicase model for historic data, the item is now split up into multiple items

## FarmedCultivating
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## FarmingForDummies
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## MinedCrops
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## BlocksBroken
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## ThunderCharge
- **Type:** `NUMERICAL, RANGE`
- **Description:** Thunder charge accumulated

## IntelligenceBonus
- **Type:** `NUMERICAL, RANGE`
- **Description:** Bottle of Jyrre bonus

## Sold
- **Type:** `BOOLEAN`
- **Description:** Has item sold (ended and at least one bid or bin)

## ItemNameContains
- **Type:** `Equal, RANGE`
- **Description:** Text the item name should contain.

## HasAttribute
- **Type:** `BOOLEAN`
- **Description:** Any attribute (crimson isle) present

## PetExp
- **Type:** `NUMERICAL, RANGE`
- **Description:** Filter by (pet) experience

## CostPerExpPlusBase
- **Type:** `NUMERICAL, RANGE`
- **Description:** Cost per exp x+y base price

## TalismanEnrichment
- **Type:** `Equal`
- **Description:** Enrichment of the talisman, from community shop

## HandlesFound
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## PowerAbilityScroll
- **Type:** `Equal`
- **Description:** Gemstone based power ability scrolls

## ItemTier
- **Type:** `NUMERICAL, RANGE`
- **Description:** Changes based on dungeon floor level obtained

## NoOtherValuableEnchants
- **Type:** `BOOLEAN`
- **Description:** Besides enchants specified in filters all valuable enchants (lvl 6+) are not allowed

## PowderCoating
- **Type:** `Equal`
- **Description:** Powder coating on divan pieces

## CollectedCoins
- **Type:** `NUMERICAL, RANGE`
- **Description:** Coins collected on Crown of Avarice

## RaffleWin
- **Type:** `Equal`
- **Description:** Which raffle roll the item is from

## RaffleYear
- **Type:** `Equal`
- **Description:** Which century the raffle item is from

## JalapenoBook
- **Type:** `Equal`
- **Description:** Jalapeno book applied

## BassWeight
- **Type:** `NUMERICAL, RANGE`
- **Description:** How high the bass weight metric is

## RunicKills
- **Type:** `NUMERICAL, RANGE`
- **Description:** How many runic mobs were killed

## RodHook
- **Type:** `Equal`
- **Description:** Hook part of the rod

## RodLine
- **Type:** `Equal`
- **Description:** Line part of the rod

## RodSinker
- **Type:** `Equal`
- **Description:** Sinker part of the rod

## DungeonSkillReq
- **Type:** `Equal`
- **Description:** Dugneon skill requirement filter, ie floor dropped

## LogsCut
- **Type:** `NUMERICAL, RANGE`
- **Description:** How many logs were cut using the axe

## AbsorbLogs
- **Type:** `NUMERICAL, RANGE`
- **Description:** How many logs were absorbed (chopped) using an axe with enchantment

## AxeBoosters
- **Type:** `Equal`
- **Description:** What boosters were applied to the axe

## PlarvoidBook
- **Type:** `NUMERICAL, RANGE`
- **Description:** Amount of polarvoid books

## ruby0Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## ruby1Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## jasper0Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## jasper1Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## jade0Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## jade1Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## topaz0Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## topaz1Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## amethyst0Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## amethyst1Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## amber0Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## amber1Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## sapphire0Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## sapphire1Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## opal0Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## opal1Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## peridot0Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## peridot1Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## aquamarine0Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## aquamarine1Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## citrine0Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## citrine1Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## combat0Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## combat1Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## offensive0Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## offensive1Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## defensive0Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## defensive1Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## mining0Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## mining1Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## universal0Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## universal1Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## chisel0Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## chisel1Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## combat0GemType
- **Type:** `Equal`
- **Description:** Targets gem type of universal,combat etc. slots

## combat1GemType
- **Type:** `Equal`
- **Description:** Targets gem type of universal,combat etc. slots

## offensive0GemType
- **Type:** `Equal`
- **Description:** Targets gem type of universal,combat etc. slots

## offensive1GemType
- **Type:** `Equal`
- **Description:** Targets gem type of universal,combat etc. slots

## defensive0GemType
- **Type:** `Equal`
- **Description:** Targets gem type of universal,combat etc. slots

## defensive1GemType
- **Type:** `Equal`
- **Description:** Targets gem type of universal,combat etc. slots

## mining0GemType
- **Type:** `Equal`
- **Description:** Targets gem type of universal,combat etc. slots

## mining1GemType
- **Type:** `Equal`
- **Description:** Targets gem type of universal,combat etc. slots

## universal0GemType
- **Type:** `Equal`
- **Description:** Targets gem type of universal,combat etc. slots

## universal1GemType
- **Type:** `Equal`
- **Description:** Targets gem type of universal,combat etc. slots

## chisel0GemType
- **Type:** `Equal`
- **Description:** Targets gem type of universal,combat etc. slots

## chisel1GemType
- **Type:** `Equal`
- **Description:** Targets gem type of universal,combat etc. slots

## amethyst2Gem
- **Type:** `Equal`
- **Description:** Selects gem purity in a slot

## mana_regeneration
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## ignition
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## ender
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## undead_resistance
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## fishing_speed
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## combo
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## arachno_resistance
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## magic_find
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## fortitude
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## undead
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## arachno
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## fisherman
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## mana_pool
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## blazing
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## elite
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## hunter
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## warrior
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## deadeye
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## experience
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## infection
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## life_regeneration
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## double_hook
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## blazing_fortune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## speed
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## trophy_hunter
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## dominance
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## midas_touch
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## mana_steal
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## blazing_resistance
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## life_recovery
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## lifeline
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## ender_resistance
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## breeze
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## veteran
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## mending
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## attack_speed
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## fishing_experience
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## vitality
- **Type:** `NUMERICAL, RANGE`
- **Description:** Supports number ranges, 0 for not present

## ultimate_duplex
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ultimate_reiterate
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## pristine
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## prismatic
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## gravity
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ExperienceEnchant
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ManaStealEnchant
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## unknown
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## cleave
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## critical
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## cubism
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ender_slayer
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## execute
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## first_strike
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## giant_killer
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## impaling
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## lethality
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## life_steal
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## luck
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## scavenger
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## thunderlord
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## telekinesis
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## vampirism
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## venomous
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## growth
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## aiming
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## dragon_hunter
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## infinite_quiver
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## piercing
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## snipe
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## harvesting
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## rainbow
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## smelting_touch
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## angler
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## blessing
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## caster
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## frail
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## magnet
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## spiked_hook
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## bane_of_arthropods
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## fire_aspect
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## looting
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## knockback
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## sharpness
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## smite
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## aqua_affinity
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## blast_protection
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## depth_strider
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## feather_falling
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## fire_protection
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## frost_walker
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## projectile_protection
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## protection
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## respiration
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## thorns
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## flame
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## power
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## punch
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## efficiency
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## fortune
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## silk_touch
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## lure
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## luck_of_the_sea
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## true_protection
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## sugar_rush
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## replenish
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## rejuvenate
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ultimate_bank
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ultimate_combo
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ultimate_jerry
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ultimate_last_stand
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ultimate_no_pain_no_gain
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ultimate_wisdom
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ultimate_wise
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## expertise
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ultimate_chimera
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ultimate_rend
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## overload
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ultimate_legion
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ultimate_swarm
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## big_brain
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## compact
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## vicious
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## counter_strike
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## turbo_carrot
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## turbo_cactus
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## turbo_cane
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## turbo_coco
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## turbo_melon
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## turbo_mushrooms
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## turbo_pumpkin
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## turbo_potato
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## turbo_warts
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## turbo_wheat
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## chance
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## prosecute
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## syphon
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## respite
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## thunderbolt
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## titan_killer
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## triple_strike
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ultimate_soul_eater
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ultimate_one_for_all
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## None
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## cultivating
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## delicate
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## smarty_pants
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ultimate_fatal_tempo
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ultimate_inferno
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## charm
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## corruption
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ferocious_mana
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## strong_mana
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## hardened_mana
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## mana_vampire
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## smoldering
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ultimate_flash
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## hecatomb
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## champion
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ultimate_habanero_tactics
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## cayenne
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## divine_gift
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## piscary
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ultimate_bobbin_time
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## tabasco
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## prosperity
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## sunder
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## dedication
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## Any
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## green_thumb
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## transylvanian
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## reflection
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ultimate_the_one
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## quantum
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## pesterminator
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## great_spook
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ultimate_refrigerate
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## paleontologist
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ice_cold
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## toxophilite
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ultimate_flowstate
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## lapidary
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## small_brain
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## tidal
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## quick_bite
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## absorb
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## arcane
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## drain
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ultimate_first_impression
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## forest_pledge
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## ultimate_missile
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## raspiration
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## scuba
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## stealth
- **Type:** `NUMERICAL, RANGE`
- **Description:** No description available.

## SparklingRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## MagicalRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## GemRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## CloudsRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## WakeRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## ZapRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## HotRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## BloodRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## LightningRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## RainbowRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## FireSpiralRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## SpiritRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## PestilenceRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## HeartsRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## SmokeyRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## LavaRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## WhiteSpiralRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## IceRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## GoldenRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## SnowRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## BiteRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## SnakeRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## RedstoneRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## CoutureRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## JerryRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## EndersnakeRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## RuneSackRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## LavatearsRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## FieryBurstRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## GrandSearingRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## SoultwistRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## SpellboundRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## GrandFreezingRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## SlimyRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## MeowMusicRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## BarkTunesRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## PrimalFearRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## IceSkatesRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## GoldenCarpetRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## SmittenRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## RainyDayRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## SuperPumpkinRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## OrnamentalRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## HeartsplosionRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## FloweryCarpetRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## BloomingRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## BlazingSunRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none

## DarknessWithinRune
- **Type:** `NUMERICAL, RANGE`
- **Description:** Applied rune (level) 0 for none


# Captured Souls
All of the following filters are Count of Captured souls filters. There are a lot of souls to capture and they are named by how how hypixel named them in the nbt data (NAME_LEVEL)  
Thse filters like all others only show as options on items where they have been seen at least once.

## ASHFANG_200
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## AUTOMATON_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## AUTOMATON_150
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## BARBARIANS_GUARD_200
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## BARBARIAN_75
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## BARBARIAN_DUKE_X_200
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## BLADESOUL_200
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## BLOOD_2
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## BLUE_SHARK_20
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## BONZO_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_DREADLORD_107
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_DREADLORD_117
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_DREADLORD_127
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_DREADLORD_47
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_DREADLORD_67
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_DREADLORD_77
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_DREADLORD_87
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_DREADLORD_97
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_LURKER_101
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_LURKER_111
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_LURKER_121
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_LURKER_41
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_LURKER_61
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_LURKER_71
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_LURKER_81
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_LURKER_91
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_SOULEATER_105
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_SOULEATER_115
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_SOULEATER_125
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_SOULEATER_45
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_SOULEATER_65
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_SOULEATER_75
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_SOULEATER_85
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_SOULEATER_95
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_TANK_ZOMBIE_40
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_TANK_ZOMBIE_60
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_TANK_ZOMBIE_70
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_TANK_ZOMBIE_80
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_AGENTK_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_ALEXANDER_40
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_APUNCH_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_BEMBO_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_BERNHARD_40
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_BLOOZING_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_CECER_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_CHEESEY_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_CHILYNN_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_CHRISTIAN_40
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_CODENAME_B_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_CONNORLINFOOT_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_DCTR_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_DEADORKAI_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_DISTRICTGECKO_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_DONPIRESO_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_DUECES_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_EXTERNALIZABLE_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_FALLOUTOWNS_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_FLAMEBOY101_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_FRIEDRICH_40
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_HYPIXEL_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_JAMIETHEGEEK_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_JAYAVARMEN_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_JUDG3_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_LADYBLEU_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_LIKAOS_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_MAGICBOYS_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_MARIUS_40
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_MINIKLOON_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_MISTRESSELDRID_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_NICHOLAS_40
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_NITROHOLIC__25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_ORANGEMARSHALL_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_PIETER_40
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_PLANCKE_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_RELENTER_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_REVENGEEE_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_REZZUS_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_SFARNHAM_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_SKYERZZ_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_SYLENT_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_THEMGRF_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_THORLON_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_VALENTIN_40
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_VINNY8BALL666_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD_WILLIAMTIGER_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD__FUDGIETHEWHALE_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_UNDEAD__ONAH_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_WITHERSKELETON_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_WITHERSKELETON_110
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_WITHERSKELETON_120
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## CRYPT_WITHERSKELETON_90
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DANTE_GOON_50
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DIAMOND_GUY_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DIAMOND_GUY_110
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DIAMOND_GUY_120
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DIAMOND_GUY_130
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DIAMOND_GUY_140
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DIAMOND_GUY_150
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DIAMOND_GUY_160
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DIAMOND_GUY_170
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DIAMOND_GUY_90
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DIAMOND_SKELETON_15
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DIAMOND_SKELETON_20
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DIAMOND_ZOMBIE_15
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DIAMOND_ZOMBIE_20
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DOJO_KNOCKBACK_ZOMBIE_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DOJO_KNOCKBACK_ZOMBIE_2
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DOJO_KNOCKBACK_ZOMBIE_3
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DOJO_KNOCKBACK_ZOMBIE_4
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DUELIST_KAUS_7
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DUELIST_ROLLIM_2
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DUMPSTER_DIVER_15
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DUNGEON_RESPAWNING_SKELETON_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DUNGEON_RESPAWNING_SKELETON_110
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DUNGEON_RESPAWNING_SKELETON_120
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DUNGEON_RESPAWNING_SKELETON_40
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DUNGEON_RESPAWNING_SKELETON_60
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DUNGEON_RESPAWNING_SKELETON_70
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DUNGEON_RESPAWNING_SKELETON_80
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## DUNGEON_RESPAWNING_SKELETON_90
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## ENT_14
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## FIRE_EEL_240
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## FIRE_MAGE_75
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## FLAMING_SPIDER_80
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## FLARE_90
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## FROG_MAN_10
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## FROZEN_STEVE_7
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## GLACITE_MAGE_155
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## GOBLIN_50
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## GOBLIN_BATTLER_60
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## GOBLIN_CREEPERTAMER_90
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## GOBLIN_KNIFE_THROWER_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## GOBLIN_WEAKLING_BOW_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## GOBLIN_WEAKLING_BOW_5
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## GOBLIN_WEAKLING_MELEE_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## GOBLIN_WEAKLING_MELEE_5
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## GOLIATH_BARBARIAN_80
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## GRAVEYARD_ZOMBIE_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## GREAT_WHITE_SHARK_180
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## GRIM_REAPER_190
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## GRINCH_21
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## HELLWISP_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## ICE_WALKER_45
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## INTRO_BLAZE_50
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## JOCKEY_SKELETON_3
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## JOCKEY_SKELETON_42
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## KALHUIKI_ELDER_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## KALHUIKI_TRIBE_MAN_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## KALHUIKI_TRIBE_WOMAN_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## KALHUIKI_YOUNGLING_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## KEY_GUARDIAN_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## KING_MIDAS_140
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## KING_MIDAS_150
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## KING_MIDAS_160
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## KING_MIDAS_170
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## KRONDOR_NECROMANCER_80
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LAPIS_ZOMBIE_7
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LIVID_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LIVID_CLONE_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_101
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_102
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_110
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_112
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_113
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_120
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_121
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_122
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_123
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_130
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_131
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_132
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_133
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_134
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_135
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_140
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_141
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_142
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_144
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_150
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_151
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_152
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_153
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_154
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_160
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_161
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_162
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_163
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_164
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_85
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_86
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_87
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_90
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_91
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_92
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## LOST_ADVENTURER_93
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MAGES_GUARD_200
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MAGE_OUTLAW_200
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MAGE_SKULL_50
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_BONZO_SUMMON_UNDEAD_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_DREADLORD_107
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_DREADLORD_117
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_DREADLORD_67
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_DREADLORD_77
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_DREADLORD_87
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_DREADLORD_97
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_LURKER_101
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_LURKER_111
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_LURKER_121
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_LURKER_61
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_LURKER_71
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_LURKER_81
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_LURKER_91
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_SOULEATER_115
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_SOULEATER_125
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_SOULEATER_65
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_SOULEATER_75
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_SOULEATER_85
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_SOULEATER_95
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_TANK_ZOMBIE_60
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_TANK_ZOMBIE_70
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_TANK_ZOMBIE_80
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_AGENTK_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_ALEXANDER_40
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_APUNCH_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_BEMBO_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_BERNHARD_40
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_BLOOZING_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_CECER_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_CHILYNN_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_CHRISTIAN_40
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_CODENAME_B_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_CONNORLINFOOT_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_DCTR_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_DONPIRESO_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_DUECES_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_EXTERNALIZABLE_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_FLAMEBOY101_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_FRIEDRICH_40
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_HYPIXEL_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_JAMIETHEGEEK_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_JAYAVARMEN_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_JUDG3_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_LADYBLEU_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_LIKAOS_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_MAGICBOYS_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_MARIUS_40
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_MINIKLOON_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_NICHOLAS_40
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_NITROHOLIC__25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_ORANGEMARSHALL_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_PIETER_40
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_PLANCKE_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_RELENTER_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_REVENGEEE_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_REZZUS_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_SFARNHAM_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_SKYERZZ_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_SYLENT_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_THEMGRF_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_THORLON_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_VALENTIN_40
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD_WILLIAMTIGER_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_UNDEAD__ONAH_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_WITHERSKELETON_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_WITHERSKELETON_110
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_WITHERSKELETON_120
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_CRYPT_WITHERSKELETON_90
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_DIAMOND_GUY_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_DIAMOND_GUY_110
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_DIAMOND_GUY_120
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_DIAMOND_GUY_130
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_DIAMOND_GUY_140
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_DIAMOND_GUY_160
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_DIAMOND_GUY_90
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_DUNGEON_RESPAWNING_SKELETON_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_DUNGEON_RESPAWNING_SKELETON_110
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_DUNGEON_RESPAWNING_SKELETON_60
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_DUNGEON_RESPAWNING_SKELETON_70
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_DUNGEON_RESPAWNING_SKELETON_80
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_DUNGEON_RESPAWNING_SKELETON_90
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_KING_MIDAS_130
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_KING_MIDAS_150
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_KING_MIDAS_160
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_KING_MIDAS_170
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LIVID_CLONE_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_101
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_102
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_110
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_111
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_112
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_113
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_120
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_121
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_122
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_130
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_131
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_132
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_134
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_142
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_144
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_150
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_151
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_152
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_153
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_154
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_160
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_162
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_85
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_86
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_87
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_90
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_91
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_LOST_ADVENTURER_92
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_MIMIC_115
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_NECRON_GUARD_300
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_PROFESSOR_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_PROFESSOR_ARCHER_GUARDIAN_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_PROFESSOR_GUARDIAN_SUMMON_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_PROFESSOR_GUARDIAN_SUMMON_2
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_PROFESSOR_MAGE_GUARDIAN_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_PROFESSOR_WARRIOR_GUARDIAN_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SADAN_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SADAN_GIANT_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SADAN_GOLEM_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SADAN_STATUE_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SCARED_SKELETON_62
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SCARED_SKELETON_72
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SCARF_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SCARF_ARCHER_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SCARF_MAGE_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SCARF_WARRIOR_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SHADOW_ASSASSIN_120
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SHADOW_ASSASSIN_130
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SHADOW_ASSASSIN_140
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SHADOW_ASSASSIN_150
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SHADOW_ASSASSIN_160
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SHADOW_ASSASSIN_170
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SHADOW_ASSASSIN_171
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SKELETON_GRUNT_60
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SKELETON_GRUNT_70
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SKELETON_GRUNT_80
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SKELETON_LORD_150
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SKELETON_MASTER_108
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SKELETON_MASTER_118
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SKELETON_MASTER_128
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SKELETON_MASTER_78
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SKELETON_MASTER_88
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SKELETON_MASTER_98
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SKELETON_SOLDIER_106
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SKELETON_SOLDIER_116
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SKELETON_SOLDIER_66
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SKELETON_SOLDIER_76
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SKELETON_SOLDIER_86
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SKELETON_SOLDIER_96
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SKELETOR_80
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SKELETOR_90
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SKELETOR_PRIME_110
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SKELETOR_PRIME_120
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SNIPER_SKELETON_113
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SNIPER_SKELETON_123
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SNIPER_SKELETON_63
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SNIPER_SKELETON_73
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SNIPER_SKELETON_83
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SNIPER_SKELETON_93
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SPIRIT_BAT_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SPIRIT_MINIBOSS_130
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SUPER_ARCHER_110
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SUPER_ARCHER_120
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SUPER_ARCHER_90
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SUPER_TANK_ZOMBIE_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SUPER_TANK_ZOMBIE_110
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SUPER_TANK_ZOMBIE_120
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_SUPER_TANK_ZOMBIE_90
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_TENTACLEES_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_TENTACLEES_110
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_TENTACLEES_90
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_THORN_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_WATCHER_BONZO_3
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_WATCHER_BONZO_5
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_WATCHER_BONZO_6
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_WATCHER_BONZO_7
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_WATCHER_GIANT_BIGFOOT_7
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_WATCHER_GIANT_BOULDER_7
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_WATCHER_GIANT_DIAMOND_7
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_WATCHER_GIANT_LASER_7
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_WATCHER_LIVID_6
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_WATCHER_LIVID_7
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_WATCHER_SCARF_5
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_WATCHER_SCARF_6
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_WATCHER_SUMMON_UNDEAD_2
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_WATCHER_SUMMON_UNDEAD_3
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_WATCHER_SUMMON_UNDEAD_4
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_WATCHER_SUMMON_UNDEAD_5
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_WATCHER_SUMMON_UNDEAD_6
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_WATCHER_SUMMON_UNDEAD_7
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_WATCHER_SUMMON_UNDEAD_8
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_WITHER_GUARD_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_WITHER_HUSK_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_WITHER_MINER_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_ZOMBIE_COMMANDER_110
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_ZOMBIE_COMMANDER_120
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_ZOMBIE_GRUNT_60
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_ZOMBIE_GRUNT_70
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_ZOMBIE_KNIGHT_106
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_ZOMBIE_KNIGHT_116
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_ZOMBIE_KNIGHT_126
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_ZOMBIE_KNIGHT_86
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_ZOMBIE_KNIGHT_96
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_ZOMBIE_LORD_150
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_ZOMBIE_SOLDIER_103
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_ZOMBIE_SOLDIER_113
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_ZOMBIE_SOLDIER_83
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MASTER_ZOMBIE_SOLDIER_93
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MATCHO_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MIMIC_115
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MINOS_CHAMPION_175
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MINOS_CHAMPION_310
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MINOS_HUNTER_125
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MINOS_HUNTER_15
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MINOS_HUNTER_60
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MINOS_INQUISITOR_750
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MINOTAUR_120
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MINOTAUR_210
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## MINOTAUR_45
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## NURSE_SHARK_6
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## NUTCRACKER_50
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## OBSIDIAN_WITHER_55
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## PHANTOM_FISHERMAN_160
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## PRIMORDIAL_BAT_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## PROFESSOR_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## RAT_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## RESPAWNING_SKELETON_2
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## REVENANT_ZOMBIE_40
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## RUNE_BLOOD_2
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SADAN_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SCARECROW_9
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SCARED_SKELETON_42
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SCARED_SKELETON_62
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SCARED_SKELETON_72
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SCARF_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SEA_ARCHER_15
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SEA_WALKER_4
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SHADOW_ASSASSIN_120
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SHADOW_ASSASSIN_130
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SHADOW_ASSASSIN_140
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SHADOW_ASSASSIN_150
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SHADOW_ASSASSIN_160
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SHADOW_ASSASSIN_170
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SHADOW_ASSASSIN_171
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETON_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETON_11
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETON_15
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETON_6
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETON_EMPEROR_150
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETON_GRUNT_40
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETON_GRUNT_60
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETON_GRUNT_70
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETON_GRUNT_80
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETON_LORD_150
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETON_MASTER_108
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETON_MASTER_118
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETON_MASTER_128
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETON_MASTER_78
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETON_MASTER_88
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETON_MASTER_98
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETON_SOLDIER_106
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETON_SOLDIER_116
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETON_SOLDIER_126
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETON_SOLDIER_66
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETON_SOLDIER_76
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETON_SOLDIER_86
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETON_SOLDIER_96
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETOR_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETOR_110
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETOR_80
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETOR_90
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETOR_PRIME_110
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SKELETOR_PRIME_120
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SNIPER_SKELETON_103
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SNIPER_SKELETON_113
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SNIPER_SKELETON_63
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SNIPER_SKELETON_73
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SNIPER_SKELETON_83
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SPIRIT_MINIBOSS_130
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SUPER_ARCHER_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SUPER_ARCHER_110
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SUPER_ARCHER_120
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SUPER_ARCHER_90
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SUPER_TANK_ZOMBIE_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SUPER_TANK_ZOMBIE_110
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SUPER_TANK_ZOMBIE_120
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## SUPER_TANK_ZOMBIE_90
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## TEAM_TREASURITE_CORLEONE_200
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## TEAM_TREASURITE_GRUNT_50
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## TEAM_TREASURITE_WENDY_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## TENTACLEES_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## TENTACLEES_110
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## TENTACLEES_90
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## THUNDER_400
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## TIGER_SHARK_50
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## TOY_SOLDIER_25
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## TREASURE_HOARDER_70
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## UNBURRIED_ZOMBIE_30
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## UNBURRIED_ZOMBIE_60
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## VAMPIRE_SCION_70
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATCHER_55
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATCHER_BONZO_3
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATCHER_BONZO_4
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATCHER_BONZO_5
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATCHER_BONZO_6
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATCHER_BONZO_7
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATCHER_GIANT_BIGFOOT_7
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATCHER_GIANT_BOULDER_7
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATCHER_GIANT_DIAMOND_7
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATCHER_GIANT_LASER_7
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATCHER_LIVID_6
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATCHER_LIVID_7
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATCHER_SCARF_4
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATCHER_SCARF_5
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATCHER_SCARF_6
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATCHER_SCARF_7
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATCHER_SPIRIT_BEAR_5
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATCHER_SUMMON_UNDEAD_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATCHER_SUMMON_UNDEAD_2
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATCHER_SUMMON_UNDEAD_3
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATCHER_SUMMON_UNDEAD_4
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATCHER_SUMMON_UNDEAD_5
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATCHER_SUMMON_UNDEAD_6
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATCHER_SUMMON_UNDEAD_7
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATCHER_SUMMON_UNDEAD_8
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WATER_HYDRA_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WEREWOLF_50
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WITHER_DEFENDER_GUARD_200
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WITHER_GUARD_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WITHER_MINER_100
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WITHER_SKELETON_70
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## WITHER_SPECTRE_70
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## YETI_175
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## ZOMBIE_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## ZOMBIE_15
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## ZOMBIE_COMMANDER_110
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## ZOMBIE_COMMANDER_120
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## ZOMBIE_DEEP_20
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## ZOMBIE_GRUNT_40
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## ZOMBIE_GRUNT_60
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## ZOMBIE_GRUNT_70
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## ZOMBIE_KNIGHT_106
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## ZOMBIE_KNIGHT_116
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## ZOMBIE_KNIGHT_126
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## ZOMBIE_KNIGHT_86
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## ZOMBIE_KNIGHT_96
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## ZOMBIE_LORD_150
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## ZOMBIE_SOLDIER_103
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## ZOMBIE_SOLDIER_113
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## ZOMBIE_SOLDIER_123
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## ZOMBIE_SOLDIER_83
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## ZOMBIE_SOLDIER_93
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

## ZOMBIE_VILLAGER_1
- **Type:** `NUMERICAL, RANGE`
- **Description:** Captured soul count, supports ranges

