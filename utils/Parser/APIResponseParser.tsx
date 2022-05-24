import api from '../../api/ApiHelper'
import { Subscription, SubscriptionType } from '../../api/ApiTypes.d'
import { hasFlag } from '../../components/FilterElement/FilterType'
import { getFlipFinders } from '../FlipUtils'
import { convertTagToName } from '../Formatter'

export function parseItemBidForList(bid: any): BidForList {
    return {
        uuid: bid.uuid,
        end: parseDate(bid.end),
        item: {
            name: bid.itemName,
            tag: bid.tag
        },
        highestBid: bid.highestBid,
        highestOwn: bid.highestOwn,
        bin: bid.bin
    } as BidForList
}

export function parseItemBid(bid: any): ItemBid {
    return {
        auctionId: bid.auctionId,
        amount: bid.amount,
        bidder: parsePlayer(bid.bidder),
        timestamp: parseDate(bid.timestamp),
        profileId: bid.profileId,
        bin: bid.bin
    } as ItemBid
}

export function parseAuction(auction: any): Auction {
    let parsedAuction = {
        uuid: auction.uuid,
        end: parseDate(auction.end),
        item: {
            tag: auction.tag,
            name: auction.itemName || auction.name
        },
        startingBid: auction.startingBid,
        highestBid: auction.highestBid,
        bin: auction.bin
    } as Auction

    parsedAuction.item.iconUrl = api.getItemImageUrl(parsedAuction.item)

    return parsedAuction
}

export function parsePlayerDetails(playerDetails: any): PlayerDetails {
    return {
        bids: playerDetails.bids.map(bid => {
            return {
                uuid: bid.uuid,
                highestOwn: bid.highestOwn,
                end: parseDate(bid.end),
                highestBid: bid.highestBid,
                item: {
                    tag: bid.tag,
                    name: bid.itemName
                }
            } as BidForList
        }),
        auctions: playerDetails.auctions.map(auction => {
            return {
                uuid: auction.auctionId,
                highestBid: auction.highestBid,
                end: parseDate(auction.end),
                item: {
                    tag: auction.tag,
                    name: auction.itemName
                },
                bin: auction.bin
            } as Auction
        })
    } as PlayerDetails
}

export function parseItemPrice(priceData: any): ItemPrice {
    return {
        time: parseDate(priceData.time),
        avg: priceData.avg,
        max: priceData.max,
        min: priceData.min,
        volume: priceData.volume
    } as ItemPrice
}

export function parseItem(item: any): Item {
    return {
        tag: item.tag,
        name: item.altNames && item.altNames[0] && item.altNames[0].Name ? item.altNames[0].Name : item.name,
        category: item.category,
        iconUrl: item.iconUrl || item.icon || api.getItemImageUrl(item),
        tier: item.tier,
        bazaar: hasFlag(item.flags, 1)
    }
}

function _formatName(enchantment: string): string {
    let formatted: string = enchantment.replace(new RegExp('_', 'g'), ' ')
    formatted = _capitalizeWords(formatted)
    return formatted
}

function _capitalizeWords(text: string): string {
    return text.replace(/\w\S*/g, function (txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    })
}

export function parseEnchantment(enchantment: any): Enchantment {
    return {
        id: enchantment.id,
        level: enchantment.level,
        name: enchantment.type ? _formatName(enchantment.type) : '',
        color: enchantment.color
    }
}

export function parseReforge(reforge: any): Reforge {
    return {
        id: reforge.id,
        name: _formatName(reforge.name)
    }
}

export function parseSearchResultItem(item: any): SearchResultItem {
    let _getRoute = (): string => {
        switch (item.type) {
            case 'filter':
                return '/item/' + item.id.split('?')[0]
            case 'item':
                return '/item/' + item.id
            case 'player':
                return '/player/' + item.id
            case 'auction':
                return '/auction/' + item.id
        }
        return ''
    }

    return {
        dataItem: {
            name: item.name,
            iconUrl: item.img ? 'data:image/png;base64,' + item.img : item.type === 'item' ? item.iconUrl : item.iconUrl + '?size=8'
        },
        type: item.type,
        route: _getRoute(),
        urlSearchParams: item.type === 'filter' ? new URLSearchParams(item.id.split('?')[1] + '&apply=true') : undefined,
        id: item.id
    }
}

