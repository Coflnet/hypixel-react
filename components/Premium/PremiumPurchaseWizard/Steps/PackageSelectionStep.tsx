import type { SlotCatalog } from '../../../../hooks/useSlotCatalog'
import OptionGroup, { WizardOption } from '../OptionGroup'
import { PremiumTier, PurchaseType } from '../types'

interface Props {
    tier: PremiumTier
    forFriends: boolean
    purchaseType: PurchaseType
    catalog: SlotCatalog
    slotCount: number
    onSelect(slotCount: number, advance: boolean): void
}

interface PackagePrice {
    amount: string
    unit: string
}

interface PackageCopy {
    count: number
    title: string
    description: string
}

function formatPeriod(ownershipSeconds: number): string {
    return ownershipSeconds === 2419200 ? '4 weeks' : `${ownershipSeconds / 86400} days`
}

/** the per-slot price of each package size, e.g. { amount: "~€24.92", unit: "per slot · every 4 weeks" } */
function getPackagePrices(catalog: SlotCatalog, tier: PremiumTier, recurring: boolean): Record<number, PackagePrice> {
    const prices: Record<number, PackagePrice> = {}
    for (const product of catalog.products.filter(product => product.slotTier === tier && product.slug?.startsWith('l_') === recurring)) {
        const provider = catalog.price(product)
        const amount = recurring ? (provider?.discountedPrice ?? provider?.originalPrice) : product.cost
        if (amount === undefined || !Number.isFinite(amount) || amount <= 0) continue
        const perSlot = amount / product.slotCount!
        const period = formatPeriod(product.ownershipSeconds!)
        prices[product.slotCount!] = recurring
            ? {
                  amount: `~${new Intl.NumberFormat(undefined, { style: 'currency', currency: provider?.currencyCode || 'EUR' }).format(perSlot)}`,
                  unit: `per slot · every ${period}`
              }
            : { amount: perSlot.toLocaleString(), unit: `CoflCoins per slot · ${period}` }
    }
    return prices
}

function isLoadingPrices(catalog: SlotCatalog, tier: PremiumTier, recurring: boolean): boolean {
    if (catalog.loading) return true
    if (!recurring) return false
    const hasRecurringProducts = catalog.products.some(product => product.slotTier === tier && product.slug?.startsWith('l_'))
    return hasRecurringProducts && !catalog.canUsePrices && !catalog.pricingError && !catalog.catalogError
}

function getPackageCopy(recurring: boolean): PackageCopy[] {
    return [
        { count: 0, title: 'Just for me', description: 'Premium for your account. Choose a duration next.' },
        {
            count: 1,
            title: 'One assignable slot',
            description: recurring
                ? 'Assign to yourself or a friend. Same price as a normal subscription; cancel this slot independently.'
                : 'Choose a friend after payment. Includes a fixed period of access.'
        },
        {
            count: 4,
            title: 'Package of 4',
            description: recurring
                ? 'Four slots to assign to friends. Renews and cancels as one subscription.'
                : 'Four slots to assign to friends. Includes a fixed period of access.'
        }
    ]
}

export default function PackageSelectionStep({ tier, forFriends, purchaseType, catalog, slotCount, onSelect }: Props) {
    const recurring = purchaseType === PurchaseType.SUBSCRIPTION
    const prices = getPackagePrices(catalog, tier, recurring)
    const loading = isLoadingPrices(catalog, tier, recurring)

    function getPriceParts(count: number): Pick<WizardOption<number>, 'price' | 'unit'> {
        if (count === 0) return { unit: 'Price depends on duration' }
        if (loading) return { unit: 'Loading price…' }
        const price = prices[count]
        if (!price) return { unit: 'Price unavailable' }
        if (!recurring) return { price: price.amount, unit: price.unit }
        const unit = (
            <>
                {price.unit}
                <br />
                {catalog.taxLabel}
            </>
        )
        return { price: price.amount, unit }
    }

    const options: WizardOption<number>[] = getPackageCopy(recurring)
        .filter(option => !forFriends || option.count !== 0)
        .map(option => ({
            value: option.count,
            title: option.title,
            description: option.description,
            testId: 'premium-package',
            ...getPriceParts(option.count)
        }))

    const selected = forFriends && slotCount === 0 ? null : slotCount
    return <OptionGroup legend="Package" options={options} selected={selected} onChoose={onSelect} />
}
