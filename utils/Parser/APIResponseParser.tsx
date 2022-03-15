import api from '../../api/ApiHelper'
import { Subscription, SubscriptionType } from '../../api/ApiTypes.d'
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

export function parseItemPriceData(priceData: any): ItemPriceData {
    return {
        filterable: priceData.filterable,
        prices: priceData.prices?.map(price => {
            return parseItemPrice(price)
        }),
        filters: priceData.filters
    }
}

export function parseItem(item: any): Item {
    return {
        tag: item.tag,
        name: item.altNames && item.altNames[0] && item.altNames[0].Name ? item.altNames[0].Name : item.name,
        category: item.category,
        iconUrl: item.iconUrl || item.icon,
        tier: item.tier,
        description: item.description,
        bazaar: item.bazaar
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
        getParams: item.type === 'filter' ? '?' + item.id.split('?')[1] + '&apply=true' : '',
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
            highestBid: auctionDetails.bids[0],
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
        type: _getTypeFromSubTypes(parseSubscriptionTypes(subscription.type))
    }
}

export function mapStripeProducts(products: any, prices: Price[]): Promise<Product[]> {
    return new Promise((resolve, reject) => {
        resolve(
            products.data
                .filter((product: any) => product.active)
                .map((product: any) => {
                    const price = prices.find(price => price.productId === product.id)
                    if (!price) {
                        reject(`price for product ${product.id} not found`)
                    }
                    return {
                        paymentProviderName: 'stripe',
                        itemId: product.id,
                        description: product.description,
                        title: product.name,
                        premiumDuration: parseInt(product.metadata.days),
                        price
                    }
                })
        )
    })
}

export function mapStripePrices(prices: any): Price[] {
    return prices.data.map((price: any) => {
        return {
            productId: price.product,
            currency: price.currency.toUpperCase(),
            value: price.unit_amount / 100.0
        }
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
    parsedFlip.item.iconUrl = api.getItemImageUrl(parsedFlip.item);

    return parsedFlip;
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
        refId: refInfo.refId,
        count: refInfo.count,
        receivedHours: refInfo.receivedHours,
        receivedTime: refInfo.receivedTime,
        bougthPremium: refInfo.bougthPremium
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
        requiredCollection: craft.reqCollection ? {
            name: craft.reqCollection.name,
            level: craft.reqCollection.level
        } : null,
        requiredSlayer: craft.reqSlayer ? {
            name: craft.reqSlayer.name,
            level: craft.reqSlayer.level
        } : null,
    } as ProfitableCraft
    c.item.name = convertTagToName(c.item.tag);
    c.ingredients.forEach(i => {
        i.item.name = convertTagToName(i.item.tag);
        i.item.iconUrl = api.getItemImageUrl(i.item);
    })
    c.item.name = convertTagToName(c.item.name);
    c.item.iconUrl = api.getItemImageUrl(c.item);
    return c;
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