export function parsePlayer(player: any): Player {
    if (typeof player === 'string') {
        player = {
            uuid: player
        }
    }
    return {
        name: player.name,
        uuid: player.uuid,
        iconUrl: player.iconUrl ? player.iconUrl + '?size=8' : 'https://crafatar.com/avatars/' + player.uuid + '?size=8'
    }
}

export function parseAuctionDetails(auctionDetails: any): AuctionDetails {
    return {
        auction: {
            uuid: auctionDetails.uuid,
            end: parseDate(auctionDetails.end),
            highestBid: auctionDetails.highestBidAmount,
            startingBid: auctionDetails.startingBid,
            item: parseItem(auctionDetails),
            bin: auctionDetails.bin
        },
        start: parseDate(auctionDetails.start),
        anvilUses: auctionDetails.anvilUses,
        auctioneer: parsePlayer(auctionDetails.auctioneer),
        bids: auctionDetails.bids.map(bid => {
            return parseItemBid(bid)
        }),
        claimed: auctionDetails.claimed,
        coop: auctionDetails.coop,
        count: auctionDetails.count,
        enchantments: auctionDetails.enchantments.map(enchantment => {
            return parseEnchantment(enchantment)
        }),
        profileId: auctionDetails.profileId,
        reforge: auctionDetails.reforge,
        nbtData: auctionDetails.flatNbt ? auctionDetails.flatNbt : undefined,
        itemCreatedAt: parseDate(auctionDetails.itemCreatedAt)
    }
}

export function parseSubscriptionTypes(typeInNumeric: number): SubscriptionType[] {
    let keys = Object.keys(SubscriptionType)
    let subTypes: SubscriptionType[] = []

    for (let i = keys.length; i >= 0; i--) {
        let enumValue = SubscriptionType[keys[i]]
        if (typeof SubscriptionType[enumValue] === 'number') {
            let number = parseInt(SubscriptionType[enumValue])
            if (number <= typeInNumeric && number > 0) {
                typeInNumeric -= number
                subTypes.push(SubscriptionType[number.toString()])
            }
        }
    }

    return subTypes
}

function _getTypeFromSubTypes(subTypes: SubscriptionType[]): string {
    let type = ''
    switch (SubscriptionType[subTypes[0].toString()]) {
        case SubscriptionType.BIN:
        case SubscriptionType.PRICE_HIGHER_THAN:
        case SubscriptionType.PRICE_LOWER_THAN:
            type = 'item'
            break
        case SubscriptionType.OUTBID:
        case SubscriptionType.SOLD:
            type = 'player'
            break
        case SubscriptionType.AUCTION:
            type = 'auction'
            break
    }
    return type
}

export function parseSubscription(subscription: any): Subscription {
    return {
        price: subscription.price,
        topicId: subscription.topicId,
        types: parseSubscriptionTypes(subscription.type),
        type: _getTypeFromSubTypes(parseSubscriptionTypes(subscription.type)),
        filter: subscription.filter ? JSON.parse(subscription.filter) : undefined
    }
}

export function parseProducts(products: any): Product[] {
    return products.map((product: any) => {
        return {
            productId: product.slug,
            description: product.description,
            title: product.title,
            ownershipSeconds: product.ownershipSeconds,
            cost: product.cost
        } as Product
    })
}

export function parseRecentAuction(auction): RecentAuction {
    return {
        end: parseDate(auction.end),
        playerName: auction.playerName,
        price: auction.price,
        seller: parsePlayer(auction.seller),
        uuid: auction.uuid
    }
}

export function parseFlipAuction(flip): FlipAuction {
    let parsedFlip = {
        showLink: true,
        median: flip.median,
        cost: flip.cost,
        uuid: flip.uuid,
        volume: flip.volume,
        bin: flip.bin,
        item: {
            tag: flip.tag,
            name: flip.name,
            tier: flip.tier
        },
        secondLowestBin: flip.secondLowestBin,
        sold: flip.sold,
        sellerName: flip.sellerName,
        lowestBin: flip.lowestBin,
        props: flip.prop,
        finder: flip.finder
    } as FlipAuction
    parsedFlip.item.iconUrl = api.getItemImageUrl(parsedFlip.item)

    return parsedFlip
}

export function parsePopularSearch(search): PopularSearch {
    return {
        title: search.title,
        url: search.url,
        img: search.img
    }
}

