import { PREMIUM_EXPERIMENT, PremiumVariant, resolvePremiumVariant } from '../../utils/PremiumExperiment'
import { recordHydrationErrors } from '../support/hydrationErrors'
import { ANDROID_USER_AGENT, playContext } from '../support/playContext'

// The /premium A/B test: the current page (control) and the redesign ("new"), plus the redesign's feature explorer,
// clip player, comparison previews and plan buttons.

const googleToken = 'eyJhbGciOiJub25lIn0.eyJleHAiOjQxMDI0NDQ4MDAsImVtYWlsIjoiY3lwcmVzc0BleGFtcGxlLmNvbSIsIm5hbWUiOiJDeXByZXNzIn0.signature'
const NEW_PAGE_TITLE = 'Get Flips Before Everyone Else'
const MEDIA = '**/skycofl/features/v1'
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'

/** the first user agent of a fixed list that the hash assigns to `variant` today (the split rotates per UTC day) */
function userAgentFor(variant: PremiumVariant): string {
    const now = new Date()
    for (let i = 0; i < 100; i++) {
        const userAgent = `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.${i}.0 Safari/537.36`
        if (resolvePremiumVariant({ userAgent, now }).variant === variant) return userAgent
    }
    throw new Error(`no user agent found for ${variant}`)
}

/** asserts that the response does not set any cookie for the experiment */
function expectNoExperimentCookie(response: Cypress.Response<unknown>) {
    const cookies = ([] as string[]).concat(response.headers['set-cookie'] ?? [])
    cookies.forEach(cookie => {
        expect(cookie).not.to.match(/premium|variant/i)
        expect(cookie).not.to.contain(PREMIUM_EXPERIMENT.name)
    })
}

function requestAs(userAgent: string, url = '/premium') {
    return cy.request({ url, headers: { 'user-agent': userAgent } })
}

type MatomoQueue = unknown[][]

function installMatomoQueue(window: Cypress.AUTWindow) {
    ;(window as Cypress.AUTWindow & { _paq: MatomoQueue })._paq = []
}

/** retries until every expected trackEvent instruction was pushed to the page's Matomo queue */
function expectTracked(...expected: unknown[][]) {
    cy.window()
        .its('_paq')
        .should((queue: MatomoQueue) => {
            const events = queue.filter(entry => entry[0] === 'trackEvent')
            expected.forEach(event => expect(events).to.deep.include(event))
        })
}

/** a socket that accepts any login; with `storeToken` the page also finds a stored token and logs in on its own */
function installAuthenticatedWebSocket(window: Cypress.AUTWindow, storeToken = true) {
    class AuthenticatedWebSocket {
        static OPEN = 1
        readyState = AuthenticatedWebSocket.OPEN
        onopen: ((event: Event) => void) | null = null
        onclose: ((event: CloseEvent) => void) | null = null
        onerror: ((event: Event) => void) | null = null
        onmessage: ((event: MessageEvent) => void) | null = null

        constructor() {
            window.setTimeout(() => this.onopen?.(new Event('open')), 0)
        }

        send(value: string) {
            const request = JSON.parse(value)
            const response = request.type === 'loginWithToken' ? googleToken : request.type === 'getCoflBalance' ? '30000' : ''
            window.setTimeout(() => {
                this.onmessage?.(
                    new MessageEvent('message', { data: JSON.stringify({ mId: request.mId, type: request.type, data: JSON.stringify(response), maxAge: 0 }) })
                )
            }, 0)
        }

        close() {}

        // the Next dev server's HMR client registers listeners on window.WebSocket
        addEventListener() {}
        removeEventListener() {}
    }

    window.WebSocket = AuthenticatedWebSocket as unknown as typeof WebSocket
    if (storeToken) window.localStorage.setItem('googleId', googleToken)
}

/** a Google Identity Services stand-in: its button hands the page the test credential, like a completed Google login */
function stubGoogleIdentity() {
    cy.intercept('GET', 'https://accounts.google.com/gsi/client*', {
        headers: { 'content-type': 'application/javascript' },
        body: `window.google = { accounts: { id: {
            initialize(options) { this.options = options },
            renderButton(container) {
                const button = document.createElement('button');
                button.textContent = 'Confirm Google identity';
                button.onclick = () => this.options.callback({ credential: '${googleToken}' });
                container.appendChild(button);
            }, prompt() {}, cancel() {}
        } } };`
    })
}

/** records the ids of the elements the page scrolls to, so a test can tell a scroll from the page apart from none */
function recordScrollTargets(window: Cypress.AUTWindow) {
    const scrolledTo: string[] = []
    const original = window.Element.prototype.scrollIntoView
    window.Element.prototype.scrollIntoView = function (this: Element, ...args: Parameters<Element['scrollIntoView']>) {
        if (this.id) scrolledTo.push(this.id)
        return original.apply(this, args)
    }
    ;(window as Cypress.AUTWindow & { scrolledTo: string[] }).scrolledTo = scrolledTo
}

function scrolledTo() {
    return cy.window().its('scrolledTo') as Cypress.Chainable<string[]>
}

/** at least part of the element is on screen */
/** ticks the early start declaration of the open checkout; its payment buttons stay disabled until then */
function confirmDeclaration() {
    cy.get('[data-testid="purchase-declaration"] input[type="checkbox"]').check()
}

function expectInViewport(selector: string) {
    cy.get(selector).should(element => {
        const rect = element[0].getBoundingClientRect()
        expect(rect.top, `${selector} top`).to.be.lessThan(Cypress.config('viewportHeight'))
        expect(rect.bottom, `${selector} bottom`).to.be.greaterThan(0)
    })
}

/** yields scrollY once two reads in a row agree (the page scrolls smoothly) */
function waitForScrollToSettle() {
    let last = Number.NaN
    return cy
        .window()
        .should(window => {
            const settled = window.scrollY === last
            last = window.scrollY
            expect(settled, 'scroll position settled').to.equal(true)
        })
        .its('scrollY')
}

function signInDialog() {
    return cy.contains('.modal-dialog', 'Sign in to SkyCofl')
}

/** a signed out visitor on the redesign; the sign-in button exists once the page is hydrated */
function visitSignedOut() {
    visitNewPage('/premium?premiumVariant=new', false, window => {
        installAuthenticatedWebSocket(window, false)
        recordScrollTargets(window)
    })
    cy.contains('#premium-sign-in button', 'Sign in').should('be.visible')
}

/** answers the first terms request only when the returned function is called; the login waits for it until then */
function holdFirstTermsRequest(reply: { statusCode: number; body?: unknown }) {
    const state = { requested: false, release: () => undefined as void }
    cy.intercept({ method: 'GET', url: '**/api/user/terms*', times: 1 }, request => {
        state.requested = true
        return new Promise<void>(resolve => (state.release = resolve)).then(() => request.reply(reply))
    })
    return state
}

const TERMS_ALLOWING_PURCHASE = {
    required: false,
    canContinueWithoutAccepting: true,
    canStartNewContract: true,
    agreementId: 'test-agreement',
    agreementHash: 'test-hash',
    agreementUrl: '/terms',
    version: 'test-version',
    hash: 'test-hash',
    englishUrl: '/terms/en',
    germanUrl: '/terms/de',
    documents: [],
    premiumPurchaseDeclaration: { version: 'test-declaration', locale: 'en', text: 'Start my Premium immediately.' }
}

