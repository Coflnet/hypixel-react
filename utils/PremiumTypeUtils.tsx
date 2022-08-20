export const PREMIUM_TYPES: PremiumType[] = [
    {
        productId: 'premium',
        label: 'Premium',
        price: 1800,
        durationString: 'month',
        priority: 2,
        options: generateNumberArray(1, 12)
    },
    {
        productId: 'premium_plus',
        label: 'Premium+',
        price: 1800,
        durationString: 'week',
        priority: 3,
        options: generateNumberArray(1, 4)
    },
    {
        productId: 'starter_premium-day',
        label: 'Starter Premium (day)',
        price: 24,
        durationString: 'day',
        priority: 1,
        options: generateNumberArray(1, 30)
    },
    {
        productId: 'starter_premium-week',
        label: 'Starter Premium (week)',
        price: 120,
        durationString: 'week',
        priority: 1,
        options: generateNumberArray(1, 12)
    },
    {
        productId: 'starter_premium',
        label: 'Starter Premium (half year)',
        price: 1800,
        durationString: 'month',
        priority: 1,
        options: [
            { value: 1, label: '6' },
            { value: 2, label: '12' }
        ]
    }
]

/**
 * Generates an array containing the numbers from (and including) start and end
 */
function generateNumberArray(start: number, end: number): number[] {
    return (Array(end - start + 1) as any).fill().map((_, idx) => start + idx)
}

export function getHighestPriorityPremiumProduct(premiumProducts: PremiumProduct[]) {
    let results: { productSlug: string; productId: string; priority: number }[] = []

    premiumProducts.forEach(product => {
        let types = [...PREMIUM_TYPES].sort((a, b) => b.productId.localeCompare(a.productId))
        let type = types.find(type => product.productSlug.startsWith(type.productId))
        results.push({
            productSlug: product.productSlug,
            productId: type.productId,
            priority: type.priority
        })
    })

    let result = results.sort((a, b) => b.priority - a.priority)[0]
    return premiumProducts.find(product => product.productSlug === result.productSlug)
}

export function getPremiumType(product: PremiumProduct) {
    return PREMIUM_TYPES.find(type => type.productId === product.productSlug)
}

export function getPremiumTypeOptionValue(option: number | { label: string; value: number }) {
    return typeof option === 'number' ? option : option.value
}

export function getPremiumTypeOptionLabel(option: number | { label: string; value: number }) {
    return typeof option === 'number' ? option : option.label
}
