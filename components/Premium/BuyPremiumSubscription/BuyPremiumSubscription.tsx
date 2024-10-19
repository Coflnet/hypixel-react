import React from 'react'
import GenericProviderPurchaseCard from '../../CoflCoins/GenericProviderPurchaseCard'
import api from '../../../api/ApiHelper'

interface Props {
    productId: string
    price: number
}

const BuyPremiumSubscription = (props: Props) => {
    function onPayLemonSqueezy() {
        api.purchasePremiumSubscription(props.productId).then(data => {
            window.open(data.directLink, '_self')
        })
    }

    return (
        <>
            <p>Click the button below to purchase a premium subscription. This subscription will be automatically renewed every month.</p>
            <GenericProviderPurchaseCard
                type="LemonSqueezy"
                price={props.price}
                onPay={onPayLemonSqueezy}
                disabledTooltip={undefined}
                isDisabled={false}
                isRedirecting={false}
            />
        </>
    )
}

export default BuyPremiumSubscription
