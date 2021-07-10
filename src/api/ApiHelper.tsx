import { mapStripePrices, mapStripeProducts, parseAuction, parseAuctionDetails, parseEnchantment, parseFlipAuction, parseItem, parseItemBidForList, parseItemPriceData, parsePlayer, parsePlayerDetails, parsePopularSearch, parseRecentAuction, parseRefInfo, parseReforge, parseSearchResultItem, parseSubscription } from "../utils/Parser/APIResponseParser";
import { RequestType, SubscriptionType, Subscription } from "./ApiTypes.d";
import { websocketHelper } from './WebsocketHelper';
import { httpApi } from './HttpHelper';
import { v4 as generateUUID } from 'uuid';
import { Stripe } from "@stripe/stripe-js";
import { enchantmentAndReforgeCompare } from "../utils/Formatter";
import { googlePlayPackageName } from '../utils/GoogleUtils'
import { toast } from 'react-toastify';
import cacheUtils from "../utils/CacheUtils";

function initAPI(): API {

    setTimeout(() => {
        cacheUtils.checkForCacheClear();
    }, 20000);

    let apiErrorHandler = (requestType: RequestType, error: any, requestData: any = null) => {
        if (!error || !error.Message) {
            return;
        }

        toast.error(error.Message);
    }

    let search = (searchText: string): Promise<SearchResultItem[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendRequest({
                type: RequestType.SEARCH,
                data: searchText,
                resolve: (items: any) => {
                    resolve(items.map((item: any) => {
                        return parseSearchResultItem(item);
                    }));
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.SEARCH, error, searchText)
                    reject();
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
            }).catch(() => {
                reject();
            });
        });
    }

    let getItemDetails = (itemTagOrName: string): Promise<Item> => {
        return new Promise((resolve, reject) => {
            httpApi.sendRequest({
                type: RequestType.ITEM_DETAILS,
                data: itemTagOrName,
                resolve: (item: any) => {
                    resolve(parseItem(item))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.ITEM_DETAILS, error, itemTagOrName);
                    reject();
                }
            });
        })
    }

    let getItemPrices = (itemTagOrName: string, fetchStart: number, itemFilter?: ItemFilter): Promise<ItemPriceData> => {
        return new Promise((resolve, reject) => {
            let requestData = {
                name: itemTagOrName,
                start: Math.round(fetchStart / 100000) * 100,
                filter: itemFilter
            };
            httpApi.sendRequest({
                type: RequestType.ITEM_PRICES,
                data: requestData,
                resolve: (data: any) => {
                    resolve(parseItemPriceData(data));
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.ITEM_PRICES, error, requestData);
                    reject();
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
                    apiErrorHandler(RequestType.PLAYER_DETAIL, error, playerUUID);
                    reject();
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
            httpApi.sendLimitedCacheRequest({
                type: RequestType.PLAYER_AUCTION,
                data: requestData,
                resolve: (auctions: any) => {
                    resolve(auctions.map((auction: any) => {
                        return parseAuction(auction);
                    }))
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.PLAYER_AUCTION, error, requestData);
                    reject();
                }
            }, 2)
        });
    }

    let getBids = (uuid: string, amount: number, offset: number): Promise<BidForList[]> => {
        return new Promise((resolve, reject) => {
            let requestData = {
                uuid: uuid,
                amount: amount,
                offset: offset
            };
            httpApi.sendLimitedCacheRequest({
                type: RequestType.PLAYER_BIDS,
                data: requestData,
                resolve: (bids: any) => {
                    resolve(bids.map((bid: any) => {
                        return parseItemBidForList(bid);
                    }));
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.PLAYER_BIDS, error, requestData);
                    reject();
                }
            })
        });
    }

    let getEnchantments = (): Promise<Enchantment[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendRequest({
                type: RequestType.ALL_ENCHANTMENTS,
                data: "",
                resolve: (enchantments: any) => {
                    let parsedEnchantments: Enchantment[] = enchantments.map(enchantment => {
                        return parseEnchantment({
                            type: enchantment.label,
                            id: enchantment.id
                        });
                    });
                    parsedEnchantments = parsedEnchantments.filter(enchantment => {
                        return enchantment.name!.toLowerCase() !== 'unknown';
                    }).sort(enchantmentAndReforgeCompare)
                    resolve(parsedEnchantments);
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.ALL_ENCHANTMENTS, error, "");
                    reject();
                }
            })
        })
    }

    let getReforges = (): Promise<Reforge[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendRequest({
                type: RequestType.ALL_REFORGES,
                data: "",
                resolve: (reforges: any) => {
                    let parsedReforges: Reforge[] = reforges.map(reforge => {
                        return parseReforge({
                            name: reforge.label,
                            id: reforge.id
                        });
                    });
                    parsedReforges = parsedReforges.filter(reforge => {
                        return reforge.name!.toLowerCase() !== 'unknown';
                    }).sort(enchantmentAndReforgeCompare)
                    resolve(parsedReforges);
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.ALL_ENCHANTMENTS, error, "");
                    reject();
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
            httpApi.sendLimitedCacheRequest({
                type: RequestType.AUCTION_DETAILS,
                data: auctionUUID,
                resolve: (auctionDetails) => {
                    resolve(parseAuctionDetails(auctionDetails));
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.AUCTION_DETAILS, error, auctionUUID);
                    reject();
                }
            }, 2)
        })
    }

    let getPlayerName = (uuid: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            httpApi.sendRequest({
                type: RequestType.PLAYER_NAME,
                data: uuid,
                resolve: (name) => {
                    resolve(name);
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.PLAYER_NAME, error, uuid);
                    reject();
                }
            })
        });
    }

    let setConnectionId = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            let websocketUUID = generateUUID();

            websocketHelper.sendRequest({
                type: RequestType.SET_CONNECTION_ID,
                data: websocketUUID,
                resolve: () => {
                    resolve();
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.SET_CONNECTION_ID, error, websocketUUID);
                    reject();
                }
            })
        });
    }

    let getVersion = (): Promise<string> => {
        return new Promise((resolve, reject) => {
            httpApi.sendRequest({
                type: RequestType.GET_VERSION,
                data: "",
                resolve: (response: any) => {
                    resolve(response.toString());
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.GET_VERSION, error, "");
                    reject();
                }
            })
        });
    }

    let subscribe = (topic: string, types: SubscriptionType[], price?: number): Promise<void> => {
        return new Promise((resolve, reject) => {
            // Add none, so reduce works (doesnt change the result)
            types.push(SubscriptionType.NONE);

            let requestData = {
                topic: topic,
                price: price || undefined,
                type: types.reduce((a, b) => {
                    let aNum: number = typeof a === "number" ? (a as number) : (parseInt(SubscriptionType[a]));
                    let bNum: number = typeof b === "number" ? (b as number) : (parseInt(SubscriptionType[b]));
                    return aNum + bNum;
                })
            }
            websocketHelper.sendRequest({
                type: RequestType.SUBSCRIBE,
                data: requestData,
                resolve: () => {
                    resolve();
                },
                reject: (error) => {
                    reject(error);
                }
            })
        });
    }

    let unsubscribe = (subscription: Subscription): Promise<Number> => {
        return new Promise((resolve, reject) => {

            // Add none, so reduce works (doesnt change the result)
            subscription.types.push(SubscriptionType.NONE);

            let requestData = {
                topic: subscription.topicId,
                price: subscription.price,
                type: subscription.types.reduce((a, b) => {
                    let aNum: number = typeof a === "number" ? (a as number) : (parseInt(SubscriptionType[a]));
                    let bNum: number = typeof b === "number" ? (b as number) : (parseInt(SubscriptionType[b]));
                    return aNum + bNum;
                })
            }

            websocketHelper.sendRequest({
                type: RequestType.UNSUBSCRIBE,
                data: requestData,
                resolve: (response: any) => {
                    resolve(parseInt(response));
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.UNSUBSCRIBE, error, "");
                    reject();
                }
            })
        });
    }

    let getSubscriptions = (): Promise<Subscription[]> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.GET_SUBSCRIPTIONS,
                data: "",
                resolve: (response: any[]) => {
                    resolve(response.map(s => {
                        return parseSubscription(s)
                    }));
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.GET_SUBSCRIPTIONS, error, "");
                    reject();
                }
            })
        })
    }

    let hasPremium = (googleId: string): Promise<Date> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.PREMIUM_EXPIRATION,
                data: googleId,
                resolve: (premiumUntil) => {
                    resolve(new Date(premiumUntil));
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.PREMIUM_EXPIRATION, error, googleId);
                    reject();
                },
            })
        })
    }

    let pay = (stripePromise: Promise<Stripe | null>, product: Product): Promise<void> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.PAYMENT_SESSION,
                data: product.itemId,
                resolve: (sessionId: any) => {
                    stripePromise.then((stripe) => {
                        if (stripe) {
                            stripe.redirectToCheckout({ sessionId });
                            resolve();
                        }
                    })
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.PAYMENT_SESSION, error);
                    reject();
                },
            })
        })
    }

    let setGoogle = (id: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.SET_GOOGLE,
                data: id,
                resolve: () => {
                    resolve();
                },
                reject: (error: any) => {
                    reject();
                }
            })
        })
    }

    let setToken = (token: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.FCM_TOKEN,
                data: {
                    name: "",
                    token: token
                },
                resolve: () => {
                    resolve();
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.FCM_TOKEN, error, token);
                    reject();
                }
            })
        })
    }

    let getStripeProducts = (): Promise<Product[]> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.GET_STRIPE_PRODUCTS,
                data: null,
                resolve: (products: any) => {
                    getStripePrices().then((prices: Price[]) => {
                        resolve(mapStripeProducts(products, prices));
                    })
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.GET_STRIPE_PRODUCTS, error);
                    reject();
                }
            })
        })
    }

    let getStripePrices = (): Promise<Price[]> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.GET_STRIPE_PRICES,
                data: null,
                resolve: (prices: any) => resolve(mapStripePrices(prices)),
                reject: (error: any) => {
                    apiErrorHandler(RequestType.GET_STRIPE_PRICES, error);
                    reject();
                }
            })

        })
    }

    let validatePaymentToken = (token: string, productId: string, packageName = googlePlayPackageName): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.VALIDATE_PAYMENT_TOKEN,
                data: { token, productId, packageName },
                resolve: (data: any) => resolve(true),
                reject: (error: any) => {
                    apiErrorHandler(RequestType.VALIDATE_PAYMENT_TOKEN, error);
                    reject(false);
                }
            })
        });
    }

    let getRecentAuctions = (itemTagOrName: string, fetchStart: number, itemFilter?: ItemFilter): Promise<RecentAuction[]> => {
        return new Promise((resolve, reject) => {

            let requestData = {
                name: itemTagOrName,
                start: Math.round(fetchStart / 100000) * 100,
                filter: itemFilter
            };
            httpApi.sendLimitedCacheRequest({
                type: RequestType.RECENT_AUCTIONS,
                data: requestData,
                resolve: (data: any) => {
                    resolve(data.map(a => parseRecentAuction(a)));
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.RECENT_AUCTIONS, error, requestData);
                    reject();
                }
            })
        });
    }

    let getFlips = (): Promise<FlipAuction[]> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.GET_FLIPS,
                data: "",
                resolve: (data: any) => {
                    resolve(data.map(a => parseFlipAuction(a)));
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.RECENT_AUCTIONS, error, "");
                    reject();
                }
            })
        });
    }

    let subscribeFlips = (flipCallback: Function, soldCallback?: Function) => {
        return new Promise((resolve, reject) => {
            websocketHelper.subscribe({
                type: RequestType.SUBSCRIBE_FLIPS,
                data: "",
                callback: function (data) {
                    if (!data) {
                        return;
                    }
                    if (!data.uuid && soldCallback) {
                        soldCallback(data);
                        return;
                    }
                    flipCallback(parseFlipAuction(data));
                }
            })
        });
    }

    let getFilter = (name: string): Promise<FilterOptions> => {
        return new Promise((resolve, reject) => {
            httpApi.sendRequest({
                type: RequestType.GET_FILTER,
                data: name,
                resolve: (data: any) => {
                    resolve(data);
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.GET_FILTER, error, name);
                }
            })
        })
    }

    let getNewPlayers = (): Promise<Player[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendLimitedCacheRequest({
                type: RequestType.NEW_PLAYERS,
                data: "",
                resolve: function (data) {
                    resolve(data.map(p => parsePlayer(p)));
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.NEW_PLAYERS, error, "");
                    reject();
                }
            }, 5);
        });
    }

    let getNewItems = (): Promise<Item[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendLimitedCacheRequest({
                type: RequestType.NEW_ITEMS,
                data: "",
                resolve: function (data) {
                    resolve(data.map(i => parseItem(i)));
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.NEW_ITEMS, error, "");
                    reject();
                }
            }, 15);
        });
    }

    let getPopularSearches = (): Promise<PopularSearch[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendLimitedCacheRequest({
                type: RequestType.POPULAR_SEARCHES,
                data: "",
                resolve: function (data) {
                    resolve(data.map(s => parsePopularSearch(s)));
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.POPULAR_SEARCHES, error, "");
                    reject();
                }
            }, 5);
        });
    }

    let getEndedAuctions = (): Promise<Auction[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendLimitedCacheRequest({
                type: RequestType.ENDED_AUCTIONS,
                data: "",
                resolve: function (data) {
                    resolve(data.map(a => parseAuction(a)));
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.ENDED_AUCTIONS, error, "");
                    reject();
                }
            }, 1);
        });
    }

    let getNewAuctions = (): Promise<Auction[]> => {
        return new Promise((resolve, reject) => {
            httpApi.sendLimitedCacheRequest({
                type: RequestType.NEW_AUCTIONS,
                data: "",
                resolve: function (data) {
                    resolve(data.map(a => parseAuction(a)));
                },
                reject: function (error) {
                    apiErrorHandler(RequestType.NEW_AUCTIONS, error, "");
                    reject();
                }
            }, 1);
        })
    }

    let getFlipBasedAuctions = (flipUUID: string): Promise<Auction[]> => {
        return new Promise((resolve, reject) => {

            websocketHelper.sendRequest({
                type: RequestType.GET_FLIP_BASED_AUCTIONS,
                data: flipUUID,
                resolve: (data: any) => {
                    resolve(data.map(a => parseAuction(a)));
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.GET_FLIP_BASED_AUCTIONS, error, flipUUID);
                    reject();
                }
            })
        });
    }


    let paypalPurchase = (orderId: string, days: number): Promise<any> => {
        let requestData = {
            orderId,
            days
        };
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.PAYPAL_PAYMENT,
                data: requestData,
                resolve: (response: any) => {
                    resolve(response);
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.RECENT_AUCTIONS, error, requestData);
                    reject(error);
                },
            });
        });
    }

    let getRefInfo = (): Promise<RefInfo> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.GET_REF_INFO,
                data: "",
                resolve: (response: any) => {
                    resolve(parseRefInfo(response));
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.GET_REF_INFO, error, "");
                    reject(error);
                }
            })
        });
    }

    let setRef = (refId: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.SET_REF,
                data: refId,
                resolve: () => {
                    resolve();
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.SET_REF, error, "");
                    reject(error);
                }
            })
        });
    }

    return {
        search,
        trackSearch,
        getItemDetails,
        getItemPrices,
        getPlayerDetails,
        getAuctions,
        getBids,
        getEnchantments,
        getReforges,
        getAuctionDetails,
        getItemImageUrl,
        getPlayerName,
        setConnectionId,
        getVersion,
        subscribe,
        unsubscribe,
        getSubscriptions,
        setGoogle,
        hasPremium,
        pay,
        setToken,
        getStripeProducts,
        getStripePrices,
        validatePaymentToken,
        getRecentAuctions,
        getFlips,
        subscribeFlips,
        getFilter,
        getNewPlayers,
        getNewItems,
        getPopularSearches,
        getEndedAuctions,
        getNewAuctions,
        getFlipBasedAuctions,
        paypalPurchase,
        getRefInfo,
        setRef
    }
}

let api = initAPI();

export default api;