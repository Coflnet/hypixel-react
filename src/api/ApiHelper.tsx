import { parseAuction, parseAuctionDetails, parseEnchantment, parseItem, parseItemBidForList, parseItemPriceData, parsePlayerDetails, parseReforge, parseSearchResultItem, parseSubscription } from "../utils/Parser/APIResponseParser";
import { RequestType, SubscriptionType, Subscription } from "./ApiTypes.d";
import { websocketHelper } from './WebsocketHelper';
import { v4 as generateUUID } from 'uuid';
import { Stripe } from "@stripe/stripe-js";
import { enchantmentAndReforgeCompare } from "../utils/Formatter";
import PriceGraph from "../components/PriceGraph/PriceGraph";
import { getPackageName } from "../utils/GoogleUtils";

function initAPI(): API {

    let apiErrorHandler = (requestType: RequestType, errorMessage: string, requestData: any = null) => {
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

    let getItemPrices = (itemTagOrName: string, fetchStart: number, itemFilter?: ItemFilter): Promise<ItemPriceData> => {
        return new Promise((resolve) => {
            let requestData = {
                name: itemTagOrName,
                start: Math.round(fetchStart / 100000) * 100,
                reforge: itemFilter?.reforge ? itemFilter.reforge.id : undefined,
                enchantments: itemFilter && itemFilter.enchantment !== undefined && itemFilter.enchantment.level !== undefined && itemFilter.enchantment.id ? [[itemFilter.enchantment.id, itemFilter.enchantment.level]] : undefined
            };
            websocketHelper.sendRequest({
                type: RequestType.ITEM_PRICES,
                data: requestData,
                resolve: (data: any) => {
                    resolve(parseItemPriceData(data));
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
                }
            })
        })
    }

    let getReforges = (): Promise<Reforge[]> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
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
        let websocketUUID = window.localStorage.getItem("websocketUUID") || generateUUID();
        window.localStorage.setItem("websocketUUID", websocketUUID);

        websocketHelper.sendRequest({
            type: RequestType.SET_CONNECTION_ID,
            data: websocketUUID,
            resolve: () => { },
            reject: (error: any) => {
                apiErrorHandler(RequestType.SET_CONNECTION_ID, error, websocketUUID);
            }
        })
    }

    let getVersion = (): Promise<string> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.GET_VERSION,
                data: "",
                resolve: (response: any) => {
                    resolve(response.toString());
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.GET_VERSION, error, "");
                }
            })
        });
    }

    let subscribe = (topic: string, price: number, types: SubscriptionType[]): Promise<void> => {
        return new Promise((resolve, reject) => {
            // Add none, so reduce works (doesnt change the result)
            types.push(SubscriptionType.NONE);

            let requestData = {
                topic: topic,
                price: price,
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
                    error = JSON.parse(error);
                    reject(error.Message);
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
                    resolve(premiumUntil);
                },
                reject: (error: any) => {
                    apiErrorHandler(RequestType.PREMIUM_EXPIRATION, error, googleId);
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
                            stripe.redirectToCheckout({ sessionId }).then(result => console.log(result));
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
                    apiErrorHandler(RequestType.SET_GOOGLE, error, id);
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
                        resolve(products.data.filter((product: any) =>
                            product.active
                        ).map((product: any) => {
                            console.log(product);
                            const price = prices.find(price => price.productId === product.id);
                            if (!price) {
                                reject(`price for product ${product.id} not found`);
                            }
                            return {
                                itemId: product.id,
                                description: product.description,
                                title: product.name,
                                price
                            }
                        }));
                    })
                },
                reject: (error: any) => apiErrorHandler(RequestType.GET_STRIPE_PRODUCTS, error)
            })
        })
    }

    let getStripePrices = (): Promise<Price[]> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.GET_STRIPE_PRICES,
                data: null,
                resolve: (prices: any) => {
                    let mappedPrices = prices.data.map((price: any) => {
                        return {
                            productId: price.product,
                            currency: price.currency.toUpperCase(),
                            value: price.unit_amount / 100.0
                        }
                    });
                    resolve(mappedPrices)
                },
                reject: (error: any) => apiErrorHandler(RequestType.GET_STRIPE_PRICES, error)
            })

        })
    }

    let validatePaymentToken = (token: string, productId: string, packageName = getPackageName()): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            websocketHelper.sendRequest({
                type: RequestType.VALIDATE_PAYMENT_TOKEN,
                data: {token, productId, packageName},
                resolve: (data: any) => {
                    // log('data: ' + JSON.stringify(data));
                    resolve(true);
                },
                reject: (error: any) => {
                    // log('error: ' + JSON.stringify(error));
                    apiErrorHandler(RequestType.VALIDATE_PAYMENT_TOKEN, error)
                    reject(false);
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
        validatePaymentToken
    }
}

let api = initAPI();

export default api;