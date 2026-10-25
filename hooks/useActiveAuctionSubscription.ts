import { useRef } from 'react'
import api from '../api/ApiHelper'
import { useLiveAuctionSubscription } from './useLiveAuctionSubscription'
import { MAX_KNOWN_UUIDS } from '../utils/ActiveAuctionUtils'

interface Options {
    tags: string[]
    filter: { [key: string]: string }
    /** the uuids currently shown, read at (re)subscribe time (capped to 200) */
    getKnownUuids: () => string[]
    onAuction: (auction: ActiveAuctionPreview) => void
    onGone: (gone: { uuid: string; reason: string }) => void
    /** bump after every successful load so the subscription is re-sent with the new visible uuids */
    loadToken: number
    enabled: boolean
}

/**
 * Keeps the single live subscription of the active auction explorer in sync with the shown query. Re-subscribes
 * (which replaces the previous subscription on the connection) whenever tags, filters or the loaded window change.
 */
export function useActiveAuctionSubscription(options: Options): () => void {
    const optionsRef = useRef(options)
    optionsRef.current = options

    return useLiveAuctionSubscription(
        () => {
            const o = optionsRef.current
            api.subscribeActiveAuctions(
                o.tags,
                o.filter,
                o.getKnownUuids().slice(0, MAX_KNOWN_UUIDS),
                auction => optionsRef.current.onAuction(auction),
                gone => optionsRef.current.onGone(gone)
            )
        },
        [JSON.stringify(options.tags), JSON.stringify(options.filter), options.loadToken],
        options.enabled
    )
}
