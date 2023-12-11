import { DEFAULT_FLIP_SETTINGS } from '../FlipUtils'

type BMBlacklist = string[]

type BMWhitelist = {
    [name: string]: {
        profit?: number
        profit_percentage?: number
    }
}

type BMTrueBlacklist = string[]

type BMFilter = {
    blacklist: BMBlacklist
    whitelist: BMWhitelist
    true_blacklist: BMTrueBlacklist
    global: {
        profit: number
        profit_percentage: number
    }
}

// probably a better way to standardize this
const enchants = new Set(['cleave', 'life_steal', 'smite', 'sharpness', 'titan_killer', 'giant_killer', 'growth', 'protection', 'overload', 'power'])
// bm doenst match on stuff like bustling
const reforges = new Set(['mossy'])
const attributes = new Set([
    'mana_pool',
    'arachno_resistance',
    'blazing_resistance',
    'breeze',
    'ender_resistance',
    'experience',
    'fortitude',
    'lifeline',
    'magic_find',
    'blazing_resistance',
    'life_regeneration',
    'mana_regeneration',
    'mending',
    'speed',
    'undead_resistance',
    'veteran',
    'dominance'
])

// return the filter:{...} portion
const parseModifiers = (name: string, modifiers: string): { [modifier: string]: string } => {
    const filter = {}
    if (modifiers.length == 0) {
        return filter
    }
    const modifiersList = modifiers.split('&')
    for (const modifier of modifiersList) {
        const tokens = modifier.split(':')
        // weird case
        if (tokens[0] == 'ultimate_reiterate') {
            tokens[0] = 'ultimate_duplex'
        }
        if (tokens[0] == 'nil') {
            filter['Clean'] = 'yes'
        }
        // sometimes OFA doesnt use a secondary identifier
        else if (tokens.length == 1 && !reforges.has(tokens[0])) {
            filter[tokens[0]] = '>0'
        } else {
            if (tokens.length != 2) throw new Error(`malformed bm config at current modifier ${modifier} at ${modifiers} on ${name}`)
            const [arg, val] = tokens
            if (arg == 'rarity_upgraded') {
                filter['Recombobulated'] = val
            } else if (arg == 'stars') {
                // can only identify one level at a time in bm
                filter['Stars'] = `${val}-${val}`
            } else if (arg.startsWith('ultimate_')) {
                filter[arg] = `${val}-${val}`
            } else if (arg == 'candyUsed') {
                if (val == 'false') {
                    filter['Candy'] = '0'
                } else {
                    filter['Candy'] = '1-10'
                }
            } else if (arg == 'rounded_level') {
                filter['PetLevel'] = `<=${val}`
            } else if (arg == 'heldItem') {
                filter['PetItem'] = val
            } else if (enchants.has(arg) || attributes.has(arg)) {
                filter[arg] = `${val}-${val}`
            } else if (reforges.has(arg)) {
                filter['Reforge'] = arg
            } else if (arg == 'winning_bid_value') {
                const maxBid = name == 'MIDAS_STAFF' ? 100 : 50
                let winningBid
                if (val == 'high') {
                    winningBid = `>=${maxBid}m`
                } else if (val == 'medium') {
                    winningBid = `${((maxBid * 2) / 3).toFixed(4)}m-${maxBid}m`
                } else {
                    winningBid = `0-${((maxBid * 2) / 3).toFixed(4)}m`
                }
                filter['WinningBid'] = winningBid
            } else if (arg !== 'global') {
                throw new Error(`error parsing token ${modifier} at ${modifiers} on ${name}`)
            }
        }
    }
    return filter
}

const petRarities = new Set(['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'])

