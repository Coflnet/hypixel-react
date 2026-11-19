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
                } catch {
                    optOut.textContent = 'Opt out of personalized ads'
                }
                optOut.style.marginLeft = '8px'
                optOut.onclick = () => {
                    try {
                        setCookie('CCPAOPTOUT', '1')
                        
                        setCookie('nonEssentialCookiesAllowed', 'false')

                        try { window._paq?.push(['forgetCookieConsentGiven']) } catch { /* The optional vendor API may not be ready. */ }

                        if (window.nitroAds && Array.isArray(window.nitroAds.queue)) {
                            window.nitroAds.queue.push(['addUserToken', ['optout']])
                        }
                        
                        try { window.__npcmp?.('reject') } catch { /* The CMP may not be ready. */ }
                        
                        try { banner.classList.remove('ncmp__active') } catch { /* Consent is saved even if the banner cannot close. */ }
                        try { window.dispatchEvent(new CustomEvent('nitro.optout')) } catch { /* Consent remains saved if notification fails. */ }
                    } catch (e) {
                        console.error('Direct opt-out failed', e)
                    }
                }

                btns.appendChild(optOut)
            } catch {
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

                try { setCookie('nonEssentialCookiesAllowed', 'true') } catch { /* Cookies may be blocked by the browser. */ }
                try { window._paq?.push(['setCookieConsentGiven']) } catch { /* The optional vendor API may not be ready. */ }
                try {
                    if (window.nitroAds && Array.isArray(window.nitroAds.queue)) {
                        window.nitroAds.queue.push(['addUserToken', ['consent']])
                    }
                } catch { /* The optional vendor API may not be ready. */ }

                try { window.dispatchEvent(new CustomEvent('nitro.optin')) } catch { /* Consent remains saved if notification fails. */ }
            } catch { /* The optional vendor API may not be ready. */ }
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