function stubAccount(terms: object = TERMS_ALLOWING_PURCHASE) {
    cy.intercept('GET', '**/api/user/terms*', { statusCode: 200, body: terms }).as('terms')
    cy.intercept('POST', '**/api/premium/user/owns', { statusCode: 200, body: {} }).as('products')
    cy.intercept('GET', '**/api/premium/subscription', { statusCode: 200, body: [] }).as('subscriptions')
    cy.intercept('GET', '**/api/premium/transactions', { statusCode: 200, body: [] })
}

function stubMedia() {
    cy.intercept('GET', `${MEDIA}/*.webp`, { fixture: 'premium/poster.webp,null', headers: { 'content-type': 'image/webp' } }).as('poster')
    cy.intercept('GET', `${MEDIA}/*.webm`, { fixture: 'premium/clip.webm,null', headers: { 'content-type': 'video/webm' } }).as('clip')
    cy.intercept('GET', `${MEDIA}/*.mp4`, { statusCode: 404, body: '' })
}

function visitNewPage(path = '/premium?premiumVariant=new', loggedIn = false, onBeforeLoad?: (window: Cypress.AUTWindow) => void) {
    cy.visit(path, {
        onBeforeLoad(window) {
            window.localStorage.clear()
            window.sessionStorage.clear()
            installMatomoQueue(window)
            if (loggedIn) installAuthenticatedWebSocket(window)
            onBeforeLoad?.(window)
        }
    })
}

function emulateReducedMotion(value: 'reduce' | 'no-preference') {
    return Cypress.automation('remote:debugger:protocol', {
        command: 'Emulation.setEmulatedMedia',
        params: { features: [{ name: 'prefers-reduced-motion', value }] }
    })
}

function stage() {
    return cy.get('[data-testid="feature-stage"]')
}

beforeEach(() => {
    cy.clearCookies()
    cy.intercept('GET', '**/api/premium/slots', { body: [] })
    cy.intercept('GET', '**/command/version/**', { body: 'cypress-version' })
    cy.intercept('GET', 'https://track.coflnet.com/matomo.js*', { headers: { 'content-type': 'application/javascript' }, body: '' })
    cy.intercept('GET', '**/api/premium/country', { body: { country: 'DE' } })
    // the single Lemon Squeezy checkout until a test offers Stripe and PayPal
    cy.intercept('GET', '**/api/premium/subscription/providers*', { statusCode: 404, body: {} })
    cy.intercept('GET', '**/api/premium/discount/auto*', { statusCode: 204 })
    cy.intercept('GET', 'https://accounts.google.com/gsi/client*', { headers: { 'content-type': 'application/javascript' }, body: '' })
    cy.intercept('GET', '**/preScript.js', { headers: { 'content-type': 'application/javascript' }, body: '' })
    // the page reports to Matomo only; any request to an own experiment endpoint would be a regression
    cy.intercept('POST', '**/api/experiment/**', cy.spy().as('experimentEndpoint'))
})

afterEach(() => {
    cy.get('@experimentEndpoint').should('not.have.been.called')
})

describe('Premium page A/B test', () => {
    it('derives the variant from the user agent, stores nothing and keeps the page out of shared caches', () => {
        const newUserAgent = userAgentFor('new')
        const currentUserAgent = userAgentFor('current')
        requestAs(newUserAgent).then(response => {
            expect(String(response.headers['cache-control'])).to.contain('no-store')
            expect(String(response.headers['cache-control'])).to.contain('private')
            expect(response.body).to.contain(NEW_PAGE_TITLE)
            expectNoExperimentCookie(response)
        })
        requestAs(newUserAgent).its('body').should('contain', NEW_PAGE_TITLE)
        requestAs(currentUserAgent).then(response => {
            expect(response.body).not.to.contain(NEW_PAGE_TITLE)
            expectNoExperimentCookie(response)
        })
        cy.getCookies().should(cookies => expect(cookies.map(cookie => cookie.name).join()).not.to.match(/premium|variant/i))
    })

    it('applies the QA override to that request only, without a cookie', () => {
        const currentUserAgent = userAgentFor('current')
        requestAs(currentUserAgent, '/premium?premiumVariant=new').then(response => {
            expect(response.body).to.contain(NEW_PAGE_TITLE)
            expectNoExperimentCookie(response)
        })
        requestAs(currentUserAgent).its('body').should('not.contain', NEW_PAGE_TITLE)
        requestAs(userAgentFor('new'), '/premium?premiumVariant=current').its('body').should('not.contain', NEW_PAGE_TITLE)
    })

    it('always serves the current page to crawlers, even with an override', () => {
        requestAs(GOOGLEBOT, '/premium?premiumVariant=new').then(response => {
            expect(response.body).not.to.contain(NEW_PAGE_TITLE)
            expect(response.body).to.contain('Features')
            expectNoExperimentCookie(response)
        })
    })

    it('counts crawlers that run scripts outside the experiment', () => {
        // the override proves the server saw the crawler: it is ignored for bots only
        cy.visit('/premium?premiumVariant=new', { headers: { 'user-agent': GOOGLEBOT }, onBeforeLoad: installMatomoQueue })
        cy.contains('h2', 'Features').should('be.visible')
        cy.contains(NEW_PAGE_TITLE).should('not.exist')
        // MainApp tracks the page view in an effect after the first commit, so the page's own effects have run by then
        cy.window()
            .its('_paq')
            .should((queue: MatomoQueue) => {
                expect(queue.map(entry => entry[0])).to.include('trackPageView')
                expect(queue.filter(entry => entry[0] === 'trackEvent' && entry[1] === 'experiment')).to.deep.equal([])
            })
    })

    it('holds Matomo events back until consent: requireConsent is queued before any event', () => {
        visitNewPage()
        expectTracked(['trackEvent', 'experiment', 'premium-page-2026-11', 'new'])
        cy.window()
            .its('_paq')
            .should((queue: MatomoQueue) => {
                const names = queue.map(entry => entry[0])
                expect(names.indexOf('requireConsent')).to.be.within(0, names.indexOf('trackEvent'))
                expect(names).not.to.include('rememberConsentGiven')
                expect(names).not.to.include('setConsentGiven')
            })
    })

    it('keeps the current page as control, without CoflCoin sending, and reports the variant', () => {
        stubAccount()
        visitNewPage('/premium?premiumVariant=current', true)
        cy.wait(['@products', '@subscriptions'])
        cy.contains('h2', 'Features').should('be.visible')
        cy.contains('h2', 'CoflCoins').should('be.visible')
        cy.get('#coflcoins-purchase').should('exist')
        cy.contains('Send CoflCoins').should('not.exist')
        cy.contains(NEW_PAGE_TITLE).should('not.exist')
        expectTracked(
            ['trackEvent', 'experiment', 'premium-page-2026-11', 'current'],
            ['trackEvent', 'premium funnel', 'wizard step', 'variant=current;step=1']
        )
    })
})

