'use client'
import { useRef, useState } from 'react'
import { Button, Modal } from 'react-bootstrap'
import { useMatomo } from '@jonkoops/matomo-tracker-react'
import { toast } from 'react-toastify'
import { useRouter } from 'next/navigation'
import api from '../../api/ApiHelper'
import { SubscriptionType } from '../../api/ApiTypes.d'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { useWasAlreadyLoggedIn } from '../../utils/Hooks'
import SubscribeItemContent from './SubscribeItemContent/SubscribeItemContent'
import SubscribePlayerContent from './SubscribePlayerContent/SubscribePlayerContent'
import SubscribeAuctionContent from './SubscribeAuctionContent/SubscribeAuctionContent'
import SubscribeBazaarItemContent from './SubscribeBazaarItemContent/SubscribeBazaarItemContent'
import ChannelPicker from './ChannelPicker/ChannelPicker'
import {
    ChannelSelection,
    getInitialChannelSelection,
    isChannelSelectionValid,
    rememberChannelSelection,
    resolveChannelSelection
} from '../../utils/NotificationChannelUtils'
import styles from './SubscribeButton.module.css'

interface Props {
    show: boolean
    onHide(): void
    topic: string
    type: 'player' | 'item' | 'auction' | 'bazaar'
    currentPrice?: number
    currentSellPrice?: number
    prefill?: SubscribePrefill
    popupTitle?: string
    popupButtonText?: string
    successMessage?: string
    onAfterSubscribe?(): void
}

const MAX_FILTERS = 5

function getInitialPrice(props: Props): string {
    if (props.prefill?.listener?.price !== undefined && props.prefill?.listener?.price !== null) {
        return props.prefill.listener.price.toString()
    }
    if (props.type === 'item' && props.currentPrice) {
        // start a touch below the current price so a "drops below" notifier fires on any dip
        return Math.floor(props.currentPrice * 0.99).toString()
    }
    if (props.type === 'bazaar' && props.currentPrice) {
        return Math.floor(props.currentPrice).toString()
    }
    return ''
}

