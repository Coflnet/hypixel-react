// Public task examples for the deterministic Cypress SSR routes of /tasks/[slug].
function task(slug: string, name: string) {
    return {
        slug,
        name,
        category: 'Mining',
        type: 'active',
        coinsPerHour: 1500000,
        description: `${name} fixture task`,
        steps: [{ number: 1, text: 'Mine the ore.' }],
        drops: [{ itemTag: 'MITHRIL_ORE', itemName: 'Mithril Ore', ratePerHour: 100, priceEach: 5, contributionPerHour: 500 }]
    }
}

const warpTask = {
    ...task('warp-task', 'Warp Task'),
    island: 'Crimson Isle',
    warp: '/warp kuudra',
    requirements: [
        { label: 'Combat 24', kind: 'skill_level', key: 'combat', target: 24, hard: true },
        { label: 'Catacombs 36', kind: 'catacombs_level', key: null, target: 36, hard: false }
    ]
}

/** The API never sends these for locked setups, the fixture does on purpose to prove the page drops them. */
export const LEAK = 987654321

function gearItem(slot: string, itemTag: string, itemName: string, numbers: Record<string, unknown> = {}, tradeable = true) {
    return { slot, itemTag, itemName, reason: `${itemName} gives more mining speed`, tradeable, ...numbers }
}

function setup(id: string, name: string, tier: string, status: string, locked: boolean, items: ReturnType<typeof gearItem>[], numbers: Record<string, unknown> = {}) {
    return {
        id,
        name,
        tier,
        status,
        locked,
        confidence: 'medium',
        assumptions: ['Mining speed 2000 assumed'],
        sources: ['https://wiki.hypixel.net/Mining', 'http://insecure.example/ignored'],
        items,
        ...numbers
    }
}

/** Sentinel auction uuid of locked tiers: it must never reach the server html. */
export const LEAK_UUID = '5ec2e7a15ec2e7a15ec2e7a15ec2e7a1'
export const DIRECT_UUID = 'b0d6e7b0d6e7b0d6e7b0d6e7b0d6e7b0'
export const BASE_UUID = 'ba5eba5eba5eba5eba5eba5eba5eba5e'

const lowerBoundAcquisition = {
    cost: 4200000,
    costSource: 'base',
    directUnavailableReason: 'no_matching_listing',
    cheapestBase: { auctionUuid: BASE_UUID, command: `/viewauction ${BASE_UUID}`, basePrice: 4200000, total: 4200000, incomplete: false, upgrades: [], grindRequired: [{ kind: 'counter', name: 'mined_crops', have: 10, need: 90, deficit: 80 }] }
}
const budgetAcquisition = {
    cost: 3130000,
    costSource: 'direct',
    direct: { price: 3130000, auctionUuid: DIRECT_UUID, command: `/viewauction ${DIRECT_UUID}` },
    cheapestBase: {
        auctionUuid: BASE_UUID,
        command: `/viewauction ${BASE_UUID}`,
        basePrice: 2000000,
        total: 2700000,
        incomplete: true,
        upgrades: [
            { kind: 'enchant', name: 'harvesting', fromLevel: 4, toLevel: 6, itemTag: 'ENCHANTMENT_HARVESTING_6', amount: 1, cost: 450000, priced: true },
            { kind: 'gem', name: 'ruby_slot', itemTag: null, amount: 1, cost: 0, priced: false }
        ],
        grindRequired: [{ kind: 'counter', name: 'farmed_cultivating', have: 1000, need: 5000, deficit: 4000 }]
    }
}
const noMatchAcquisition = { cost: 900000, costSource: 'market', directUnavailableReason: 'no_matching_listing', baseUnavailableReason: 'no_base_listing' }
const leakedAcquisition = {
    cost: LEAK,
    costSource: 'direct',
    direct: { price: LEAK, auctionUuid: LEAK_UUID, command: `/viewauction ${LEAK_UUID}` },
    cheapestBase: { auctionUuid: LEAK_UUID, command: `/viewauction ${LEAK_UUID}`, basePrice: LEAK, total: LEAK, incomplete: false, upgrades: [], grindRequired: [] }
}
const budgetSpec = { rarity: 'EPIC', reforge: 'fruitful', stars: 5, hotPotatoCount: 10, enchants: { harvesting: 6, cultivating: 10 } }
const measuredNumbers = { basis: 'measured', players: 2, playersAtLeast: true, playersLabel: '2+', observationsLabel: '5+', hours: 14, commonP25: LEAK, commonP75: LEAK }
const leakedMeasured = { ...measuredNumbers, statMedians: { mining_speed: LEAK }, hours: 14 }
const itemNumbers = { buyPrice: 3130000, resaleValue: 2710000, stability: 'stable', cv: 0.05, trendPerWeek: 0.01, volumePerDay: 120 }
const leakedItemNumbers = { acquisition: leakedAcquisition, spec: { reforge: 'leakedreforge', enchants: { leaked: 9 } }, modifiersMeasured: true, buyPrice: LEAK, resaleValue: LEAK, stability: 'stable', cv: 0.07, trendPerWeek: 0.02, volumePerDay: LEAK }
const leakedSetupNumbers = {
    ...leakedMeasured,
    coinsPerHour: LEAK, deltaCoinsPerHour: LEAK, buyCost: LEAK, resaleValue: LEAK, borrowCost: LEAK,
    paybackHoursBorrow: 1, paybackHoursFull: 2, netGain10h: LEAK, netGain50h: LEAK, stability: 'volatile'
}

