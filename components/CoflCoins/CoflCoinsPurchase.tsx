'use client'
import { useMemo, useState } from 'react'
import { Button, Form, InputGroup } from 'react-bootstrap'
import { toast } from 'react-toastify'
import api from '../../api/ApiHelper'
import { useCoflCoins } from '../../utils/Hooks'
import styles from './CoflCoinsPurchase.module.css'
import { isClientSideRendering } from '../../utils/SSRUtils'
import { Menu, MenuItem, Typeahead, useItem } from 'react-bootstrap-typeahead'
import PurchaseElement from './PurchaseElement'
import { getCountryFromUserLanguage } from '../../utils/CountryUtils'
import CountrySelect from '../CountrySelect/CountrySelect'

interface Props {
    cancellationRightLossConfirmed: boolean
}

function Payment(props: Props) {
    let [loadingId, setLoadingId] = useState('')
    let [currentRedirectLink, setCurrentRedirectLink] = useState('')
    let [showAll, setShowAll] = useState(false)
    let [selectedCountry, setSelectedCountry] = useState(getCountryFromUserLanguage())
    let coflCoins = useCoflCoins()
    let isDisabled = !props.cancellationRightLossConfirmed || !selectedCountry

    function onPayPaypal(productId: string, coflCoins?: number) {
        setLoadingId(coflCoins ? `${productId}_${coflCoins}` : productId)
        setCurrentRedirectLink('')
        api.paypalPurchase(productId, coflCoins)
            .then(data => {
                setCurrentRedirectLink(data.directLink)
                window.open(data.directLink)
            })
            .catch(onPaymentRedirectFail)
    }

    function onPayStripe(productId: string, coflCoins?: number) {
        setLoadingId(coflCoins ? `${productId}_${coflCoins}` : productId)
        setCurrentRedirectLink('')
        api.stripePurchase(productId, coflCoins)
            .then(data => {
                setCurrentRedirectLink(data.directLink)
                window.open(data.directLink)
            })
            .catch(onPaymentRedirectFail)
    }

    function onPayLemonSqueezy(productId: string, coflCoins?: number) {
        setLoadingId(coflCoins ? `${productId}_${coflCoins}` : productId)
        setCurrentRedirectLink('')
        api.lemonsqueezyPurchase(productId, coflCoins)
            .then(data => {
                setCurrentRedirectLink(data.directLink)
                window.open(data.directLink)
            })
            .catch(onPaymentRedirectFail)
    }

    function onPaymentRedirectFail() {
        setCurrentRedirectLink('')
        setLoadingId('')
        toast.error('Something went wrong. Please try again.')
    }

    function getDisabledPaymentTooltip() {
        if (!props.cancellationRightLossConfirmed) {
            return <span>Please note the information regarding your cancellation right above.</span>
        }
        if (!selectedCountry) {
            return <span>Please select your country. This information is necessary for tax purposes.</span>
        }
        return undefined
    }
    let disabledTooltip = getDisabledPaymentTooltip()

    return (
        <div>
            <div>
                <CountrySelect defaultCountry={selectedCountry} onCountryChange={setSelectedCountry} />
                <div className={styles.productGrid}>
                    <PurchaseElement
                        coflCoinsToBuy={1800}
                        loadingProductId={loadingId}
                        redirectLink={currentRedirectLink}
                        paypalPrice={6.99}
                        stripePrice={6.69}
                        lemonsqueezyPrice={6.99}
                        disabledTooltip={disabledTooltip}
                        isDisabled={isDisabled}
                        onPayPalPay={onPayPaypal}
                        onStripePay={onPayStripe}
                        onLemonSqeezyPay={onPayLemonSqueezy}
                        paypalProductId="p_cc_1800"
                        stripeProductId="s_cc_1800"
                        lemonsqueezyProductId="l_cc_1800"
                        countryCode={selectedCountry ? selectedCountry.value : undefined}
                    />
                    <PurchaseElement
                        coflCoinsToBuy={5400}
                        loadingProductId={loadingId}
                        redirectLink={currentRedirectLink}
                        paypalPrice={19.99}
                        stripePrice={19.69}
                        lemonsqueezyPrice={19.69}
                        disabledTooltip={disabledTooltip}
                        isDisabled={isDisabled}
                        onPayPalPay={onPayPaypal}
                        onStripePay={onPayStripe}
                        onLemonSqeezyPay={onPayLemonSqueezy}
                        paypalProductId="p_cc_5400"
                        stripeProductId="s_cc_5400"
                        lemonsqueezyProductId="l_cc_5400"
                        countryCode={selectedCountry ? selectedCountry.value : undefined}
                    />
                    {!showAll ? (
                        <Button
                            style={{ width: '100%' }}
                            onClick={() => {
                                setShowAll(true)
                            }}
                        >
                            Show all CoflCoin Options
                        </Button>
                    ) : null}
                    {showAll ? (
                        <>
                            <PurchaseElement
                                coflCoinsToBuy={10800}
                                loadingProductId={loadingId}
                                redirectLink={currentRedirectLink}
                                paypalPrice={39.69}
                                stripePrice={38.99}
                                lemonsqueezyPrice={39.69}
                                disabledTooltip={disabledTooltip}
                                isDisabled={isDisabled}
                                onPayPalPay={onPayPaypal}
                                onStripePay={onPayStripe}
                                onLemonSqeezyPay={onPayLemonSqueezy}
                                paypalProductId="p_cc_10800"
                                stripeProductId="s_cc_10800"
                                lemonsqueezyProductId="l_cc_10800"
                                countryCode={selectedCountry ? selectedCountry.value : undefined}
                            />
                            <PurchaseElement
                                coflCoinsToBuy={21600}
                                loadingProductId={loadingId}
                                redirectLink={currentRedirectLink}
                                paypalPrice={78.69}
                                stripePrice={74.99}
                                lemonsqueezyPrice={78.69}
                                disabledTooltip={disabledTooltip}
                                isDisabled={isDisabled}
                                onPayPalPay={onPayPaypal}
                                onStripePay={onPayStripe}
                                onLemonSqeezyPay={onPayLemonSqueezy}
                                paypalProductId="p_cc_21600"
                                stripeProductId="s_cc_21600"
                                lemonsqueezyProductId="l_cc_21600"
                                countryCode={selectedCountry ? selectedCountry.value : undefined}
                            />
                            {coflCoins % 1800 != 0 ? (
                                <PurchaseElement
                                    coflCoinsToBuy={1800 + (1800 - (coflCoins % 1800))}
                                    loadingProductId={loadingId}
                                    redirectLink={currentRedirectLink}
                                    paypalPrice={(6.99 / 1800) * (1800 + (1800 - (coflCoins % 1800)))}
                                    stripePrice={(6.69 / 1800) * (1800 + (1800 - (coflCoins % 1800)))}
                                    lemonsqueezyPrice={(6.99 / 1800) * (1800 + (1800 - (coflCoins % 1800)))}
                                    disabledTooltip={disabledTooltip}
                                    isDisabled={isDisabled}
                                    onPayPalPay={onPayPaypal}
                                    onStripePay={onPayStripe}
                                    onLemonSqeezyPay={onPayLemonSqueezy}
                                    isSpecial1800CoinsMultiplier
                                    paypalProductId="p_cc_1800"
                                    stripeProductId="s_cc_1800"
                                    lemonsqueezyProductId="l_cc_1800"
                                    countryCode={selectedCountry ? selectedCountry.value : undefined}
                                />
                            ) : null}
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    )
}

export default Payment
