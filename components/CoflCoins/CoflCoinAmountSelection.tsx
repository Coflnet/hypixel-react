'use client'
import { useState } from 'react'
import { Card, Button } from 'react-bootstrap'
import Number from '../Number/Number'
import styles from './CoflCoinsPurchase.module.css'

interface CoflCoinOption {
    amount: number
    paypalPrice: number
    stripePrice: number
    lemonsqueezyPrice: number
    paypalProductId: string
    stripeProductId: string
    lemonsqueezyProductId: string
    discount?: number
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

// Calculate price per coin for comparison
function getPricePerCoin(option: CoflCoinOption, provider: 'paypal' | 'stripe' | 'lemonsqueezy' = 'stripe'): number {
    const price = provider === 'paypal' ? option.paypalPrice : 
                  provider === 'stripe' ? option.stripePrice : 
                  option.lemonsqueezyPrice
    return price / option.amount
}

// Calculate savings compared to base option
function calculateSavings(baseOption: CoflCoinOption, currentOption: CoflCoinOption): number {
    const basePricePerCoin = getPricePerCoin(baseOption)
    const currentPricePerCoin = getPricePerCoin(currentOption)
    return ((basePricePerCoin - currentPricePerCoin) / basePricePerCoin) * 100
}

function CoflCoinAmountSelection({ onAmountSelected, coflCoins }: Props) {
    const [selectedOption, setSelectedOption] = useState<CoflCoinOption | null>(null)
    const baseOption = coflCoinOptions[0] // 1800 coins option as base

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

    return (
        <div>
            <h4 style={{ marginBottom: '30px', textAlign: 'center' }}>Choose CoflCoin Amount</h4>
            
            {specificOption && (
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '8px', border: '1px solid #bee5eb' }}>
                    <p style={{ margin: 0, color: '#0c5460', fontSize: '0.9rem' }}>
                        <strong>Recommended:</strong> Your current balance isn't divisible by 1800. 
                        Consider buying <Number number={specificOption.amount} /> CoflCoins to optimize your premium purchases.
                    </p>
                </div>
            )}

            <div className={styles.productGrid}>
                {allOptions.map((option, index) => {
                    const savings = index === 0 && !specificOption ? 0 : calculateSavings(baseOption, option)
                    const isSelected = selectedOption?.amount === option.amount
                    const isSpecialOption = option === specificOption

                    return (
                        <Card 
                            key={option.amount}
                            className={`${styles.premiumPlanCard} ${isSelected ? styles.selectedCard : ''}`}
                            style={{ 
                                cursor: 'pointer',
                                border: isSelected ? '2px solid #004085' : '2px solid #dee2e6',
                                backgroundColor: isSelected ? '#eef4ff' : 'white',
                                transform: isSelected ? 'translateY(-2px)' : 'none',
                                boxShadow: isSelected ? '0 6px 20px rgba(0, 64, 133, 0.18)' : '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                            onClick={() => setSelectedOption(option)}
                        >
                            <Card.Header style={{ position: 'relative' }}>
                                <Card.Title>
                                    <Number number={option.amount} /> CoflCoins
                                </Card.Title>
                                {isSpecialOption && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '10px',
                                        right: '10px',
                                        background: 'linear-gradient(135deg, #28a745, #20c997)',
                                        color: 'white',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        OPTIMAL
                                    </span>
                                )}
                                {savings > 0 && !isSpecialOption && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '10px',
                                        right: '10px',
                                        background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
                                        color: 'white',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        SAVE {Math.round(savings)}%
                                    </span>
                                )}
                            </Card.Header>
                            <Card.Body>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '10px', color: '#28a745' }}>
                                        From €{option.stripePrice.toFixed(2)}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '15px' }}>
                                        €{getPricePerCoin(option).toFixed(4)} per coin
                                    </div>
                                    
                                    {savings > 0 && !isSpecialOption && (
                                        <div style={{ 
                                            fontSize: '0.9rem', 
                                            color: '#28a745', 
                                            fontWeight: '600',
                                            marginBottom: '10px'
                                        }}>
                                            {Math.round(savings)}% cheaper than {baseOption.amount} coins
                                        </div>
                                    )}

                                    {isSpecialOption && (
                                        <div style={{ 
                                            fontSize: '0.9rem', 
                                            color: '#0c5460',
                                            marginBottom: '10px'
                                        }}>
                                            Makes your total divisible by 1800
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
                    {selectedOption ? `Continue with ${selectedOption.amount} CoflCoins` : 'Select an Amount'}
                </Button>
            </div>
        </div>
    )
}

export default CoflCoinAmountSelection
