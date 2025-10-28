'use client'
import { useState } from 'react'
import CoflCoinAmountSelection from './CoflCoinAmountSelection'
import CoflCoinPaymentSelection from './CoflCoinPaymentSelection'

interface CoflCoinOption {
    amount: number
    paypalPrice: number
    stripePrice: number
    lemonsqueezyPrice: number
    googlePlayPrice: number
    paypalProductId: string
    stripeProductId: string
    lemonsqueezyProductId: string
    googlePlayProductId: string
}

interface Props {
    coflCoins: number
    countryCode?: string
    onPayPalPay: (productId: string, coflCoins?: number) => void
    onStripePay: (productId: string, coflCoins?: number) => void
    onLemonSqueezyPay: (productId: string, coflCoins?: number) => void
    onGooglePlayPay: (productId: string, purchaseToken: string, coflCoins?: number) => void
    loadingProductId: string
    isGooglePlayAvailable?: boolean
}

function CoflCoinPurchaseWizard({ coflCoins, countryCode, onPayPalPay, onStripePay, onLemonSqueezyPay, onGooglePlayPay, loadingProductId, isGooglePlayAvailable }: Props) {
    const [step, setStep] = useState<'amount' | 'payment'>('amount')
    const [selectedOption, setSelectedOption] = useState<CoflCoinOption | null>(null)

    const handleAmountSelected = (option: CoflCoinOption) => {
        setSelectedOption(option)
        setStep('payment')
    }

    const handleBack = () => {
        setStep('amount')
        setSelectedOption(null)
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            {step === 'amount' && <CoflCoinAmountSelection coflCoins={coflCoins} onAmountSelected={handleAmountSelected} />}

            {step === 'payment' && selectedOption && (
                <CoflCoinPaymentSelection
                    selectedOption={selectedOption}
                    coflCoins={coflCoins}
                    countryCode={countryCode}
                    onBack={handleBack}
                    onPayPalPay={onPayPalPay}
                    onStripePay={onStripePay}
                    onLemonSqueezyPay={onLemonSqueezyPay}
                    onGooglePlayPay={onGooglePlayPay}
                    loadingProductId={loadingProductId}
                    isGooglePlayAvailable={isGooglePlayAvailable}
                />
            )}
        </div>
    )
}

export default CoflCoinPurchaseWizard