export const publicTaskSetups = {
    slug: 'gear-task',
    taskName: 'Gear Task',
    profileName: 'Mining',
    locked: true,
    baselineCoinsPerHour: 1500000,
    comparisonCoinsPerHour: 1500000,
    category: 'Mining',
    measuredAt: '2026-11-01T00:00:00Z',
    modifierEffects: [{ changes: [{ component: 'tool.enchants.harvesting', from: '5', to: '6' }], players: 2, playersAtLeast: true, playersLabel: '2+', pairs: 3, ratio: LEAK, percentChange: LEAK }],
    baseline: setup('baseline', 'Baseline gear', 'baseline', 'baseline', false, [gearItem('tool', 'STONE_PICKAXE', 'Stone Pickaxe', { stability: 'stable', acquisition: noMatchAcquisition, modifiersMeasured: false })], {
        basis: 'estimate',
        coinsPerHour: 1500000,
        deltaCoinsPerHour: 0,
        stability: 'stable'
    }),
    setups: [
        setup('budget', 'Budget upgrade', 'budget', 'upgrade', false, [gearItem('tool', 'MITHRIL_PICKAXE', 'Mithril Pickaxe', { ...itemNumbers, spec: budgetSpec, acquisition: budgetAcquisition, modifiersMeasured: true })], {
            ...measuredNumbers,
            // details only: the free tier of the public response must drop it
            statMedians: { mining_speed: LEAK },
            confidence: 'low',
            commonP25: 1600000,
            commonP75: 1800000,
            coinsPerHour: 1710000,
            deltaCoinsPerHour: 210000,
            buyCost: 3130000,
            resaleValue: 2710000,
            borrowCost: 420000,
            paybackHoursBorrow: 2,
            paybackHoursFull: 14.9,
            netGain10h: 1680000,
            netGain50h: 10080000,
            stability: 'stable'
        }),
        setup('mid', 'Mid upgrade', 'mid', 'reached', true, [gearItem('helmet', 'MINER_HELMET', 'Miner Helmet', leakedItemNumbers)], leakedSetupNumbers),
        setup('endgame', 'Endgame upgrade', 'endgame', 'upgrade', true, [
            gearItem('tool', 'DIVAN_DRILL', 'Divan Drill', leakedItemNumbers),
            gearItem('pet', 'SOULBOUND_PET', 'Soulbound Pet', {}, false)
        ], leakedSetupNumbers)
    ]
}

/** No measured baseline: the API sends null and the community rate. A budget item is only priced as a lower bound. */
export const communityTaskSetups = {
    slug: 'community-task',
    taskName: 'Community Task',
    profileName: 'Mining',
    locked: true,
    baselineCoinsPerHour: 1500000,
    comparisonCoinsPerHour: 1500000,
    baseline: null,
    setups: [
        setup('budget', 'Budget upgrade', 'budget', 'upgrade', false, [gearItem('tool', 'MITHRIL_PICKAXE', 'Mithril Pickaxe', { ...itemNumbers, priceLowerBound: true, acquisition: lowerBoundAcquisition, modifiersMeasured: true })], {
            ...measuredNumbers,
            confidence: 'low',
            coinsPerHour: 1710000,
            deltaCoinsPerHour: 210000,
            buyCost: 4200000,
            priceLowerBound: true,
            resaleValue: 2710000,
            borrowCost: 1490000,
            paybackHoursBorrow: 7,
            paybackHoursFull: 20,
            netGain10h: 610000,
            netGain50h: 8560000,
            stability: 'stable'
        })
    ]
}

/** Only baseline and endgame: tiers that do not beat the one below are not sent. */
export const sparseTaskSetups = {
    slug: 'sparse-task',
    taskName: 'Sparse Task',
    profileName: 'Mining',
    locked: true,
    baselineCoinsPerHour: 1500000,
    baseline: publicTaskSetups.baseline,
    setups: [publicTaskSetups.setups[2]]
}

export const taskFixtures = {
    list: [task('gear-task', 'Gear Task'), task('plain-task', 'Plain Task'), task('community-task', 'Community Task'), task('sparse-task', 'Sparse Task')],
    tasks: {
        'gear-task': task('gear-task', 'Gear Task'),
        'plain-task': task('plain-task', 'Plain Task'),
        'community-task': task('community-task', 'Community Task'),
        'sparse-task': task('sparse-task', 'Sparse Task'),
        'warp-task': warpTask
    } as Record<string, unknown>,
    setups: { 'gear-task': publicTaskSetups, 'community-task': communityTaskSetups, 'sparse-task': sparseTaskSetups } as Record<string, unknown>
}