export const parseBMName = (entry: string): { item: Item; itemFilter: ItemFilter } | undefined => {
    let [name, modifiers] = entry.includes('=') ? entry.split('=') : [entry, '']
    const filter: ItemFilter = {}
    // handle pets
    if (name.startsWith('PET_') && !name.startsWith('PET_ITEM_') && petRarities.has(name.substring(name.lastIndexOf('_') + 1))) {
        const i = name.lastIndexOf('_')
        const rarity = name.substring(i + 1)
        name = name.substring(0, i)
        filter['Rarity'] = rarity
    }
    if (/^.*_RUNE_\d$/.test(name)) {
        const i = name.lastIndexOf('_')
        const level = name.substring(i + 1)
        name = name.substring(0, i)
        const incorrectIDReplacements = {
            PESTILENCE_RUNE: 'ZOMBIE_SLAYER_RUNE',
            MAGICAL_RUNE: 'MAGIC_RUNE'
        }
        // mistake in common filters
        if (name in incorrectIDReplacements) {
            name = incorrectIDReplacements[name]
        }
        const suffixIndex = name.indexOf('_RUNE')
        let shortenedName = name.substring(0, suffixIndex)
        name = `RUNE_${shortenedName}`
        // end rune is common error, blood rune item id coded incorrect, rest dont have levels yet
        const exceptions = new Set(['RUNE_END', 'RUNE_BLOOD', 'RUNE_HEARTS', 'RUNE_ICE', 'RUNE_SNOW', 'RUNE_MAGIC', 'RUNE_ZOMBIE_SLAYER'])
        if (exceptions.has(name)) {
            return
        }
        const levelNameReplacements = {
            RUNE_DRAGON: 'END',
            RUNE_HEARTS: 'COEURS',
            RUNE_ICE: 'GLACE',
            RUNE_SNOW: 'NEVE',
            ZOMBIE_SLAYER: 'PESTILENCE',
            RUNE_MAGIC: 'MAGICAL'
        }
        if (name in levelNameReplacements) {
            shortenedName = levelNameReplacements[name]
        }
        const runeLevel = `${shortenedName}_RUNE`.toLowerCase().replace(/(_.)|^./g, group => group.toUpperCase().replace('_', ''))
        filter[runeLevel] = level
    }
    if (name.startsWith('POTION_')) {
        const i = name.indexOf('_')
        name = `POTION_${name.substring(i + 1, name.length)}`
    }
    // common error in popular filter
    if (name.startsWith('STARRED_FROZEN_BLAZE')) {
        const i = name.indexOf('_')
        name = name.substring(i + 1, name.length)
    }
    // random exceptions
    const replacements = {
        PIONEER_PICKAXE: 'ALPHA_PICK',
        FLAKE_THE_FISH: 'SNOWFLAKE_THE_FISH',
        SPIRIT_SCEPTRE: 'BAT_WAND',
        // a common filter has these typo so i will fix it here
        POCKET_ESPRESSO_MACINE: 'POCKET_ESPRESSO_MACHINE',
        ADVENT_CALENDER_DISPLAY: 'ADVENT_CALENDAR_DISPLAY'
    }
    if (name in replacements) name = replacements[name]
    // handle modifiers
    const modifierFilter = parseModifiers(name, modifiers)
    return { item: { tag: name }, itemFilter: { ...filter, ...modifierFilter } }
}

export const parseBMConfig = (
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
    for (const TBLEntry of input.true_blacklist) {
        output.restrictions.push({
            type: 'blacklist' as const,
            item: { tag: TBLEntry } as Item,
            itemFilter: {
                ForceBlacklist: 'true'
            }
        })
    }
    // regular blacklist
    for (const BLEntry of input.blacklist) {
        const parsed = parseBMName(BLEntry)
        if (parsed)
            output.restrictions.push({
                type: 'blacklist' as const,
                ...parsed
            })
    }
    for (const [WLEntry, { profit, profit_percentage }] of Object.entries(input.whitelist)) {
        const parsed = parseBMName(WLEntry)
        if (parsed) {
            const entry = {
                type: 'whitelist' as const,
                ...parsed
            }
            entry['itemFilter']['MinProfit'] = `${profit}`
            entry['itemFilter']['MinProfitPercentage'] = `${profit_percentage}`
            output.restrictions.push(entry)
        }
    }
    output.filter.minProfit = input.global.profit
    output.filter.minProfitPercent = input.global.profit_percentage
    // probably more elegant way to do this
    output.filter.maxCost = 10 ** 10
    return output
}
