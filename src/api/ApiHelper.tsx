import { parseAuction, parseEnchantment, parseItem, parseItemBid, parseItemPriceData, parsePlayer, parsePlayerDetails } from "../utils/Parser/APIResponseParser";
import { RequestType } from "./ApiTypes.d";
import { websocketHelper } from './WebsocketHelper';

function initAPI(): API {

    let apiErrorHandler = (requestType: RequestType, errorMessage: string, requestData: any) => {
        console.error("-----------------------------------------------------------------------------------------------")
        console.error("API returned error! RequestType: " + requestType)
        console.error(errorMessage)
        console.error("Request-Data: ")
        console.error(requestData);
        console.error("-----------------------------------------------------------------------------------------------")
    }

    let search = (searchText: string): Promise<Player[]> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.SEARCH,
                data: searchText,
                resolve: (players: any) => {
                    resolve(players.map((player: any) => {
                        return parsePlayer(player);
                    }));
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.SEARCH, error, searchText)
                }
            });
        })
    }

    let getItemDetails = (itemName: string): Promise<Item> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.ITEM_DETAILS,
                data: itemName,
                resolve: (item: any) => {
                    resolve(parseItem(item))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.ITEM_DETAILS, error, itemName)
                }
            });
        })
    }

    let getItemPrices = (itemName: string, fetchStart: number, reforge?: Reforge, enchantmentFilter?: EnchantmentFilter): Promise<ItemPriceData[]> => {
        return new Promise((resolve, reject) => {
            let requestData = {
                name: itemName,
                start: Math.round(fetchStart / 1000),
                reforge: reforge ? reforge.id : undefined,
                enchantments: enchantmentFilter && enchantmentFilter.enchantment && enchantmentFilter.level ? [[enchantmentFilter.enchantment.id, enchantmentFilter.level]] : undefined
            };
            websocketHelper.sendRequest({
                type: RequestType.ITEM_PRICES,
                data: requestData,
                resolve: (data: any) => {
                    resolve(data.map((priceData: any) => {
                        return parseItemPriceData(priceData);
                    }));
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.ITEM_PRICES, error, requestData)
                }
            });
        })
    }

    let getPlayerDetails = (playerUUID: string): Promise<PlayerDetails> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.PLAYER_DETAIL,
                data: playerUUID,
                resolve: (playerData: any) => {
                    resolve(parsePlayerDetails(playerData));
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.PLAYER_DETAIL, error, playerUUID)
                }
            })
        });
    }

    let getAuctions = (uuid: string, amount: number, offset: number): Promise<Auction[]> => {
        return new Promise((resolve, reject) => {
            let requestData = {
                uuid: uuid,
                amount: amount,
                offset: offset
            };
            websocketHelper.sendRequest({
                type: RequestType.PLAYER_AUCTION,
                data: requestData,
                resolve: (auctions: any) => {
                    resolve(auctions.map((auction: any) => {
                        return parseAuction(auction);
                    }))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.PLAYER_AUCTION, error, requestData);
                }
            })
        });
    }

    let getBids = (uuid: string, amount: number, offset: number): Promise<ItemBid[]> => {
        return new Promise((resolve, reject) => {
            let requestData = {
                uuid: uuid,
                amount: amount,
                offset: offset
            };
            websocketHelper.sendRequest({
                type: RequestType.PLAYER_BIDS,
                data: requestData,
                resolve: (bids: any) => {
                    resolve(bids.map((bid: any) => {
                        return parseItemBid(bid);
                    }));
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.PLAYER_BIDS, error, requestData);
                }
            })
        });
    }

    let getEnchantments = (): Promise<Enchantment[]> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.ALL_ENCHANTMENTS,
                data: "",
                resolve: (enchantments: any) => {
                    resolve(enchantments.map((enchantment: any, i: number) => {
                        return parseEnchantment(enchantment, i);
                    }))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.ALL_ENCHANTMENTS, error, "");
                }
            })
        })
    }

    return {
        search: search,
        getItemDetails: getItemDetails,
        getItemPrices: getItemPrices,
        getPlayerDetails: getPlayerDetails,
        getAuctions: getAuctions,
        getBids: getBids,
        getEnchantments: getEnchantments
    }
}

let api = initAPI();

export default api;