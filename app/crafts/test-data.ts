type RawCraftIngredient = {
    itemId: string
    count: number
    cost: number
    type?: string | null
}

type RawProfitableCraft = {
    itemId: string
    itemName: string
    sellPrice: number
    craftCost: number
    ingredients: RawCraftIngredient[]
    reqCollection?: {
        name: string
        level: number
    } | null
    reqSlayer?: {
        name: string
        level: number
    } | null
    reqSkill?: {
        name: string
        level: number
    } | null
    volume: number
    median: number
    lastUpdated: string
}

export const TEST_PROFITABLE_CRAFTS: RawProfitableCraft[] = [
    {
        itemId: 'SUPER_COMPACTOR_3000',
        itemName: 'SUPER_COMPACTOR_3000',
        sellPrice: 512000,
        craftCost: 398500,
        ingredients: [
            { itemId: 'ENCHANTED_COBBLESTONE', count: 448, cost: 310000 },
            { itemId: 'ENCHANTED_REDSTONE_BLOCK', count: 1, cost: 88500 }
        ],
        reqCollection: {
            name: 'COBBLESTONE',
            level: 9
        },
        volume: 1420,
        median: 501000,
        lastUpdated: '2025-01-01T00:00:00.000Z'
    },
    {
        itemId: 'HYPER_CATALYST',
        itemName: 'HYPER_CATALYST',
        sellPrice: 148000,
        craftCost: 96500,
        ingredients: [
            { itemId: 'ENCHANTED_CATALYST', count: 4, cost: 92000 },
            { itemId: 'EYE_OF_ENDER', count: 16, cost: 4500 }
        ],
        reqCollection: {
            name: 'CATALYST_COLLECTION',
            level: 7
        },
        volume: 6100,
        median: 140500,
        lastUpdated: '2025-01-01T00:00:00.000Z'
    },
    {
        itemId: 'GOLDEN_TOOTH',
        itemName: 'GOLDEN_TOOTH',
        sellPrice: 198000,
        craftCost: 129500,
        ingredients: [
            { itemId: 'GOLDEN_POWDER', count: 1, cost: 78500 },
            { itemId: 'WOLF_TOOTH', count: 64, cost: 51000 }
        ],
        reqSlayer: {
            name: 'WOLF',
            level: 4
        },
        volume: 980,
        median: 190000,
        lastUpdated: '2025-01-01T00:00:00.000Z'
    },
    {
        itemId: 'REVENANT_VISCERA',
        itemName: 'REVENANT_VISCERA',
        sellPrice: 410000,
        craftCost: 287000,
        ingredients: [
            { itemId: 'REVENANT_FLESH', count: 512, cost: 279000 },
            { itemId: 'GOLDEN_TOOTH', count: 8, cost: 8000, type: 'craft' }
        ],
        reqSlayer: {
            name: 'ZOMBIE',
            level: 6
        },
        volume: 730,
        median: 395000,
        lastUpdated: '2025-01-01T00:00:00.000Z'
    },
    {
        itemId: 'ENCHANTED_CAKE',
        itemName: 'ENCHANTED_CAKE',
        sellPrice: 120000,
        craftCost: 62000,
        ingredients: [
            { itemId: 'CAKE', count: 1, cost: 12000 },
            { itemId: 'ENCHANTED_EGG', count: 1, cost: 15000 },
            { itemId: 'ENCHANTED_SUGAR', count: 32, cost: 18000 },
            { itemId: 'ENCHANTED_WHEAT', count: 32, cost: 17000 }
        ],
        reqCollection: {
            name: 'WHEAT',
            level: 6
        },
        volume: 220,
        median: 115000,
        lastUpdated: '2025-01-01T00:00:00.000Z'
    }
]

export const TEST_BAZAAR_TAGS: string[] = [
    'ENCHANTED_COBBLESTONE',
    'ENCHANTED_REDSTONE_BLOCK',
    'ENCHANTED_CATALYST',
    'EYE_OF_ENDER',
    'GOLDEN_POWDER',
    'WOLF_TOOTH',
    'REVENANT_FLESH',
    'ENCHANTED_EGG',
    'ENCHANTED_SUGAR',
    'ENCHANTED_WHEAT'
]
