import { toast } from 'react-toastify'
import api from '../api/ApiHelper'
import { CUSTOM_EVENTS } from '../api/ApiTypes.d'
import { hasFlag } from '../components/FilterElement/FilterType'
import { DEFAULT_FLIP_SETTINGS, FLIP_FINDERS, getFlipCustomizeSettings, getFlipFinders } from './FlipUtils'
import { isClientSideRendering } from './SSRUtils'
import toml from 'toml'
import { getNumberFromShortenString } from './Formatter'

const LOCAL_STORAGE_SETTINGS_KEY = 'userSettings'

let settings = getInitUserSettings()

function getInitUserSettings(): any {
    if (!isClientSideRendering()) {
        return {}
    }

    let item = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY)

    // item === "\"{}\"" is a wrong state and has to be reset (fix for users that still have this in the local storage)
    if (!item || item === '"{}"') {
        item = '{}'
        localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, item)
    }
    try {
        return JSON.parse(item)
    } catch {
        return {}
    }
}

export function getSetting(key: string, defaultValue: any = ''): string {
    return settings[key] || defaultValue
}

export function getSettingsObject<T>(key: string, defaultValue: T) {
    if (!isClientSideRendering()) {
        return defaultValue
    }
    let object = settings[key] || JSON.stringify(defaultValue)
    let parsed: T
    try {
        parsed = JSON.parse(object)
    } catch {
        parsed = defaultValue
    }
    return parsed
}

export function setSetting(key: any, value: any) {
    if (!isClientSideRendering()) {
        return
    }
    settings[key] = value
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings))
}

export function setSettingsFromServerSide(
    settings: any
): Promise<{ flipCustomizing: FlipCustomizeSettings; filter: FlipperFilter; restrictions: FlipRestriction[] }> {
    return new Promise(resolve => {
        settings.visibility = settings.visibility || {}
        settings.mod = settings.mod || {}
        settings.filters = settings.filters || {}

        let flipCustomizing = {
            hideCost: !settings.visibility.cost,
            hideEstimatedProfit: !settings.visibility.estProfit,
            hideLowestBin: !settings.visibility.lbin,
            hideSecondLowestBin: !settings.visibility.slbin,
            hideMedianPrice: !settings.visibility.medPrice,
            hideSeller: !settings.visibility.seller,
            hideVolume: !settings.visibility.volume,
            maxExtraInfoFields: settings.visibility.extraFields,
            hideProfitPercent: !settings.visibility.profitPercent,
            hideSellerOpenBtn: !settings.visibility.sellerOpenBtn,
            hideLore: !settings.visibility.lore,
            useLowestBinForProfit: settings.lbin,
            shortNumbers: settings.mod.shortNumbers,
            soundOnFlip: settings.mod.soundOnFlip,
            justProfit: settings.mod.justProfit,
            blockTenSecMsg: settings.mod.blockTenSecMsg,
            hideModChat: !settings.mod.chat,
            modFormat: settings.mod.format,
            modNoAdjustToPurse: settings.mod.noAdjustToPurse,
            modCountdown: settings.mod.countdown,
            disableLinks: !settings.visibility.links,
            hideCopySuccessMessage: !settings.visibility.copySuccessMessage,
            finders: FLIP_FINDERS.filter(finder => {
                return hasFlag(parseInt(settings.finders), parseInt(finder.value))
            }).map(finder => parseInt(finder.value))
        } as FlipCustomizeSettings

        let filter = {
            maxCost: settings.maxCost,
            minProfit: settings.minProfit,
            minProfitPercent: settings.minProfitPercent,
            minVolume: settings.minVolume,
            onlyBin: settings.onlyBin,
            onlyUnsold: settings.visibility.hideSold
        } as FlipperFilter

        let restrictions = getSettingsObject<FlipRestriction[]>(RESTRICTIONS_SETTINGS_KEY, [])
        let itemMap = {}

        restrictions.forEach(restriction => {
            if (restriction.item?.tag) {
                itemMap[restriction.item.tag] = restriction.item?.name
            }
        })

        let _addListToRestrictions = function (list, type): Promise<FlipRestriction[]> {
            return new Promise(resolve => {
                if (list) {
                    let newRestrictions: FlipRestriction[] = []
                    let promises: Promise<void>[] = []
                    list.forEach(item => {
                        let itemName = item.displayName || itemMap[item.tag]
                        if (!item.tag) {
                            newRestrictions.push({
                                type: type,
                                itemFilter: item.filter,
                                tags: item.tags
                            })
                        } else if (itemName && item.tag) {
                            newRestrictions.push({
                                type: type,
                                item: {
                                    tag: item.tag,
                                    name: itemName,
                                    iconUrl: api.getItemImageUrl(item)
                                },
                                itemFilter: item.filter,
                                tags: item.tags
                            })
                        } else {
                            promises.push(
                                api.getItemDetails(item.tag).then(details => {
                                    newRestrictions.push({
                                        type: type,
                                        item: {
                                            tag: details.tag,
                                            name: details.name,
                                            iconUrl: api.getItemImageUrl(item)
                                        },
                                        itemFilter: item.filter,
                                        tags: item.tags
                                    })
                                })
                            )
                        }
                    })
                    if (promises.length > 0) {
                        Promise.all(promises).then(() => {
                            resolve(newRestrictions)
                        })
                    } else {
                        resolve(newRestrictions)
                    }
                } else {
                    resolve([])
                }
            })
        }

        setSetting(FLIP_CUSTOMIZING_KEY, JSON.stringify(flipCustomizing))
        setSetting(FLIPPER_FILTER_KEY, JSON.stringify(filter))

        Promise.all([_addListToRestrictions(settings.whitelist, 'whitelist'), _addListToRestrictions(settings.blacklist, 'blacklist')]).then(results => {
            setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(results[0].concat(results[1]))))

            document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.FLIP_SETTINGS_CHANGE, { detail: { apiUpdate: true } }))
            resolve({
                filter,
                flipCustomizing,
                restrictions
            })
        })
    })
}

