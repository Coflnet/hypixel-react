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

document.addEventListener("testEvent", function () {
    let data = { "filters": {}, "blacklist": [{ "tag": "ASPECT_OF_THE_DRAGON", "filter": {} }], "whitelist": [], "lbin": false, "minProfit": 5000, "minProfitPercent": 0, "minVolume": 0, "maxCost": 0, "visibility": { "cost": true, "estProfit": true, "lbin": false, "slbin": false, "medPrice": true, "seller": true, "volume": true, "extraFields": 0, "avgSellTime": false, "profitPercent": true, "profit": false }, "mod": { "justProfit": false, "soundOnFlip": true, "shortNumbers": false }, "finders": 7, "changer": "f6d43385-2a8d-4e96-89d4-4a04a9132ae0" }
    setSettingsChangedData(data);
});

export function setSettingsChangedData(data: any) {
    setSetting(FLIP_CUSTOMIZING_KEY, JSON.stringify({
        hideCost: !data.visibility.cost,
        hideEstimatedProfit: !data.visibility.estProfit,
        hideLowestBin: !data.visibility.lBin,
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

    document.dispatchEvent(new CustomEvent("apiSettingsUpdate"));
    document.dispatchEvent(new CustomEvent("flipSettingsChange"));
}

export const FLIP_CUSTOMIZING_KEY = "flipCustomizing";
export const RESTRICTIONS_SETTINGS_KEY = "flipRestrictions";
export const FLIPPER_FILTER_KEY = "flipperFilters";
export const PREMIUM_EXPIRATION_NOFIFY_DATE_KEY = "premiumExpirationNotifyDate"