export function parseRefInfo(refInfo): RefInfo {
    return {
        oldInfo: {
            refId: refInfo.oldInfo.refId,
            count: refInfo.oldInfo.count,
            receivedHours: refInfo.oldInfo.receivedHours,
            receivedTime: refInfo.oldInfo.receivedTime,
            bougthPremium: refInfo.oldInfo.bougthPremium
        },
        purchasedCoins: refInfo.purchasedCoins,
        referedCount: refInfo.referedCount,
        validatedMinecraft: refInfo.validatedMinecraft,
        referredBy: refInfo.referredBy
    }
}

export function parseFilterOption(filterOption): FilterOptions {
    return {
        name: filterOption.name,
        options: filterOption.options,
        type: filterOption.type
    }
}

export function parseAccountInfo(accountInfo): AccountInfo {
    return {
        email: accountInfo.email,
        mcId: accountInfo.mcId,
        mcName: accountInfo.mcName,
        token: accountInfo.token
    }
}

export function parseMinecraftConnectionInfo(minecraftConnectionInfo): MinecraftConnectionInfo {
    return {
        code: minecraftConnectionInfo.code,
        isConnected: minecraftConnectionInfo.isConnected
    }
}

export function parseDate(dateString: string) {
    if (!dateString) {
        return new Date()
    }
    if (dateString.slice(-1) === 'Z') {
        return new Date(dateString)
    }
    return new Date(dateString + 'Z')
}

export function parseCraftIngredient(ingredient): CraftingIngredient {
    return {
        cost: ingredient.cost,
        count: ingredient.count,
        item: {
            tag: ingredient.itemId
        }
    }
}

export function parseProfitableCraft(craft): ProfitableCraft {
    let c = {
        item: {
            tag: craft.itemId
        },
        craftCost: craft.craftCost,
        sellPrice: craft.sellPrice,
        ingredients: craft.ingredients.map(parseCraftIngredient),
        median: craft.median,
        volume: craft.volume,
        requiredCollection: craft.reqCollection
            ? {
                  name: craft.reqCollection.name,
                  level: craft.reqCollection.level
              }
            : null,
        requiredSlayer: craft.reqSlayer
            ? {
                  name: craft.reqSlayer.name,
                  level: craft.reqSlayer.level
              }
            : null
    } as ProfitableCraft
    c.item.name = convertTagToName(c.item.tag)
    c.ingredients.forEach(i => {
        i.item.name = convertTagToName(i.item.tag)
        i.item.iconUrl = api.getItemImageUrl(i.item)
    })
    c.item.name = convertTagToName(c.item.name)
    c.item.iconUrl = api.getItemImageUrl(c.item)
    return c
}

export function parseLowSupplyItem(item): LowSupplyItem {
    let lowSupplyItem = parseItem(item) as LowSupplyItem
    lowSupplyItem.supply = item.supply
    lowSupplyItem.medianPrice = item.median
    lowSupplyItem.volume = item.volume
    lowSupplyItem.iconUrl = api.getItemImageUrl(item)
    lowSupplyItem.name = convertTagToName(item.tag)
    return lowSupplyItem
}

export function parseSkyblockProfile(profile): SkyblockProfile {
    return {
        current: profile.current,
        cuteName: profile.cute_name,
        id: profile.profile_id
    }
}

export function parseCraftingRecipe(recipe): CraftingRecipe {
    return {
        A1: recipe.A1.split(':')[0],
        A2: recipe.A2.split(':')[0],
        A3: recipe.A3.split(':')[0],
        B1: recipe.B1.split(':')[0],
        B2: recipe.B2.split(':')[0],
        B3: recipe.B3.split(':')[0],
        C1: recipe.C1.split(':')[0],
        C2: recipe.C2.split(':')[0],
        C3: recipe.C3.split(':')[0]
    }
}

export function parseItemSummary(price): ItemPriceSummary {
    return {
        max: price.max,
        mean: price.mean,
        median: price.median,
        min: price.min,
        mode: price.mode,
        volume: price.volume
    }
}

export function parsePaymentResponse(payment): PaymentResponse {
    return {
        id: payment.id,
        directLink: payment.dirctLink
    } as PaymentResponse
}

