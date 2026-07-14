'use client'
import { useState } from 'react'
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
import { wasErrorShownToUser } from '../../api/NotificationApi'
import styles from './SubscribeButton.module.css'

interface Props {
    show: boolean
    onHide(): void
    topic: string
    type: 'player' | 'item' | 'auction' | 'bazaar'
    currentPrice?: number
    currentSellPrice?: number
    /** the filter the user is currently searching with; copied into a new item notifier */
    defaultFilter?: ItemFilter
    prefill?: SubscribePrefill
    popupTitle?: string
    popupButtonText?: string
    successMessage?: string
    onAfterSubscribe?(): void
}

const MAX_FILTERS = 5
/** how far the suggested price sits away from the current one, so the notifier isn't triggered instantly */
const PRICE_MARGIN = 0.01

/**
 * The price to prefill for the currently selected direction (and, on the bazaar, the selected price
 * source). A bit below the current price for "drops below", a bit above it for "rises above".
 */
function getSuggestedPrice(props: Props, isPriceAbove: boolean, useSellPrice: boolean): string {
    if (props.prefill?.listener?.price !== undefined && props.prefill?.listener?.price !== null) {
        return props.prefill.listener.price.toString()
    }
    if (props.type !== 'item' && props.type !== 'bazaar') {
        return ''
    }
    let current = props.type === 'bazaar' && useSellPrice ? props.currentSellPrice : props.currentPrice
    if (!current) {
        return ''
    }
    return isPriceAbove ? Math.ceil(current * (1 + PRICE_MARGIN)).toString() : Math.floor(current * (1 - PRICE_MARGIN)).toString()
}

function NotifierDialog(props: Props) {
    let { trackEvent } = useMatomo()
    let router = useRouter()
    let prefillTypes = (props.prefill?.listener?.types as unknown as string[]) || []
    // null until the user types a price of their own; until then the suggestion below is what's shown, so it
    // follows the selected direction and a price that only finishes loading while the dialog is already open
    let [typedPrice, setTypedPrice] = useState<string | null>(null)
    let [isPriceAbove, setIsPriceAbove] = useState(prefillTypes.includes(SubscriptionType[SubscriptionType.PRICE_HIGHER_THAN]))
    let [onlyInstantBuy, setOnlyInstantBuy] = useState(prefillTypes.includes(SubscriptionType[SubscriptionType.BIN]))
    let [gotOutbid, setGotOutbid] = useState(prefillTypes.includes(SubscriptionType[SubscriptionType.OUTBID]))
    let [isSold, setIsSold] = useState(prefillTypes.includes(SubscriptionType[SubscriptionType.SOLD]))
    let [isPlayerAuctionCreation, setIsPlayerAuctionCreation] = useState(prefillTypes.includes(SubscriptionType[SubscriptionType.PLAYER_CREATES_AUCTION]))
    let [hasPlayerBoughtAnyAuction, setHasPlayerBoughtAnyAuction] = useState(prefillTypes.includes(SubscriptionType[SubscriptionType.BOUGHT_ANY_AUCTION]))
    let [isUseBazaarSellNotBuy, setIsUseBazaarSellNotBuy] = useState(prefillTypes.includes(SubscriptionType[SubscriptionType.USE_SELL_NOT_BUY]))
    let [itemFilter, setItemFilter] = useState<ItemFilter | undefined>(props.prefill?.listener?.filter || props.defaultFilter)
    let [isItemFilterValid, setIsItemFilterValid] = useState(true)
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [notificationTargets, setNotificationTargets] = useState<NotificationTarget[]>([])
    let [isLoadingNotificationTargets, setIsLoadingNotificationTargets] = useState(false)
    let [channelSelection, setChannelSelection] = useState<ChannelSelection>({ inGame: true, push: false, newDiscordUrl: null, existingTargetIds: [] })
    let [isSubmitting, setIsSubmitting] = useState(false)
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn()

    let price = typedPrice ?? getSuggestedPrice(props, isPriceAbove, isUseBazaarSellNotBuy)

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
            if (!wasErrorShownToUser(e)) {
                toast.error(e instanceof Error ? e.message : 'Could not set up the selected channels. Please try again.')
            }
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
                if (error?.message && !wasErrorShownToUser(error)) {
                    toast.error(error.message)
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
                                priceValue={price}
                                isPriceAbove={isPriceAbove}
                                onFilterChange={filter => setItemFilter({ ...filter })}
                                onIsPriceAboveChange={setIsPriceAbove}
                                onOnlyInstantBuyChange={setOnlyInstantBuy}
                                onPriceChange={setTypedPrice}
                                prefill={props.prefill?.listener}
                                defaultFilter={props.defaultFilter}
                                onIsFilterValidChange={setIsItemFilterValid}
                            />
                        ) : null}
                        {props.type === 'bazaar' ? (
                            <SubscribeBazaarItemContent
                                itemTag={props.topic}
                                priceValue={price}
                                isPriceAbove={isPriceAbove}
                                useSellPrice={isUseBazaarSellNotBuy}
                                onPriceChange={setTypedPrice}
                                onIsPriceAboveChange={setIsPriceAbove}
                                onUseSellPriceChange={setIsUseBazaarSellNotBuy}
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