export async function handleSettingsImport(importString: string) {
    let filter: FlipperFilter = DEFAULT_FLIP_SETTINGS.FILTER
    let flipCustomizeSettings: FlipCustomizeSettings = DEFAULT_FLIP_SETTINGS.FLIP_CUSTOMIZE
    let restrictions: FlipRestriction[] = DEFAULT_FLIP_SETTINGS.RESTRICTIONS
    let promises: Promise<any>[] = []

    try {
        let importObject = JSON.parse(importString)
        if (importObject.whitelist !== undefined) {
            // Handle import in server-side format
            let settings = await setSettingsFromServerSide(importObject)
            filter = settings.filter
            flipCustomizeSettings = settings.flipCustomizing
            restrictions = settings.restrictions
        } else {
            // Handle import in client-side format
            filter = importObject[FLIPPER_FILTER_KEY] ? JSON.parse(importObject[FLIPPER_FILTER_KEY]) : {}
            flipCustomizeSettings = importObject[FLIP_CUSTOMIZING_KEY] ? JSON.parse(importObject[FLIP_CUSTOMIZING_KEY]) : {}
            restrictions = importObject[RESTRICTIONS_SETTINGS_KEY] ? JSON.parse(importObject[RESTRICTIONS_SETTINGS_KEY]) : []
        }
    } catch {
        // Handle toml settings import
        try {
            var json = toml.parse(importString)

            if (json.thresholds.blacklist.blacklist_bypass_percent) {
                restrictions.push({
                    type: 'whitelist',
                    itemFilter: {
                        MinProfitPercentage: (json.thresholds.blacklist.blacklist_bypass_percent * 100).toString()
                    }
                })
            }

            if (json.thresholds.blacklist.blacklist_bypass_profit) {
                restrictions.push({
                    type: 'whitelist',
                    itemFilter: {
                        MinProfit: json.thresholds.blacklist.blacklist_bypass_profit.toString()
                    }
                })
            }

            if (json.thresholds.blacklist.blacklist_bypass_volume) {
                restrictions.push({
                    type: 'whitelist',
                    itemFilter: {
                        Volume: json.thresholds.blacklist.blacklist_bypass_volume.toString()
                    }
                })
            }

            if (json.thresholds.blacklist.user_blacklist) {
                json.thresholds.blacklist.user_blacklist.split(',').forEach(user => {
                    restrictions.push({
                        type: 'blacklist',
                        itemFilter: {
                            Seller: user
                        }
                    })
                })
            }

            json.thresholds.blacklist.enchant_blacklist.split(',').forEach(item => {
                let restriction: FlipRestriction = {
                    type: 'blacklist'
                }
                let split = item.split('-')
                if (split[0].length > 0) {
                    restriction.itemFilter = {
                        Enchantment: split[0]
                    }
                }
                if (split[1] && split[1].length > 0) {
                    restriction.itemFilter.EnchantLvl = split[1]
                }
                restrictions.push(restriction)
            })
            json.flipping.others.blacklist.split(',').forEach(item => {
                let restriction: FlipRestriction = {
                    type: 'blacklist'
                }
                let split = item.split('_+_')
                if (split[0].length > 0) {
                    let split2 = split[0].split('==')
                    promises.push(
                        api.getItemDetails(split2[0]).then(details => {
                            restriction.item = {
                                tag: details.tag,
                                name: details.name,
                                iconUrl: api.getItemImageUrl({
                                    tag: details.tag
                                })
                            }
                            restrictions.push(restriction)
                        })
                    )
                    if (split2[1] && split2[1].length > 0) {
                        restriction.itemFilter = {
                            Stars: split2[1].split('_STARRED_')[0]
                        }
                    }
                }
                if (split[1] && split[1].length > 0) {
                    if (!restriction.itemFilter) {
                        restriction.itemFilter = {}
                    }
                    restriction.itemFilter.Rarity = split[1]
                }
            })

            flipCustomizeSettings.soundOnFlip = !!json.flipping.others.enable_sounds
            flipCustomizeSettings.hideModChat = !json.flipping.others.enable_chat
            filter.minProfit = getNumberFromShortenString(json.thresholds.threshold.threshold)
            filter.minProfitPercent = json.thresholds.threshold.threshold_percentage * 100
            filter.maxCost = getNumberFromShortenString(json.thresholds.threshold.max_cost)
        } catch {
            toast.error('The import of the filter settings failed. Please make sure this is a valid filter file.')
            return
        }
    }

    await Promise.allSettled(promises)

    setSetting(FLIPPER_FILTER_KEY, JSON.stringify(filter))
    setSetting(FLIP_CUSTOMIZING_KEY, JSON.stringify(flipCustomizeSettings))
    setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(restrictions)))

    api.subscribeFlips(
        restrictions || [],
        filter,
        getFlipCustomizeSettings(),
        undefined,
        undefined,
        undefined,
        () => {
            window.location.reload()
        },
        true
    )

    setTimeout(() => {
        window.location.reload()
    }, 1000)
}

