'use client'
import { useState } from 'react'
import { Card, Button, Form, InputGroup, Alert } from 'react-bootstrap'
import Number from '../Number/Number'
import styles from './CoflCoinsPurchase.module.css'
import NumberElement from '../Number/Number'

interface CoflCoinOption {
    amount: number
    paypalPrice: number
    stripePrice: number
    lemonsqueezyPrice: number
    paypalProductId: string
    stripeProductId: string
    lemonsqueezyProductId: string
    discount?: number
    isCustom?: boolean
}

interface Props {
    onAmountSelected: (option: CoflCoinOption) => void
    coflCoins: number
}

const coflCoinOptions: CoflCoinOption[] = [
    {
        amount: 1800,
        paypalPrice: 8.69,
        stripePrice: 8.42,
        lemonsqueezyPrice: 8.69,
        paypalProductId: "p_cc_1800",
        stripeProductId: "s_cc_1800",
        lemonsqueezyProductId: "l_cc_1800"
    },
    {
        amount: 5400,
        paypalPrice: 22.99,
        stripePrice: 22.69,
        lemonsqueezyPrice: 22.69,
        paypalProductId: "p_cc_5400",
        stripeProductId: "s_cc_5400",
        lemonsqueezyProductId: "l_cc_5400"
    },
    {
        amount: 10800,
        paypalPrice: 39.69,
        stripePrice: 38.99,
        lemonsqueezyPrice: 39.69,
        paypalProductId: "p_cc_10800",
        stripeProductId: "s_cc_10800",
        lemonsqueezyProductId: "l_cc_10800"
    },
    {
        amount: 21600,
        paypalPrice: 78.69,
        stripePrice: 74.99,
        lemonsqueezyPrice: 78.69,
        paypalProductId: "p_cc_21600",
        stripeProductId: "s_cc_21600",
        lemonsqueezyProductId: "l_cc_21600"
    }
]

function getPricePerCoin(option: CoflCoinOption, provider: 'paypal' | 'stripe' | 'lemonsqueezy' = 'stripe'): number {
    const price = provider === 'paypal' ? option.paypalPrice :
        provider === 'stripe' ? option.stripePrice :
            option.lemonsqueezyPrice
    return price / option.amount
}

function calculateSavings(baseOption: CoflCoinOption, currentOption: CoflCoinOption): number {
    const basePricePerCoin = getPricePerCoin(baseOption)
    const currentPricePerCoin = getPricePerCoin(currentOption)
    return ((basePricePerCoin - currentPricePerCoin) / basePricePerCoin) * 100
}

