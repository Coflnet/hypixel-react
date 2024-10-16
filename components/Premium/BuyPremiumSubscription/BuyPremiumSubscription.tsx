import React from 'react'
import { Modal, Button } from 'react-bootstrap'
import GenericProviderPurchaseCard from '../../CoflCoins/GenericProviderPurchaseCard'
import api from '../../../api/ApiHelper'

const BuyPremiumSubscription = () => {
    function onPayLemonSqueezy() {
        api.lemonsqueezyPurchase('l_premium', 1800).then(data => {
            window.open(data.directLink, '_self')
        })
    }

    return (
        <>
            <h4>Purchase Premium Subscription</h4>
            <p>Click the button below to purchase a premium subscription. This subscription will be automatically renewed every month.</p>
            <GenericProviderPurchaseCard
                type="LemonSqueezy"
                price={1}
                onPay={onPayLemonSqueezy}
                disabledTooltip={<></>}
                isDisabled={false}
                isRedirecting={false}
            />
        </>
    )
}

export default BuyPremiumSubscription
