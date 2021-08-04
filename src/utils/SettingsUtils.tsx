import { toast } from "react-toastify";

let localStorageSettingsKey = "userSettings";
let settings;

export function getSetting(key: string): string {
    if (!settings) {
        let settings = localStorage.getItem(localStorageSettingsKey);
        try {
            settings = JSON.parse(localStorage.getItem(localStorageSettingsKey)!);
            return settings![key];
        } catch {
            toast.error("Error saving user settings");
        }
    }
    return settings[key];
}

export function setSetting(key: any, value: any) {
    settings[key] = value;
    localStorage.setItem(localStorageSettingsKey, JSON.stringify(value));
}