function CoflCoinAmountSelection({ onAmountSelected, coflCoins }: Props) {
    const [selectedOption, setSelectedOption] = useState<CoflCoinOption | null>(null)
    const [customAmount, setCustomAmount] = useState<string>('')
    const [showCustomInput, setShowCustomInput] = useState(false)
    const baseOption = coflCoinOptions[0]

    // Check if user needs specific amount to make their coins divisible by 1800
    const remainder = coflCoins % 1800
    const needsSpecificAmount = remainder !== 0
    const specificAmount = needsSpecificAmount ? 1800 - remainder : 0

    const specificOption: CoflCoinOption | null = needsSpecificAmount ? {
        amount: 1800 + specificAmount,
        paypalPrice: (baseOption.paypalPrice / 1800) * (1800 + specificAmount),
        stripePrice: (baseOption.stripePrice / 1800) * (1800 + specificAmount),
        lemonsqueezyPrice: (baseOption.lemonsqueezyPrice / 1800) * (1800 + specificAmount),
        paypalProductId: baseOption.paypalProductId,
        stripeProductId: baseOption.stripeProductId,
        lemonsqueezyProductId: baseOption.lemonsqueezyProductId
    } : null

    const allOptions = specificOption ? [specificOption, ...coflCoinOptions] : coflCoinOptions

    // Custom amount helpers
    const getCustomAmountValue = (): number => {
        return parseInt(customAmount) || 0
    }

    const isCustomAmountValid = (): boolean => {
        const amount = getCustomAmountValue()
        return amount >= 1800
    }

    const calculateCustomPrice = (amount: number, basePrice: number): number => {
        const pricePerCoin = basePrice / baseOption.amount
        return pricePerCoin * amount
    }

    const createCustomOption = (amount: number): CoflCoinOption => {
        return {
            amount,
            paypalPrice: calculateCustomPrice(amount, baseOption.paypalPrice),
            stripePrice: calculateCustomPrice(amount, baseOption.stripePrice),
            lemonsqueezyPrice: calculateCustomPrice(amount, baseOption.lemonsqueezyPrice),
            paypalProductId: baseOption.paypalProductId,
            stripeProductId: baseOption.stripeProductId,
            lemonsqueezyProductId: baseOption.lemonsqueezyProductId
        }
    }

    const handleCustomAmountChange = (value: string) => {
        // Only allow numbers
        const numericValue = value.replace(/[^0-9]/g, '')
        setCustomAmount(numericValue)
        
        // If we have a valid custom amount, clear the selected predefined option
        if (numericValue && parseInt(numericValue) >= 1800) {
            setSelectedOption(null)
        }
    }

    const handleCustomAmountSelect = () => {
        if (isCustomAmountValid()) {
            const customOption = createCustomOption(getCustomAmountValue())
            onAmountSelected(customOption)
        }
    }

    const handlePredefinedOptionSelect = (option: CoflCoinOption) => {
        setSelectedOption(option)
        setCustomAmount('')
    }

    // Build a lightweight custom option placeholder (will be shown as a card)
    const customOptionPlaceholder: CoflCoinOption = {
        amount: getCustomAmountValue() || 0,
        paypalPrice: calculateCustomPrice(getCustomAmountValue(), baseOption.paypalPrice),
        stripePrice: calculateCustomPrice(getCustomAmountValue(), baseOption.stripePrice),
        lemonsqueezyPrice: calculateCustomPrice(getCustomAmountValue(), baseOption.lemonsqueezyPrice),
        paypalProductId: baseOption.paypalProductId,
        stripeProductId: baseOption.stripeProductId,
        lemonsqueezyProductId: baseOption.lemonsqueezyProductId,
        isCustom: true
    }

    const displayedOptions = [...allOptions, customOptionPlaceholder]

    return (
        <div>
            <h4 style={{ marginBottom: '30px', textAlign: 'center' }}>Choose CoflCoin Amount</h4>

            {specificOption && (
                <div className="alert alert-info" role="alert" style={{ marginBottom: '20px' }}>
                    <p className="mb-0 small">
                        <strong>Recommended:</strong> Your current balance isn't divisible by 1800.
                        Consider buying <Number number={specificOption.amount} /> CoflCoins to optimize your premium purchases.
                    </p>
                </div>
            )}

            <div className={styles.productGrid}>
                {displayedOptions.map((option, index) => {
                    const isCustom = !!option.isCustom
                    const rawSavings = !isCustom ? (index === 0 && !specificOption ? 0 : calculateSavings(baseOption, option)) : 0
                    const savings = typeof rawSavings === 'number' ? rawSavings : 0
                    const isSelected = selectedOption?.amount === option.amount && !isCustom
                    const isSpecialOption = option === specificOption

                    // For custom option card, expand if showCustomInput or if user typed a valid amount
                    const shouldExpandCustom = isCustom && (showCustomInput || (customAmount && isCustomAmountValid()))

                    return (
                        <Card
                            key={isCustom ? 'custom-option' : option.amount}
                            className={`${styles.premiumPlanCard} ${isSelected ? 'border-primary shadow' : 'border-secondary'}`}
                            style={{
                                cursor: 'pointer',
                                transform: (isSelected || (isCustom && shouldExpandCustom)) ? 'translateY(-2px)' : 'none'
                            }}
                            onClick={() => !isCustom && handlePredefinedOptionSelect(option)}
                        >
                            <Card.Header className="position-relative">
                                <Card.Title>
                                    {isCustom ? 'Custom Amount' : <Number number={option.amount} />}
                                </Card.Title>
                                {isSpecialOption && (
                                    <span className="position-absolute top-0 end-0 mt-2 me-2 badge bg-success">OPTIMAL</span>
                                )}
                                {!isCustom && savings > 0 && (
                                    <span className="position-absolute top-0 end-0 mt-2 me-2 badge bg-warning text-dark">SAVE {Math.round(savings)}%</span>
                                )}
                            </Card.Header>
                            <Card.Body>
                                <div style={{ textAlign: 'center' }}>
                                    {!isCustom && (
                                        <>
                                            <div className="h5 fw-semibold text-success mb-2">From €{option.stripePrice.toFixed(2)}</div>
                                            <div className="small text-muted mb-3">€{getPricePerCoin(option).toFixed(4)} per coin</div>

                                            {savings > 0 && (
                                                <div className="small text-success fw-semibold mb-2">
                                                    {Math.round(savings)}% cheaper than <Number number={baseOption.amount} /> coins
                                                </div>
                                            )}

                                            {isSpecialOption && (
                                                <div className="small text-info mb-2">Makes your total divisible by 1800</div>
                                            )}
                                        </>
                                    )}

                                    {isCustom && (
                                        <div>
                                            {!shouldExpandCustom && (
                                                <>
                                                    <div className="small text-muted mb-2">Need a different amount?</div>
                                                    <Button variant="outline-primary" size="sm" onClick={() => setShowCustomInput(true)}>
                                                        Enter Custom Amount
                                                    </Button>
                                                </>
                                            )}

                                            {shouldExpandCustom && (
                                                <div style={{ marginTop: 10 }}>
                                                    <Form.Group className="mb-3">
                                                        <InputGroup>
                                                            <Form.Control
                                                                type="text"
                                                                placeholder="1800"
                                                                value={customAmount}
                                                                onChange={(e) => handleCustomAmountChange(e.target.value)}
                                                            />
                                                            <InputGroup.Text>CoflCoins</InputGroup.Text>
                                                        </InputGroup>
                                                        {customAmount && (
                                                            <Form.Text className="text-muted">
                                                                {isCustomAmountValid() ? (
                                                                    <>Price: €{calculateCustomPrice(getCustomAmountValue(), baseOption.stripePrice).toFixed(2)}</>
                                                                ) : (
                                                                    <span className="text-danger">Minimum amount is 1800 CoflCoins</span>
                                                                )}
                                                            </Form.Text>
                                                        )}
                                                    </Form.Group>

                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                                                        <Button variant="primary" disabled={!isCustomAmountValid()} onClick={handleCustomAmountSelect}>
                                                            Continue
                                                        </Button>
                                                        <Button variant="outline-secondary" onClick={() => { setShowCustomInput(false); setCustomAmount('') }}>
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    )
                })}
            </div>

            

            <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '30px'
            }}>
                <Button
                    variant="primary"
                    size="lg"
                    disabled={!selectedOption}
                    onClick={() => selectedOption && onAmountSelected(selectedOption)}
                    style={{
                        padding: '12px 40px',
                        fontSize: '1.1rem',
                        fontWeight: '600'
                    }}
                >
                    {selectedOption ? <span>Continue with <NumberElement number={selectedOption.amount} /> CoflCoins</span> : 'Select an Amount'}
                </Button>
            </div>
        </div>
    )
}

export default CoflCoinAmountSelection
