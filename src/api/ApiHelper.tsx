import { parseAuction, parseAuctionDetails, parseEnchantment, parseItem, parseItemBidForList, parseItemPriceData, parsePlayerDetails, parseSearchResultItem } from "../utils/Parser/APIResponseParser";
import { RequestType } from "./ApiTypes.d";
import { websocketHelper } from './WebsocketHelper';
import cookie from 'cookie';
import { v4 as generateUUID } from 'uuid';

function initAPI(): API {

    let apiErrorHandler = (requestType: RequestType, errorMessage: string, requestData: any) => {
        console.error("-----------------------------------------------------------------------------------------------")
        console.error("API returned error! RequestType: " + requestType)
        console.error(errorMessage)
        console.error("Request-Data: ")
        console.error(requestData);
        console.error("-----------------------------------------------------------------------------------------------")
    }

    let search = (searchText: string): Promise<SearchResultItem[]> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.SEARCH,
                data: searchText,
                resolve: (items: any) => {
                    resolve(items.map((item: any) => {
                        return parseSearchResultItem(item);
                    }));
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.SEARCH, error, searchText)
                }
            });
        })
    }

    let getItemImageUrl = (item: Item): Promise<string> => {

        return new Promise((resolve, reject) => {
            if (item.tag !== null) {
                let prefixes = ["PET", "POTION", "RUNE"];
                let isSimple = true;
                prefixes.forEach(p => {
                    if (!item.tag || item.tag?.startsWith(p))
                        isSimple = false;
                });
                // resolve early
                if (isSimple)
                    resolve("https://sky.lea.moe/item/" + item.tag)
            }

            return getItemDetails(item.tag || item.name!).then(itemDetails => {
                if (!itemDetails.iconUrl) {
                    resolve("https://sky.lea.moe/item/" + itemDetails.tag)
                } else {
                    resolve(itemDetails.iconUrl || "")
                }
            });
        });
    }

    let getItemDetails = (itemTagOrName: string): Promise<Item> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.ITEM_DETAILS,
                data: itemTagOrName,
                resolve: (item: any) => {
                    resolve(parseItem(item))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.ITEM_DETAILS, error, itemTagOrName)
                }
            });
        })
    }

    let getItemPrices = (itemTagOrName: string, fetchStart: number, reforge?: Reforge, enchantmentFilter?: EnchantmentFilter): Promise<ItemPriceData[]> => {
        return new Promise((resolve) => {
            let requestData = {
                name: itemTagOrName,
                start: Math.round(fetchStart / 100000) * 100,
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

    let getBids = (uuid: string, amount: number, offset: number): Promise<BidForList[]> => {
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
                        return parseItemBidForList(bid);
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
                        return parseEnchantment({
                            type: enchantment,
                            id: i + 1
                        });
                    }))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.ALL_ENCHANTMENTS, error, "");
                }
            })
        })
    }

    let trackSearch = (fullSearchId: string, fullSearchType: string): void => {
        let requestData = {
            id: fullSearchId,
            type: fullSearchType
        };
        websocketHelper.sendRequest({
            type: RequestType.TRACK_SEARCH,
            data: requestData,
            resolve: () => { },
            reject: (error: any) => {
                apiErrorHandler(RequestType.TRACK_SEARCH, error, requestData);
            }
        })
    }

    let getAuctionDetails = (auctionUUID: string): Promise<AuctionDetails> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.AUCTION_DETAILS,
                data: auctionUUID,
                resolve: (auctionDetails) => {
                    resolve(parseAuctionDetails(auctionDetails));
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.AUCTION_DETAILS, error, auctionUUID);
                }
            })
        })
    }

    let getPlayerName = (uuid: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.PLAYER_NAME,
                data: uuid,
                resolve: (name) => {
                    resolve(name);
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.PLAYER_NAME, error, uuid);
                }
            })
        });
    }

    let setConnectionId = () => {
        let cookies = cookie.parse(document.cookie);
        cookies.websocketUUID = cookies.websocketUUID || generateUUID();
        document.cookie = cookie.serialize("websocketUUID", cookies.websocketUUID, { expires: new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()) });

        websocketHelper.sendRequest({
            type: RequestType.SET_CONNECTION_ID,
            data: cookies.websocketUUID,
            resolve: () => { },
            reject: (error: any) => {
                apiErrorHandler(RequestType.SET_CONNECTION_ID, error, cookies.websocketUUID);
            }
        })
    }

    return {
        search: search,
        trackSearch: trackSearch,
        getItemDetails: getItemDetails,
        getItemPrices: getItemPrices,
        getPlayerDetails: getPlayerDetails,
        getAuctions: getAuctions,
        getBids: getBids,
        getEnchantments: getEnchantments,
        getAuctionDetails: getAuctionDetails,
        getItemImageUrl: getItemImageUrl,
        getPlayerName: getPlayerName,
        setConnectionId: setConnectionId
    }
}

let api = initAPI();

export default api;