export function mapSettingsToApiFormat(filter: FlipperFilter, flipSettings: FlipCustomizeSettings, restrictions: FlipRestriction[]) {
    return {
        whitelist: mapRestrictionsToApiFormat(restrictions.filter(restriction => restriction.type === 'whitelist')),
        blacklist: mapRestrictionsToApiFormat(restrictions.filter(restriction => restriction.type === 'blacklist')),
        minProfit: filter.minProfit || 0,
        minProfitPercent: filter.minProfitPercent || 0,
        minVolume: filter.minVolume || 0,
        maxCost: filter.maxCost || 0,
        onlyBin: filter.onlyBin,
        lbin: flipSettings.useLowestBinForProfit,
        mod: {
            justProfit: flipSettings.justProfit,
            soundOnFlip: flipSettings.soundOnFlip,
            shortNumbers: flipSettings.shortNumbers,
            blockTenSecMsg: flipSettings.blockTenSecMsg,
            format: flipSettings.modFormat,
            chat: !flipSettings.hideModChat,
            noAdjustToPurse: flipSettings.modNoAdjustToPurse
        },
        visibility: {
            cost: !flipSettings.hideCost,
            estProfit: !flipSettings.hideEstimatedProfit,
            lbin: !flipSettings.hideLowestBin,
            slbin: !flipSettings.hideSecondLowestBin,
            medPrice: !flipSettings.hideMedianPrice,
            seller: !flipSettings.hideSeller,
            volume: !flipSettings.hideVolume,
            extraFields: flipSettings.maxExtraInfoFields || 0,
            profitPercent: !flipSettings.hideProfitPercent,
            sellerOpenBtn: !flipSettings.hideSellerOpenBtn,
            lore: !flipSettings.hideLore,
            copySuccessMessage: !flipSettings.hideCopySuccessMessage,
            links: !flipSettings.disableLinks
        },
        finders: flipSettings.finders?.reduce((a, b) => +a + +b, 0),
        changer: window.sessionStorage.getItem('sessionId')
    }
}

