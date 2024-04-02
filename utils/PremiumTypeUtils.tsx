export enum PREMIUM_RANK {
    STARTER = 1,
    PREMIUM = 2,
    PREMIUM_PLUS = 3
}

export const PREMIUM_TYPES: PremiumType[] = [
    {
        productId: 'premium',
        label: 'Premium',
        durationString: 'month',
        priority: PREMIUM_RANK.PREMIUM,
        options: generateNumberOptionArray(1, 12, 'premium', 1800)
    },
    {
        productId: 'premium_plus',
        label: 'Premium+',
        durationString: '',
        priority: PREMIUM_RANK.PREMIUM_PLUS,
        options: [
            { value: 1, label: '1 week', productId: 'premium_plus', price: 1800 },
            { value: 1, label: '1 hour', productId: 'premium_plus-hour', price: 200 },
            { value: 1, label: '1 day', productId: 'premium_plus-day', price: 600 }
        ]
    },
    {
        productId: 'starter_premium',
        label: 'Starter Premium',
        durationString: '',
        priority: PREMIUM_RANK.STARTER,
        options: [
            { value: 1, label: '1 day', productId: 'starter_premium-day', price: 24 },
            { value: 1, label: '1 week', productId: 'starter_premium-week', price: 120 },
            { value: 4, label: '4 weeks', productId: 'starter_premium-week', price: 120 },
            { value: 1, label: '6 months', productId: 'starter_premium', price: 1800 },
            { value: 2, label: '12 months', productId: 'starter_premium', price: 1800 }
        ]
    }
]

function generateNumberOptionArray(start: number, end: number, productId: string, priceForOption: number): PremiumTypeOption[] {
    return (Array(end - start + 1) as any)
        .fill()
        .map((_, idx) => start + idx)
        .map(number => {
            return {
                value: number,
                label: number,
                productId: productId,
                price: priceForOption
            }
        })
}

export function getHighestPriorityPremiumProduct(premiumProducts: PremiumProduct[] = []) {
    let results = premiumProducts.map(product => {
        let type = getPremiumType(product)
        return {
            productSlug: product.productSlug,
            productId: type?.productId,
            priority: type?.priority
        }
    })

    let result = results.sort((a, b) => b.priority - a.priority)[0]
    return premiumProducts.find(product => product.productSlug === result.productSlug && product.expires > new Date())
}

export function getPremiumType(product: PremiumProduct) {
    return [...PREMIUM_TYPES].sort((a, b) => b.productId.localeCompare(a.productId)).find(type => product.productSlug.startsWith(type.productId))
}

export function hasHighEnoughPremium(products: PremiumProduct[], minPremiumType: PREMIUM_RANK) {
    let hasHighEnoughPremium = false
    products.forEach(product => {
        let type = getPremiumType(product)
        if (type && type.priority >= minPremiumType && product.expires > new Date()) {
            hasHighEnoughPremium = true
        }
    })
    return hasHighEnoughPremium
}
