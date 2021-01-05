import { v4 as generateUUID } from 'uuid';

export function parseItemBidForList(bid: any): BidForList {
    return {
        uuid: bid.uuid,
        end: new Date(bid.end),
        item: {
            name: bid.itemName,
            tag: bid.tag
        },
        highestBid: bid.highestBid,
        highestOwn: bid.highestOwn
    } as BidForList
}

export function parseItemBid(bid: any): ItemBid {
    return {
        auctionId: bid.auctionId,
        amount: bid.amount,
        bidder: parsePlayer(bid.bidder),
        timestamp: bid.timestap,
        profileId: bid.profileId
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
        highestBid: auction.highestBid
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
                }
            } as Auction
        })
    } as PlayerDetails
}

export function parseItemPriceData(priceData: any): ItemPriceData {
    return {
        end: new Date(priceData.end),
        price: priceData.price
    } as ItemPriceData;
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
            iconUrl: item.iconUrl,
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
        iconUrl: player.iconUrl || "https://crafatar.com/avatars/" + player.uuid
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
            }
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
        reforge: auctionDetails.reforge
    }
}