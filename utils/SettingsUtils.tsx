const LOCAL_STORAGE_SETTINGS_KEY = "userSettings";

let settings = getInitUserSettings();

function getInitUserSettings(): any {
    return {};
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

export const FLIP_CUSTOMIZING_KEY = "flipCustomizing";
export const RESTRICTIONS_SETTINGS_KEY = "flipRestrictions";
export const FLIPPER_FILTER_KEY = "flipperFilters";
export const PREMIUM_EXPIRATION_NOFIFY_DATE_KEY = "premiumExpirationNotifyDate"