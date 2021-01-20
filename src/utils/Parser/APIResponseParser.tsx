import { v4 as generateUUID } from 'uuid';
import { Subscription, SubscriptionType } from '../../api/ApiTypes.d';

export function parseItemBidForList(bid: any): BidForList {
    return {
        uuid: bid.uuid,
        end: new Date(bid.end),
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
        timestamp: new Date(bid.timestamp),
        profileId: bid.profileId,
        bin: bid.bin
    } as ItemBid
}

export function parseAuction(auction: any): Auction {
    return {
        uuid: auction.uuid,
        end: new Date(auction.end),
        item: {
            tag: auction.tag,
            name: auction.itemName
        },
        startingBid: auction.startingBid,
        highestBid: auction.highestBid,
        bin: auction.bin
    } as Auction
}

export function parsePlayerDetails(playerDetails: any): PlayerDetails {
    return {
        bids: playerDetails.bids.map(bid => {
            return {
                uuid: bid.uuid,
                highestOwn: bid.highestOwn,
                end: new Date(bid.end),
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
                end: new Date(auction.end),
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
        time: new Date(priceData.time),
        avg: priceData.avg,
        max: priceData.max,
        min: priceData.min,
        volume: priceData.volume
    } as ItemPrice;
}

export function parseItemPriceData(priceData: any): ItemPriceData {
    return {
        filterable: priceData.filterable,
        prices: priceData.prices.map(price => {
            return parseItemPrice(price);
        })
    }
}

export function parseItem(item: any): Item {
    return {
        tag: item.tag,
        name: item.name,
        category: item.category,
        iconUrl: item.iconUrl,
        tier: item.tier,
        description: item.description
    }
}

export function parseEnchantment(enchantment: any): Enchantment {

    function formatEnchantmentName(enchantment: string): string {
        let formatted: string = enchantment.replaceAll("_", " ");
        formatted = capitalizeWords(formatted);
        return formatted;
    }

    function capitalizeWords(text: string): string {
        return text.replace(/\w\S*/g, function (txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    }

    return {
        id: enchantment.id || generateUUID(),
        level: enchantment.level,
        name: enchantment.type ? formatEnchantmentName(enchantment.type) : ""
    }
}

export function parseSearchResultItem(item: any): SearchResultItem {
    return {
        dataItem: {
            name: item.name,
            iconUrl: item.type === "item" ? item.iconUrl : item.iconUrl + "?size=32",
            uuid: item.id
        },
        type: item.type,
        route: item.type === "item" ? "/item/" + item.id : "/player/" + item.id,
        id: item.id
    }
}

export function parsePlayer(player: any): Player {
    if (typeof player === "string") {
        player = {
            uuid: player
        }
    }
    return {
        name: player.name,
        uuid: player.uuid,
        iconUrl: player.iconUrl ? player.iconUrl + "?size=32" : "https://crafatar.com/avatars/" + player.uuid + "?size=32"
    }
}

export function parseAuctionDetails(auctionDetails: any): AuctionDetails {
    return {
        auction: {
            uuid: auctionDetails.uuid,
            end: new Date(auctionDetails.end),
            highestBid: auctionDetails.bids[0],
            startingBid: auctionDetails.startingBid,
            item: {
                tag: auctionDetails.tag,
                name: auctionDetails.itemName,
                category: auctionDetails.category,
                tier: auctionDetails.tier
            },
            bin: auctionDetails.bin
        },
        start: new Date(auctionDetails.start),
        anvilUses: auctionDetails.anvilUses,
        auctioneer: parsePlayer(auctionDetails.auctioneerId),
        bids: auctionDetails.bids.map(bid => {
            return parseItemBid(bid);
        }),
        claimed: auctionDetails.claimed,
        coop: auctionDetails.coop,
        count: auctionDetails.count,
        enchantments: auctionDetails.enchantments.map(enchantment => {
            return parseEnchantment(enchantment);
        }),
        profileId: auctionDetails.profileId,
        reforge: auctionDetails.reforge,
        nbtData: auctionDetails.nbtData.Data
    }
}

export function parseSubscriptionTypes(typeInNumeric: number): SubscriptionType[] {

    let keys = Object.keys(SubscriptionType);
    let subTypes: SubscriptionType[] = [];

    for (let i = keys.length; i >= 0; i--) {
        let enumValue = SubscriptionType[keys[i]];
        if (typeof SubscriptionType[enumValue] === 'number') {
            let number = parseInt(SubscriptionType[enumValue]);
            if (number <= typeInNumeric && number > 0) {
                typeInNumeric -= number;
                subTypes.push(SubscriptionType[number.toString()]);
            }
        }
    }

    return subTypes;
}

function _getTypeFromSubTypes(subTypes: SubscriptionType[]) {
    var isItem = true;
    subTypes.forEach(subtype => {
        if (subtype === SubscriptionType.OUTBID || subtype === SubscriptionType.SOLD || subtype === SubscriptionType.BIN) {
            isItem = false;
        }
    });
    return isItem ? "item" : "player";
}

export function parseSubscription(subscription: any): Subscription {
    return {
        price: subscription.price,
        topicId: subscription.topicId,
        types: parseSubscriptionTypes(subscription.type),
        type: _getTypeFromSubTypes(parseSubscriptionTypes(subscription.type))
    }
}