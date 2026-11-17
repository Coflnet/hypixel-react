import { PREMIUM_EXPERIMENT, PremiumVariant, resolvePremiumVariant } from '../../utils/PremiumExperiment'

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
    documents: []
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
            window.localStorage.setItem('userCountryCode', 'DE')
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
    cy.intercept('GET', 'https://api.country.is*', { body: { country: 'DE' } })
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
        cy.get('[data-testid="plan-premium_plus"]').should('contain', '€').and('contain', 'per month')
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
        cy.get('button[aria-label="Pay with PayPal"]').click()
        cy.wait('@checkout').its('request.query').should('deep.include', { provider: 'paypal', country: 'DE' })
        expectTracked(['trackEvent', 'premium funnel', 'checkout started', 'variant=new;product=l_premium-year;provider=subscription;paymentProvider=paypal'])
    })

    it('keeps the ?tier= deep link working', () => {
        stubAccount()
        visitNewPage('/premium?premiumVariant=new&tier=premium_plus', true)
        cy.wait(['@products', '@subscriptions'])
        cy.get('#buyPremium').should('contain', 'Choose Your Plan Type')
    })
})
