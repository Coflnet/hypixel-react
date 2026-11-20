'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

/**
 * The ids the mail, Stripe and PayPal links carry: /account?extend={id} and ?extended={id} for the renewal of a long term,
 * ?switch={id} (back without paying) and ?switched={id} (back after paying) for the switch to a longer term.
 */
const LINK_PARAMS = ['extend', 'extended', 'switch', 'switched'] as const
type LinkParams = Partial<Record<(typeof LINK_PARAMS)[number], string>>

function readLinkParams(): LinkParams {
    if (typeof window === 'undefined') return {}
    const params = new URLSearchParams(window.location.search)
    return Object.fromEntries(LINK_PARAMS.map(name => [name, params.get(name) || undefined]))
}

/** the current url without the link params, other params stay */
function getUrlWithoutLinkParams(pathname: string): string {
    const params = new URLSearchParams(window.location.search)
    LINK_PARAMS.forEach(name => params.delete(name))
    const query = params.toString()
    return `${pathname}${query ? `?${query}` : ''}${window.location.hash}`
}

/**
 * The links into the renewal of a long term subscription and the switch to a longer term. `extendId` is the subscription the
 * reminder mail points at (its dialog opens, or it explains the term end), `paypalReturned` is set when PayPal sent the buyer
 * back after approving a renewal. `switchId` is the subscription whose switch was left without paying (its dialog opens again),
 * `switchReturned` is set when the buyer comes back after paying for a switch: it appears once the provider notified us (the
 * premium refresh polls for it). Once `ready` and handled the params leave the url, so a reload does not repeat them.
 */
export function useExtensionLinks(ready: boolean) {
    const [params] = useState(readLinkParams)
    const [paypalReturned, setPaypalReturned] = useState(!!params.extended)
    const [switchReturned, setSwitchReturned] = useState(!!params.switched)
    const router = useRouter()
    const pathname = usePathname()
    const handled = useRef(false)

    useEffect(() => {
        if (!ready || handled.current || !LINK_PARAMS.some(name => params[name])) return
        handled.current = true
        router.replace(getUrlWithoutLinkParams(pathname), { scroll: false })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready])

    return {
        extendId: params.extend,
        paypalReturned,
        dismissPaypalReturned: () => setPaypalReturned(false),
        switchId: params.switch,
        switchReturned,
        dismissSwitchReturned: () => setSwitchReturned(false)
    }
}
