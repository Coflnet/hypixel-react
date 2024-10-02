'use client'
import { useEffect, useState } from 'react'
import { ListGroup, ListGroupItem } from 'react-bootstrap'
import api from '../../../api/ApiHelper'
import { numberWithThousandsSeparators } from '../../../utils/Formatter'
import { getLoadingElement } from '../../../utils/LoadingUtils'
import { PREMIUM_TYPES } from '../../../utils/PremiumTypeUtils'

function TransactionHistory() {
    let [transactions, setTransactions] = useState<Transaction[]>([])
    let [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadTransactions()
    }, [])

    function loadTransactions() {
        api.getTransactions()
            .then(newTransacitons => {
                newTransacitons = newTransacitons.sort((a, b) => b.timeStamp.getTime() - a.timeStamp.getTime())
                setTransactions(newTransacitons)
            })
            .finally(() => {
                setIsLoading(false)
            })
    }

    function getDescriptionText(transaction: Transaction) {
        if (transaction.productId === 'compensation') {
            return (
                <span>
                    <b>Compensation:</b> {transaction.reference}
                </span>
            )
        }
        if (transaction.productId === 'transfer') {
            return 'CoflCoins-Transfer'
        }
        if (transaction.productId === 'verify_mc') {
            return 'Verified Minecraft Account'
        }
        if (transaction.productId === 'test-premium') {
            return 'Awarded Test-Premium'
        }
        if (transaction.productId.startsWith('p_cc')) {
            return 'Bought CoflCoins via PayPal'
        }
        if (transaction.productId.startsWith('s_cc')) {
            return 'Bought CoflCoins via Stripe'
        }
        if (transaction.productId.startsWith('l_cc')) {
            return 'Bought CoflCoins via LemonSqueezy'
        }
        if (transaction.productId.startsWith('pre_api')) {
            return 'Bought Pre-API'
        }

        const parts = transaction.reference.split('.')
        let suffix = ''
        if (parts.length === 2 && /^[0-9a-fA-F]{32}$/.test(parts[0]) && /^[0-9a-fA-F\-]{1,}$/.test(parts[1])) {
            suffix = `(License for ${parts[0]})`
        }

        let purchasedPremiumOption
        PREMIUM_TYPES.forEach(premiumType => {
            if (transaction.productId.startsWith(premiumType.productId)) {
                purchasedPremiumOption = premiumType.label
            }
        })

        if (purchasedPremiumOption) {
            return `Bought ${purchasedPremiumOption}${suffix}`
        }

        return transaction.productId
    }

    if (isLoading) {
        return getLoadingElement(<p>Loading transactions...</p>)
    }

    return (
        <ListGroup>
            {transactions.map(transaction => (
                <ListGroupItem key={transaction.reference} style={{ display: 'flex', gap: 15, justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ flex: 1 }}>{transaction.timeStamp.toLocaleString()}</span>
                    <span style={{ flex: 4 }}>{getDescriptionText(transaction)}</span>
                    <span style={{ flex: 2, fontWeight: 'bold', color: transaction.amount < 0 ? 'red' : 'lime', textAlign: 'right' }}>
                        {transaction.amount > 0 ? '+' : ''}
                        {numberWithThousandsSeparators(transaction.amount)} CoflCoins
                    </span>
                </ListGroupItem>
            ))}
        </ListGroup>
    )
}

export default TransactionHistory
