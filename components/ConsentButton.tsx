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
                setVisible(!!window.__tcfapi)
            } catch {
                setVisible(false)
            }
        }

        
        const cookies = document.cookie.split(';').map(c => c.trim())
        if (cookies.some(c => c.startsWith('CCPAOPTOUT='))) {
            setOptedOut(true)
        }

        if (window.nitroAds && window.nitroAds.loaded) {
            update()
        } else {
            window.addEventListener('nitroAds.loaded', update)
        }

        return () => window.removeEventListener('nitroAds.loaded', update)
    }, [])

    const doOptOut = () => {
        try {
            
            setCookie('CCPAOPTOUT', '1')

            
            try {
                if (window.nitroAds && typeof window.nitroAds.addUserToken === 'function') {
                    window.nitroAds.addUserToken('optout')
                } else if (window.nitroAds && Array.isArray(window.nitroAds.queue)) {
                    window.nitroAds.queue.push(['addUserToken', ['optout']])
                }
            } catch { /* The optional vendor API may not be ready. */ }

            
            try {
                if (window.__cmp) {
                    
                    window.__cmp('set', {consents: {}})
                }
            } catch { /* The optional vendor API may not be ready. */ }

            setOptedOut(true)
            try { window.dispatchEvent(new CustomEvent('nitro.optout')) } catch { /* Consent remains saved if notification fails. */ }
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
                                if (window.__cmp) window.__cmp('showModal')
                            } catch { /* The optional vendor API may not be ready. */ }
                        }}
                    >
                        Update cookie preferences
                    </button>
                    <button onClick={doOptOut} style={{ marginLeft: 8 }}>
                        Opt out of personalized ads
                    </button>
                </>
            ) : (
                <></>
            )}
        </div>
    )
}