function NotifierDialog(props: Props) {
    let { trackEvent } = useMatomo()
    let router = useRouter()
    let prefillTypes = (props.prefill?.listener?.types as unknown as string[]) || []
    let [price, setPrice] = useState(getInitialPrice(props))
    let priceDirty = useRef(false)
    let [isPriceAbove, setIsPriceAbove] = useState(prefillTypes.includes(SubscriptionType[SubscriptionType.PRICE_HIGHER_THAN]))
    let [onlyInstantBuy, setOnlyInstantBuy] = useState(prefillTypes.includes(SubscriptionType[SubscriptionType.BIN]))
    let [gotOutbid, setGotOutbid] = useState(prefillTypes.includes(SubscriptionType[SubscriptionType.OUTBID]))
    let [isSold, setIsSold] = useState(prefillTypes.includes(SubscriptionType[SubscriptionType.SOLD]))
    let [isPlayerAuctionCreation, setIsPlayerAuctionCreation] = useState(prefillTypes.includes(SubscriptionType[SubscriptionType.PLAYER_CREATES_AUCTION]))
    let [hasPlayerBoughtAnyAuction, setHasPlayerBoughtAnyAuction] = useState(prefillTypes.includes(SubscriptionType[SubscriptionType.BOUGHT_ANY_AUCTION]))
    let [isUseBazaarSellNotBuy, setIsUseBazaarSellNotBuy] = useState(prefillTypes.includes(SubscriptionType[SubscriptionType.USE_SELL_NOT_BUY]))
    let [itemFilter, setItemFilter] = useState<ItemFilter | undefined>(props.prefill?.listener?.filter || undefined)
    let [isItemFilterValid, setIsItemFilterValid] = useState(true)
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [notificationTargets, setNotificationTargets] = useState<NotificationTarget[]>([])
    let [isLoadingNotificationTargets, setIsLoadingNotificationTargets] = useState(false)
    let [channelSelection, setChannelSelection] = useState<ChannelSelection>({ inGame: true, push: false, newDiscordUrl: null, existingTargetIds: [] })
    let [isSubmitting, setIsSubmitting] = useState(false)
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn()

    function getSubscriptionTypes(): SubscriptionType[] {
        let types: SubscriptionType[] = []
        if (props.type === 'item') {
            types.push(isPriceAbove ? SubscriptionType.PRICE_HIGHER_THAN : SubscriptionType.PRICE_LOWER_THAN)
            if (onlyInstantBuy) {
                types.push(SubscriptionType.BIN)
            }
        }
        if (props.type === 'player') {
            if (gotOutbid) types.push(SubscriptionType.OUTBID)
            if (isSold) types.push(SubscriptionType.SOLD)
            if (isPlayerAuctionCreation) types.push(SubscriptionType.PLAYER_CREATES_AUCTION)
            if (hasPlayerBoughtAnyAuction) types.push(SubscriptionType.BOUGHT_ANY_AUCTION)
        }
        if (props.type === 'auction') {
            types.push(SubscriptionType.AUCTION)
        }
        if (props.type === 'bazaar') {
            types.push(isPriceAbove ? SubscriptionType.PRICE_HIGHER_THAN : SubscriptionType.PRICE_LOWER_THAN)
            if (isUseBazaarSellNotBuy) {
                types.push(SubscriptionType.USE_SELL_NOT_BUY)
            }
        }
        return types
    }

    async function onSubscribe() {
        trackEvent({ action: 'subscribed', category: 'subscriptions' })

        let priceToSend = price
        if ((props.type === 'item' || props.type === 'bazaar') && !priceToSend) {
            priceToSend = '0'
        }
        let filterToSend = itemFilter
        if (props.type === 'item' && !filterToSend) {
            filterToSend = {}
        }

        setIsSubmitting(true)
        let resolvedTargets: NotificationTarget[]
        try {
            resolvedTargets = await resolveChannelSelection(channelSelection, notificationTargets)
        } catch (e) {
            setIsSubmitting(false)
            toast.error(e instanceof Error ? e.message : 'Could not set up the selected channels. Please try again.')
            return
        }

        api.subscribe(props.topic, getSubscriptionTypes(), resolvedTargets, priceToSend ? parseInt(priceToSend) : undefined, filterToSend)
            .then(() => {
                rememberChannelSelection(channelSelection, resolvedTargets)
                props.onHide()
                toast.success(props.successMessage || 'Notifier successfully created!', {
                    onClick: () => {
                        router.push('/subscriptions')
                    }
                })
                if (props.onAfterSubscribe) {
                    props.onAfterSubscribe()
                }
            })
            .catch(error => {
                if (error?.message) {
                    toast.error(error.message, {
                        onClick: () => {
                            router.push('/subscriptions')
                        }
                    })
                }
            })
            .finally(() => {
                setIsSubmitting(false)
            })
    }

    function onLogin() {
        setIsLoggedIn(true)
        setIsLoadingNotificationTargets(true)
        api.getNotificationTargets().then(targets => {
            setNotificationTargets(targets)
            setChannelSelection(getInitialChannelSelection(targets, props.prefill?.targetIds))
            setIsLoadingNotificationTargets(false)
        })
    }

    function onBazaarUseSellChange(useSell: boolean) {
        setIsUseBazaarSellNotBuy(useSell)
        // re-seed the price from the matching market average, unless the user has typed their own value
        if (!priceDirty.current && props.prefill?.listener?.price === undefined) {
            let source = useSell ? props.currentSellPrice : props.currentPrice
            if (source) {
                setPrice(Math.floor(source).toString())
            }
        }
    }

    function onPriceChange(value: string) {
        priceDirty.current = true
        setPrice(value)
    }

    function isNotifyDisabled(): boolean {
        if (!isChannelSelectionValid(channelSelection)) {
            return true
        }
        if (itemFilter && Object.keys(itemFilter).length > MAX_FILTERS) {
            return true
        }
        if (props.type === 'item') {
            return itemFilter && Object.keys(itemFilter).length > 0 ? false : price === undefined || price === ''
        }
        if (props.type === 'player') {
            return !gotOutbid && !isSold && !isPlayerAuctionCreation && !hasPlayerBoughtAnyAuction
        }
        return false
    }

    return (
        <Modal show={props.show} onHide={props.onHide} className={styles.subscribeDialog}>
            <Modal.Header closeButton>
                <Modal.Title>{props.popupTitle || 'Notify me'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {isLoggedIn ? (
                    <div>
                        <h5 className={styles.sectionHeading}>When</h5>
                        {props.type === 'item' ? (
                            <SubscribeItemContent
                                itemTag={props.topic}
                                onFilterChange={filter => setItemFilter({ ...filter })}
                                onIsPriceAboveChange={setIsPriceAbove}
                                onOnlyInstantBuyChange={setOnlyInstantBuy}
                                onPriceChange={onPriceChange}
                                prefill={props.prefill?.listener}
                                prefillPrice={getInitialPrice(props)}
                                onIsFilterValidChange={setIsItemFilterValid}
                            />
                        ) : null}
                        {props.type === 'bazaar' ? (
                            <SubscribeBazaarItemContent
                                itemTag={props.topic}
                                priceValue={price}
                                onPriceChange={onPriceChange}
                                onIsPriceAboveChange={setIsPriceAbove}
                                onUseSellPriceChange={onBazaarUseSellChange}
                                prefill={props.prefill?.listener}
                            />
                        ) : null}
                        {props.type === 'player' ? (
                            <SubscribePlayerContent
                                onGotOutbidChange={setGotOutbid}
                                onIsSoldChange={setIsSold}
                                onIsPlayerAuctionCreation={setIsPlayerAuctionCreation}
                                onBoughtAnyAuctionChange={setHasPlayerBoughtAnyAuction}
                                prefill={props.prefill?.listener}
                            />
                        ) : null}
                        {props.type === 'auction' ? <SubscribeAuctionContent /> : null}

                        <h5 className={styles.sectionHeading}>Where</h5>
                        <ChannelPicker
                            targets={notificationTargets}
                            isLoading={isLoadingNotificationTargets}
                            selection={channelSelection}
                            onChange={setChannelSelection}
                        />

                        <Button
                            onClick={onSubscribe}
                            disabled={isNotifyDisabled() || !isItemFilterValid || isSubmitting}
                            className={styles.notifyButton}
                        >
                            {isSubmitting ? 'Creating...' : props.popupButtonText || 'Create notifier'}
                        </Button>
                        {itemFilter && Object.keys(itemFilter).length > MAX_FILTERS ? (
                            <p style={{ color: 'red' }}>You currently can't use more than {MAX_FILTERS} filters for Notifiers</p>
                        ) : null}
                    </div>
                ) : (
                    <p>To use notifiers, please login with Google: </p>
                )}
                <GoogleSignIn onAfterLogin={onLogin} />
                {wasAlreadyLoggedIn && !isLoggedIn ? getLoadingElement() : ''}
            </Modal.Body>
        </Modal>
    )
}

export default NotifierDialog
