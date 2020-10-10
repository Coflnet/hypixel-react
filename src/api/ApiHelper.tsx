import { parseAuction, parseItem, parseItemBid, parseItemPriceData, parsePlayer, parsePlayerDetails } from "../utils/APIResponseParser";

enum RequestType {
    SEARCH = "search",
    PLAYER_DETAIL = "playerDetails",
    ITEM_PRICES = "itemPrices",
    AUCTION_DETAILS = "auctionDetails",
    ITEM_DETAILS = "itemDetails",
    PLAYER_AUCTION = "playerAuctions",
    PLAYER_BIDS = "playerBids"
}

interface ApiRequest {
    mId: number,
    type: RequestType,
    data: any,
    resolve: Function,
    reject: Function
}

function initAPI(): API {

    const requests: ApiRequest[] = [];
    let requestCounter: number = 0;

    let initWebsocket = (): WebSocket => {
        let websocket = new WebSocket("wss://skyblock-backend.coflnet.com/skyblock");
        websocket.onopen = onWebsocketOpen;
        websocket.onclose = onWebsocketClose;
        websocket.onerror = onWebsocketError;
        websocket.onmessage = onWebsocketMessage;
        return websocket;
    };

    let onWebsocketOpen = (): void => {
        console.log("Websocket open");
    };

    let onWebsocketClose = (): void => {
        console.log("Websocket closed");
    };

    let onWebsocketError = (e: Event): void => {
        console.error(e)
    };

    let onWebsocketMessage = (e: MessageEvent): void => {
        var response: any = JSON.parse(e.data);
        let request: ApiRequest | undefined = requests.find(e => e.mId === response.mId);
        if (!request) {
            return;
        }
        delete response.mId;
        if (response.type.includes("error")) {
            request.reject(response.data);
        } else {
            request.resolve(JSON.parse(response.data));
        }
    };

    let apiErrorHandler = (requestType: RequestType, errorMessage: string, requestData: any) => {
        console.error("-----------------------------------------------------------------------------------------------")
        console.error("API returned error! RequestType: " + requestType)
        console.error(errorMessage)
        console.error("Request-Data: ")
        console.error(requestData);
        console.error("-----------------------------------------------------------------------------------------------")
    }

    const websocket: WebSocket = initWebsocket();

    let sendRequest = (request: ApiRequest): void => {
        if (websocket.readyState === WebSocket.OPEN) {
            try {
                request.data = btoa(JSON.stringify(request.data));
            } catch (error) {
                throw new Error("couldnt btoa this data: " + request.data);
            }
            requests.push(request);
            websocket.send(JSON.stringify(request));
        } else if (websocket.readyState === WebSocket.CONNECTING) {
            setTimeout(() => {
                sendRequest(request);
            }, 1000);
        }
    }

    let search = (searchText: string): Promise<Player[]> => {
        return new Promise((resolve, reject) => {
            var request: ApiRequest = {
                mId: requestCounter++,
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
            }
            sendRequest(request);
        })
    }

    let getItemDetails = (itemName: string): Promise<Item> => {
        return new Promise((resolve, reject) => {
            sendRequest({
                mId: requestCounter++,
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
                enchantments: enchantmentFilter ? [[enchantmentFilter.enchantment.id, enchantmentFilter.level]] : undefined
            };
            sendRequest({
                mId: requestCounter++,
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
            sendRequest({
                mId: requestCounter++,
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
            sendRequest({
                mId: requestCounter++,
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
            sendRequest({
                mId: requestCounter++,
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

    return {
        websocket: websocket,
        search: search,
        getItemDetails: getItemDetails,
        getItemPrices: getItemPrices,
        getPlayerDetails: getPlayerDetails,
        getAuctions: getAuctions,
        getBids: getBids
    }
}

let api = initAPI();

export default api;