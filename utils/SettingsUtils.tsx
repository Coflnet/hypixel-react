import { toast } from 'react-toastify'
import api from '../api/ApiHelper'
import { CUSTOM_EVENTS } from '../api/ApiTypes.d'
import { hasFlag } from '../components/FilterElement/FilterType'
import { FLIP_FINDERS, getFlipFinders } from './FlipUtils'
import { isClientSideRendering } from './SSRUtils'
import toml from 'toml'
import { getNumberFromShortenString } from './Formatter'

const LOCAL_STORAGE_SETTINGS_KEY = 'userSettings'

let settings = getInitUserSettings()

function getInitUserSettings(): any {
    if (!isClientSideRendering()) {
        return
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

export function setSettingsChangedData(data: any): Promise<void> {
    return new Promise(resolve => {
        data.visibility = data.visibility || {}
        data.mod = data.mod || {}
        data.filters = data.filters || {}

        setSetting(
            FLIP_CUSTOMIZING_KEY,
            JSON.stringify({
                hideCost: !data.visibility.cost,
                hideEstimatedProfit: !data.visibility.estProfit,
                hideLowestBin: !data.visibility.lbin,
                hideSecondLowestBin: !data.visibility.slbin,
                hideMedianPrice: !data.visibility.medPrice,
                hideSeller: !data.visibility.seller,
                hideVolume: !data.visibility.volume,
                maxExtraInfoFields: data.visibility.extraFields,
                hideProfitPercent: !data.visibility.profitPercent,
                hideSellerOpenBtn: !data.visibility.sellerOpenBtn,
                hideLore: !data.visibility.lore,
                useLowestBinForProfit: data.lbin,
                shortNumbers: data.mod.shortNumbers,
                soundOnFlip: data.mod.soundOnFlip,
                justProfit: data.mod.justProfit,
                blockTenSecMsg: data.mod.blockTenSecMsg,
                hideModChat: !data.mod.chat,
                modFormat: data.mod.format,
                modCountdown: data.mod.countdown,
                disableLinks: !data.visibility.links,
                hideCopySuccessMessage: !data.visibility.copySuccessMessage,
                finders: FLIP_FINDERS.filter(finder => {
                    return hasFlag(parseInt(data.finders), parseInt(finder.value))
                }).map(finder => parseInt(finder.value))
            } as FlipCustomizeSettings)
        )

        setSetting(
            FLIPPER_FILTER_KEY,
            JSON.stringify({
                maxCost: data.maxCost,
                minProfit: data.minProfit,
                minProfitPercent: data.minProfitPercent,
                minVolume: data.minVolume,
                onlyBin: data.onlyBin,
                onlyUnsold: data.visibility.hideSold
            } as FlipperFilter)
        )

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
                        let itemName = itemMap[item.tag]
                        if (!item.tag) {
                            newRestrictions.push({
                                type: type,
                                itemFilter: item.filter
                            })
                        } else if (itemName && item.tag) {
                            newRestrictions.push({
                                type: type,
                                item: {
                                    tag: item.tag,
                                    name: itemName,
                                    iconUrl: api.getItemImageUrl(item)
                                },
                                itemFilter: item.filter
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
                                        itemFilter: item.filter
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

        Promise.all([_addListToRestrictions(data.whitelist, 'whitelist'), _addListToRestrictions(data.blacklist, 'blacklist')]).then(results => {
            setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(results[0].concat(results[1])))

            document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.FLIP_SETTINGS_CHANGE, { detail: { apiUpdate: true } }))
            resolve()
        })
    })
}

export async function handleSettingsImport(importString: string) {
    let filter: FlipperFilter = {}
    let flipCustomizeSettings: FlipCustomizeSettings = {}
    let restrictions: FlipRestriction[] = []
    let promises: Promise<any>[] = []

    try {
        let importObject = JSON.parse(importString)
        filter = importObject[FLIPPER_FILTER_KEY] ? JSON.parse(importObject[FLIPPER_FILTER_KEY]) : {}
        flipCustomizeSettings = importObject[FLIP_CUSTOMIZING_KEY] ? JSON.parse(importObject[FLIP_CUSTOMIZING_KEY]) : {}
        restrictions = importObject[RESTRICTIONS_SETTINGS_KEY] ? JSON.parse(importObject[RESTRICTIONS_SETTINGS_KEY]) : []
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
                        MinProfit: json.thresholds.blacklist.blacklist_bypass_profit
                    }
                })
            }

            if (json.thresholds.blacklist.blacklist_bypass_volume) {
                restrictions.push({
                    type: 'whitelist',
                    itemFilter: {
                        Volume: json.thresholds.blacklist.blacklist_bypass_volume
                    }
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
    setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(restrictions))

    api.subscribeFlips(() => {}, restrictions || [], filter, undefined, undefined, true)

    setTimeout(() => {
        window.location.reload()
    }, 1000)
}

export const FLIP_CUSTOMIZING_KEY = 'flipCustomizing'
export const RESTRICTIONS_SETTINGS_KEY = 'flipRestrictions'
export const FLIPPER_FILTER_KEY = 'flipperFilters'
export const PREMIUM_EXPIRATION_NOFIFY_DATE_KEY = 'premiumExpirationNotifyDate'
