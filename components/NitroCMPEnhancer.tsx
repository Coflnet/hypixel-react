'use client'

import { useEffect } from 'react'

function setCookie(name: string, value: string, days = 3650) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

export default function NitroCMPEnhancer() {
    useEffect(() => {
        function injectButton() {
            try {
                const banner = document.querySelector('#ncmp__tool .ncmp__banner')
                if (!banner) return

                if (banner.querySelector('.npcmp-direct-optout')) return

                const btns = banner.querySelector('.ncmp__banner-btns')
                if (!btns) return

                const optOut = document.createElement('button')
                optOut.className = 'npcmp-direct-optout ncmp__btn ncmp__btn-ghost ncmp__btn-border'
                
                try {
                    const locale = (navigator.language || (navigator.languages && navigator.languages[0]) || 'en').toLowerCase()
                    optOut.textContent = locale.startsWith('de') ? 'Alles ablehnen' : 'Opt out of personalized ads'
                } catch (e) {
                    optOut.textContent = 'Opt out of personalized ads'
                }
                optOut.style.marginLeft = '8px'
                optOut.onclick = () => {
                    try {
                        setCookie('CCPAOPTOUT', '1')
                        
                        setCookie('nonEssentialCookiesAllowed', 'false')
                        
                        if ((window as any).nitroAds && Array.isArray((window as any).nitroAds.queue)) {
                            ;(window as any).nitroAds.queue.push(['addUserToken', ['optout']])
                        }
                        
                        try {
                            if ((window as any).__npcmp) {
                                try { (window as any).__npcmp('reject') } catch (e) {}
                            }
                        } catch (e) {}
                        
                        try { banner.classList.remove('ncmp__active') } catch (e) {}
                        try { window.dispatchEvent(new CustomEvent('nitro.optout')) } catch (e) {}
                    } catch (e) {
                        console.error('Direct opt-out failed', e)
                    }
                }

                btns.appendChild(optOut)
            } catch (e) {
                // swallow errors
            }
        }

        
        injectButton()

        
        const obs = new MutationObserver(() => injectButton())
        obs.observe(document.body, { childList: true, subtree: true })

        
        function onDocumentClick(ev: Event) {
            try {
                const target = ev.target as HTMLElement
                const banner = target?.closest && target.closest('#ncmp__tool .ncmp__banner')
                if (!banner) return

                const btn = (target as HTMLElement).closest ? (target as HTMLElement).closest('button') : null
                if (!btn) return
                const txt = (btn.textContent || '').toLowerCase()
                const cls = (btn.className || '').toLowerCase()

                const acceptKeywords = ['accept', 'allow', 'yes', 'agree', 'consent', 'zustimmen', 'akzeptieren', 'annehmen']
                const isAccept = acceptKeywords.some(k => txt.includes(k)) || /accept|allow|consent|agree|zustimmen|akzeptieren/.test(cls)
                if (!isAccept) return

                try { setCookie('nonEssentialCookiesAllowed', 'true') } catch (e) {}
                try {
                    if ((window as any).nitroAds && Array.isArray((window as any).nitroAds.queue)) {
                        ;(window as any).nitroAds.queue.push(['addUserToken', ['consent']])
                    }
                } catch (e) {}

                try { window.dispatchEvent(new CustomEvent('nitro.optin')) } catch (e) {}
            } catch (e) {
                
            }
        }

        document.addEventListener('click', onDocumentClick)

        
        window.addEventListener('nitro.cmp.ready', injectButton as EventListener)

        return () => {
            obs.disconnect()
            window.removeEventListener('nitro.cmp.ready', injectButton as EventListener)
            document.removeEventListener('click', onDocumentClick)
        }
    }, [])

    return null
}
