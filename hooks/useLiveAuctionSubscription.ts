import { useCallback, useEffect, useRef, type DependencyList } from 'react'
import api from '../api/ApiHelper'

/**
 * Manages a single live-update subscription (auction bids or sold auctions).
 *
 * `subscribe` is invoked to (re)establish the subscription. The hook subscribes when `enabled` is
 * true, re-subscribes whenever `deps` change and cleans up on unmount. The returned `resubscribe`
 * lets callers re-establish the subscription imperatively (e.g. after a filter toggle) without
 * bumping a state counter just to re-trigger an effect.
 *
 * Only one live-update subscription can be active per connection (see `api.subscribeSoldAuctions`),
 * so re-subscribing implicitly replaces the previous one.
 */
export function useLiveAuctionSubscription(subscribe: () => void, deps: DependencyList, enabled: boolean = true): () => void {
    // keep the latest `subscribe` closure so re-subscribing always uses current props/state
    // without the effect depending on its (per-render) identity
    let subscribeRef = useRef(subscribe)
    subscribeRef.current = subscribe

    let resubscribe = useCallback(() => {
        subscribeRef.current()
    }, [])

    useEffect(() => {
        if (!enabled) {
            return
        }
        subscribeRef.current()
        return () => {
            api.unsubscribeUpdates()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, enabled])

    return resubscribe
}
