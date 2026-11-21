'use client'
import OptionGroup, { WizardOption } from '../OptionGroup'
import { PurchaseType } from '../types'

interface Props {
    selectedType: PurchaseType | null
    onTypeSelect: (type: PurchaseType, advance: boolean) => void
    coinsOnly?: boolean
}

const TYPE_OPTIONS: WizardOption<PurchaseType>[] = [
    {
        value: PurchaseType.SUBSCRIPTION,
        title: 'Subscription',
        description: 'Renews automatically. Cancel any time on this page; discount codes work.',
        badge: 'Most popular'
    },
    {
        value: PurchaseType.COFLCOINS,
        title: 'CoflCoins',
        description: 'Pay with CoflCoins balance (prepaid pay as you go).'
    }
]

export default function PaymentMethodStep({ selectedType, onTypeSelect, coinsOnly }: Props) {
    const options = coinsOnly ? TYPE_OPTIONS.filter(option => option.value === PurchaseType.COFLCOINS) : TYPE_OPTIONS
    return <OptionGroup legend="Plan type" options={options} selected={selectedType} onChoose={onTypeSelect} />
}