describe('Premium redesign', () => {
    afterEach(() => {
        cy.then(() => emulateReducedMotion('no-preference'))
    })

    it('renders the marketing sections on the server', () => {
        cy.request('/premium?premiumVariant=new').then(response => {
            expect(response.body).to.contain(NEW_PAGE_TITLE)
            expect(response.body).to.contain('FROM THE SKYCOFL COMMUNITY CHAT')
            expect(response.body).to.contain('Mr_Fahad_09')
            expect(response.body).to.contain('prem+ best')
            expect(response.body).to.contain('15 Jul 2026')
            expect(response.body).to.contain('strikeangles')
            expect(response.body).to.contain('prem+ is awesome')
            expect(response.body).to.contain('16 Feb 2025')
            expect(response.body).to.contain('Average Flip Receive Time')
            expect(response.body).to.contain('Compare Plans')
            expect(response.body).to.contain('Market analysis range')
            expect(response.body).to.contain('Pick a Plan, Upgrade Any Time')
            expect(response.body).not.to.contain('<video')
        })
    })

    it('switches tabs and features, autoplays the selected clip and tears it down on change', () => {
        stubMedia()
        visitNewPage()
        expectTracked(['trackEvent', 'experiment', 'premium-page-2026-11', 'new'])
        cy.get('#features').scrollIntoView()
        stage().find('h3').should('have.text', 'Auction Flipper')
        stage()
            .find('img')
            .should('have.attr', 'width', '1280')
            .and('have.attr', 'height', '720')
            .and('have.attr', 'loading', 'lazy')
            .and('have.attr', 'decoding', 'async')
        stage().find('video').should('have.attr', 'preload', 'none').and('have.prop', 'muted', true)
        stage().find('video source').first().should('have.attr', 'src').and('match', /flipper\.webm$/)
        stage().find('[data-view]').should('have.attr', 'data-view', 'playing')
        // keep the stage in view: scrolling the button to the top would pause the clip on its own
        stage().scrollIntoView()
        stage().find('button[aria-label="Pause clip"]').click({ scrollBehavior: false })
        stage().find('[data-view]').should('have.attr', 'data-view', 'paused')
        stage().find('video').should('have.prop', 'paused', true)
        expectTracked(['trackEvent', 'premium page', 'clip play', 'variant=new;feature=flipper;trigger=auto;place=explorer'])

        cy.contains('button', 'Flip Finders').click().should('have.attr', 'aria-pressed', 'true')
        stage().find('h3').should('have.text', 'Flip Finders')
        // the click scrolled the list into view and the stage out of it: the old clip is gone, the new one waits
        stage().find('video').should('not.exist')
        stage().scrollIntoView()
        stage().find('video source').first().should('have.attr', 'src').and('match', /finders\.webm$/)
        stage().find('video').should('have.length', 1)
        expectTracked(['trackEvent', 'premium page', 'feature selected', 'variant=new;feature=finders'])

        cy.contains('button', 'Notifiers').click()
        stage().find('[data-testid="feature-media"]').should('not.exist')
        stage().should('contain', 'MAX. NOTIFIERS').and('contain', '1,000')

        cy.contains('button', 'In-Game Mod').click().should('have.attr', 'aria-pressed', 'true')
        expectTracked(['trackEvent', 'premium page', 'explorer tab', 'variant=new;tab=mod'])
        stage().find('h3').should('have.text', 'Prices in Item Tooltips')
        stage().find('img').should('have.attr', 'src').and('match', /tooltip\.webp$/)
        stage().scrollIntoView()
        stage().find('video source').first().should('have.attr', 'src').and('match', /tooltip\.webm$/)
        stage().find('video').should('have.length', 1)
    })

    it('removes the media quietly when a poster fails and keeps the still when a clip fails', () => {
        stubMedia()
        cy.intercept('GET', `${MEDIA}/bazaar.webp`, { statusCode: 404, body: '' })
        cy.intercept('GET', `${MEDIA}/history.webm`, { statusCode: 404, body: '' })
        visitNewPage()
        cy.get('#features').scrollIntoView()
        cy.contains('button', 'Premium Bazaar Flips').click()
        stage().find('h3').should('have.text', 'Premium Bazaar Flips')
        stage().find('[data-testid="feature-media"]').should('not.exist')
        cy.contains('button', 'Price History').click()
        stage().scrollIntoView()
        stage().find('[data-view]').should('have.attr', 'data-view', 'unavailable')
        stage().contains('Clip unavailable').should('be.visible')
        stage().find('img').should('be.visible')
        stage().find('video').should('not.exist')
    })

    it('waits for a tap with reduced motion', () => {
        stubMedia()
        cy.then(() => emulateReducedMotion('reduce'))
        visitNewPage()
        cy.get('#features').scrollIntoView()
        stage().find('video').should('not.exist')
        stage().find('button[aria-label="Play clip, 9 seconds"]').should('contain', '0:09').click()
        stage().find('video').should('exist')
        stage().find('[data-view]').should('have.attr', 'data-view', 'playing')
        expectTracked(['trackEvent', 'premium page', 'clip play', 'variant=new;feature=flipper;trigger=tap;place=explorer'])
    })

    it('opens one comparison preview at a time and closes it again', () => {
        stubMedia()
        visitNewPage()
        cy.get('#compare').scrollIntoView()
        cy.contains('tr', 'Replay flips').find('button').should('not.exist')

        cy.contains('tr', 'Premium Bazaar Flips').find('button[aria-expanded]').as('bazaarPreview').should('have.attr', 'aria-expanded', 'false').click()
        cy.get('@bazaarPreview').should('have.attr', 'aria-expanded', 'true')
        cy.get('[data-testid="compare-preview"]').should('be.visible').and('contain', 'Plus Attribute flips and Mayor cycle flips.')
        cy.get('[data-testid="compare-preview"] img').should('have.attr', 'src').and('match', /bazaar\.webp$/)
        expectTracked(['trackEvent', 'premium page', 'preview opened', 'variant=new;feature=bazaar'])

        cy.contains('tr', 'Average flip receive time').find('button[aria-expanded]').click()
        cy.get('[data-testid="compare-preview"]').should('have.length', 1).and('contain', 'Live BIN flips matched to your filters.')
        cy.get('@bazaarPreview').should('have.attr', 'aria-expanded', 'false')

        cy.get('body').type('{esc}')
        cy.get('[data-testid="compare-preview"]').should('not.exist')
        cy.get('video').should('not.exist')

        cy.contains('tr', 'Max. recent and active auctions').find('th').click()
        cy.get('@bazaarPreview').click()
        cy.get('[data-testid="compare-preview"]').should('be.visible')
        cy.contains('h2', 'Compare Plans').click()
        cy.get('[data-testid="compare-preview"]').should('not.exist')

        cy.get('@bazaarPreview').trigger('mouseover')
        cy.get('[data-testid="compare-preview"]').should('be.visible')
        cy.get('@bazaarPreview').trigger('mouseout')
        cy.get('[data-testid="compare-preview"]').should('not.exist')
    })

    it('opens the sign-in dialog from a plan button without scrolling the page', () => {
        // without media stubs the CDN poster fails, its frame is removed and the layout shifts
        stubMedia()
        visitSignedOut()
        // the plan prices are before VAT until the country is detected (nothing is stored on the device); then the price line reflows
        // the note under the price changes once the payment providers answer (until then it has the card/PayPal wording): wait for it too
        cy.get('[data-testid="plan-premium"]').should('contain', '€11.53').and('not.contain', 'plus VAT where applicable').and('contain', 'every 13 weeks')
        cy.contains('button', /^Get Premium$/).scrollIntoView()
        // the page scrolls smoothly: wait until the button arrived and the position no longer changes
        expectInViewport('[data-testid="plan-premium"] button')
        waitForScrollToSettle()
            .then(scrollY => {
                cy.contains('button', /^Get Premium$/).click({ scrollBehavior: false })
                signInDialog().should('be.visible')
                cy.window().its('scrollY').should('equal', scrollY)
            })
        expectInViewport('[data-testid="plan-premium"]')
        scrolledTo().should('be.empty')
        cy.location('search').should('contain', 'tier=premium').and('contain', 'premiumVariant=new')
        expectTracked(
            ['trackEvent', 'premium page', 'plan button', 'variant=new;tier=premium'],
            ['trackEvent', 'premium page', 'sign in prompt', 'variant=new;source=plan']
        )
    })

    // regression: US plan cards said "+ VAT" although the direct US checkout adds none
    it('prices the plan cards like the direct checkout of the visitor country', () => {
        cy.intercept('GET', '**/api/premium/country', { body: { country: 'US' } })
        cy.intercept('GET', '**/api/premium/subscription/providers*', { body: [{ provider: 'stripe' }, { provider: 'paypal' }] })
        visitSignedOut()
        cy.get('[data-testid="plan-premium"]').should('contain', '€9.69').and('contain', 'every 4 weeks').and('not.contain', 'VAT')
        // card and PayPal continue a 13 or 52 week plan every 4 weeks at the 4-week price
        cy.get('[data-testid="plan-premium"]').should('contain', 'then €9.69 every 4 weeks until cancelled').and('contain', 'Cancel anytime').and('not.contain', 'every 52 weeks')
        cy.get('[data-testid="plan-tax-note"]').should('contain.text', 'No tax added.').and('not.contain.text', 'VAT is added')
    })

    // SkyApi before the rollout of GET /api/premium/country: unknown country, no third-party lookup
    it('prices the plan cards before VAT while SkyApi cannot tell the country', () => {
        cy.intercept('GET', '**/api/premium/country', { statusCode: 404, body: 'Not Found' }).as('country')
        cy.intercept('GET', 'https://api.country.is*', cy.spy().as('thirdParty'))
        visitSignedOut()
        cy.wait('@country')
        cy.get('[data-testid="plan-premium"]').should('contain', '€9.69').and('contain', 'plus VAT where applicable')
        cy.get('[data-testid="plan-tax-note"]').should('contain.text', 'before VAT until your country is known')
        cy.get('@country.all').should('have.length', 1)
        cy.get('@thirdParty').should('not.have.been.called')
    })

    it('continues to the wizard on the chosen plan once the sign-in from that dialog completed', () => {
        stubAccount()
        stubGoogleIdentity()
        visitSignedOut()
        cy.contains('button', 'Get Premium+').click()
        signInDialog().contains('button', 'Confirm Google identity').click()
        signInDialog().should('not.exist')
        cy.get('#buyPremium').should('contain', 'Choose Your Plan Type')
        expectInViewport('#buyPremium')
        scrolledTo().should('deep.equal', ['buyPremium'])
        cy.location('search').should('contain', 'tier=premium_plus')
        expectTracked(
            ['trackEvent', 'premium page', 'sign in prompt', 'variant=new;source=plan'],
            ['trackEvent', 'premium funnel', 'wizard step', 'variant=new;step=2;tier=premium_plus']
        )
    })

    it('keeps the sign-in going through the agreement step and then shows what blocks the purchase', () => {
        stubAccount({
            ...TERMS_ALLOWING_PURCHASE,
            required: true,
            canStartNewContract: false,
            documents: [{ key: 'terms', title: 'Core Terms', version: 'test-version', url: '/terms/en', sha256: 'a'.repeat(64), acceptanceHash: 'b'.repeat(64), changed: true }]
        })
        stubGoogleIdentity()
        visitSignedOut()
        cy.contains('button', /^Get Premium$/).click()
        signInDialog().contains('button', 'Confirm Google identity').click()
        cy.contains('.modal-dialog', 'Review the SkyCofl agreement').contains('button', 'Continue under previous terms').click()
        cy.get('#terms-acceptance').should('be.visible')
        expectInViewport('#terms-acceptance')
        scrolledTo().should('deep.equal', ['terms-acceptance'])
        cy.get('#buyPremium').should('not.exist')
    })

    it('drops the pending action when the dialog is closed without signing in', () => {
        stubAccount()
        stubGoogleIdentity()
        visitSignedOut()
        cy.contains('button', 'Get Premium+').click()
        signInDialog().find('.btn-close').click()
        signInDialog().should('not.exist')
        // a later sign-in through the regular button does not resume the closed action
        cy.contains('#premium-sign-in button', 'Sign in').click()
        signInDialog().contains('button', 'Confirm Google identity').click()
        cy.wait(['@products', '@subscriptions'])
        cy.get('#buyPremium').should('exist')
        cy.contains('#premium-sign-in button', 'Sign in').should('not.exist')
        // rendered with the same update that would have carried a resumed action's scroll
        cy.contains('You do not have a Premium account.').should('be.visible')
        scrolledTo().should('be.empty')
        expectTracked(['trackEvent', 'premium page', 'sign in prompt', 'variant=new;source=plan'])
    })

    it('opens the sign-in dialog for Buy CoflCoins and the slots link, and continues the slots after the sign-in', () => {
        stubAccount()
        stubGoogleIdentity()
        visitSignedOut()
        cy.contains('button', 'Buy CoflCoins').click()
        signInDialog().should('be.visible')
        signInDialog().find('.btn-close').click()
        signInDialog().should('not.exist')

        cy.contains('a', 'Explore Slots and Bundles').click()
        signInDialog().should('be.visible')
        // no navigation: the page and its state stay
        cy.location('search').should('equal', '?premiumVariant=new')
        scrolledTo().should('be.empty')
        expectTracked(
            ['trackEvent', 'premium page', 'sign in prompt', 'variant=new;source=coflcoins'],
            ['trackEvent', 'premium page', 'sign in prompt', 'variant=new;source=slots'],
            ['trackEvent', 'premium funnel', 'slots click', 'variant=new;source=link']
        )

        signInDialog().contains('button', 'Confirm Google identity').click()
        cy.contains('#buyPremium h2', 'Get slots').should('be.visible')
        expectInViewport('#buyPremium')
        cy.location('search').should('contain', 'slots=true').and('contain', 'premiumVariant=new')
    })

    it('continues Buy CoflCoins at the CoflCoins purchase after the sign-in', () => {
        stubAccount()
        stubGoogleIdentity()
        visitSignedOut()
        cy.contains('button', 'Buy CoflCoins').click()
        signInDialog().contains('button', 'Confirm Google identity').click()
        cy.get('#coflcoins-purchase').should('exist')
        scrolledTo().should('deep.equal', ['coflcoins-purchase'])
        expectInViewport('#coflcoins-purchase')
    })

    it('waits for an automatic login in progress instead of opening the dialog, then continues', () => {
        // after stubAccount: the newest matching intercept answers first
        stubAccount()
        const terms = holdFirstTermsRequest({ statusCode: 200, body: TERMS_ALLOWING_PURCHASE })
        visitNewPage('/premium?premiumVariant=new', true, recordScrollTargets)
        cy.wrap(terms).should(state => expect(state.requested, 'the automatic login started').to.equal(true))
        cy.contains('button', 'Get Premium+').click()
        cy.get('.modal-dialog').should('not.exist')
        cy.then(() => terms.release())
        cy.get('#buyPremium').should('contain', 'Choose Your Plan Type')
        expectInViewport('#buyPremium')
        scrolledTo().should('deep.equal', ['buyPremium'])
        cy.get('.modal-dialog').should('not.exist')
    })

    it('reports a failed automatic login to the page (onLoginFail), which then offers the sign-in for the waiting action', () => {
        stubAccount()
        const terms = holdFirstTermsRequest({ statusCode: 500, body: '' })
        visitNewPage('/premium?premiumVariant=new', true, recordScrollTargets)
        cy.wrap(terms).should(state => expect(state.requested, 'the automatic login started').to.equal(true))
        cy.contains('button', /^Get Premium$/).click()
        cy.get('.modal-dialog').should('not.exist')
        cy.then(() => terms.release())
        signInDialog().should('be.visible')
        cy.window().should(window => expect(window.localStorage.getItem('googleId')).to.equal(null))
        scrolledTo().should('be.empty')
        expectTracked(['trackEvent', 'premium page', 'sign in prompt', 'variant=new;source=plan'])
    })

    it('still answers the click when the account fails to load after the sign-in', () => {
        stubAccount()
        // a network error: the generated client resolves HTTP errors, so only this makes the account load reject
        cy.intercept('POST', '**/api/premium/user/owns', { forceNetworkError: true }).as('failedProducts')
        stubGoogleIdentity()
        visitSignedOut()
        cy.contains('button', /^Get Premium$/).click()
        signInDialog().contains('button', 'Confirm Google identity').click()
        cy.wait('@failedProducts')
        // the account state is unknown: the page shows the account area instead of doing nothing
        scrolledTo().should('deep.equal', ['premium-sign-in'])
        expectInViewport('#premium-sign-in')
    })

    it('opens the purchase wizard on the picked plan and tracks the funnel', () => {
        stubAccount()
        visitNewPage('/premium?premiumVariant=new', true)
        cy.wait(['@products', '@subscriptions', '@terms'])
        cy.get('[data-testid="plan-price-premium_plus"]')
            .should('contain.text', '€42.47').and('contain.text', 'every 4 weeks')
            .and('contain.text', '€118.63 every 13 weeks, €421.50 every 52 weeks')
        cy.contains('button', 'Get Premium+').click()
        cy.get('#buyPremium').should('be.visible').and('contain', 'Choose Your Plan Type')
        cy.location('search').should('contain', 'tier=premium_plus').and('contain', 'premiumVariant=new')
        expectTracked(
            ['trackEvent', 'premium page', 'plan button', 'variant=new;tier=premium_plus'],
            ['trackEvent', 'premium funnel', 'wizard step', 'variant=new;step=2;tier=premium_plus']
        )
        cy.get('#coflcoins-purchase').should('exist')
        cy.contains('Send CoflCoins').should('not.exist')
        // the slots link reloads /premium and keeps the QA override
        cy.contains('a', 'Explore Slots and Bundles').should('have.attr', 'href', '/premium?slots=true&premiumVariant=new#buyPremium')
    })

    it('offers card and PayPal in the redesign too and tracks the chosen provider', () => {
        stubAccount()
        cy.intercept('GET', '**/api/premium/subscription/providers*', { body: [{ provider: 'stripe' }, { provider: 'paypal' }] })
        cy.intercept('POST', '**/api/topup/rates', { statusCode: 503, body: {} })
        cy.intercept('POST', '**/api/premium/subscription/l_premium-year?*', { body: { directLink: 'https://www.paypal.com/checkoutnow?token=test' } }).as('checkout')
        visitNewPage('/premium?premiumVariant=new&tier=premium', true)
        cy.wait(['@products', '@subscriptions'])
        cy.get('#buyPremium').contains('[data-testid="wizard-option-title"]', /^Subscription$/).click()
        cy.get('#buyPremium').contains('[data-testid="wizard-option-title"]', 'Just for me').click()
        cy.get('#buyPremium').contains('[data-testid="wizard-option-title"]', /^Yearly$/).click()
        cy.contains('button', 'Pay with card').should('be.visible')
        cy.window().then(window => cy.stub(window, 'open'))
        // the payment buttons wait for the unticked early start declaration
        cy.get('button[aria-label="Pay with PayPal"]').should('be.disabled')
        confirmDeclaration()
        cy.get('button[aria-label="Pay with PayPal"]').click()
        cy.wait('@checkout').its('request').should(request => {
            expect(request.query).to.deep.include({ provider: 'paypal', country: 'DE' })
            expect(request.body).to.include({
                immediatePerformanceRequested: true,
                withdrawalConsequenceAcknowledged: true,
                declarationVersion: 'test-declaration',
                legalLocale: 'en'
            })
            expect(request.body.declarationRequestId).to.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
        })
        expectTracked(['trackEvent', 'premium funnel', 'checkout started', 'variant=new;product=l_premium-year;provider=subscription;paymentProvider=paypal'])
    })

    it('keeps the ?tier= deep link working', () => {
        stubAccount()
        visitNewPage('/premium?premiumVariant=new&tier=premium_plus', true)
        cy.wait(['@products', '@subscriptions'])
        cy.get('#buyPremium').should('contain', 'Choose Your Plan Type')
    })
})