export function parseKatFlip(katFlip): KatFlip {
    let flip = {
        coreData: {
            amount: katFlip.coreData.amount,
            cost: katFlip.coreData.cost,
            hours: katFlip.coreData.hours,
            item: {
                tag: katFlip.coreData.itemTag,
                name: katFlip.coreData.name,
                tier: katFlip.coreData.baseRarity
            },
            material: katFlip.coreData.material
        },
        cost: katFlip.purchaseCost + katFlip.materialCost + katFlip.upgradeCost,
        purchaseCost: katFlip.purchaseCost,
        materialCost: katFlip.materialCost,
        median: katFlip.median,
        originAuctionUUID: katFlip.originAuction,
        profit: katFlip.profit,
        referenceAuctionUUID: katFlip.referenceAuction,
        targetRarity: katFlip.targetRarity,
        upgradeCost: katFlip.upgradeCost,
        volume: katFlip.volume
    } as KatFlip
    flip.coreData.item.iconUrl = api.getItemImageUrl(flip.coreData.item)
    return flip
}

export function parseFlipTrackingFlip(flip): FlipTrackingFlip {
    let flipTrackingFlip = {
        item: {
            tag: flip?.itemTag,
            name: flip?.itemName || flip?.itemTag || '---',
            tier: flip?.tier
        },
        originAuction: flip?.originAuction,
        pricePaid: flip?.pricePaid,
        soldAuction: flip?.soldAuction,
        soldFor: flip?.soldFor,
        uId: flip?.uId,
        finder: getFlipFinders([flip.finder || 0])[0],
        sellTime: parseDate(flip?.sellTime),
        profit: flip?.profit
    } as FlipTrackingFlip
    flipTrackingFlip.item.iconUrl = api.getItemImageUrl(flipTrackingFlip?.item)
    return flipTrackingFlip
}

export function parseBazaarOrder(order): BazaarOrder {
    return {
        amount: order.amount,
        pricePerUnit: order.pricePerUnit,
        orders: order.orders
    }
}

export function parseBazaarSnapshot(snapshot): BazaarSnapshot {
    return {
        item: parseItem({ tag: snapshot.productId }),
        buyData: {
            orderCount: snapshot.buyOrdersCount,
            price: snapshot.buyPrice,
            volume: snapshot.buyVolume,
            moving: snapshot.buyMovingWeek
        },
        sellData: {
            orderCount: snapshot.sellOrdersCount,
            price: snapshot.sellPrice,
            volume: snapshot.sellVolume,
            moving: snapshot.sellMovingWeek
        },
        timeStamp: parseDate(snapshot.timeStamp),
        buyOrders: snapshot.buyOrders.map(parseBazaarOrder),
        sellOrders: snapshot.sellOrders.map(parseBazaarOrder)
    }
}

export function parseFlipTrackingResponse(flipTrackingResponse): FlipTrackingResponse {
    return {
        flips: flipTrackingResponse?.flips ? flipTrackingResponse.flips.map(parseFlipTrackingFlip) : [],
        totalProfit: flipTrackingResponse?.totalProfit || 0
    }
}

export function parseBazaarPrice(bazaarPrice): BazaarPrice {
    return {
        buyData: {
            max: bazaarPrice.maxBuy,
            min: bazaarPrice.minBuy,
            price: bazaarPrice.buy,
            volume: bazaarPrice.buyVolume,
            moving: bazaarPrice.buyMovingWeek
        },
        sellData: {
            max: bazaarPrice.maxSell,
            min: bazaarPrice.minSell,
            price: bazaarPrice.sell,
            volume: bazaarPrice.sellVolume,
            moving: bazaarPrice.sellMovingWeek
        },
        timestamp: parseDate(bazaarPrice.timestamp)
    }
}

export function parsePrivacySettings(privacySettings): PrivacySettings {
    return {
        allowProxy: privacySettings.allowProxy,
        autoStart: privacySettings.autoStart,
        chatRegex: privacySettings.chatRegex,
        collectChat: privacySettings.collectChat,
        collectChatClicks: privacySettings.collectChatClicks,
        collectEntities: privacySettings.collectEntities,
        collectInvClick: privacySettings.collectInvClick,
        collectInventory: privacySettings.collectInventory,
        collectLobbyChanges: privacySettings.collectLobbyChanges,
        collectScoreboard: privacySettings.collectScoreboard,
        collectTab: privacySettings.collectTab,
        commandPrefixes: privacySettings.commandPrefixes,
        extendDescriptions: privacySettings.extendDescriptions
    }
}
