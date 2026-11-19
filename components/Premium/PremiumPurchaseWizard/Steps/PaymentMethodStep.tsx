'use client'
import OptionGroup, { WizardOption } from '../OptionGroup'
import { PurchaseType } from '../types'

interface Props {
    selectedType: PurchaseType | null
    onTypeSelect: (type: PurchaseType, advance: boolean) => void
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

export default function PaymentMethodStep({ selectedType, onTypeSelect }: Props) {
    return <OptionGroup legend="Plan type" options={TYPE_OPTIONS} selected={selectedType} onChoose={onTypeSelect} />
}
