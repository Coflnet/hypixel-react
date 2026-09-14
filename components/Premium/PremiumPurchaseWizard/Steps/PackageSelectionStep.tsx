import { Card } from 'react-bootstrap'
import type { SlotCatalog } from '../../../../hooks/useSlotCatalog'
import { PremiumTier, PurchaseType } from '../types'
import styles from './Steps.module.css'

interface Props {
    tier: PremiumTier
    forFriends: boolean
    purchaseType: PurchaseType
    catalog: SlotCatalog
    slotCount: number
    onSelect(slotCount: number): void
}

export default function PackageSelectionStep({ tier, forFriends, purchaseType, catalog, slotCount, onSelect }: Props) {
    const recurring = purchaseType === PurchaseType.SUBSCRIPTION
    const prices: Record<number, string> = {}
    for (const product of catalog.products.filter(product => product.slotTier === tier && product.slug?.startsWith('l_') === recurring)) {
        const provider = catalog.price(product)
        const amount = recurring ? (provider?.discountedPrice ?? provider?.originalPrice) : product.cost
        if (amount === undefined || !Number.isFinite(amount) || amount <= 0) continue
        const perSlot = amount / product.slotCount!
        const cost = recurring
            ? `~${new Intl.NumberFormat(undefined, { style: 'currency', currency: provider?.currencyCode || 'EUR' }).format(perSlot)}`
            : `${perSlot.toLocaleString()} CoflCoins`
        const period = product.ownershipSeconds === 2419200 ? '4 weeks' : `${product.ownershipSeconds! / 86400} days`
        prices[product.slotCount!] = `${cost} per slot · ${recurring ? 'every ' : ''}${period}`
    }
    const loading =
        catalog.loading ||
        (recurring &&
            catalog.products.some(product => product.slotTier === tier && product.slug?.startsWith('l_')) &&
            !catalog.canUsePrices &&
            !catalog.pricingError &&
            !catalog.catalogError)

    return (
        <div className={`${styles.optionsGrid} ${forFriends ? styles.twoOptions : ''}`}>
            {[
                { count: 0, title: 'Just for me', icon: '👤', description: 'Premium for your account. Choose a duration next.' },
                { count: 1, title: 'One assignable slot', icon: '🎟️', description: recurring ? 'Assign to yourself or a friend. Same price as a normal subscription; cancel this slot independently.' : 'Choose a friend after payment. Includes a fixed period of access.' },
                { count: 4, title: 'Package of 4', icon: '👥', description: recurring ? 'Four slots to assign to friends. Renews and cancels as one subscription.' : 'Four slots to assign to friends. Includes a fixed period of access.' }
            ]
                .filter(option => !forFriends || option.count !== 0)
                .map(option => (
                    <Card
                        as="button"
                        type="button"
                        key={option.count}
                        data-testid="premium-package"
                        aria-pressed={slotCount === option.count}
                        className={`${styles.optionCard} ${slotCount === option.count ? styles.selected : ''}`}
                        onClick={() => onSelect(option.count)}
                    >
                        <Card.Body className={styles.optionBody}>
                            <div className={styles.optionIcon}>{option.icon}</div>
                            <h5 className={styles.paymentTitle}>{option.title}</h5>
                            <p className={styles.paymentDescription}>{option.description}</p>
                            <div className={styles.monthlyPrice}>
                                <small>
                                    {option.count === 0
                                        ? 'Price depends on duration'
                                        : loading
                                          ? 'Loading price…'
                                          : prices[option.count] || 'Price unavailable'}
                                </small>
                                {recurring && option.count > 0 && prices[option.count] ? <small className="d-block">{catalog.taxLabel}</small> : null}
                            </div>
                        </Card.Body>
                    </Card>
                ))}
        </div>
    )
}
