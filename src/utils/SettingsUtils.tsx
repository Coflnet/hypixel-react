import api from "../api/ApiHelper";
import { CUSTOM_EVENTS } from "../api/ApiTypes.d";

const LOCAL_STORAGE_SETTINGS_KEY = "userSettings";

let settings = getInitUserSettings();

function getInitUserSettings(): any {
    let item = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);

    // item === "\"{}\"" is a wrong state and has to be reset (fix for users that still have this in the local storage)
    if (!item || item === "\"{}\"") {
        item = "{}";
        localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, item);
    }
    try {
        return JSON.parse(item);
    } catch {
        return {};
    }
}

export function getSetting(key: string): string {
    return settings[key] || "";
}


export function getSettingsObject<T>(key: string, defaultValue: T) {
    let object = settings[key] || JSON.stringify(defaultValue);
    let parsed: T;
    try {
        parsed = JSON.parse(object);
    } catch {
        parsed = defaultValue;
    }
    return parsed;
}

export function setSetting(key: any, value: any) {
    settings[key] = value;
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
}

export function setSettingsChangedData(data: any): Promise<void> {
    return new Promise(resolve => {

        data.visibility = data.visibility || {};
        data.mod = data.mod || {};
        data.filters = data.filters || {};

        setSetting(FLIP_CUSTOMIZING_KEY, JSON.stringify({
            hideCost: !data.visibility.cost,
            hideEstimatedProfit: !data.visibility.estProfit,
            hideLowestBin: !data.visibility.lbin,
            hideSecondLowestBin: !data.visibility.slbin,
            hideMedianPrice: !data.visibility.medPrice,
            hideSeller: !data.visibility.seller,
            hideVolume: !data.visibility.volume,
            maxExtraInfoFields: data.visibility.extraFields,
            hideProfitPercent: !data.visibility.profitPercent,
            useLowestBinForProfit: data.lbin,
            shortNumbers: data.mod.shortNumbers,
            soundOnFlip: data.mod.soundOnFlip,
            justProfit: data.mod.justProfit
        } as FlipCustomizeSettings));

        setSetting(FLIPPER_FILTER_KEY, JSON.stringify({
            maxCost: data.maxCost,
            minProfit: data.minProfit,
            minProfitPercent: data.minProfitPercent,
            minVolume: data.minVolume,
            onlyBin: data.filters.Bin === "true"
        } as FlipperFilter))

        let restrictions = getSettingsObject<FlipRestriction[]>(RESTRICTIONS_SETTINGS_KEY, []);
        let itemMap = {};

        restrictions.forEach(restriction => {
            if (restriction.item?.tag) {
                itemMap[restriction.item.tag] = restriction.item?.name
            }
        })

        let _addListToRestrictions = function (list, type): Promise<FlipRestriction[]> {
            return new Promise((resolve) => {
                if (list) {
                    let newRestrictions: FlipRestriction[] = [];
                    let promises: Promise<void>[] = [];
                    list.forEach(item => {
                        let itemName = itemMap[item.tag];
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
                            promises.push(api.getItemDetails(item.tag).then(details => {
                                newRestrictions.push({
                                    type: type,
                                    item: {
                                        tag: details.tag,
                                        name: details.name,
                                        iconUrl: api.getItemImageUrl(item)
                                    },
                                    itemFilter: item.filter
                                })
                            }))
                        }
                    });
                    if (promises.length > 0) {
                        Promise.all(promises).then(() => {
                            resolve(newRestrictions);
                        })
                    } else {
                        resolve(newRestrictions);
                    }
                } else {
                    resolve([]);
                }
            })
        }

        Promise.all([_addListToRestrictions(data.whitelist, "whitelist"), _addListToRestrictions(data.blacklist, "blacklist")]).then(results => {
            setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(results[0].concat(results[1])));

            document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.FLIP_SETTINGS_CHANGE, { detail: { apiUpdate: true } }));
            resolve();
        })
    })
}

export const FLIP_CUSTOMIZING_KEY = "flipCustomizing";
export const RESTRICTIONS_SETTINGS_KEY = "flipRestrictions";
export const FLIPPER_FILTER_KEY = "flipperFilters";
export const PREMIUM_EXPIRATION_NOFIFY_DATE_KEY = "premiumExpirationNotifyDate"