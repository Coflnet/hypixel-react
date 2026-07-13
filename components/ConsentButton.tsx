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
            
            setCookie('CCPAOPTOUT', '1')

            
            try {
                if ((window as any).nitroAds && typeof (window as any).nitroAds.addUserToken === 'function') {
                    ;(window as any).nitroAds.addUserToken('optout')
                } else if ((window as any).nitroAds && Array.isArray((window as any).nitroAds.queue)) {
                    (window as any).nitroAds.queue.push(['addUserToken', ['optout']])
                }
            } catch (e) {
                
            }

            
            try {
                if ((window as any).__cmp) {
                    
                    (window as any).__cmp('set', {consents: {}})
                }
            } catch (e) {
                
            }

            setOptedOut(true)
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
                <></>
            )}
        </div>
    )
}
