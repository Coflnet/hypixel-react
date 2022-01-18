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
    lowestBin: 46000000,
    secondLowestBin: 47000000,
    median: 50000000,
    sellerName: "Testuser",
    showLink: true,
    uuid: "e4723502450544c8a3711a0a5b1e8cd0",
    volume: 5.874998615,
    sold: true,
    finder: 1,
    props: ["Top Bid: 50.000.000", "Recombobulated", "Hot Potato Book: 2", "Ultimate Wise 1", "Sharpness 6", "Thunderlord 6", "Vampirism 6", "Critical 6", "Luck 6", "Giant Killer 6", "Smite 6", "Ender Slayer 6", "...", "...", "...", "...", "...", "...", "...", "...", "...", "...", "...", "...", "...", "...", "...", "...", "...", "..."]
}

export function getFlipCustomizeSettings(): FlipCustomizeSettings {
    let settings: FlipCustomizeSettings;

    let defaultModFormat = "§6{0}: {1}{2} {3}{4} -> {5} (+{6} §4{7}{3}) §7Med: §b{8} §7Lbin: §b{9} §7Volume: §b{10}";

    try {
        settings = JSON.parse(getSetting(FLIP_CUSTOMIZING_KEY));

        // Felder, die spezielle default values haben
        if (settings.hideSecondLowestBin !== false) {
            settings.hideSecondLowestBin = true;
        }
        if (settings.soundOnFlip !== false) {
            settings.soundOnFlip = true;
        }
        if (!settings.finders) {
            settings.finders = FLIP_FINDERS.map(finder => +finder.value);
        }
        if (!settings.modFormat) {
            settings.modFormat = defaultModFormat;
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
            hideSecondLowestBin: true,
            useLowestBinForProfit: false,
            disableLinks: false,
            justProfit: false,
            soundOnFlip: true,
            shortNumbers: false,
            hideProfitPercent: false,
            blockTenSecMsg: false,
            finders: FLIP_FINDERS.filter(finder => finder.default).map(finder => +finder.value),
            modFormat: defaultModFormat
        };

        setSetting(FLIP_CUSTOMIZING_KEY, JSON.stringify(settings))
    }
    return settings;
}

export function calculateProfit(flip: FlipAuction, useLowestBinForProfit?: boolean) {

    if (useLowestBinForProfit) {
        return flip.lowestBin - flip.cost;
    } else {
        return flip.median - flip.cost;
    }
}

export const FLIP_FINDERS = [
    { value: "1", label: 'Flipper', shortLabel: "FLIP", default: true, description: "Is the classical flip finding algorithm using the Skyblock AH history database. It searches the history for similar items but searching for references takes time thus this is relatively slow." },
    { value: "2", label: 'Sniper', shortLabel: "SNIPE", default: false, description: "Is a classical sniping algorithm that stores prices in a dictionary grouped by any relevant modifiers. It only outputs flips that are below lbin and median for a combination of relevant modifiers. Its faster by about 3000x but may not find as many flips as the flipper." },
    { value: "4", label: 'Sniper (Median)', shortLabel: "MSNIPE", default: false, description: "Uses the same algorithm as Sniper but doesn't require the item to be below lowest bin and only 10% below the median sell value." }
]

export function getDefaulFlipFinders(finders: number[]) {
    return FLIP_FINDERS.filter(option => finders.some(finder => finder.toString() === option.value))
}
