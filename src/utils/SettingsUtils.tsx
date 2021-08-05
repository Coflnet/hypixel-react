let LOCAL_STORAGE_SETTINGS_KEY = "userSettings";

let settings = getInitUserSettings();

function getInitUserSettings(): any {
    let item = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (!item) {
        item = "{}";
        localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(item));
    }
    return JSON.parse(item);
}

export function getSetting(key: string): string {
    return settings[key] || "";
}

export function setSetting(key: any, value: any) {
    settings[key] = value;
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
}

export const FLIP_CUSTOMIZING_KEY = "flipCustomizing";