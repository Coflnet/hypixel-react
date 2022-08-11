export const PREMIUM_TYPES: PremiumType[] = [
    {
        productId: 'premium',
        label: 'Premium',
        price: 1800,
        durationString: 'month',
        priority: 1
    },
    {
        productId: 'premium_plus',
        label: 'Premium+',
        price: 1800,
        durationString: 'week',
        priority: 2
    }
]

export function getHighestPriorityPremiumProduct(premiumProducts: PremiumProduct[]) {
    let premiumTypes = PREMIUM_TYPES.filter(type => premiumProducts.findIndex(product => product.productSlug === type.productId) !== -1)
    let premiumType = premiumTypes.sort((a, b) => b.priority - a.priority)[0]
    return premiumProducts.find(product => product.productSlug === premiumType.productId)
}

export function getPremiumType(product: PremiumProduct) {
    return PREMIUM_TYPES.find(type => type.productId === product.productSlug)
}
