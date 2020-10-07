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
            request.data = btoa(JSON.stringify(request.data));
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
                resolve: (data: any) => {
                    var players: Player[] = data.map(p => {
                        let player: Player = {
                            name: p[0],
                            uuid: p[1],
                            iconUrl: "https://crafatar.com/avatars/" + p[1]
                        };
                        return player;
                    })
                    resolve(players);
                },
                reject: (error) => {
                    apiErrorHandler(RequestType.SEARCH, error, searchText)
                },
                data: searchText
            }
            sendRequest(request);
        })
    }

    let getItemDetails = (itemName: string): Promise<Item> => {
        return new Promise((resolve, reject) => {
            sendRequest({
                mId: requestCounter++,
                type: RequestType.ITEM_DETAILS,
                resolve: (data: any) => {
                    resolve({
                        name: data.AltNames[0],
                        category: data.Category,
                        iconUrl: data.IconUrl || '/barrier.png',
                        tier: data.Tier,
                        description: data.Description
                    })
                },
                reject: (error) => {
                    apiErrorHandler(RequestType.ITEM_DETAILS, error, itemName)
                },
                data: itemName
            });
        })
    }

    let getItemPrices = (itemName: string, fetchStart: Date, reforge?: Reforge, enchantmentFilter?: EnchantmentFilter): Promise<ItemPriceData[]> => {
        return new Promise((resolve, reject) => {
            let requestData = {
                name: itemName,
                start: Math.round(fetchStart.getTime() / 1000),
                reforge: reforge ? reforge.id : undefined,
                enchantments: enchantmentFilter ? [[enchantmentFilter.enchantment.id, enchantmentFilter.level]] : undefined
            };
            sendRequest({
                mId: requestCounter++,
                type: RequestType.ITEM_PRICES,
                resolve: (data: any) => {
                    resolve(data.map((priceData: any) => {
                        return {
                            end: new Date(priceData.end),
                            price: priceData.price
                        } as ItemPriceData;
                    }));
                },
                reject: (error) => {
                    apiErrorHandler(RequestType.ITEM_PRICES, error, requestData)
                },
                data: requestData
            });
        })
    }

    return {
        websocket: websocket,
        search: search,
        getItemDetails: getItemDetails,
        getItemPrices: getItemPrices
    }
}

let api = initAPI();

export default api;