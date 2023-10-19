'use client'
import { useMemo, useState } from 'react'
import { Button, Form, InputGroup } from 'react-bootstrap'
import { toast } from 'react-toastify'
import api from '../../api/ApiHelper'
import { useCoflCoins } from '../../utils/Hooks'
import styles from './CoflCoinsPurchase.module.css'
import { isClientSideRendering } from '../../utils/SSRUtils'
import countryList from 'react-select-country-list'
import { Menu, MenuItem, Typeahead } from 'react-bootstrap-typeahead'
import PurchaseElement from './PurchaseElement'

interface Props {
    cancellationRightLossConfirmed: boolean
}

function Payment(props: Props) {
    let [loadingId, setLoadingId] = useState('')
    let [currentRedirectLink, setCurrentRedirectLink] = useState('')
    let [showAll, setShowAll] = useState(false)
    const countryOptions = useMemo(() => countryList().getData(), [])
    let [country, setCountry] = useState<any>(
        isClientSideRendering() && navigator.language && navigator.language.includes('-')
            ? countryOptions.find(country => country.value === navigator.language.split('-')[1])
            : null
    )
    let coflCoins = useCoflCoins()
    let isDisabled = !props.cancellationRightLossConfirmed || !country

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

    function onPaymentRedirectFail() {
        setCurrentRedirectLink('')
        setLoadingId('')
        toast.error('Something went wrong. Please try again.')
    }

    function getDisabledPaymentTooltip() {
        if (!props.cancellationRightLossConfirmed) {
            return <span>Please note the information regarding your cancellation right above.</span>
        }
        if (!country) {
            return <span>Please select your country. This information is necessary for tax purposes.</span>
        }
        return undefined
    }
    let disabledTooltip = getDisabledPaymentTooltip()

    function getCountryImage(countryCode: string): JSX.Element {
        return (
            <img
                src={`https://flagcdn.com/16x12/${countryCode.toLowerCase()}.png`}
                srcSet={`https://flagcdn.com/32x24/${countryCode.toLowerCase()}.png 2x, https://flagcdn.com/48x36/${countryCode.toLowerCase()}.png 3x`}
                width="16"
                height="12"
                alt={countryCode}
                style={{ marginRight: '5px' }}
            />
        )
    }

    return (
        <div>
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15, paddingBottom: 15 }}>
                    <label htmlFor="countryTypeahead">Your Country: </label>
                    <Typeahead
                        id="countryTypeahead"
                        style={{ width: 'auto' }}
                        selected={country ? [country] : []}
                        onChange={e => {
                            setCountry(e[0])
                        }}
                        minLength={2}
                        labelKey={option => {
                            return option ? (option as any).label : ''
                        }}
                        options={countryOptions}
                        selectHint={(shouldSelect, event) => {
                            return event.key === 'Enter' || shouldSelect
                        }}
                        renderInput={({ inputRef, referenceElementRef, ...inputProps }) => {
                            return (
                                <InputGroup>
                                    <InputGroup.Text>{country ? getCountryImage(country.value) : <div style={{ minWidth: 16 }} />}</InputGroup.Text>
                                    <Form.Control
                                        {...(inputProps as any)}
                                        ref={input => {
                                            inputRef(input)
                                            referenceElementRef(input)
                                        }}
                                    />
                                </InputGroup>
                            )
                        }}
                        renderMenu={(results, menuProps) => (
                            <Menu {...menuProps}>
                                {results.map((result, index) => {
                                    let country = result as { label: string; value: string }
                                    return (
                                        <MenuItem option={country} position={index}>
                                            {getCountryImage(country.value)}
                                            {country.label}
                                        </MenuItem>
                                    )
                                })}
                            </Menu>
                        )}
                    ></Typeahead>
                </div>
                <div className={styles.productGrid}>
                    <PurchaseElement
                        coflCoinsToBuy={1800}
                        loadingProductId={loadingId}
                        redirectLink={currentRedirectLink}
                        paypalPrice={6.99}
                        stripePrice={6.69}
                        disabledTooltip={disabledTooltip}
                        isDisabled={isDisabled}
                        onPayPalPay={onPayPaypal}
                        onStripePay={onPayStripe}
                        paypalProductId="p_cc_1800"
                        stripeProductId="s_cc_1800"
                    />
                    <PurchaseElement
                        coflCoinsToBuy={5400}
                        loadingProductId={loadingId}
                        redirectLink={currentRedirectLink}
                        paypalPrice={19.99}
                        stripePrice={19.69}
                        disabledTooltip={disabledTooltip}
                        isDisabled={isDisabled}
                        onPayPalPay={onPayPaypal}
                        onStripePay={onPayStripe}
                        paypalProductId="p_cc_5400"
                        stripeProductId="s_cc_5400"
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
                                disabledTooltip={disabledTooltip}
                                isDisabled={isDisabled}
                                onPayPalPay={onPayPaypal}
                                onStripePay={onPayStripe}
                                paypalProductId="p_cc_10800"
                                stripeProductId="s_cc_10800"
                            />
                            <PurchaseElement
                                coflCoinsToBuy={21600}
                                loadingProductId={loadingId}
                                redirectLink={currentRedirectLink}
                                paypalPrice={78.69}
                                stripePrice={74.99}
                                disabledTooltip={disabledTooltip}
                                isDisabled={isDisabled}
                                onPayPalPay={onPayPaypal}
                                onStripePay={onPayStripe}
                                paypalProductId="p_cc_21600"
                                stripeProductId="s_cc_21600"
                            />
                            {coflCoins % 1800 != 0 ? (
                                <PurchaseElement
                                    coflCoinsToBuy={1800 + (1800 - (coflCoins % 1800))}
                                    loadingProductId={loadingId}
                                    redirectLink={currentRedirectLink}
                                    paypalPrice={(6.99 / 1800) * (1800 + (1800 - (coflCoins % 1800)))}
                                    stripePrice={(6.69 / 1800) * (1800 + (1800 - (coflCoins % 1800)))}
                                    disabledTooltip={disabledTooltip}
                                    isDisabled={isDisabled}
                                    onPayPalPay={onPayPaypal}
                                    onStripePay={onPayStripe}
                                    isSpecial1800CoinsMultiplier
                                    paypalProductId="p_cc_1800"
                                    stripeProductId="s_cc_1800"
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