// the live Blackweek sale of Germany: Stripe and PayPal honour it, so the page shows the sale prices of the direct checkout
const blackweek = {
    code: 'GTA6',
    name: 'Blackweek sale',
    amountType: 'percent',
    amount: 25,
    periodAmounts: { 4: 25, 13: 40, 52: 50 },
    duration: 'once',
    startsAt: '2026-11-19T23:00:00Z',
    expiresAt: '2099-11-30T22:59:59Z',
    providers: ['stripe', 'paypal']
}
const directProviders = [
    { provider: 'stripe', mode: 'direct' },
    { provider: 'paypal', mode: 'direct' }
]

describe('Automatic promotion on /premium', () => {
    beforeEach(() => {
        cy.intercept('GET', '**/api/premium/subscription/providers*', { body: directProviders }).as('providers')
    })

    function stubSale() {
        cy.intercept('GET', '**/api/premium/discount/auto*', { body: blackweek }).as('promotion')
    }

    function expectBanner() {
        cy.get('[data-testid="promotion-banner"]')
            .should('be.visible')
            .and('contain.text', 'Blackweek sale:')
            .and('contain.text', 'up to 50% OFF')
            .and('contain.text', 'your first payment — ends November 30')
            .and('contain.text', 'Applied automatically')
            .and('have.attr', 'href', '#plans')
    }

    it('advertises the sale and strikes the regular prices on the redesign', () => {
        stubSale()
        visitSignedOut()
        expectBanner()
        cy.get('[data-testid="plan-sale-line"]').should('contain.text', 'Blackweek sale · up to 50% off your first payment · ends November 30').and('contain.text', '· applied automatically')
        cy.get('[data-testid="plan-price-premium"]').should('contain.text', '€8.65').and('contain.text', '-25%').and('contain.text', 'for the first 4 weeks')
        cy.get('[data-testid="plan-price-premium"] s').first().should('have.text', '€11.53')
        cy.get('[data-testid="plan-price-premium"]')
            .should('contain.text', 'then €11.53 every 4 weeks until cancelled')
            .and('contain.text', '€19.77')
            .and('contain.text', '(-40%)')
            .and('contain.text', '€57.52')
            .and('contain.text', '(-50%)')
        cy.get('[data-testid="plan-price-starter"]').should('contain.text', '€9.92').and('contain.text', '-50%').find('s').should('have.text', '€19.86')
        cy.get('[data-testid="plan-price-premium_plus"]')
            .should('contain.text', '€31.86')
            .and('contain.text', '-25%')
            .and('contain.text', 'for the first 4 weeks')
            .and('contain.text', 'then €42.47 every 4 weeks until cancelled')
            .and('contain.text', '€210.75')
            .find('s').first().should('have.text', '€42.47')
        // the banner scrolls to the plans and keeps the page (and its QA override)
        cy.get('[data-testid="promotion-banner"]').click()
        cy.location('hash').should('equal', '#plans')
        cy.location('search').should('contain', 'premiumVariant=new')
    })

    it('advertises the sale on the current page and links to its purchase area', () => {
        stubSale()
        visitNewPage('/premium?premiumVariant=current')
        expectBanner()
        cy.get('#plans #premium-sign-in').should('exist')
    })

    it('shows no banner and regular prices while no promotion runs', () => {
        visitSignedOut()
        cy.get('[data-testid="plan-price-premium"]').should('contain.text', '€11.53').and('contain.text', 'every 4 weeks').and('contain.text', 'then €11.53 every 4 weeks')
        cy.get('[data-testid="plan-price-premium"] s').should('not.exist')
        cy.get('[data-testid="promotion-banner"]').should('not.exist')
        cy.get('[data-testid="plan-sale-line"]').should('not.exist')
    })

    it('shows no banner when the promotion is not valid for the country\'s providers', () => {
        cy.intercept('GET', '**/api/premium/discount/auto*', { body: { ...blackweek, providers: ['paypal'] } }).as('promotion')
        cy.intercept('GET', '**/api/premium/subscription/providers*', { body: [{ provider: 'stripe', mode: 'direct' }] }).as('stripeOnly')
        visitSignedOut()
        cy.wait(['@promotion', '@stripeOnly'])
        // the offer settled on the exact direct charge, where a valid promotion would show
        cy.get('[data-testid="plan-tax-note"]').should('contain.text', 'Includes VAT.')
        cy.get('[data-testid="plan-price-premium"]').should('contain.text', '€11.53').and('not.contain.text', '-25%')
        cy.get('[data-testid="promotion-banner"]').should('not.exist')
    })
})

