import { DEFAULT_FLIP_SETTINGS } from './FlipUtils'

type BMBlacklist = string[]

type BMWhitelistEntry = {
    [name: string]: {
        profit?: number
        profit_percentage?: number
    }
}

type BMWhitelist = BMWhitelistEntry[]

type BMTrueBlacklist = string[]

type BMFilter = {
    blackist: BMBlacklist
    whitelist: BMWhitelist
    true_blacklist: BMTrueBlacklist
    global: {
        profit: number
        profit_percentage: number
    }
}

export const BMConvert = (
    input: BMFilter
): {
    filter: FlipperFilter
    flipCustomizeSettings: FlipCustomizeSettings
    restrictions: FlipRestriction[]
} => {
    const output = {
        filter: DEFAULT_FLIP_SETTINGS.FILTER,
        flipCustomizeSettings: DEFAULT_FLIP_SETTINGS.FLIP_CUSTOMIZE,
        restrictions: DEFAULT_FLIP_SETTINGS.RESTRICTIONS
    }
    // true_blacklist -> ForceBlacklist
    let tags: string[] = []
    for (const TBLEntry of input.true_blacklist) {
        tags.push(TBLEntry)
    }
    output.restrictions.push({
        type: 'blacklist',
        tags: [...tags],
        itemFilter: {
            ForceBlacklist: 'true'
        }
    })
    tags = []
    // filter.minProfit = getNumberFromShortenString(json.thresholds.threshold.threshold)
    // filter.minProfitPercent = json.thresholds.threshold.threshold_percentage * 100
    // filter.maxCost = getNumberFromShortenString(json.thresholds.threshold.max_cost)
    return output
}
