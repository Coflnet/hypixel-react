'use client'

import React, { useEffect, useState } from 'react'

function setCookie(name: string, value: string, days = 3650) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

export default function ConsentButton() {
    const [visible, setVisible] = useState(false)
    const [optedOut, setOptedOut] = useState(false)

    useEffect(() => {
        const update = () => {
            try {
                setVisible(!!(window as any).__tcfapi)
            } catch (e) {
                setVisible(false)
            }
        }

        // also reflect existing cookie state
        const cookies = document.cookie.split(';').map(c => c.trim())
        if (cookies.some(c => c.startsWith('CCPAOPTOUT='))) {
            setOptedOut(true)
        }

        if ((window as any).nitroAds && (window as any).nitroAds.loaded) {
            update()
        } else {
            window.addEventListener('nitroAds.loaded', update)
        }

        return () => window.removeEventListener('nitroAds.loaded', update)
    }, [])

    const doOptOut = () => {
        try {
            // set the local cookie used by the app/middleware
            setCookie('CCPAOPTOUT', '1')

            // notify NitroPay via its queue'd API (safe to call because pre-script defines addUserToken as queue pusher)
            try {
                if ((window as any).nitroAds && typeof (window as any).nitroAds.addUserToken === 'function') {
                    ;(window as any).nitroAds.addUserToken('optout')
                } else if ((window as any).nitroAds && Array.isArray((window as any).nitroAds.queue)) {
                    (window as any).nitroAds.queue.push(['addUserToken', ['optout']])
                }
            } catch (e) {
                // ignore nitro notify errors
            }

            // best-effort to tell CMP about the change. These calls are wrapped and will fail silently if API differs.
            try {
                if ((window as any).__cmp) {
                    // many CMPs accept a 'set' command, but implementations differ; wrap in try/catch
                    (window as any).__cmp('set', {consents: {}})
                }
            } catch (e) {
                // ignore
            }

            setOptedOut(true)
            // dispatch an event in case other code wants to react
            try { window.dispatchEvent(new CustomEvent('nitro.optout')) } catch (e) {}
        } catch (e) {
            console.error('Opt-out failed', e)
        }
    }

    if (!visible && !optedOut) return null

    return (
        <div id="consent-box">
            {!optedOut ? (
                <>
                    <button
                        onClick={() => {
                            try {
                                if ((window as any).__cmp) (window as any).__cmp('showModal')
                            } catch (e) {}
                        }}
                    >
                        Update cookie preferences
                    </button>
                    <button onClick={doOptOut} style={{ marginLeft: 8 }}>
                        Opt out of personalized ads
                    </button>
                </>
            ) : (
                <div>You have opted out of personalized ads.</div>
            )}
        </div>
    )
}
