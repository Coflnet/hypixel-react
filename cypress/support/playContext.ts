export const ANDROID_USER_AGENT = 'Mozilla/5.0 (Linux; Android 15) Chrome/131.0 Mobile Safari/537.36'

export function playContext(window: Cypress.AUTWindow, enabled = true, context: 'app' | 'standalone' | 'android' | 'browser' = 'app') {
    Object.assign(window, { __playSubscriptionsEnabled: enabled })
    if (context !== 'browser') Object.defineProperty(window.navigator, 'userAgent', { value: ANDROID_USER_AGENT })
    if (context === 'app') Object.defineProperty(window.document, 'referrer', { value: 'android-app://com.coflnet.sky' })
    if (context === 'standalone') {
        const matchMedia = window.matchMedia.bind(window)
        cy.stub(window, 'matchMedia').callsFake((query: string) => {
            const result = matchMedia(query)
            return query === '(display-mode: standalone)' ? Object.defineProperty(result, 'matches', { value: true }) : result
        })
    }
}
