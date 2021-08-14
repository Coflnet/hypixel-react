import { FLIP_CUSTOMIZING_KEY, getSetting, setSetting } from "./SettingsUtils";

export const DEMO_FLIP: FlipAuction = {
    bin: true,
    cost: 45000000,
    item: {
        category: "WEAPON",
        name: "Sharp Midas' Sword",
        tag: "MIDAS_SWORD",
        tier: "LEGENDARY",
        iconUrl: "https://sky.coflnet.com/static/icon/MIDAS_SWORD"
    },
    lowestBin: 100000,
    secondLowestBin: 101000,
    median: 50000000,
    sellerName: "Testuser",
    showLink: true,
    uuid: "e4723502450544c8a3711a0a5b1e8cd0",
    volume: 5.874998615,
    sold: true,
    props: ["Top Bid: 50.000.000", "Recombulated", "Hot Potato Book: 2", "Ultimate Wise 1", "Sharpness 6", "Thunderlord 6", "Vampirism 6", "Critical 6", "Luck 6", "Giant Killer 6", "Smite 6", "Ender Slayer 6", "...", "...", "...", "...", "...", "...", "...", "...", "...", "...", "...", "...", "...", "...", "...", "...", "...", "..."]
}

export function getFlipCustomizeSettings(): FlipCustomizeSettings {
    let settings: FlipCustomizeSettings;
    try {
        settings = JSON.parse(getSetting(FLIP_CUSTOMIZING_KEY));

        if (settings.hideSecondLowestBin !== false) {
            settings.hideSecondLowestBin = true;
        }

    } catch {
        settings = {
            hideCost: false,
            hideEstimatedProfit: false,
            hideLowestBin: false,
            hideMedianPrice: false,
            hideSeller: false,
            hideVolume: false,
            maxExtraInfoFields: 3,
            hideCopySuccessMessage: false,
            hideSecondLowestBin: true
        };

        setSetting(FLIP_CUSTOMIZING_KEY, JSON.stringify(settings))
    }
    return settings;
}