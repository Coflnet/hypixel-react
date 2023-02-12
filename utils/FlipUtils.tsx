import { FLIP_CUSTOMIZING_KEY, getSetting, setSetting } from './SettingsUtils'

export const DEMO_FLIP: FlipAuction = {
    bin: true,
    cost: 45000000,
    item: {
        category: 'WEAPON',
        name: "Sharp Midas' Sword",
        tag: 'MIDAS_SWORD',
        tier: 'LEGENDARY',
        iconUrl: 'https://sky.coflnet.com/static/icon/MIDAS_SWORD'
    },
    lowestBin: 46000000,
    secondLowestBin: 47000000,
    median: 50000000,
    sellerName: 'Testuser',
    showLink: true,
    uuid: 'e4723502450544c8a3711a0a5b1e8cd0',
    volume: 5.874998615,
    sold: true,
    finder: 1,
    props: [
        'Top Bid: 50.000.000',
        'Recombobulated',
        'Hot Potato Book: 2',
        'Ultimate Wise 1',
        'Sharpness 6',
        'Thunderlord 6',
        'Vampirism 6',
        'Critical 6',
        'Luck 6',
        'Giant Killer 6',
        'Smite 6',
        'Ender Slayer 6',
        '...',
        '...',
        '...',
        '...',
        '...',
        '...',
        '...',
        '...',
        '...',
        '...',
        '...',
        '...',
        '...',
        '...',
        '...',
        '...',
        '...',
        '...'
    ]
}

export const DEFAULT_MOD_FORMAT = '§6{0}: {1}{2} {3}{4} -> {5} (+{6} §4{7}{3}) §7Med: §b{8} §7Lbin: §b{9} §7Volume: §b{10}'

export function getFlipCustomizeSettings(): FlipCustomizeSettings {
    let settings: FlipCustomizeSettings

    try {
        settings = JSON.parse(getSetting(FLIP_CUSTOMIZING_KEY))

        // Fields that have special default values
        if (settings.hideSecondLowestBin !== false) {
            settings.hideSecondLowestBin = true
        }
        if (settings.soundOnFlip !== false) {
            settings.soundOnFlip = true
        }
        if (!settings.finders) {
            settings.finders = FLIP_FINDERS.map(finder => +finder.value)
        }
    } catch {
        settings = DEFAULT_FLIP_SETTINGS.FLIP_CUSTOMIZE
        setSetting(FLIP_CUSTOMIZING_KEY, JSON.stringify(DEFAULT_FLIP_SETTINGS.FLIP_CUSTOMIZE))
    }
    return settings
}

export const FLIP_FINDERS = [
    {
        value: '1',
        label: 'Flipper',
        shortLabel: 'FLIP',
        default: true,
        description:
            'Is the classical flip finding algorithm using the Skyblock AH history database. It searches the history for similar items but searching for references takes time thus this is relatively slow.',
        selectable: true
    },
    {
        value: '2',
        label: 'Sniper',
        shortLabel: 'SNIPE',
        default: true,
        description:
            'Is a classical sniping algorithm that stores prices in a dictionary grouped by any relevant modifiers. It only outputs flips that are below lbin and median for a combination of relevant modifiers. Its faster by about 3000x but may not find as many flips as the flipper.',
        selectable: true
    },
    {
        value: '4',
        label: 'Sniper (Median)',
        shortLabel: 'MSNIPE',
        default: true,
        description: "Uses the same algorithm as Sniper but doesn't require the item to be below lowest bin and only 5% below the median sell value.",
        selectable: true
    },
    { value: '8', label: 'AI', shortLabel: 'AI', default: false, description: '', selectable: false },
    {
        value: '16',
        label: 'User',
        shortLabel: 'User',
        default: false,
        description: (
            <span>
                Forwards all new auctions with a target value set to the starting bid (0 profit)
                <br /> You can use this together with whitelist/blacklist of <b>Starting Bid</b> and other filters to create your own flip rules.
                <br /> Different to the other finders this one won't pre-filter auctions its all up to you.",
            </span>
        ),
        selectable: true
    },
    { value: '32', label: 'TFM', shortLabel: 'TFM', default: false, description: '', selectable: false },
    { value: '64', label: 'Stonks', shortLabel: 'Stonks', default: false, description: '', selectable: false },
    { value: '128', label: 'External', shortLabel: 'External', default: false, description: '', selectable: false }
]

export function getFlipFinders(finderValues: number[]) {
    let finders = FLIP_FINDERS.filter(option => finderValues.some(finder => finder.toString() === option.value))
    let notFoundFinder = {
        value: '',
        label: 'Unknown',
        shortLabel: 'Unknown',
        default: false,
        description: '',
        selectable: false
    }
    return finders.length > 0 ? finders : [notFoundFinder]
}

export const DEFAULT_FLIP_SETTINGS = {
    FLIP_CUSTOMIZE: {
        hideCost: false,
        hideEstimatedProfit: false,
        hideLowestBin: true,
        hideMedianPrice: false,
        hideSeller: true,
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
        hideLore: true,
        hideModChat: false,
        hideSellerOpenBtn: false,
        modFormat: '',
        modCountdown: false
    } as FlipCustomizeSettings,
    RESTRICTIONS: [] as FlipRestriction[],
    FILTER: {
        onlyBin: false,
        maxCost: 2147483647,
        minProfit: 0,
        minProfitPercent: 0,
        minVolume: 0,
        onlyUnsold: false,
        restrictions: []
    } as FlipperFilter
}

export function isCurrentCalculationBasedOnLbin(flipCustomizeSettings: FlipCustomizeSettings) {
    return (flipCustomizeSettings.finders?.length === 1 && flipCustomizeSettings.finders[0].toString() === '2') || flipCustomizeSettings.useLowestBinForProfit
}

export function calculateProfit(flip: FlipAuction, settings?: FlipCustomizeSettings) {
    if (settings && isCurrentCalculationBasedOnLbin(settings)) {
        return flip.lowestBin - flip.cost
    } else {
        return flip.median - flip.cost
    }
}
