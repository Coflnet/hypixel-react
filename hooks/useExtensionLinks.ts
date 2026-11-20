'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

/** the ids the mail and PayPal links carry: /account?extend={id} and /account?extended={id} */
function readLinkParams(): { extendId?: string; extendedId?: string } {
    if (typeof window === 'undefined') return {}
    const params = new URLSearchParams(window.location.search)
    return { extendId: params.get('extend') || undefined, extendedId: params.get('extended') || undefined }
}

/** the current url without the renewal link params, other params stay */
function getUrlWithoutLinkParams(pathname: string): string {
    const params = new URLSearchParams(window.location.search)
    params.delete('extend')
    params.delete('extended')
    const query = params.toString()
    return `${pathname}${query ? `?${query}` : ''}${window.location.hash}`
}

/**
 * The links into the renewal of a long term subscription. `extendId` is the subscription the reminder mail points at (its
 * dialog opens, or it explains the term end), `paypalReturned` is set when PayPal sent the buyer back after the approval:
 * the renewal appears once PayPal notified us (the premium refresh polls for it). Once `ready` and handled the params leave the
 * url, so a reload does not open the dialog or show the notice again.
 */
export function useExtensionLinks(ready: boolean) {
    const [params] = useState(readLinkParams)
    const [paypalReturned, setPaypalReturned] = useState(!!params.extendedId)
    const router = useRouter()
    const pathname = usePathname()
    const handled = useRef(false)

    useEffect(() => {
        if (!ready || handled.current || (!params.extendId && !params.extendedId)) return
        handled.current = true
        router.replace(getUrlWithoutLinkParams(pathname), { scroll: false })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready])

    return { extendId: params.extendId, paypalReturned, dismissPaypalReturned: () => setPaypalReturned(false) }
}