export function mapRestrictionsToApiFormat(restrictions: FlipRestriction[]) {
    return restrictions.map(restriction => {
        return { tag: restriction.item?.tag, filter: restriction.itemFilter, displayName: restriction.item?.name, tags: restriction.tags }
    })
}

export function storeUsedTagsInLocalStorage(restrictions: FlipRestriction[]) {
    let tags: Set<string> = new Set()
    restrictions.forEach(restriction => {
        if (restriction.tags) {
            restriction.tags.forEach(tag => tags.add(tag))
        }
    })
    localStorage.setItem(CURRENTLY_USED_TAGS, tags.size > 0 ? JSON.stringify(Array.from(tags)) : '[]')
}

/**
 * Removes private properties starting with a _ from the restrictions, because the backend cant handle these.
 * These also have to be saved into the localStorage because they could get sent to the api from there
 * @param restrictions The restrictions
 * @returns A new array containing restrictions without private properties
 */
export function getCleanRestrictionsForApi(restrictions: FlipRestriction[]) {
    return restrictions.map(restriction => {
        let newRestriction = {
            type: restriction.type,
            tags: restriction.tags
        } as FlipRestriction

        if (restriction.item) {
            newRestriction.item = {
                tag: restriction.item?.tag,
                name: restriction.item?.name
            }
        }

        if (restriction.itemFilter) {
            newRestriction.itemFilter = {}
            Object.keys(restriction.itemFilter).forEach(key => {
                if (!key.startsWith('_')) {
                    newRestriction.itemFilter![key] = restriction.itemFilter![key]
                }
            })
        }
        return newRestriction
    })
}

export const FLIP_CUSTOMIZING_KEY = 'flipCustomizing'
export const RESTRICTIONS_SETTINGS_KEY = 'flipRestrictions'
export const FLIPPER_FILTER_KEY = 'flipperFilters'
export const PREMIUM_EXPIRATION_NOFIFY_DATE_KEY = 'premiumExpirationNotifyDate'
export const BAZAAR_GRAPH_TYPE = 'bazaarGraphType'
export const BAZAAR_GRAPH_LEGEND_SELECTION = 'bazaarGraphLegendSelection'
export const AUCTION_GRAPH_LEGEND_SELECTION = 'auctionGraphLegendSelection'
export const RECENT_AUCTIONS_FETCH_TYPE_KEY = 'recentAuctionsFetchType'
export const CANCELLATION_RIGHT_CONFIRMED = 'cancellationRightConfirmed'
export const LAST_USED_FILTER = 'lastUsedFilter'
export const IGNORE_FLIP_TRACKING_PROFIT = 'ignoreFlipTrackingProfit'
export const LAST_PREMIUM_PRODUCTS = 'lastPremiumProducts'
export const CURRENTLY_USED_TAGS = 'currentlyUsedTags'
export const HIDE_RELATED_ITEMS = 'hideRelatedItems'