describe('Google Play subscription checkout', () => {
    const checkoutTime = Date.UTC(2030, 0, 1)
    const signedCheckout = {
        playProductId: 'premium_plus',
        basePlanId: 'p4w',
        obfuscatedAccountId: 'opaque-id',
        accountLabel: 'Jörg & #',
        expiresAt: checkoutTime / 1000 + 600,
        signature: 'test-signature'
    }

    function visitPlayCheckout(path = '/premium', loggedIn = true) {
        visitNewPage(path, loggedIn, window => {
            playContext(window)
            cy.stub(window, 'open').as('openPlay')
        })
    }

    function buyWithPlay() {
        return cy.get('#buyPremium').contains('button', 'Buy with Google Play')
    }

    it('keeps the existing wizard in the Android app with the rollout off', () => {
        stubAccount()
        visitNewPage('/premium?premiumVariant=new&playUpdate=1', true, window => playContext(window, false, 'standalone'))
        cy.get('[data-testid="premium-wizard"]').should('be.visible')
        cy.get('[data-testid="premium-web-checkout"]').should('not.exist')
        cy.contains('a', 'Pay on the website instead').should('not.exist')
        cy.contains('button', 'Buy with Google Play').should('not.exist')
    })

    it('server-renders the web checkout for Android visitors and the mobile Googlebot', () => {
        requestAs(ANDROID_USER_AGENT, '/premium?premiumVariant=new&playUpdate=1').its('body').should('match', /<h1[^>]*>Get Flips Before Everyone Else/)
        requestAs(`${ANDROID_USER_AGENT} ${GOOGLEBOT}`, '/premium?playUpdate=1').its('body').should('match', /<h2[^>]*>Features<\/h2>/)
    })

    for (const context of ['browser', 'android'] as const) {
        it(`ignores the Play update URL in the ${context} browser`, () => {
            stubAccount()
            visitNewPage('/premium?premiumVariant=new&playUpdate=1', true, window => playContext(window, true, context))
            cy.get('[data-testid="premium-web-checkout"]').should('be.visible')
            cy.get('[data-testid="premium-wizard"]').should('be.visible')
            cy.contains('a', 'Update or install the app from Google Play').should('not.exist')
            cy.contains('button', 'Buy with Google Play').should('not.exist')
        })
    }

    for (const device of [
        { name: 'desktop', userAgent: 'Mozilla/5.0 (X11; Linux x86_64) Chrome/131.0 Safari/537.36' },
        { name: 'iPhone', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1' }
    ]) {
        it(`keeps website checkout in ${device.name} standalone mode`, () => {
            stubAccount()
            cy.intercept('POST', '**/api/topup/rates', { body: { products: [] } })
            visitNewPage('/premium?premiumVariant=new&playUpdate=1', true, window => playContext(window, true, 'standalone', device.userAgent))
            cy.get('[data-testid="premium-web-checkout"]').should('be.visible')
            cy.get('[data-testid="premium-wizard"]').should('be.visible')
            cy.contains('a', 'Update or install the app from Google Play').should('not.exist')
            cy.contains('button', 'Buy with Google Play').should('not.exist')
            cy.get('#coflcoins-purchase').within(() => {
                cy.contains('.card-title', /^1,800$/).click()
                cy.contains('.card-title', /^1,800 CoflCoins$/).closest('.card').contains('button', /€/).should('be.enabled')
                cy.contains('Buy with Google Play').should('not.exist')
            })
        })
    }

    it('prepares the selected plan, shows its account and offers the signed intent as a second tap', () => {
        stubAccount()
        // The signed expiry is already in the past on this device.
        cy.clock(checkoutTime + 660_000, ['Date'])
        cy.intercept('POST', '**/api/premium/subscription/l_prem_plus/playstore', { body: signedCheckout }).as('playStart')
        visitPlayCheckout('/premium?premiumVariant=new&tier=premium_plus&code=WEB')
        cy.wait(['@products', '@subscriptions'])
        cy.get('#play-subscription-tier option:enabled').should('have.length', 2)
        cy.get('#play-subscription-tier').should('have.value', 'l_prem_plus')
        cy.get('#buyPremium').should('contain', 'every 4 weeks').and('contain', 'Google Play shows the final price before you pay')
        cy.get('#plans').should('contain', 'creator and discount codes').and('not.contain', 'VAT').and('not.contain', '€')
        cy.get('#plans').find('[data-testid="purchase-declaration"], [data-testid="premium-wizard"]').should('not.exist')
        cy.contains('a', 'Continue to Google Play').should('not.exist')
        buyWithPlay().click()
        cy.wait('@playStart').its('request.headers.googletoken').should('equal', googleToken)
        buyWithPlay().should('not.exist')
        cy.get('#buyPremium').should('contain', signedCheckout.accountLabel)
        cy.contains('a', 'Continue to Google Play').should('be.visible').and('have.class', 'matomo_ignore').and('have.attr', 'href',
            'intent://subscribe?productId=premium_plus&basePlanId=p4w&userId=opaque-id&slug=l_prem_plus&label=J%C3%B6rg%20%26%20%23&exp=1893456600&sig=test-signature' +
            '#Intent;scheme=skycofl;package=com.coflnet.sky;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;' +
            'S.browser_fallback_url=https%3A%2F%2Fsky.coflnet.com%2Fpremium%3FplayUpdate%3D1;end'
        )
        cy.get('@openPlay').should('not.have.been.called')
        cy.location('href').should('equal', `${Cypress.config('baseUrl')}/premium?premiumVariant=new&tier=premium_plus&code=WEB`)
        cy.window().its('_paq').should(queue => {
            const events = JSON.stringify(queue)
            expect(events).not.to.contain(signedCheckout.signature)
            expect(events).not.to.contain(signedCheckout.obfuscatedAccountId)
            expect(events).not.to.contain(signedCheckout.accountLabel)
        })
        // Observe the valid click after the progress listener, then stop the test browser opening the intent.
        cy.document().then(document => document.addEventListener('click', event => {
            expect(event.defaultPrevented).to.equal(false)
            event.preventDefault()
        }, { once: true }))
        cy.contains('a', 'Continue to Google Play').click()
        cy.get('#nprogress').should('not.exist')
        cy.get('#play-subscription-tier').select('l_premium')
        cy.contains('a', 'Continue to Google Play').should('not.exist')
        buyWithPlay().should('be.enabled')
    })

    it('prevents an expired link from navigating and lets the buyer prepare a fresh link', () => {
        stubAccount()
        cy.clock(checkoutTime, ['Date'])
        cy.intercept('POST', '**/api/premium/subscription/l_prem_plus/playstore', { body: signedCheckout }).as('playStart')
        visitNewPage('/premium?tier=premium_plus', true, window => {
            playContext(window)
            cy.stub(window, 'open').as('openPlay')
            cy.stub(window.performance, 'now').callsFake(() => window.Date.now() - checkoutTime)
        })
        cy.wait(['@products', '@subscriptions'])
        buyWithPlay().click()
        cy.wait('@playStart')
        cy.contains('a', 'Continue to Google Play').should('be.visible')
        cy.tick(540_000)
        const wasPrevented = cy.spy((event: MouseEvent) => event.defaultPrevented)
        cy.document().then(document => document.addEventListener('click', wasPrevented, { once: true }))
        cy.contains('a', 'Continue to Google Play').click()
        cy.wrap(wasPrevented).should('have.returned', true)
        cy.get('#nprogress').should('not.exist')
        cy.contains('This Google Play link expired. Please try again.').should('be.visible')
        cy.contains('a', 'Continue to Google Play').should('not.exist')
        buyWithPlay().should('be.enabled')
        cy.location('pathname').should('equal', '/premium')
        cy.get('@openPlay').should('not.have.been.called')
        cy.intercept('POST', '**/api/premium/subscription/l_prem_plus/playstore', {
            body: { ...signedCheckout, expiresAt: signedCheckout.expiresAt + 600 }
        }).as('freshPlayStart')
        buyWithPlay().click()
        cy.wait('@freshPlayStart')
        cy.contains('a', 'Continue to Google Play').should('be.visible')
    })

    it('discards a response for a plan changed while the request was pending', () => {
        stubAccount()
        cy.clock(checkoutTime, ['Date'])
        let requested = false
        let release: () => void
        const pending = new Promise<void>(resolve => { release = resolve })
        cy.intercept('POST', '**/api/premium/subscription/l_prem_plus/playstore', request => {
            requested = true
            return pending.then(() => request.reply({ body: signedCheckout }))
        }).as('playStart')
        visitPlayCheckout('/premium?tier=premium_plus')
        cy.wait(['@products', '@subscriptions'])
        cy.window().then(window => {
            const fetch = window.fetch.bind(window)
            // Deliver the previous response even when checkout cancels its request.
            cy.stub(window, 'fetch').callsFake((input: RequestInfo | URL, init?: RequestInit) => {
                if (!String(input).endsWith('/l_prem_plus/playstore')) return fetch(input, init)
                return fetch(input, { ...init, signal: undefined })
            })
        })
        buyWithPlay().click()
        cy.wrap(null).should(() => expect(requested).to.equal(true))
        cy.get('#play-subscription-tier').select('l_premium')
        cy.then(() => release())
        cy.wait('@playStart')
        cy.get('#play-subscription-tier').should('have.value', 'l_premium')
        cy.contains('a', 'Continue to Google Play').should('not.exist')
        cy.get('#buyPremium').should('not.contain', signedCheckout.accountLabel)
        buyWithPlay().should('be.enabled')
        cy.get('@openPlay').should('not.have.been.called')
    })

    it('opens sign-in from Play checkout while signed out', () => {
        cy.intercept('POST', '**/api/premium/subscription/*/playstore', cy.spy().as('playRequest'))
        visitPlayCheckout('/premium?slots=true&tier=starter', false)
        buyWithPlay().should('be.disabled')
        cy.get('#play-subscription-tier').select('l_premium')
        buyWithPlay().click()
        signInDialog().should('be.visible')
        cy.get('@playRequest').should('not.have.been.called')
    })

    for (const query of ['?playUpdate=1', '?playUpdate=1&web=1']) {
        it(`offers the Chrome checkout link from Android standalone with ${query}`, () => {
            const hydrationErrors = recordHydrationErrors()
            stubAccount()
            visitNewPage(`/premium${query}`, true, window => playContext(window, true, 'standalone'))
            cy.contains('a', 'Update or install the app from Google Play')
                .should('be.visible').and('have.attr', 'href', 'https://play.google.com/store/apps/details?id=com.coflnet.sky')
            cy.get('#buyPremium').should('not.exist')
            cy.get('[data-testid="premium-web-checkout"]').should('not.exist')
            cy.contains('a', 'Pay on the website instead').should('be.visible').and('have.attr', 'href',
                'intent://sky.coflnet.com/premium#Intent;scheme=https;package=com.android.chrome;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end')
            cy.contains('If Chrome isn’t installed, open sky.coflnet.com/premium in your browser.').should('be.visible')
            cy.wrap(hydrationErrors).should('be.empty')
        })
    }

    it('ignores web=1 on the normal Android app checkout', () => {
        visitNewPage('/premium?web=1', false, window => playContext(window, true, 'standalone'))
        buyWithPlay().should('be.visible')
        cy.get('[data-testid="premium-web-checkout"]').should('not.exist')
        cy.contains('a', 'Pay on the website instead').should('not.exist')
    })

    it('shows web checkout at the intent destination in Android Chrome', () => {
        stubAccount()
        visitNewPage('/premium', true, window => playContext(window, true, 'android'))
        cy.get('[data-testid="premium-web-checkout"]').should('be.visible')
        cy.get('[data-testid="premium-wizard"]').should('be.visible')
        buyWithPlay().should('not.exist')
    })

    it('keeps the prepaid CoflCoins checkout in Play mode without showing website prices or methods', () => {
        stubAccount()
        stubGoogleIdentity()
        cy.intercept('POST', '**/api/topup/rates', { body: { products: [] } })
        cy.intercept('POST', '**/api/service/purchase', { statusCode: 200, body: {} }).as('coinsCheckout')
        visitPlayCheckout()
        cy.contains('h2', 'Pay with CoflCoins').should('be.visible')
        cy.get('[data-testid="premium-wizard"]').should('not.contain.text', '€')
        cy.get('#coflcoins-purchase').within(() => {
            cy.contains('Choose CoflCoin Amount').should('be.visible')
            cy.contains(/From €/).should('not.exist')
            cy.contains('.card-title', /^1,800$/).click()
            cy.contains('.card-title', /^1,800 CoflCoins$/).should('be.visible')
            cy.contains('Buy with Google Play').should('be.visible')
            cy.contains(/Buy with PayPal|Buy with other payment methods|Continue to payment/).should('not.exist')
            cy.contains(/From €/).should('not.be.visible')
            cy.get('[placeholder="Enter discount code"]').should('not.be.visible')
        })
        cy.get('[data-testid="premium-wizard"]').contains('[data-testid="wizard-option-title"]', /^Premium$/).click()
        cy.get('[data-testid="premium-wizard"]').contains('[data-testid="wizard-option-title"]', /^Subscription$/).should('not.exist')
        cy.get('[data-testid="premium-wizard"]').contains('[data-testid="wizard-option-title"]', /^CoflCoins$/).click()
        cy.get('[data-testid="premium-wizard"]').contains('[data-testid="wizard-option-title"]', 'Just for me').click()
        cy.get('[data-testid="premium-wizard"]').should('not.contain.text', '€')
        cy.get('[data-testid="premium-wizard"]').contains('[data-testid="wizard-option-title"]', '1 Month').click()
        cy.contains('button', /Purchase for .* CoflCoins/).click()
        cy.contains('button', 'Confirm Google identity').click()
        cy.get('#premium-early-start-declaration').check()
        cy.contains('button', 'Buy now for').click()
        cy.wait('@coinsCheckout').its('request.body').should('include', { slug: 'premium', count: 1 })
        cy.contains('Purchase successful').should('be.visible')
    })

    for (const scenario of [
        {
            name: 'an existing subscription and its provider',
            reply: { statusCode: 400, body: { slug: 'active_subscription', message: 'You already have an active subscription. The blocking subscription is billed by paypal.' } },
            message: 'You already have an active subscription billed by PayPal.'
        },
        { name: 'a temporary outage', reply: { statusCode: 503, body: {} }, message: 'Please try again later' },
        { name: 'a network failure', reply: { forceNetworkError: true }, message: 'Please try again later' }
    ]) {
        it(`handles ${scenario.name} and leaves the checkout ready to retry`, () => {
            stubAccount()
            cy.intercept('POST', '**/api/premium/subscription/l_premium/playstore', scenario.reply).as('playStart')
            visitPlayCheckout()
            cy.wait(['@products', '@subscriptions'])
            buyWithPlay().click()
            cy.wait('@playStart')
            cy.get('#buyPremium').contains('[role="alert"]', scenario.message).should('be.visible')
            buyWithPlay().should('be.enabled')
            cy.get('@openPlay').should('not.have.been.called')
        })
    }

    it('uses the existing agreement when the Play API requires new terms', () => {
        stubAccount()
        const required = {
            ...TERMS_ALLOWING_PURCHASE, required: true, canStartNewContract: false,
            version: 'updated-terms', agreementHash: 'updated-hash'
        }
        cy.intercept('POST', '**/api/premium/subscription/l_prem_plus/playstore', { statusCode: 428, body: { slug: 'terms_acceptance_required' } }).as('playStart')
        cy.intercept('POST', '**/api/user/terms*', { body: TERMS_ALLOWING_PURCHASE }).as('acceptTerms')
        visitPlayCheckout('/premium?tier=premium_plus')
        cy.wait(['@products', '@subscriptions', '@terms'])
        cy.intercept('GET', '**/api/user/terms*', { body: required }).as('freshTerms')
        buyWithPlay().click()
        cy.wait(['@playStart', '@freshTerms'])
        buyWithPlay().should('be.disabled')
        cy.get('#terms-acceptance').contains('button', 'Accept the SkyCofl agreement package').click()
        cy.wait('@acceptTerms').its('request.body').should('include', { version: 'updated-terms', hash: 'updated-hash' })
        buyWithPlay().should('be.enabled')
        cy.get('#play-subscription-tier').should('have.value', 'l_prem_plus')
    })

    it('explains an existing Google Play subscription in the website checkout', () => {
        stubAccount()
        cy.intercept('GET', '**/api/premium/subscription/providers*', { body: [{ provider: 'stripe' }, { provider: 'paypal' }] })
        cy.intercept('POST', '**/api/premium/subscription/l_premium?*', {
            statusCode: 400,
            body: { slug: 'active_play_subscription' }
        }).as('websiteCheckout')
        visitNewPage('/premium?premiumVariant=new&tier=premium', true, window => playContext(window, true, 'browser'))
        cy.get('#buyPremium').contains('[data-testid="wizard-option-title"]', /^Subscription$/).click()
        cy.get('#buyPremium').contains('[data-testid="wizard-option-title"]', 'Just for me').click()
        cy.get('#buyPremium').contains('[data-testid="wizard-option-title"]', /^4 weeks$/).click()
        confirmDeclaration()
        cy.contains('button', 'Pay with card').click()
        cy.wait('@websiteCheckout')
        cy.contains('You already subscribe through Google Play. Manage your subscription in Google Play.').should('be.visible')
    })

    for (const message of [
        'Server completed the purchase, but Play consumption will be retried',
        'Purchase completion was interrupted and will be retried'
    ]) {
        it(`shows processing rather than failure for a CoflCoins return: ${message}`, () => {
            stubAccount()
            visitPlayCheckout(`/premium#billing_error_ps_cc_1800_${encodeURIComponent(message)}`)
            cy.contains('[role="status"]', 'Your CoflCoins purchase is processing. Check your balance before trying again.').should('be.visible')
            cy.contains('Purchase failed').should('not.exist')
            cy.contains('Google Play reported a checkout problem.').should('not.exist')
            cy.location('hash').should('equal', '')
        })
    }

    it('uses fixed support guidance for a CoflCoins return', () => {
        const message = 'This purchase cannot be completed automatically. Contact support.'
        stubAccount()
        visitPlayCheckout(`/premium#billing_error_ps_cc_1800_${encodeURIComponent(message)}`)
        cy.contains('[role="alert"]', 'This CoflCoins purchase cannot be completed automatically. Please contact support before trying again.').should('be.visible')
        cy.contains(message).should('not.exist')
        cy.location('hash').should('equal', '')
    })

    it('uses subscription labels on Android result pages and on a failed checkout return', () => {
        visitPlayCheckout('/success#billing_success_l_premium', false)
        cy.contains('Premium subscription through Google Play').should('be.visible')
        visitPlayCheckout('/cancel#billing_error_l_prem_plus_Purchase%20canceled%20by%20user', false)
        cy.contains('h2', 'Premium+ subscription purchase').should('be.visible')
        cy.contains('The purchase was cancelled.').should('be.visible')
        visitPlayCheckout('/premium#billing_error_l_prem_plus_This%20subscription%20belongs%20to%20a%20different%20SkyCofl%20account', false)
        cy.contains('[role="alert"]', 'belong to another SkyCofl account').should('be.visible')
        cy.window().then(window => { window.location.hash = '#billing_error_l_prem_plus_Could%20not%20securely%20save%20the%20subscription' })
        cy.contains('[role="alert"]', 'Your payment is processing.').should('be.visible').and('not.contain.text', 'could not be completed')
        cy.window().then(window => { window.location.hash = '#billing_error_l_prem_plus_Arbitrary%20payment%20instructions' })
        cy.contains('[role="alert"]', 'Google Play reported a checkout problem.').should('be.visible')
        cy.contains('Arbitrary payment instructions').should('not.exist')
        visitNewPage('/premium?premiumVariant=new#billing_error_l_prem_plus_Arbitrary%20payment%20instructions', false,
            window => playContext(window, true, 'android'))
        cy.contains(NEW_PAGE_TITLE).should('be.visible')
        cy.contains('[role="alert"]', 'Google Play reported a checkout problem.').should('be.visible')
        cy.contains('Arbitrary payment instructions').should('not.exist')
    })
})
