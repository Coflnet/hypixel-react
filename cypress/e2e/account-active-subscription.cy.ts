import { pageText, tickUntil } from '../support/clock'
import { formatMoney } from '../../utils/PricingUtils'
import { getBazaarHistoryYears } from '../../utils/DataHistory'

const BAZAAR_ARCHIVE_BULLET = `Archive, CSV exports and about ${getBazaarHistoryYears()} years of bazaar data`

beforeEach(() => {
    cy.then(() => Cypress.automation('remote:debugger:protocol', { command: 'Network.clearBrowserCache' }))
    cy.intercept('GET', '**/api/premium/slots', { body: [] })
    // Until the backend offers Stripe and PayPal the checkout keeps the single Lemon Squeezy button without a promotion.
    cy.intercept('GET', '**/api/premium/subscription/providers*', { statusCode: 404, body: {} })
    cy.intercept('GET', '**/api/premium/discount/auto*', { statusCode: 204 })
    // the visitor's country (SkyApi reads Cloudflare's); tests of another country stub it again
    cy.intercept('GET', '**/api/premium/country', { body: { country: 'DE' } })
    // Advancing the checkout clock also runs the background cache-version check.
    // Stub it on both localhost (remote commands) and 127.0.0.1 (relative commands).
    cy.intercept('GET', '**/command/version/**', { body: 'cypress-version' })
    // Analytics, push notifications and remote images are outside these purchase/account scenarios.
    cy.intercept('GET', 'https://track.coflnet.com/matomo.js*', { headers: { 'content-type': 'application/javascript' }, body: '' })
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
    cy.intercept('GET', '**/preScript.js', { headers: { 'content-type': 'application/javascript' }, body: '' })
    cy.intercept({ resourceType: 'image', url: /^https:\/\// }, {
        headers: { 'content-type': 'image/svg+xml' }, body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'
    })
})

const googleToken = 'eyJhbGciOiJub25lIn0.eyJleHAiOjQxMDI0NDQ4MDAsImVtYWlsIjoiY3lwcmVzc0BleGFtcGxlLmNvbSIsIm5hbWUiOiJDeXByZXNzIn0.signature'

const OPTION_TITLE = '[data-testid="wizard-option-title"]'

/** the title of a wizard option row; clicking it clicks its row like a pointer would */
/** ticks the early start declaration of the open checkout; its payment buttons stay disabled until then */
function confirmDeclaration() {
    cy.get('[data-testid="purchase-declaration"] input[type="checkbox"]').check()
}

function wizardOption(title: string | RegExp) {
    return cy.get('#buyPremium').contains(OPTION_TITLE, title)
}

interface StubResponse {
    statusCode?: number
    body?: unknown
    delay?: number
    forceNetworkError?: boolean
}

function installAuthenticatedWebSocket(window: Cypress.AUTWindow) {
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
                    new MessageEvent('message', {
                        data: JSON.stringify({ mId: request.mId, type: request.type, data: JSON.stringify(response), maxAge: 0 })
                    })
                )
            }, 0)
        }

        // Next's dev HMR client registers listeners on the replaced WebSocket too
        addEventListener() {}
        removeEventListener() {}
        close() {}
    }

    window.WebSocket = AuthenticatedWebSocket as unknown as typeof WebSocket
    window.localStorage.clear()
    window.sessionStorage.clear()
    window.localStorage.setItem('googleId', googleToken)
    window.document.cookie = 'nonEssentialCookiesAllowed=false; path=/'
}

function visitAuthenticatedPage(path = '/account', setup?: (window: Cypress.AUTWindow) => void) {
    cy.intercept('GET', '**/api/user/terms*', {
        statusCode: 200,
        body: {
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
            premiumPurchaseDeclaration: { version: 'test-declaration', locale: 'en', text: 'Start my purchased access immediately.', sha256: 'test-hash' }
        }
    })
    cy.intercept('GET', '**/api/premium/transactions', { statusCode: 200, body: [] })
    cy.visit(path, {
        onBeforeLoad(window) {
            installAuthenticatedWebSocket(window)
            setup?.(window)
        }
    })
}

function stubProducts(response: StubResponse = { statusCode: 200, body: {} }) {
    cy.intercept('POST', '**/api/premium/user/owns', response).as('products')
}

function stubSubscriptions(response: StubResponse) {
    cy.intercept('GET', '**/api/premium/subscription', response).as('subscriptions')
}

function deleteAccountButton() {
    return cy.contains('button', /^Delete account$/)
}

/** the browser's time zone, so dates shown in the viewer's zone are known; '' restores the system's */
function setTimeZone(timezoneId: string) {
    return cy.then(() => Cypress.automation('remote:debugger:protocol', { command: 'Emulation.setTimezoneOverride', params: { timezoneId } }))
}

function waitForDialogTransition() {
    // Cypress actionability does not wait for opacity transitions. Let the dialog
    // finish entering before an immediate fixture response starts its exit.
    cy.get('[role="dialog"]').should('be.visible').then(dialog =>
        Cypress.Promise.all(dialog[0].getAnimations({ subtree: true }).map(animation => animation.finished))
    )
}

const activeSubscription = {
    externalId: 'active-subscription',
    endsAt: null,
    productName: 'premium_plus',
    paymentAmount: 499,
    renewsAt: '2099-02-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z'
}

describe('Premium refresh after checkout', () => {
    const ownership = { premium: { expiresAt: '2099-02-01T00:00:00Z' } }
    const cacheKey = 'skycoflApiCache:premium-products:cypress%40example.com'

    for (const path of ['/premium', '/account']) {
        it(`picks up delayed payment confirmation on ${path} without reloading`, () => {
            const lookups = { products: 0, subscriptions: 0 }
            let paid = false
            cy.intercept('POST', '**/api/premium/user/owns', request => {
                lookups.products++
                request.reply({ body: paid ? ownership : {} })
            })
            cy.intercept('GET', '**/api/premium/subscription', request => {
                lookups.subscriptions++
                request.reply({ body: paid ? [{ ...activeSubscription, productName: 'premium' }] : [] })
            })
            // The page polls every 5 seconds; faked timers let the test skip that wait.
            let page: Cypress.AUTWindow
            cy.clock(Date.now(), ['setTimeout', 'clearTimeout'])
            visitAuthenticatedPage(path, window => {
                page = window
            })
            tickUntil(() => lookups.products > 0 && lookups.subscriptions > 0 && pageText(page).includes('No Premium'), 'the first lookup shows no Premium')
            cy.then(() => {
                paid = true
            })
            tickUntil(() => pageText(page).includes('Premium (Subscription)'), 'a poll picks up the payment')
            cy.contains('No Premium').should('not.exist')
            if (path === '/premium') cy.contains('You have a Premium account.').should('be.visible')
            cy.window().then(window => {
                expect(JSON.parse(window.sessionStorage.getItem(cacheKey)!).value).to.deep.equal(ownership)
                expect(JSON.parse(window.localStorage.getItem('lastPremiumProducts')!)).to.deep.equal(ownership)
            })
        })
    }

    it('refreshes immediately on returning to the tab despite a fresh empty cache', () => {
        stubProducts()
        stubSubscriptions({ body: [] })
        visitAuthenticatedPage('/premium', window => {
            cy.spy(window, 'addEventListener').as('windowListeners')
        })
        cy.wait(['@products', '@subscriptions'])
        cy.contains('No Premium').should('be.visible')
        cy.get('@windowListeners').should('have.been.calledWith', 'focus')
        // The initial empty UI can render before the first response is applied.
        // Returning to the tab must happen after that request has filled its cache.
        cy.window().should(window => {
            expect(JSON.parse(window.sessionStorage.getItem(cacheKey) || 'null')?.value).to.deep.equal({})
        })
        cy.intercept('POST', '**/api/premium/user/owns', { body: ownership }).as('refreshedProducts')
        cy.window().then(window => window.dispatchEvent(new window.Event('focus')))
        cy.wait('@refreshedProducts')
        cy.contains('You have a Premium account.').should('be.visible')
    })

    it('does not reset the selected purchase step when ownership is unchanged', () => {
        stubProducts({ body: ownership })
        stubSubscriptions({ body: [] })
        visitAuthenticatedPage('/premium?tier=premium_plus')
        cy.wait(['@products', '@subscriptions'])
        wizardOption(/^CoflCoins$/).click()
        cy.get('#buyPremium').contains('Choose Your Package').should('be.visible')
        cy.window().then(window => window.dispatchEvent(new window.Event('focus')))
        cy.wait('@products')
        cy.get('#buyPremium').contains('Choose Your Package').should('be.visible')
    })

    it('refreshes checkout-return caches, pauses in the background, and backs off after two minutes', () => {
        let fulfilled = false
        let updates = 0
        cy.intercept('POST', '**/api/premium/user/owns', request => request.reply({ body: fulfilled ? ownership : {} })).as('products')
        cy.clock(Date.now(), ['Date', 'setTimeout', 'clearTimeout'])
        visitAuthenticatedPage('/success', window => {
            window.sessionStorage.setItem(cacheKey, JSON.stringify({ expiresAt: Date.now() + 300000, value: {} }))
            window.addEventListener('premium.products.updated', () => { updates++ })
        })
        cy.wait('@products')
        cy.tick(0)
        cy.wrap(null).should(() => expect(updates).to.equal(1))
        // the page waits for the booked payment (cypress/e2e/payment-success.cy.ts) while the ownership cache refreshes
        cy.contains('h2', 'Waiting for payment confirmation…').should('be.visible')
        cy.window().then(window => Object.defineProperty(window.document, 'visibilityState', { configurable: true, value: 'hidden' }))
        cy.tick(15000)
        cy.get('@products.all').should('have.length', 1)
        cy.then(() => { fulfilled = true })
        cy.window().then(window => {
            Object.defineProperty(window.document, 'visibilityState', { configurable: true, value: 'visible' })
            window.document.dispatchEvent(new window.Event('visibilitychange'))
        })
        cy.wait('@products')
        cy.wrap(null).should(() => expect(updates).to.equal(2))
        cy.window().should(window => expect(JSON.parse(window.sessionStorage.getItem(cacheKey)!).value).to.deep.equal(ownership))
        cy.tick(5000)
        cy.wait('@products')
        cy.wrap(null).should(() => expect(updates).to.equal(3))
        cy.clock().invoke('setSystemTime', Date.now() + 180000)
        cy.tick(5000)
        cy.wait('@products')
        cy.wrap(null).should(() => expect(updates).to.equal(4))
        cy.get('@products.all').then(requests => {
            const count = requests.length
            cy.tick(29000)
            cy.get('@products.all').should('have.length', count)
            cy.tick(1000)
            cy.wait('@products')
        })
        cy.get('@products.all').then(requests => {
            const count = requests.length
            cy.visit('/about')
            cy.tick(30000)
            cy.get('@products.all').should('have.length', count)
        })
    })
})

describe('Account deletion with subscription lookup', () => {
    it('shows delegated premium as owner-managed without subscription controls', () => {
        stubProducts({ statusCode: 200, body: {
            premium_plus: { expiresAt: '2099-02-01T00:00:00Z', ownerId: 'another-account', slotId: 42, canManage: false }
        } })
        stubSubscriptions({ statusCode: 200, body: [] })
        visitAuthenticatedPage()
        cy.wait(['@products', '@subscriptions'])
        cy.contains('Provided by another account. Only the purchaser can change or cancel this slot.').should('be.visible')
        cy.contains('button', 'Cancel subscription').should('not.exist')
        cy.contains('Reactivate subscription').should('not.exist')
    })

    for (const path of ['/account', '/premium']) {
        it(`refreshes assigned Premium on ${path} despite a cached empty ownership response`, () => {
            stubProducts({ body: {
                premium: { expiresAt: '2099-02-01T00:00:00Z', ownerId: '7', slotId: 1, canManage: false },
                starter_premium: { expiresAt: '2099-02-01T00:00:00Z', ownerId: '7', slotId: 1, canManage: false }
            } })
            stubSubscriptions({ body: [] })
            visitAuthenticatedPage(path, window => {
                window.sessionStorage.setItem('skycoflApiCache:premium-products:cypress%40example.com', JSON.stringify({
                    expiresAt: Date.now() + 300000, value: {}
                }))
            })
            cy.wait(['@products', '@subscriptions'])
            cy.contains('Provided by another account. Only the purchaser can change or cancel this slot.').should('be.visible')
            cy.contains('button', 'Cancel subscription').should('not.exist')
        })
    }

    it('stays disabled while subscriptions load, then preserves authenticated deletion', () => {
        stubProducts()
        stubSubscriptions({ statusCode: 200, delay: 1200, body: [] })
        cy.intercept('DELETE', '**/api/user/me', request => {
            expect(request.headers.googletoken).to.equal(googleToken)
            request.reply({ statusCode: 200, body: { message: 'Deleted' } })
        }).as('deleteAccount')

        visitAuthenticatedPage()

        deleteAccountButton().should('be.disabled')
        cy.wait('@subscriptions')
        deleteAccountButton().should('be.enabled').click()
        cy.get('#deleteAccountConfirmation').type('DELETE')
        cy.contains('button', 'Permanently delete my account').should('be.enabled').click()
        cy.wait('@deleteAccount')
    })

    it('stays disabled when subscription lookup fails', () => {
        stubProducts()
        stubSubscriptions({ forceNetworkError: true })

        visitAuthenticatedPage()

        cy.wait('@subscriptions')
        deleteAccountButton().should('be.disabled')
        cy.contains('Premium subscriptions could not be loaded').should('be.visible')
    })

    it('allows deletion when only product loading fails and there is no subscription', () => {
        stubProducts({ forceNetworkError: true })
        stubSubscriptions({ statusCode: 200, body: [] })

        visitAuthenticatedPage()

        cy.wait(['@products', '@subscriptions'])
        cy.contains('Premium products could not be loaded').should('be.visible')
        deleteAccountButton().should('be.enabled')
    })

    it('blocks an active subscription and shows a labeled cancel control without products', () => {
        stubProducts({ forceNetworkError: true })
        stubSubscriptions({ statusCode: 200, body: [activeSubscription] })
        cy.intercept('DELETE', '**/api/premium/subscription/active-subscription', { statusCode: 200 }).as('cancelSubscription')

        visitAuthenticatedPage()

        cy.wait(['@products', '@subscriptions'])
        deleteAccountButton().should('be.disabled')
        cy.contains('button', 'Cancel subscription').should('be.visible')
        cy.contains('h2', 'Danger Zone')
            .parent()
            .then(dangerZone => {
                let buttons = dangerZone.find('button').toArray()
                let cancelButtonIndex = buttons.findIndex(button => button.textContent?.includes('Cancel subscription'))
                let deleteButtonIndex = buttons.findIndex(button => button.textContent?.trim() === 'Delete account')
                expect(cancelButtonIndex).to.be.lessThan(deleteButtonIndex)
                cy.wrap(buttons[cancelButtonIndex]).click()
            })
        cy.contains('.modal-title', 'Cancel Subscription').should('be.visible')
        cy.contains('button', 'Confirm cancelation').click()
        cy.wait('@cancelSubscription')
        cy.contains('Premium products could not be loaded').should('be.visible')
    })

    it('blocks a canceled subscription until its paid period expires', () => {
        stubProducts()
        stubSubscriptions({
            statusCode: 200,
            body: [{ ...activeSubscription, externalId: 'canceled-subscription', endsAt: '2099-01-15T00:00:00Z' }]
        })

        visitAuthenticatedPage()

        cy.wait('@subscriptions')
        deleteAccountButton().should('be.disabled')
        cy.contains('Canceled').should('be.visible')
        cy.contains('button', 'Cancel subscription').should('not.exist')
    })
})

// regression: the legally required "cancel contracts here" page (§ 312k BGB) was not linked from sky.coflnet.com
describe('Contract cancellation link', () => {
    it('is in the footer of every page, in German for a German browser', () => {
        cy.visit('/about')
        cy.get('footer [data-testid="cancel-contract-link"]')
            .should('be.visible')
            .and('have.attr', 'href', 'https://coflnet.com/cancel-contract')
            .and('have.text', 'Cancel contracts here')
        cy.visit('/about', {
            onBeforeLoad(window) {
                Object.defineProperty(window.navigator, 'language', { value: 'de-DE' })
            }
        })
        cy.get('footer [data-testid="cancel-contract-link"]')
            .should('have.attr', 'href', 'https://coflnet.com/de/cancel-contract')
            .and('have.text', 'Verträge hier kündigen')
    })

    // regression: the fixed cookie banner and the anchor ad covered the footer's cancellation link
    it('stays reachable above a bar fixed at the bottom of the window', () => {
        cy.visit('/about')
        cy.document().then(document => {
            const banner = document.createElement('div')
            banner.className = 'CookieConsent'
            banner.setAttribute('style', 'position: fixed; left: 0; right: 0; bottom: 0; height: 140px; background: black; z-index: 999')
            document.body.appendChild(banner)
        })
        cy.get('footer[data-testid="site-footer"]').should('have.css', 'padding-bottom', `${16 + 140}px`)
        cy.scrollTo('bottom')
        cy.get('footer [data-testid="cancel-contract-link"]').should(link => {
            const box = link[0].getBoundingClientRect()
            const atLink = link[0].ownerDocument.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
            expect(atLink, 'the link is not covered').to.equal(link[0])
        })
        // the bar closed: the room goes away
        cy.get('.CookieConsent').invoke('remove')
        cy.get('footer[data-testid="site-footer"]').should('have.css', 'padding-bottom', '16px')
    })

    it('is next to the subscription cancel actions of the account page', () => {
        stubProducts()
        stubSubscriptions({ statusCode: 200, body: [activeSubscription] })
        visitAuthenticatedPage()
        cy.wait('@subscriptions')
        cy.contains('p', "You can also cancel on Coflnet's cancellation page")
            .find('[data-testid="cancel-contract-link"]')
            .should('be.visible')
            .and('have.attr', 'href', 'https://coflnet.com/cancel-contract')
        cy.contains('button', 'Cancel subscription').click()
        cy.get('.modal [data-testid="cancel-contract-link"]').should('be.visible').and('have.attr', 'href', 'https://coflnet.com/cancel-contract')
    })
})


describe('Subscription plan changes', () => {
    const plan = { productSlug: 'l_prem_plus-slots-4', title: 'Four Premium+ slots', price: 99.69,
        currencyCode: 'eur', ownershipSeconds: 2419200, slotCount: 4, isUpgrade: true }

    function openPlan(response: StubResponse = { statusCode: 200, body: [plan] }) {
        stubProducts()
        stubSubscriptions({ statusCode: 200, body: [activeSubscription] })
        cy.intercept('GET', '**/api/premium/subscription/active-subscription/plans', response).as('plans')
        visitAuthenticatedPage()
        cy.wait('@subscriptions')
        cy.contains('button', 'Change subscription plan').click()
        cy.wait('@plans')
    }

    it('shows the price, authenticates the change, and prevents duplicate submission', () => {
        cy.intercept('PUT', '**/api/premium/subscription/active-subscription/switch*', request => {
            expect(request.headers.googletoken).to.equal(googleToken)
            expect(request.query.targetProductSlug).to.equal(plan.productSlug)
            request.reply({ statusCode: 200, delay: 700, body: { status: 'completed' } })
        }).as('changePlan')
        openPlan()
        cy.contains('Four Premium+ slots').should('contain', '99.69')
        cy.contains('button', 'Upgrade and pay difference').click().should('be.disabled')
        cy.wait('@changePlan')
        cy.contains('Your subscription plan has been updated.').should('be.visible')
        cy.get('@changePlan.all').should('have.length', 1)
    })

    it('explains that downgrades preserve the paid tier until renewal', () => {
        cy.intercept('PUT', '**/api/premium/subscription/active-subscription/switch*', { statusCode: 200, body: { status: 'completed' } }).as('changePlan')
        openPlan({ statusCode: 200, body: [{ ...plan, productSlug: 'l_premium-slots-4', title: 'Four Premium slots', price: 29.69, isUpgrade: false }] })
        cy.contains('Your current paid tier stays active until renewal.').should('be.visible')
        cy.contains('Four Premium slots').should('contain', '29.69')
        cy.contains('button', 'Change next renewal').click()
        cy.wait('@changePlan')
    })

    it('provides the PayPal confirmation link without claiming completion', () => {
        const portal = 'https://test.lemonsqueezy.com/billing/subscription/update'
        cy.intercept('PUT', '**/api/premium/subscription/active-subscription/switch*', { statusCode: 200, body: { status: 'redirect', redirectUrl: portal } })
        openPlan()
        cy.contains('button', 'Upgrade and pay difference').click()
        cy.contains('a', 'Continue in Lemon Squeezy').should('have.attr', 'href', portal)
        cy.contains('Your subscription plan has been updated.').should('not.exist')
    })

    it('shows agreement errors without claiming the plan changed', () => {
        cy.intercept('PUT', '**/api/premium/subscription/active-subscription/switch*', { statusCode: 428, body: {} })
        openPlan()
        cy.contains('button', 'Upgrade and pay difference').click()
        cy.get('[role="alert"]').should('contain', 'agreement')
        cy.contains('a', 'Review agreement').should('have.attr', 'href', '/premium')
    })
})


describe('Premium page upgrade button', () => {
    const upgrade = { productSlug: 'l_prem_plus-slots-4', title: 'Four Premium+ slots', price: 99.69,
        currencyCode: 'eur', ownershipSeconds: 2419200, slotCount: 4, isUpgrade: true }
    const downgrade = { ...upgrade, productSlug: 'l_premium-slots-4', title: 'Four Premium slots', price: 29.69, isUpgrade: false }

    function visitPremium(subscriptions: StubResponse, path = '/premium') {
        stubProducts({ statusCode: 200, body: { premium: { expiresAt: '2099-02-01T00:00:00Z' } } })
        stubSubscriptions(subscriptions)
        visitAuthenticatedPage(path)
        cy.wait(['@products', '@subscriptions'])
    }

    // regression: existing Premium users got hard-coded net prices ("8.69 Euro (+VAT) / 4 weeks") that started a Lemon Squeezy
    // checkout past the provider routing and the promotion; they now extend through the purchase wizard
    for (const variant of ['current', 'new']) {
        it(`extends Premium through the purchase wizard with the buyer's providers on the ${variant} page`, () => {
            cy.intercept('GET', '**/api/premium/country', { body: { country: 'DE' } })
            cy.intercept('GET', '**/api/premium/subscription/providers*', { body: [{ provider: 'stripe' }, { provider: 'paypal' }] }).as('providers')
            cy.intercept('POST', '**/api/topup/rates', {
                body: { products: [{ productSlug: 'l_premium', discountPercent: 0, providers: [{ providerSlug: 'lemonsqueezy', currencyCode: 'EUR', originalPrice: 9.69, discountedPrice: 9.69 }] }] }
            })
            visitPremium({ statusCode: 200, body: [] }, `/premium?premiumVariant=${variant}`)
            cy.get('#extendPremium').should('not.contain.text', 'Euro').and('not.contain.text', '+VAT')
            cy.contains('#extendPremium button', 'Extend with a subscription').click()
            cy.get('#buyPremium').should('be.visible').and('contain.text', 'Extend Premium').and('contain.text', 'Choose Your Plan Type')
            wizardOption(/^Subscription$/).click()
            wizardOption('Just for me').click()
            wizardOption(/^4 weeks$/).click()
            cy.contains('#buyPremium h3', 'Complete Purchase').should('be.visible')
            // the exact German charge every 4 weeks, not the old hard-coded net price
            cy.get('#buyPremium').should('contain.text', formatMoney(11.53, 'EUR')).and('contain.text', 'per 4 weeks').and('not.contain.text', '8.69')
            cy.intercept('POST', /\/api\/premium\/subscription\/l_premium(\?|$)/, { body: { directLink: 'https://checkout.stripe.com/c/pay/test' } }).as('checkout')
            cy.window().then(window => cy.stub(window, 'open'))
            confirmDeclaration()
            cy.contains('button', 'Pay with card').click()
            cy.wait('@checkout').its('request.query').should('deep.include', { provider: 'stripe', country: 'DE' })
        })
    }

    it('extends Premium Plus with a Premium Plus subscription, not Premium', () => {
        cy.intercept('GET', '**/api/premium/country', { body: { country: 'DE' } })
        cy.intercept('GET', '**/api/premium/subscription/providers*', { body: [{ provider: 'stripe' }, { provider: 'paypal' }] })
        cy.intercept('POST', '**/api/topup/rates', {
            body: { products: [{ productSlug: 'l_prem_plus', discountPercent: 0, providers: [{ providerSlug: 'lemonsqueezy', currencyCode: 'EUR', originalPrice: 35.69, discountedPrice: 35.69 }] }] }
        })
        stubProducts({ statusCode: 200, body: { premium_plus: { expiresAt: '2099-02-01T00:00:00Z' } } })
        stubSubscriptions({ statusCode: 200, body: [] })
        visitAuthenticatedPage('/premium')
        cy.wait(['@products', '@subscriptions'])
        cy.contains('#extendPremium button', 'Extend with a subscription').click()
        cy.get('#buyPremium').should('contain.text', 'Extend Premium')
        wizardOption(/^Subscription$/).click()
        wizardOption('Just for me').click()
        wizardOption(/^4 weeks$/).click()
        cy.contains('#buyPremium h3', 'Complete Purchase').should('be.visible')
        cy.get('#buyPremium').should('contain.text', 'Premium Plus').and('contain.text', formatMoney(42.47, 'EUR'))
        cy.intercept('POST', /\/api\/premium\/subscription\/l_prem_plus(\?|$)/, { body: { directLink: 'https://checkout.stripe.com/c/pay/test' } }).as('checkout')
        cy.window().then(window => cy.stub(window, 'open'))
        confirmDeclaration()
        cy.contains('button', 'Pay with card').click()
        cy.wait('@checkout').its('request.query').should('deep.include', { provider: 'stripe', country: 'DE' })
    })

    it('upgrades the existing subscription instead of opening a purchase wizard', () => {
        cy.intercept('GET', '**/api/premium/subscription/active-subscription/plans', { statusCode: 200, body: [downgrade, upgrade] }).as('plans')
        cy.intercept('PUT', '**/api/premium/subscription/active-subscription/switch*', request => {
            expect(request.headers.googletoken).to.equal(googleToken)
            expect(request.query.targetProductSlug).to.equal(upgrade.productSlug)
            request.reply({ statusCode: 200, body: { status: 'completed' } })
        }).as('upgrade')
        visitPremium({ statusCode: 200, body: [{ ...activeSubscription, productName: 'premium' }] })
        cy.contains('button', 'Upgrade to Higher Tier').click()
        cy.wait('@plans')
        cy.contains('.modal-title', 'Upgrade subscription').should('be.visible')
        cy.contains('Four Premium+ slots').should('contain', '99.69')
        cy.get('.modal input[type="radio"]').should('have.length', 1)
        cy.contains('The upgrade applies after payment.').should('be.visible')
        cy.get('#buyPremium').should('not.exist')
        cy.contains('button', 'Upgrade and pay difference').click()
        cy.wait('@upgrade')
        cy.contains('Your subscription plan has been updated.').should('be.visible')
    })

    it('does not offer downgrades or a new purchase when no higher tier is available', () => {
        cy.intercept('GET', '**/api/premium/subscription/active-subscription/plans', { statusCode: 200, body: [downgrade] }).as('plans')
        visitPremium({ statusCode: 200, body: [activeSubscription] })
        cy.contains('button', 'Upgrade to Higher Tier').click()
        cy.wait('@plans')
        cy.contains('No higher-tier plan is available for this subscription.').should('be.visible')
        cy.contains('button', 'Change next renewal').should('not.exist')
        cy.contains('button', 'Upgrade and pay difference').should('not.exist')
        cy.get('#buyPremium').should('not.exist')
    })

    it('keeps the purchase wizard for prepaid accounts without a subscription', () => {
        visitPremium({ statusCode: 200, body: [] })
        cy.contains('button', 'Upgrade to Higher Tier').click()
        cy.get('#buyPremium').should('be.visible').and('contain', 'Upgrade Premium')
        cy.contains('.modal-title', 'Upgrade subscription').should('not.exist')
    })

    it('disables upgrading when subscription lookup fails', () => {
        visitPremium({ forceNetworkError: true })
        cy.contains('Premium subscriptions could not be loaded').should('be.visible')
        cy.contains('button', 'Upgrade to Higher Tier').should('be.disabled')
        cy.get('#buyPremium').should('not.exist')

        let releaseSubscriptions: () => void
        const pending = new Promise<void>(resolve => { releaseSubscriptions = resolve })
        cy.intercept('GET', '**/api/premium/subscription', request =>
            pending.then(() => request.reply({ body: [activeSubscription] }))
        ).as('refreshedSubscriptions')
        cy.window().then(window => window.dispatchEvent(new window.Event('focus')))
        cy.contains('Premium subscriptions could not be loaded').should('be.visible')
        cy.contains('button', 'Upgrade to Higher Tier').should('be.disabled')
        cy.then(() => releaseSubscriptions())
        cy.wait('@refreshedSubscriptions')
        cy.contains('Premium subscriptions could not be loaded').should('not.exist')
        cy.contains('button', 'Upgrade to Higher Tier').should('be.enabled')
    })

    it('keeps each active subscription separate and excludes canceled subscriptions', () => {
        cy.intercept('GET', '**/api/premium/subscription/active-subscription/plans', { statusCode: 200, body: [upgrade] }).as('plans')
        visitPremium({ statusCode: 200, body: [
            { ...activeSubscription, externalId: 'canceled-subscription', endsAt: '2099-01-15T00:00:00Z' },
            { ...activeSubscription, externalId: 'plus-subscription', productName: 'premium_plus' },
            { ...activeSubscription, productName: 'premium' }
        ] })
        cy.contains('h2', 'Extend Premium').parent().find('button').should('have.length', 2)
        cy.contains('span', /^Premium — renews/).parent().contains('button', 'Upgrade to Higher Tier').click()
        cy.wait('@plans')
        cy.contains('.modal-title', 'Upgrade subscription').should('be.visible')
    })

    // regression: an owner whose subscription still renews could start a second one of the same tier and be billed twice
    it('asks before starting another subscription of the tier that already renews', () => {
        visitPremium({ statusCode: 200, body: [{ ...activeSubscription, productName: 'premium' }] })
        cy.get('[data-testid="renewing-subscription-notice"]')
            .should('contain.text', 'You already have a renewing Premium subscription')
            .and('contain.text', 'It renews on')
            .and('contain.text', '2099')
            .and('contain.text', 'billed in addition')
        cy.contains('#extendPremium button', 'Extend with a subscription').click()
        cy.get('#buyPremium').should('not.exist')
        cy.contains('button', 'Keep only my current subscription').click()
        cy.contains('button', 'Yes, start another subscription').should('not.exist')
        cy.get('#buyPremium').should('not.exist')
        cy.contains('#extendPremium button', 'Extend with a subscription').click()
        cy.contains('button', 'Yes, start another subscription').click()
        cy.get('#buyPremium').should('be.visible').and('contain.text', 'Extend Premium').and('contain.text', 'Choose Your Plan Type')
    })

    it('does not warn about a subscription of another tier or one that was canceled', () => {
        visitPremium({ statusCode: 200, body: [
            { ...activeSubscription, externalId: 'plus-subscription', productName: 'premium_plus' },
            { ...activeSubscription, externalId: 'canceled', productName: 'premium', endsAt: '2099-01-15T00:00:00Z' }
        ] })
        cy.contains('#extendPremium button', 'Extend with a subscription').click()
        cy.get('[data-testid="renewing-subscription-notice"]').should('not.exist')
        cy.get('#buyPremium').should('be.visible').and('contain.text', 'Extend Premium')
    })

    // regression: after choosing "Extend" and then a higher tier the heading still said "Extend Premium"
    it('calls it an upgrade once the owner goes back and picks a higher tier', () => {
        visitPremium({ statusCode: 200, body: [] })
        cy.contains('#extendPremium button', 'Extend with a subscription').click()
        cy.contains('#buyPremium h2', 'Extend Premium').should('be.visible')
        cy.get('[data-testid="premium-wizard"]').contains('button', /^Back$/).click()
        wizardOption(/^Premium Plus$/).click()
        cy.contains('#buyPremium h2', 'Upgrade Premium').should('be.visible')
        cy.contains('#buyPremium h2', 'Extend Premium').should('not.exist')
        wizardOption(/^Subscription$/).click()
        wizardOption('Just for me').click()
        wizardOption(/^4 weeks$/).click()
        cy.contains('#buyPremium h3', 'Complete Upgrade').should('be.visible')
        cy.contains('#buyPremium h2', 'Upgrade Premium').should('be.visible')
    })
})

const purchasedSlot: {
    id: string
    tier: string
    expires: string
    version: number
    assignedUserId: string | null
    minecraftUuid: string | null
    recipientEmail: string | null
    minecraftName: string | null
} = {
    id: '9007199254740993',
    tier: 'premium_plus',
    expires: '2099-02-01T00:00:00Z',
    version: 7,
    assignedUserId: null,
    minecraftUuid: null,
    recipientEmail: null,
    minecraftName: null
}

function visitSlots() {
    stubProducts()
    stubSubscriptions({ statusCode: 200, body: [] })
    visitAuthenticatedPage()
    cy.wait('@slots')
}

describe('Purchased slot assignments', () => {
    for (const slotCount of [1, 4]) {
        it(`cancels the selected ${slotCount}-slot subscription while keeping other subscriptions and assignments`, () => {
            const subscription = { ...activeSubscription, externalId: 'slot-subscription', productName: `Premium+ ${slotCount} slot`, slotCount }
            let canceled = false
            stubProducts()
            cy.intercept('GET', '**/api/premium/subscription', request => request.reply({ body: [
                activeSubscription, { ...subscription, endsAt: canceled ? subscription.renewsAt : null }
            ] })).as('subscriptions')
            cy.intercept('GET', '**/api/premium/slots', { body: [
                { ...purchasedSlot, subscriptionId: subscription.externalId, recipientEmail: 'friend@example.com', assignedUserId: 'friend' }
            ] }).as('slots')
            cy.intercept('DELETE', '**/api/premium/subscription/*', request => {
                expect(request.url).to.contain('/subscription/slot-subscription')
                expect(request.headers.googletoken).to.equal(googleToken)
                canceled = true
                request.reply({ statusCode: 200 })
            }).as('cancelSlot')
            visitAuthenticatedPage()
            cy.get('#purchased-slots').should('contain.text', 'keeps billing active')
            cy.get('[data-testid="tier-slot"]').contains('button', slotCount === 1 ? 'Cancel slot subscription' : 'Cancel 4-slot subscription').click()
            cy.get('.modal').should('contain.text', 'Subscription #slot-subscription')
                .and('contain.text', slotCount === 1 ? 'this single slot only' : 'all 4 slots')
                .and('contain.text', 'Access continues through the paid period')
            waitForDialogTransition()
            cy.contains('button', 'Confirm cancelation').click()
            cy.wait('@cancelSlot')
            cy.get('.modal').should('not.exist')
            cy.get('[data-testid="tier-slot"]').should('contain.text', 'Canceled · access until').and('contain.text', 'friend@example.com')
            cy.get('[data-testid="tier-slot"]').contains('button', 'Cancel').should('not.exist')
            cy.contains('button', 'Cancel subscription').should('be.visible')
        })
    }

    it('keeps a failed cancellation open and allows retry without claiming success', () => {
        const subscription = { ...activeSubscription, externalId: 'single-slot', productName: 'Premium+ single slot', slotCount: 1 }
        stubProducts()
        stubSubscriptions({ body: [subscription] })
        cy.intercept('GET', '**/api/premium/slots', { body: [{ ...purchasedSlot, subscriptionId: subscription.externalId }] })
        cy.intercept('DELETE', '**/api/premium/subscription/single-slot', { statusCode: 503, delay: 500, body: { message: 'Try again' } }).as('failedCancel')
        visitAuthenticatedPage()
        cy.get('[data-testid="tier-slot"]').contains('button', 'Cancel slot subscription').click()
        cy.contains('button', 'Confirm cancelation').click()
        cy.contains('button', 'Canceling…').should('be.disabled')
        cy.wait('@failedCancel')
        cy.get('.modal').should('contain.text', 'Could not confirm cancellation')
        cy.contains('Subscription cancelled').should('not.exist')
        stubSubscriptions({ body: [{ ...subscription, endsAt: subscription.renewsAt }] })
        cy.intercept('DELETE', '**/api/premium/subscription/single-slot', { statusCode: 200 }).as('retryCancel')
        cy.contains('button', 'Confirm cancelation').click()
        cy.wait('@retryCancel')
        cy.get('.modal').should('not.exist')
        cy.get('[data-testid="tier-slot"]').should('contain.text', 'Canceled · access until')
    })

    it('assigns by email without rounding the slot ID and shows the saved recipient after reloading', () => {
        let slot = { ...purchasedSlot }
        const remaining = ['9007199254740994', '9007199254740995', '9007199254740996'].map(id => ({ ...purchasedSlot, id }))
        cy.intercept('GET', '**/api/premium/slots', request => request.reply({ statusCode: 200, body: [slot, ...remaining] })).as('slots')
        cy.intercept('PUT', `**/api/premium/slots/${slot.id}/assignment`, request => {
            expect(request.headers.googletoken).to.equal(googleToken)
            expect(request.body).to.deep.equal({ email: 'friend@example.com', version: 7 })
            slot = { ...slot, assignedUserId: '123', recipientEmail: 'friend@example.com', version: 8 }
            request.reply({ statusCode: 204 })
        }).as('assignSlot')
        visitSlots()
        cy.get('[data-testid="tier-slot"]').should('have.length', 4).first().contains('button', 'Assign slot').click()
        waitForDialogTransition()
        cy.get('#slot-recipient').type('friend@example.com')
        cy.contains('button', 'Save assignment').click()
        cy.wait('@assignSlot')
        cy.get('[data-testid="tier-slot"]').should('contain.text', 'friend@example.com')
        cy.get('[data-testid="tier-slot"]').filter(':contains("Unassigned")').should('have.length', 3)
        cy.get('[role="dialog"]').should('not.exist')
        cy.contains('button', 'Refresh slots').click()
        cy.wait('@slots')
        cy.get('[data-testid="tier-slot"]').should('contain.text', 'friend@example.com')
    })

    it('assigns a Minecraft name and displays the resolved name', () => {
        let slot = { ...purchasedSlot }
        cy.intercept('GET', '**/api/premium/slots', request => request.reply({ body: [slot] })).as('slots')
        cy.intercept('PUT', '**/api/premium/slots/*/assignment', request => {
            expect(request.body).to.deep.equal({ minecraftAccount: 'Notch', version: 7 })
            slot = { ...purchasedSlot, version: 8, minecraftUuid: '069a79f444e94726a5befca90e38aaf5', minecraftName: 'Notch' }
            request.reply({ statusCode: 204 })
        }).as('assignSlot')
        visitSlots()
        cy.contains('button', 'Assign slot').click()
        cy.get('#slot-recipient-type').select('minecraft')
        cy.get('#slot-recipient').type('Notch')
        cy.contains('button', 'Save assignment').click()
        cy.wait('@assignSlot')
        cy.get('[data-testid="tier-slot"]').should('contain.text', 'Notch')
        // Close the confirmation instead of waiting for its auto-close, it would cover the screenshot.
        cy.contains('.Toastify__toast', 'Slot assigned').should('be.visible')
        cy.get('.Toastify__close-button').click({ multiple: true })
        cy.get('.Toastify__toast').should('not.exist')
        cy.get('#purchased-slots').screenshot('purchased-slot-management')
    })

    it('can use the current account and release an assignment without retaining either recipient field', () => {
        let slot: typeof purchasedSlot = {
            ...purchasedSlot,
            assignedUserId: '123',
            recipientEmail: 'friend@example.com',
            minecraftUuid: '069a79f444e94726a5befca90e38aaf5',
            minecraftName: 'Notch'
        }
        cy.intercept('GET', '**/api/premium/slots', request => request.reply({ body: [slot] })).as('slots')
        cy.intercept('PUT', '**/api/premium/slots/*/assignment', request => {
            slot = { ...purchasedSlot, version: slot.version + 1, assignedUserId: request.body.email ? '7' : null, recipientEmail: request.body.email || null }
            request.reply({ statusCode: 204 })
        }).as('assignSlot')
        visitSlots()
        cy.contains('button', 'Reassign').click()
        waitForDialogTransition()
        cy.get('#slot-recipient-type').select('email')
        cy.contains('button', 'Use my email').click()
        cy.get('#slot-recipient').should('have.value', 'cypress@example.com')
        cy.contains('button', 'Save assignment').click()
        cy.wait('@assignSlot').its('request.body').should('deep.equal', { email: 'cypress@example.com', version: 7 })
        cy.get('[data-testid="tier-slot"]').should('contain.text', 'cypress@example.com').and('not.contain.text', 'Notch')
        cy.get('[role="dialog"]').should('not.exist')
        cy.get('[data-testid="tier-slot"]').contains('button', 'Release slot').click()
        cy.wait('@assignSlot').its('request.body').should('deep.equal', { version: 8 })
        cy.get('[data-testid="tier-slot"]').should('contain.text', 'Unassigned')
    })

    it('refreshes a stale assignment before allowing a retry and prevents duplicate submissions', () => {
        cy.intercept('GET', '**/api/premium/slots', { body: [purchasedSlot] }).as('slots')
        cy.intercept('PUT', '**/api/premium/slots/*/assignment', {
            statusCode: 400,
            delay: 600,
            body: { Message: 'Slot changed; review the current assignment before trying again.' }
        }).as('conflict')
        visitSlots()
        cy.contains('button', 'Assign slot').click()
        cy.get('#slot-recipient').type('friend@example.com')
        cy.intercept('GET', '**/api/premium/slots', { body: [{ ...purchasedSlot, recipientEmail: 'new@example.com', assignedUserId: '333', version: 8 }] }).as(
            'slots'
        )
        cy.contains('button', 'Save assignment').click()
        cy.contains('button', 'Saving…').should('be.disabled')
        cy.wait('@conflict')
        cy.get('.modal').should('contain.text', 'Slot changed').and('contain.text', 'Currently: new@example.com')
        cy.intercept('PUT', '**/api/premium/slots/*/assignment', { statusCode: 204 }).as('retry')
        cy.contains('button', 'Save assignment').click()
        cy.wait('@retry').its('request.body').should('deep.equal', { email: 'friend@example.com', version: 8 })
    })

    it('keeps the form and recipient error visible when the email has no account', () => {
        cy.intercept('GET', '**/api/premium/slots', { body: [purchasedSlot] }).as('slots')
        cy.intercept('PUT', '**/api/premium/slots/*/assignment', {
            statusCode: 400,
            body: 'The recipient must first sign in to SkyCofl with that email.',
            headers: { 'content-type': 'text/plain' }
        }).as('invalidRecipient')
        visitSlots()
        cy.contains('button', 'Assign slot').click()
        cy.get('#slot-recipient').type('unknown@example.com')
        cy.contains('button', 'Save assignment').click()
        cy.wait('@invalidRecipient')
        cy.get('.modal [role="alert"]').should('contain.text', 'must first sign in')
        cy.get('#slot-recipient').should('have.value', 'unknown@example.com')
    })

    it('disables assignment for expired slots and shows an empty state only after a successful load', () => {
        cy.intercept('GET', '**/api/premium/slots', { body: [{ ...purchasedSlot, expires: '2020-01-01T00:00:00Z' }] }).as('slots')
        visitSlots()
        cy.contains('button', 'Assign slot').should('be.disabled')
        cy.intercept('GET', '**/api/premium/slots', { statusCode: 503, body: {} }).as('slots')
        cy.contains('button', 'Refresh slots').click()
        cy.wait('@slots')
        cy.contains('Could not load purchased slots').should('be.visible')
        cy.contains('You don’t own any slots yet').should('not.exist')
        cy.intercept('GET', '**/api/premium/slots', { body: [] }).as('slots')
        cy.contains('button', 'Refresh slots').click()
        cy.wait('@slots')
        cy.contains('You don’t own any slots yet').should('be.visible')
    })
})

const slotCatalog = [
    { slug: 'premium-slots', slotTier: 'premium', slotCount: 1, cost: 1800, ownershipSeconds: 2592000 },
    { slug: 'premium-slots-4', slotTier: 'premium', slotCount: 4, cost: 6000, ownershipSeconds: 2592000 },
    { slug: 'premium_plus-slot-weeks', slotTier: 'premium_plus', slotCount: 1, cost: 9000, ownershipSeconds: 2419200 },
    { slug: 'premium_plus-slots-4', slotTier: 'premium_plus', slotCount: 4, cost: 27000, ownershipSeconds: 2419200 },
    { slug: 'l_premium-slots', slotTier: 'premium', slotCount: 1, cost: 1800, ownershipSeconds: 2419200 },
    { slug: 'l_prem_plus-slots', slotTier: 'premium_plus', slotCount: 1, cost: 8500, ownershipSeconds: 2419200 },
    { slug: 'l_premium-slots-4', slotTier: 'premium', slotCount: 4, cost: 7200, ownershipSeconds: 2419200 },
    { slug: 'l_prem_plus-slots-4', slotTier: 'premium_plus', slotCount: 4, cost: 27000, ownershipSeconds: 2419200 }
]

function slotPricing() {
    return {
        products: [['l_premium-slots', 9.69], ['l_prem_plus-slots', 35.69], ['l_premium-slots-4', 29.69], ['l_prem_plus-slots-4', 99.69]].map(([slug, amount]) => ({
            productSlug: slug, providers: [{ providerSlug: 'lemonsqueezy', currencyCode: 'EUR', originalPrice: Number(amount), discountedPrice: Number(amount) }]
        }))
    }
}

describe('Slot packages in the Premium wizard', () => {
    beforeEach(() => {
        cy.intercept('GET', '**/api/premium/country', { body: { country: 'US' } })
        cy.intercept('GET', '**/api/premium/slots/products', { body: slotCatalog }).as('slotProducts')
        cy.intercept('POST', '**/api/topup/rates', request => request.reply({ body: slotPricing() })).as('slotPrices')
        stubProducts()
        stubSubscriptions({ body: [] })
    })

    function visitShop(path = '/premium?slots=true#buyPremium') {
        visitAuthenticatedPage(path)
        cy.contains('Choose the tier your friends will receive.').should('be.visible')
        cy.get(`#buyPremium ${OPTION_TITLE}`).should('have.length', 2)
    }

    function packageButton(count: number) {
        return cy.get('[data-testid="premium-package"]').contains(OPTION_TITLE, count === 0 ? 'Just for me' : count === 1 ? 'One assignable slot' : 'Package of 4')
    }

    function choosePackage(tier = 'Premium+', count = 4, payment = 'CoflCoins') {
        wizardOption(tier === 'Premium+' ? /^Premium Plus$/ : /^Premium$/).click()
        wizardOption(payment).click()
        packageButton(count).click()
    }

    function confirmCoins() {
        cy.contains('button', 'Confirm Google identity').click()
        cy.get('#premium-early-start-declaration').check()
        cy.contains('button', 'Buy now for').click()
    }

    // regression: the wizard only renders after the account loaded, so the browser's hash scroll to #buyPremium ran too early
    it('opens the slot path scrolled to the wizard when the link has the #buyPremium hash', () => {
        cy.viewport(1280, 700)
        visitAuthenticatedPage('/premium?slots=true#buyPremium')
        cy.contains('Choose the tier your friends will receive.').should('be.visible')
        cy.get('[data-testid="premium-wizard"]').should($wizard => {
            const { top, bottom } = $wizard[0].getBoundingClientRect()
            expect(top, 'wizard starts above the bottom edge').to.be.lessThan(700)
            expect(bottom, 'wizard ends below the top edge').to.be.greaterThan(0)
        })
        cy.get(`#buyPremium ${OPTION_TITLE}`).should('have.length', 2)
    })

    it('offers all three packages between payment and duration and skips duration for assignable slots', () => {
        cy.viewport(1280, 1300)
        visitAuthenticatedPage('/premium')
        wizardOption(/^Premium Plus$/).click()
        cy.contains('Step 2 of 5').should('be.visible')
        cy.contains('#buyPremium h3', 'Choose Your Plan Type').should('be.visible')
        cy.get('[data-testid="premium-package"]').should('not.exist')
        wizardOption(/^CoflCoins$/).click()
        cy.contains('Choose Your Package').should('be.visible')
        cy.contains('Step 3 of 5').should('be.visible')
        cy.get('[data-testid="premium-package"] input').should('have.length', 3).and('be.enabled')
        packageButton(0).should('be.visible')
        packageButton(1).closest('label').should('contain.text', '9,000 CoflCoins per slot · 4 weeks')
        packageButton(4).closest('label').should('contain.text', '6,750 CoflCoins per slot · 4 weeks')
        cy.get('[data-testid="slot-offer"]').should('not.exist')
        cy.get('#buyPremium input[placeholder="Select your country"]').should('not.exist')
        cy.contains('#buyPremium h3', 'Choose Your Package').closest('[data-testid="premium-wizard"]').screenshot('package-before-duration')
        packageButton(4).click()
        cy.contains('Step 4 of 4').should('be.visible')
        cy.contains('h3', 'Select Duration').should('not.exist')
        cy.get('[data-testid="slot-offer"]').should('have.length', 1).and('contain.text', '27,000 CoflCoins').and('not.contain.text', 'Subscription')
        cy.get('#buyPremium').screenshot('package-checkout')
        cy.get('#buyPremium').contains('button', 'Back').click()
        packageButton(1).click()
        cy.contains('Step 4 of 4').should('be.visible')
        cy.get('[data-testid="slot-offer"]').should('have.length', 1).and('contain.text', '9,000 CoflCoins')
        cy.get('#buyPremium').contains('button', 'Back').click()
        packageButton(0).click()
        cy.contains('h3', 'Select Duration').should('be.visible')
        cy.contains('Step 4 of 5').should('be.visible')
        wizardOption('4 Weeks').click()
        cy.contains('Step 5 of 5').should('be.visible')
        cy.contains('h3', 'Complete Purchase').should('be.visible')
        cy.get('#buyPremium').contains('button', 'Back').click()
        cy.contains('Step 4 of 5').should('be.visible')
    })

    it('keeps both friends choices selectable with an empty catalog', () => {
        cy.intercept('GET', '**/api/premium/slots/products', { body: [] }).as('slotProducts')
        visitShop()
        wizardOption(/^Premium Plus$/).click()
        wizardOption(/^CoflCoins$/).click()
        cy.get('[data-testid="premium-package"] input').should('have.length', 2).and('be.enabled')
        cy.contains('No slots are currently available').should('not.exist')
        packageButton(4).closest('label').should('contain.text', 'Price unavailable').find('input').should('be.enabled')
        packageButton(4).click()
        cy.contains('This package is currently unavailable').should('be.visible')
        cy.get('[data-testid="slot-offer"]').should('not.exist')
        cy.get('#buyPremium').contains('button', 'Back').click()
        packageButton(0).should('not.exist')
        packageButton(1).click()
        cy.contains('This package is currently unavailable').should('be.visible')
        cy.contains('h3', 'Select Duration').should('not.exist')
    })

    // regression: plan type and duration were <div onClick> cards that keyboard users could not reach
    it('lets keyboard-only users choose the plan type and duration with arrow keys and Continue', () => {
        visitAuthenticatedPage('/premium?tier=premium')
        cy.contains('#buyPremium h3', 'Choose Your Plan Type').should('be.visible')
        cy.get('#buyPremium input[type="radio"]').first().focus()
        cy.press(Cypress.Keyboard.Keys.DOWN)
        cy.get('#buyPremium input[value="coflcoins"]').should('be.checked').and('be.focused')
        cy.press(Cypress.Keyboard.Keys.UP)
        cy.get('#buyPremium input[value="subscription"]').should('be.checked').and('be.focused')
        // arrow keys only select: the visitor stays on the step until Continue
        cy.contains('#buyPremium h3', 'Choose Your Plan Type').should('be.visible')
        cy.contains('Step 1 of 4').should('be.visible')
        cy.press(Cypress.Keyboard.Keys.TAB)
        cy.focused().should('have.text', 'Back')
        cy.press(Cypress.Keyboard.Keys.TAB)
        cy.focused().should('have.text', 'Continue')
        cy.press(Cypress.Keyboard.Keys.SPACE)
        cy.contains('#buyPremium h3', 'Choose Your Package').should('be.focused')
        cy.get('#buyPremium input:checked').should('have.value', '0').focus()
        cy.press(Cypress.Keyboard.Keys.DOWN)
        cy.get('#buyPremium input:checked').should('have.value', '1')
        cy.press(Cypress.Keyboard.Keys.UP)
        cy.get('#buyPremium input:checked').should('have.value', '0')
        cy.contains('#buyPremium h3', 'Choose Your Package').should('be.visible')
        cy.get('#buyPremium').contains('button', 'Continue').focus()
        cy.press(Cypress.Keyboard.Keys.SPACE)
        cy.contains('#buyPremium h3', 'Select Duration').should('be.focused')
        cy.get('#buyPremium').contains('button', 'Continue').should('be.disabled')
        cy.get('#buyPremium input[type="radio"]').first().focus()
        cy.press(Cypress.Keyboard.Keys.DOWN)
        cy.get('#buyPremium input[value="quarter"]').should('be.checked')
        cy.contains('#buyPremium h3', 'Select Duration').should('be.visible')
        cy.get('#buyPremium').contains('button', 'Continue').should('be.enabled').focus()
        cy.press(Cypress.Keyboard.Keys.SPACE)
        cy.contains('#buyPremium h3', 'Complete Purchase').should('be.focused')
        cy.get('#buyPremium [aria-label="Change plan type: Subscription"]').should('be.visible')
        cy.get('#buyPremium [aria-label="Change package: Just for me"]').should('be.visible')
        cy.get('#buyPremium [aria-label="Change duration: Quarterly"]').should('be.visible')
    })

    it('advances on a pointer click and jumps back to a step from its summary chip', () => {
        visitAuthenticatedPage('/premium?tier=premium')
        wizardOption(/^Subscription$/).click()
        cy.contains('#buyPremium h3', 'Choose Your Package').should('be.visible')
        wizardOption('Just for me').click()
        cy.contains('#buyPremium h3', 'Select Duration').should('be.visible')
        wizardOption(/^Yearly$/).click()
        cy.contains('#buyPremium h3', 'Complete Purchase').should('be.visible')
        cy.contains('Step 4 of 4').should('be.visible')
        cy.get('#buyPremium [data-testid="premium-wizard"] > div').first().should('contain.text', 'Premium').and('contain.text', 'Yearly')
        // regression: the total read "96.69 Euro" (number, then the currency name)
        cy.get('#buyPremium').should('contain.text', formatMoney(96.69, 'EUR')).and('not.contain.text', 'Euro')
        cy.get('#buyPremium [aria-label="Change plan type: Subscription"]').click()
        cy.contains('#buyPremium h3', 'Choose Your Plan Type').should('be.focused')
        cy.contains('Step 1 of 4').should('be.visible')
        cy.get('#buyPremium input[value="subscription"]').should('be.checked')
        // coming back, the earlier answers stay and Continue walks forward again
        cy.get('#buyPremium').contains('button', 'Continue').click()
        cy.contains('#buyPremium h3', 'Choose Your Package').should('be.visible')
        cy.get('#buyPremium').contains('button', 'Continue').click()
        cy.contains('#buyPremium h3', 'Select Duration').should('be.visible')
        cy.get('#buyPremium input[value="yearly"]').should('be.checked')
        cy.get('#buyPremium [aria-label="Change package: Just for me"]').click()
        cy.contains('#buyPremium h3', 'Choose Your Package').should('be.visible')
        cy.contains('Step 2 of 4').should('be.visible')
    })

    // regression: a Premium Plus holder asking for Premium kept Premium Plus checked (disabled, "Cannot downgrade") and Continue bought it
    it('never offers the active tier as a choice when an upgrade link asks for a lower tier', () => {
        stubProducts({ body: { premium_plus: { expiresAt: '2099-02-01T00:00:00Z' } } })
        visitAuthenticatedPage('/premium?tier=premium')
        cy.contains('#buyPremium h3', 'Upgrade Your Premium Plus').should('be.visible')
        cy.get('#buyPremium input[type="radio"]').should('have.length', 3).and('be.disabled')
        cy.get('#buyPremium input:checked').should('not.exist')
        cy.get('#buyPremium').contains('label', 'Premium Plus').should('contain.text', 'Cannot downgrade')
        cy.get('#buyPremium').contains('button', 'Continue').should('be.disabled')
    })

    // regression: the Premium Plus row showed the yearly price per month without saying so, and 4-week billing read "per month"
    it('says how the tier prices are billed', () => {
        cy.intercept('GET', '**/api/premium/subscription/providers*', { statusCode: 404, body: {} })
        visitAuthenticatedPage('/premium')
        wizardOption(/^Premium Plus$/).closest('label').should('contain.text', 'Billed every 52 weeks at').and('contain.text', 'every 4 weeks')
        wizardOption(/^Premium Plus$/).closest('label').should('contain.text', '€27.25').and('contain.text', 'per 4 weeks').and('not.contain.text', 'month')
        // Starter is only sold for 52 weeks
        wizardOption(/^Starter$/).closest('label').should('contain.text', 'every 52 weeks only').and('contain.text', '€16.69').and('contain.text', 'per 52 weeks')
    })

    // the card/PayPal wording is the default: Lemon Squeezy's "renews every 52 weeks" only appears once the offer settled on it
    it('does not say a plan renews every 52 weeks while the payment providers are unknown', () => {
        cy.intercept('GET', '**/api/premium/subscription/providers*', { statusCode: 404, body: {}, delay: 2500 }).as('slowProviders')
        visitAuthenticatedPage('/premium')
        wizardOption(/^Premium Plus$/).closest('label').should('contain.text', 'then every 4 weeks until cancelled').and('not.contain.text', 'Billed every 52 weeks')
        cy.wait('@slowProviders')
        wizardOption(/^Premium Plus$/).closest('label').should('contain.text', 'Billed every 52 weeks at')
    })

    // regression: back from the payment provider (back/forward cache) the button stayed disabled on "Redirecting…"
    it('enables the checkout button again when the page comes back from the back/forward cache', () => {
        cy.intercept('POST', '**/api/premium/subscription/l_premium-year*', { statusCode: 200, body: { directLink: 'https://test.lemonsqueezy.com/checkout/premium' } }).as('checkout')
        visitAuthenticatedPage('/premium?tier=premium')
        wizardOption(/^Subscription$/).click()
        wizardOption('Just for me').click()
        wizardOption(/^Yearly$/).click()
        cy.window().then(window => cy.stub(window, 'open').as('checkoutNavigation'))
        confirmDeclaration()
        cy.contains('button', 'Continue to our secure payment processor').click()
        cy.wait('@checkout')
        cy.get('@checkoutNavigation').should('have.been.calledOnce')
        cy.contains('button', 'Redirecting to payment provider...').should('be.disabled').and('have.attr', 'aria-busy', 'true')
        cy.window().then(window => window.dispatchEvent(new window.PageTransitionEvent('pageshow', { persisted: false })))
        cy.contains('button', 'Redirecting to payment provider...').should('be.disabled')
        cy.window().then(window => window.dispatchEvent(new window.PageTransitionEvent('pageshow', { persisted: true })))
        cy.contains('button', 'Continue to our secure payment processor').should('be.enabled').and('not.have.attr', 'aria-busy')
    })

    // regression: upgrading Starter in place added a "Just for me" chip and a Back path through a package step never shown
    it('keeps the steps the visitor saw after upgrading Starter in place at the checkout', () => {
        visitAuthenticatedPage('/premium?tier=starter')
        wizardOption(/^Subscription$/).click()
        cy.contains('#buyPremium h3', 'Select Duration').should('be.visible')
        wizardOption(/^Yearly$/).click()
        cy.contains('#buyPremium h3', 'Complete Purchase').should('be.visible')
        cy.contains('Step 3 of 3').should('be.visible')
        cy.get('#buyPremium').contains('button', 'Upgrade to Premium').click()
        cy.contains('Step 3 of 3').should('be.visible')
        cy.get('#buyPremium [aria-label^="Change package"]').should('not.exist')
        cy.get('#buyPremium [aria-label="Change duration: Yearly"]').should('be.visible')
        cy.get('#buyPremium').contains('button', 'Back').click()
        cy.contains('#buyPremium h3', 'Select Duration').should('be.visible')
        cy.get('#buyPremium').contains('button', 'Back').click()
        cy.contains('#buyPremium h3', 'Choose Your Plan Type').should('be.visible')
        // from the plan type on, the upgraded tier offers its packages again
        cy.get('#buyPremium').contains('button', 'Continue').click()
        cy.contains('#buyPremium h3', 'Choose Your Package').should('be.visible')
    })

    it('hides Back on the first step instead of disabling it and needs a choice before Continue', () => {
        visitAuthenticatedPage('/premium')
        cy.contains('#buyPremium h3', 'Choose Your Premium Tier').should('be.visible')
        cy.contains('Step 1 of 5').should('be.visible')
        cy.get('#buyPremium').contains('button', 'Back').should('not.exist')
        cy.get('#buyPremium').contains('button', 'Continue').should('be.disabled')
        cy.get('#buyPremium input[value="starter"]').focus()
        cy.press(Cypress.Keyboard.Keys.DOWN)
        cy.get('#buyPremium input[value="premium"]').should('be.checked')
        cy.contains('#buyPremium h3', 'Choose Your Premium Tier').should('be.visible')
        cy.get('#buyPremium').contains('button', 'Continue').should('be.enabled').click()
        cy.contains('#buyPremium h3', 'Choose Your Plan Type').should('be.visible')
        cy.get('#buyPremium').contains('button', 'Back').should('be.visible').click()
        cy.get('#buyPremium').contains('button', 'Back').should('not.exist')
        cy.get('#buyPremium input[value="premium"]').should('be.checked')
    })

    it('keeps Starter on its four-step personal flow and skips unsupported slot packages', () => {
        visitAuthenticatedPage('/premium')
        wizardOption(/^Starter$/).click()
        cy.contains('Step 2 of 4').should('be.visible')
        cy.contains('#buyPremium h3', 'Choose Your Plan Type').should('be.visible')
        cy.get('[data-testid="premium-package"]').should('not.exist')
        cy.get('#buyPremium').contains('button', 'Back').click()
        cy.contains('Choose Your Premium Tier').should('be.visible')
        cy.contains('Step 1 of 4').should('be.visible')
    })

    it('opens payment for a preselected tier, then shows packages before duration', () => {
        visitAuthenticatedPage('/premium?tier=premium_plus')
        cy.contains('#buyPremium h3', 'Choose Your Plan Type').should('be.visible')
        // the tier was chosen before the wizard opened, so its step is skipped and not counted
        cy.contains('Step 1 of 4').should('be.visible')
        wizardOption(/^Subscription$/).click()
        cy.contains('Choose Your Package').should('be.visible')
        cy.contains('Step 2 of 4').should('be.visible')
        packageButton(0).should('be.visible')
        cy.get('[data-testid="premium-package"]').should('have.length', 3)
        cy.get('#buyPremium').contains(OPTION_TITLE, 'One assignable slot').should('be.visible')
        packageButton(4).closest('label').should('contain.text', '~€24.92 per slot · every 4 weeks')
    })

    it('makes bundles reachable for an existing subscriber without entering the upgrade dialog', () => {
        stubProducts({ body: { premium_plus: { expiresAt: '2099-02-01T00:00:00Z' } } })
        stubSubscriptions({ body: [activeSubscription] })
        // the "Premium for friends" card is part of the current page; the A/B split of a user agent changes daily
        visitAuthenticatedPage('/premium?premiumVariant=current')
        cy.on('window:before:load', installAuthenticatedWebSocket)
        cy.contains('a', 'Explore slots & bundles').click()
        cy.location('search').should('contain', 'slots=true')
        cy.contains('h2', 'Get slots').should('be.visible')
        cy.get(`#buyPremium ${OPTION_TITLE}`).should('have.length', 2)
        cy.contains('.modal-title', 'Upgrade subscription').should('not.exist')
    })

    for (const [index, slug, count, amount] of [[0, 'l_premium-slots', 1, '9.69'], [1, 'l_prem_plus-slots', 1, '35.69'], [0, 'l_premium-slots-4', 4, '29.69'], [1, 'l_prem_plus-slots-4', 4, '99.69']] as const) {
        it(`reviews and opens the correct ${slug} checkout with assignment as the return destination`, () => {
            cy.intercept('POST', `**/api/premium/subscription/${slug}?*`, request => {
                expect(request.query.assignSlots).to.equal('true')
                expect(request.headers.googletoken).to.equal(googleToken)
                // the Lemon Squeezy checkout carries the early start declaration too
                expect(request.body).to.include({ immediatePerformanceRequested: true, withdrawalConsequenceAcknowledged: true, declarationVersion: 'test-declaration', legalLocale: 'en' })
                expect(request.body.declarationRequestId).to.be.a('string').and.not.be.empty
                request.reply({ statusCode: 200, delay: 500, body: { directLink: 'https://test.lemonsqueezy.com/checkout/slot-bundle' } })
            }).as('slotCheckout')
            visitShop()
            choosePackage(index === 0 ? 'Premium' : 'Premium+', count, 'Subscription')
            cy.get('[data-testid="slot-offer"]').should('contain.text', amount)
            if (count === 1) cy.contains('Same price as a normal subscription.').should('be.visible')
            cy.window().then(window => cy.stub(window, 'open').as('checkoutNavigation'))
            cy.contains('button', 'Continue with subscription').click()
            cy.contains('.modal-title', 'Review your slot subscription').should('be.visible')
            cy.get('.modal').should('contain.text', 'new subscription').and('contain.text', 'assign the slots')
            if (count === 1) cy.get('.modal').should('contain.text', 'Cancel slot subscription').and('contain.text', 'Only this slot subscription')
            cy.get('#slot-subscription-early-start-declaration').should('not.be.checked')
            cy.contains('button', 'Continue to checkout').should('be.disabled')
            confirmDeclaration()
            cy.contains('button', 'Continue to checkout').click()
            cy.contains('button', 'Opening checkout…').should('be.disabled')
            cy.get('#buyPremium').contains('button', 'Back').should('be.disabled')
            cy.wait('@slotCheckout')
            cy.get('@checkoutNavigation').should('have.been.calledOnceWithExactly', 'https://test.lemonsqueezy.com/checkout/slot-bundle', '_self')
            cy.contains('Your 4 slots are ready').should('not.exist')
        })
    }

    describe('creator and discount codes on a slot subscription', () => {
        const checkoutUrl = '**/api/premium/subscription/l_premium-slots-4?*'

        function stubCreatorPricing() {
            cy.intercept('POST', '**/api/topup/rates', request => {
                const discounted = request.body.creatorCode === 'friend'
                request.reply({
                    body: {
                        products: slotPricing().products.map(product => {
                            const original = product.providers[0].originalPrice
                            return {
                                ...product,
                                discountPercent: discounted ? 10 : 0,
                                providers: [{ ...product.providers[0], discountedPrice: discounted ? Math.round(original * 90) / 100 : original }]
                            }
                        })
                    }
                })
            }).as('slotPrices')
        }

        function openReview(path?: string) {
            visitShop(path)
            choosePackage('Premium', 4, 'Subscription')
            cy.contains('button', 'Continue with subscription').click()
            cy.contains('.modal-title', 'Review your slot subscription').should('be.visible')
        }

        function openCodes() {
            cy.get('.modal').contains('button', 'Have a discount or creator code?').click()
        }

        it('sends the creator code and shows the reduced price', () => {
            stubCreatorPricing()
            cy.intercept('POST', checkoutUrl, request => {
                expect(request.query.creatorCode).to.equal('friend')
                expect(request.query.assignSlots).to.equal('true')
                expect(request.query).not.to.have.property('discountcode')
                request.reply({ statusCode: 200, body: { directLink: 'https://test.lemonsqueezy.com/checkout/slot-bundle' } })
            }).as('slotCheckout')
            openReview()
            cy.get('.modal').should('contain.text', '29.69')
            openCodes()
            cy.get('.modal input[placeholder="Enter creator code"]').type('friend')
            cy.get('.modal input[placeholder="Enter creator code"]').closest('div').parent().contains('button', 'Apply').click()
            cy.get('@slotPrices.all').should(calls => expect(calls[calls.length - 1].request.body.creatorCode).to.equal('friend'))
            cy.get('.modal').should('contain.text', '26.72').and('contain.text', 'Creator code applied! You get 10% off').and('contain.text', 'You save')
            cy.window().then(window => cy.stub(window, 'open').as('checkoutNavigation'))
            confirmDeclaration()
            cy.contains('button', 'Continue to checkout').click()
            cy.wait('@slotCheckout')
        })

        it('validates a discount code, shows the discounted price and sends it', () => {
            cy.intercept('GET', '**/api/discount/SAVE20*', { body: { code: 'SAVE20', amount: 20, amountType: 'percent', name: 'Spring', isValid: true, durationInMonths: 0 } }).as('discount')
            cy.intercept('POST', checkoutUrl, request => {
                expect(request.query.discountcode).to.equal('SAVE20')
                expect(request.query).not.to.have.property('creatorCode')
                request.reply({ statusCode: 200, body: { directLink: 'https://test.lemonsqueezy.com/checkout/slot-bundle' } })
            }).as('slotCheckout')
            openReview()
            openCodes()
            cy.get('.modal input[placeholder="Enter discount code"]').type('SAVE20')
            cy.get('.modal input[placeholder="Enter discount code"]').closest('div').parent().contains('button', 'Apply').click()
            cy.wait('@discount')
            cy.get('.modal').should('contain.text', '23.76').and('contain.text', 'Discount code valid!').and('contain.text', 'You save')
            cy.window().then(window => cy.stub(window, 'open').as('checkoutNavigation'))
            confirmDeclaration()
            cy.contains('button', 'Continue to checkout').click()
            cy.wait('@slotCheckout')
        })

        it('prefills and validates the discount code from the page URL', () => {
            cy.intercept('GET', '**/api/discount/SAVE20*', { body: { code: 'SAVE20', amount: 20, amountType: 'percent', name: 'Spring', isValid: true, durationInMonths: 0 } }).as('discount')
            openReview('/premium?slots=true&code=SAVE20#buyPremium')
            cy.wait('@discount')
            cy.get('.modal').should('contain.text', '23.76').and('contain.text', 'Discount code valid!')
            cy.get('.modal input[placeholder="Enter discount code"]').should('have.value', 'SAVE20')
        })

        it('rejects an invalid discount code without changing the price', () => {
            cy.intercept('GET', '**/api/discount/NOPE*', { body: { code: 'NOPE', amount: 0, isValid: false } })
            openReview()
            openCodes()
            cy.get('.modal input[placeholder="Enter discount code"]').type('NOPE')
            cy.get('.modal input[placeholder="Enter discount code"]').closest('div').parent().contains('button', 'Apply').click()
            cy.get('.modal').should('contain.text', 'This discount code is not valid').and('contain.text', '29.69')
        })

        // regression: a creator code the quote failed for blocked every subscription price and could not be removed
        it('drops a creator code the prices cannot be loaded with and keeps the checkout usable', () => {
            cy.intercept('POST', '**/api/topup/rates', request => {
                if (request.body.creatorCode === 'typo') return request.reply({ statusCode: 400, body: { error: 'Invalid or expired creator code' } })
                request.reply({ body: slotPricing() })
            }).as('slotPrices')
            cy.intercept('POST', checkoutUrl, request => {
                expect(request.query).not.to.have.property('creatorCode')
                request.reply({ statusCode: 200, body: { directLink: 'https://test.lemonsqueezy.com/checkout/slot-bundle' } })
            }).as('slotCheckout')
            openReview()
            openCodes()
            cy.get('.modal input[placeholder="Enter creator code"]').type('typo')
            cy.get('.modal input[placeholder="Enter creator code"]').closest('div').parent().contains('button', 'Apply').click()
            cy.get('.modal').should('contain.text', 'The creator code typo could not be applied').and('contain.text', '29.69')
            cy.get('.modal').should('not.contain.text', 'Creator code applied')
            cy.get('[data-testid="slot-offer"]').should('contain.text', '29.69')
            cy.window().then(window => cy.stub(window, 'open').as('checkoutNavigation'))
            confirmDeclaration()
            cy.contains('button', 'Continue to checkout').should('be.enabled').click()
            cy.wait('@slotCheckout')
        })

        // regression: a yearly-only code was accepted (and its discount shown) for a slot subscription that renews every 4 weeks
        it('holds back a yearly-only discount code because slot subscriptions renew every 4 weeks', () => {
            cy.intercept('GET', '**/api/discount/YEARLY20*', { body: { code: 'YEARLY20', amount: 20, amountType: 'percent', name: 'Yearly Deal', isValid: true, durationInMonths: 0 } }).as('discount')
            cy.intercept('POST', checkoutUrl, request => {
                expect(request.query).not.to.have.property('discountcode')
                request.reply({ statusCode: 200, body: { directLink: 'https://test.lemonsqueezy.com/checkout/slot-bundle' } })
            }).as('slotCheckout')
            openReview()
            openCodes()
            cy.get('.modal input[placeholder="Enter discount code"]').type('YEARLY20')
            cy.get('.modal input[placeholder="Enter discount code"]').closest('div').parent().contains('button', 'Apply').click()
            cy.wait('@discount')
            cy.get('.modal').should('contain.text', 'only valid for yearly billing').and('contain.text', '29.69')
            cy.get('.modal').should('not.contain.text', '23.76').and('not.contain.text', 'Switch to yearly')
            cy.window().then(window => cy.stub(window, 'open').as('checkoutNavigation'))
            confirmDeclaration()
            cy.contains('button', 'Continue to checkout').click()
            cy.wait('@slotCheckout')
        })
    })

    it('purchases one four-slot package for 27,000 coins with the existing declaration and identity confirmation', () => {
        cy.intercept('POST', '**/api/service/purchase', request => {
            expect(request.headers.googletoken).to.equal(googleToken)
            expect(request.body).to.include({ slug: 'premium_plus-slots-4', count: 1, immediatePerformanceRequested: true, withdrawalConsequenceAcknowledged: true, declarationVersion: 'test-declaration', legalLocale: 'en' })
            expect(request.body.declarationRequestId).to.be.a('string').and.not.be.empty
            expect(request.body).not.to.have.property('slotIds')
            request.reply({ statusCode: 200 })
        }).as('buySlots')
        visitShop()
        choosePackage()
        cy.get('[data-testid="slot-offer"]').filter(':contains("CoflCoins · pay once")').should('have.length', 1).and('contain.text', '27,000 CoflCoins').and('contain.text', 'Save 25%')
        cy.get('#buyPremium').screenshot('four-slot-coflcoin-bundle')
        cy.contains('button', 'Buy with CoflCoins').click()
        cy.get('.modal').should('contain.text', '4 Premium+ slots').and('contain.text', '4 weeks').and('not.contain.text', 'cannot ordinarily be moved')
        cy.contains('button', 'Buy now for').should('be.disabled')
        confirmCoins()
        cy.wait('@buySlots')
        cy.contains('Your 4 slots are ready').should('be.visible')
        cy.contains('a', 'Assign your slots').should('have.attr', 'href', '/account#purchased-slots')
    })

    it('offers individual slots with their actual durations and purchases the single-slot product', () => {
        cy.intercept('POST', '**/api/service/purchase', { statusCode: 200 }).as('buySlots')
        visitShop()
        choosePackage('Premium', 1)
        cy.get('[data-testid="slot-offer"]').first().should('contain.text', '1,800 CoflCoins').and('contain.text', '30 days')
        cy.get('[data-testid="slot-offer"]').first().contains('button', 'Buy with CoflCoins').click()
        confirmCoins()
        cy.wait('@buySlots').its('request.body').should('include', { slug: 'premium-slots', count: 1 })
        cy.contains('Your slot is ready').should('be.visible')
    })

    it('routes an insufficient balance to top-up instead of attempting a purchase', () => {
        let purchaseAttempts = 0
        cy.intercept('POST', '**/api/service/purchase', request => { purchaseAttempts++; request.reply({ statusCode: 400 }) })
        visitShop()
        choosePackage()
        cy.window().then(window => window.document.dispatchEvent(new CustomEvent('coflCoinRefresh', { detail: { coflCoins: 1000 } })))
        cy.contains('Add 26,000 CoflCoins').should('be.visible')
        cy.contains('button', 'Top up CoflCoins').click()
        cy.get('.modal').should('not.exist')
        cy.then(() => expect(purchaseAttempts).to.equal(0))
    })

    it('blocks subscription checkout when prices fail and allows going back to CoflCoins', () => {
        cy.intercept('POST', '**/api/topup/rates', { statusCode: 503, body: {} }).as('slotPrices')
        visitShop()
        choosePackage('Premium+', 4, 'Subscription')
        cy.contains('Could not load subscription prices').should('be.visible')
        cy.contains('button', 'Continue with subscription').should('be.disabled')
        cy.get('#buyPremium').contains('button', 'Back').click()
        cy.get('#buyPremium').contains('button', 'Back').click()
        wizardOption(/^CoflCoins$/).click()
        packageButton(4).click()
        cy.contains('button', 'Buy with CoflCoins').should('be.enabled')
        cy.contains('button', 'Continue with subscription').should('not.exist')
    })

    // regression: ?tier=premium preselected the tier but still opened the tier step
    it('skips the tier step for a ?tier=premium link and lets Back change the tier', () => {
        visitAuthenticatedPage('/premium?tier=premium')
        cy.contains('#buyPremium h3', 'Choose Your Plan Type').should('be.visible')
        cy.contains('Step 1 of 4').should('be.visible')
        cy.get('#buyPremium').contains('button', 'Back').click()
        cy.contains('Choose Your Premium Tier').should('be.visible')
        cy.contains('Step 1 of 5').should('be.visible')
        wizardOption(/^Premium Plus$/).click()
        cy.contains('Step 2 of 5').should('be.visible')
    })

    it('hides personal access in slot mode for subscriptions and CoflCoins', () => {
        visitShop()
        cy.contains('Step 1 of 4').should('be.visible')
        wizardOption(/^Premium$/).click()
        wizardOption(/^Subscription$/).click()
        cy.get('[data-testid="premium-package"]').should('have.length', 2)
        packageButton(0).should('not.exist')
        packageButton(4).should('be.visible')
        cy.contains('Step 3 of 4').should('be.visible')
        cy.get('#buyPremium').contains(OPTION_TITLE, 'One assignable slot').should('be.visible')
        cy.get('#buyPremium').contains('button', 'Back').click()
        wizardOption(/^CoflCoins$/).click()
        cy.get('[data-testid="premium-package"]').should('have.length', 2)
        packageButton(0).should('not.exist')
        packageButton(4).should('be.visible')
        packageButton(1).click()
        cy.contains('Step 4 of 4').should('be.visible')
        cy.contains('h3', 'Select Duration').should('not.exist')
        cy.get('[data-testid="slot-offer"]').should('contain.text', '1,800 CoflCoins')
    })

    it('preloads the catalog and quotes once and reuses them across steps', () => {
        let catalogs = 0
        let quotes = 0
        cy.intercept('GET', '**/api/premium/slots/products', request => {
            catalogs++
            request.reply({ body: slotCatalog })
        }).as('preloadCatalog')
        cy.intercept('POST', '**/api/topup/rates', request => {
            if (request.body.productSlugs.includes('l_premium-slots-4')) quotes++
            request.reply({ body: slotPricing() })
        }).as('preloadQuotes')
        visitShop()
        cy.wait('@preloadCatalog')
        cy.wait('@preloadQuotes')
        choosePackage('Premium', 4, 'Subscription')
        cy.get('[data-testid="slot-offer"]').should('contain.text', '29.69')
        cy.get('#buyPremium').contains('button', 'Back').click()
        packageButton(4).closest('label').should('contain.text', '~€7.42 per slot')
        cy.contains('#buyPremium h3', 'Choose Your Package').closest('[data-testid="premium-wizard"]').screenshot('subscription-package-options')
        packageButton(4).click()
        cy.contains('Renews automatically. Cancel anytime.').trigger('mouseover')
        cy.get('[role="tooltip"]').should('contain.text', 'account page').and('contain.text', 'time you have already paid for')
        cy.then(() => { expect(catalogs).to.equal(1); expect(quotes).to.equal(1) })
    })

    it('purchases four Premium slots for 6,000 CoflCoins and shows their per-slot cost', () => {
        cy.intercept('POST', '**/api/service/purchase', { statusCode: 200 }).as('buySlots')
        visitShop()
        wizardOption(/^Premium$/).click()
        wizardOption(/^CoflCoins$/).click()
        packageButton(4).closest('label').should('contain.text', '1,500 CoflCoins per slot · 30 days')
        packageButton(4).click()
        cy.get('[data-testid="slot-offer"]').should('contain.text', '6,000 CoflCoins').and('contain.text', '1,500 CoflCoins')
        cy.contains('button', 'Buy with CoflCoins').click()
        cy.get('.modal').should('contain.text', '4 Premium slots').and('contain.text', '30 days')
        confirmCoins()
        cy.wait('@buySlots').its('request.body').should('include', { slug: 'premium-slots-4', count: 1 })
        cy.contains('Your 4 slots are ready').should('be.visible')
    })

    it('recovers from catalog errors and does not show invented offers', () => {
        cy.intercept('GET', '**/api/premium/slots/products', { statusCode: 503, body: {} }).as('slotProducts')
        visitShop()
        choosePackage()
        cy.contains('Could not load slot options').should('be.visible')
        cy.get('[data-testid="slot-offer"]').should('not.exist')
        cy.intercept('GET', '**/api/premium/slots/products', { body: slotCatalog }).as('slotProducts')
        cy.contains('button', 'Try again').click()
        cy.get('[data-testid="slot-offer"]').should('have.length', 1)
    })

    it('does not keep old tax-inclusive prices available while another country is loading', () => {
        cy.intercept('POST', '**/api/topup/rates', request => {
            request.reply({ body: slotPricing(), delay: request.body.countryCode === 'DE' ? 1000 : 0 })
        })
        visitShop()
        choosePackage('Premium', 4, 'Subscription')
        cy.contains('button', 'Continue with subscription').should('be.enabled')
        cy.get('#buyPremium input[placeholder="Select your country"]').click().type('Germany')
        cy.get('.rbt-menu').contains('Germany').click()
        cy.contains('button', 'Continue with subscription').should('be.disabled')
        cy.get('[data-testid="slot-offer"]').should('not.contain.text', '29.69')
        cy.get('#buyPremium input[placeholder="Select your country"]').clear().type('France')
        cy.get('.rbt-menu').contains('France').click()
        cy.get('[data-testid="slot-offer"]').should('contain.text', '35.63')
        cy.contains('button', 'Continue with subscription').should('be.enabled')
        cy.get('#buyPremium').contains('button', 'Back').click()
        packageButton(4).closest('label').should('contain.text', '~€8.91 per slot')
    })

    it('keeps the cards usable on a phone and confirms price changes when the country changes', () => {
        cy.viewport(390, 844)
        visitShop()
        choosePackage('Premium', 4, 'Subscription')
        cy.get('[data-testid="slot-offer"]').first().should('contain.text', '29.69')
        cy.get('#buyPremium input[placeholder="Select your country"]').click().type('Germany')
        cy.get('.rbt-menu').contains('Germany').click()
        cy.get('[data-testid="slot-offer"]').first().should('contain.text', '35.33')
        cy.get('#buyPremium').contains('button', 'Back').click()
        packageButton(4).closest('label').should('contain.text', '~€8.83 per slot · every 4 weeks')
        cy.document().then(document => expect(document.documentElement.scrollWidth).to.be.at.most(390))
        packageButton(4).click()
        cy.get('[data-testid="slot-offer"]').first().should('contain.text', '35.33')
        cy.contains('button', 'Continue with subscription').click()
        cy.get('.modal').should('contain.text', '35.33').and('contain.text', 'Includes estimated tax')
        cy.get('.modal').contains('button', 'Back').click()
        cy.document().then(document => expect(document.documentElement.scrollWidth).to.be.at.most(390))
        cy.get('[data-testid="slot-offer"]').first().scrollIntoView()
        cy.screenshot('slot-bundles-mobile', { capture: 'viewport', blackout: ['#nprogress'] })
    })
})

describe('Discount codes at the subscription checkout', () => {
    const save20 = { code: 'SAVE20', amount: 20, amountType: 'percent', name: 'Spring', isValid: true, durationInMonths: 0 }
    const yearly20 = { code: 'YEARLY20', amount: 20, amountType: 'percent', name: 'Yearly Deal', isValid: true, durationInMonths: 0 }

    beforeEach(() => {
        cy.intercept('GET', '**/api/premium/country', { body: { country: 'US' } })
        cy.intercept('POST', '**/api/topup/rates', {
            body: {
                products: [['l_premium', 9.69], ['l_premium-year', 96.69]].map(([slug, amount]) => ({
                    productSlug: slug,
                    discountPercent: 0,
                    providers: [{ providerSlug: 'lemonsqueezy', currencyCode: 'EUR', originalPrice: Number(amount), discountedPrice: Number(amount) }]
                }))
            }
        })
        cy.intercept('GET', '**/api/discount/SAVE20*', { body: save20 }).as('save20')
        cy.intercept('GET', '**/api/discount/YEARLY20*', { body: yearly20 }).as('yearly20')
        stubProducts()
        stubSubscriptions({ body: [] })
    })

    function openCheckout(duration: '4 weeks' | 'Yearly', path = '/premium?tier=premium') {
        visitAuthenticatedPage(path)
        wizardOption(/^Subscription$/).click()
        wizardOption('Just for me').click()
        wizardOption(new RegExp(`^${duration}$`)).click()
        cy.contains('#buyPremium h3', 'Complete Purchase').should('be.visible')
    }

    function discountInput() {
        return cy.get('#buyPremium input[placeholder="Enter discount code"]')
    }

    function discountAction(label: 'Apply' | 'Clear') {
        return discountInput().closest('div').parent().contains('button', label)
    }

    function applyDiscount(code: string) {
        cy.get('#buyPremium').contains('button', 'Have a discount or creator code?').click()
        discountInput().type(code)
        discountAction('Apply').click()
    }

    it('applies a valid code to the price and sends it with the checkout', () => {
        cy.intercept('POST', /\/api\/premium\/subscription\/l_premium\?/, request => {
            expect(request.query.discountcode).to.equal('SAVE20')
            // the Lemon Squeezy checkout is requested as before
            expect(request.query).not.to.have.property('provider')
            request.reply({ statusCode: 200, body: { directLink: 'https://test.lemonsqueezy.com/checkout/premium' } })
        }).as('checkout')
        openCheckout('4 weeks')
        applyDiscount('SAVE20')
        cy.wait('@save20')
        cy.get('#buyPremium').should('contain.text', 'Discount code valid!').and('contain.text', '7.76')
        cy.window().then(window => cy.stub(window, 'open').as('checkoutNavigation'))
        confirmDeclaration()
        cy.contains('button', 'Continue to our secure payment processor').click()
        cy.wait('@checkout')
    })

    it('holds a yearly-only code back on monthly billing until the visitor opts in, and clears it again', () => {
        openCheckout('4 weeks')
        applyDiscount('YEARLY20')
        cy.wait('@yearly20')
        cy.get('#buyPremium').should('contain.text', 'only valid for yearly billing').and('not.contain.text', 'Discount code valid!')
        cy.get('#buyPremium').contains('button', 'Switch to yearly and apply discount').click()
        cy.get('#buyPremium').should('contain.text', 'Discount code valid!').and('not.contain.text', 'only valid for yearly billing')
        cy.get('#buyPremium [aria-label="Change duration: Yearly"]').should('be.visible')
        discountAction('Clear').click()
        discountInput().should('have.value', '')
        cy.get('#buyPremium').should('not.contain.text', 'Discount code valid!')
        discountAction('Apply').should('be.disabled')
    })

    // regression: the switch only changed the code check, the price and the checkout stayed monthly and sent the yearly-only code
    it('bills yearly after switching to yearly for a yearly-only code', () => {
        cy.intercept('POST', '**/api/premium/subscription/l_premium*', request => {
            request.reply({ statusCode: 200, body: { directLink: 'https://test.lemonsqueezy.com/checkout/premium' } })
        }).as('checkout')
        openCheckout('4 weeks')
        applyDiscount('YEARLY20')
        cy.wait('@yearly20')
        cy.get('#buyPremium').contains('button', 'Switch to yearly and apply discount').click()
        cy.get('#buyPremium').should('contain.text', 'Renews every 52 weeks').and('contain.text', 'per 52 weeks').and('not.contain.text', 'per 4 weeks')
        cy.get('#buyPremium').should('contain.text', formatMoney(77.36, 'EUR')).and('contain.text', formatMoney(96.69, 'EUR'))
        cy.window().then(window => cy.stub(window, 'open').as('checkoutNavigation'))
        confirmDeclaration()
        cy.contains('button', 'Continue to our secure payment processor').click()
        cy.wait('@checkout').then(({ request }) => {
            expect(new URL(request.url).pathname).to.match(/\/l_premium-year$/)
            expect(request.query.discountcode).to.equal('YEARLY20')
        })
    })

    it('accepts a yearly-only code on yearly billing', () => {
        openCheckout('Yearly')
        applyDiscount('YEARLY20')
        cy.wait('@yearly20')
        cy.get('#buyPremium').should('contain.text', 'Discount code valid!').and('not.contain.text', 'only valid for yearly billing')
    })

    it('prefills and validates the code from the page URL', () => {
        openCheckout('4 weeks', '/premium?tier=premium&code=SAVE20')
        cy.wait('@save20')
        discountInput().should('have.value', 'SAVE20')
        cy.get('#buyPremium').should('contain.text', 'Discount code valid!').and('contain.text', '7.76')
    })
})

const blackFriday = {
    code: 'BF2026',
    name: 'Black Friday',
    amountType: 'percent',
    amount: 50,
    periodAmounts: { 4: 25, 13: 50, 52: 50 },
    duration: 'once',
    startsAt: '2026-11-01T00:00:00Z',
    expiresAt: '2099-11-30T23:59:59Z',
    providers: ['stripe', 'paypal']
}
const blackFridayCode = { ...blackFriday, isValid: true, isLimitedToProducts: false, isSubscriptionOnly: true, durationInMonths: 0 }
const directProviders = [{ provider: 'stripe', mode: 'direct' }, { provider: 'paypal', mode: 'direct' }]

function stubProviders(body: unknown, statusCode = 200) {
    cy.intercept('GET', '**/api/premium/subscription/providers*', { statusCode, body }).as('providers')
}

function stubPromotion() {
    cy.intercept('GET', '**/api/premium/discount/auto*', { body: blackFriday }).as('promotion')
    cy.intercept('GET', '**/api/discount/BF2026*', { body: blackFridayCode }).as('promotionCode')
}

describe('Stripe and PayPal checkout with the automatic promotion', () => {
    beforeEach(() => {
        setTimeZone('Europe/Berlin')
        cy.intercept('GET', '**/api/premium/country', { body: { country: 'US' } })
        cy.intercept('POST', '**/api/topup/rates', {
            body: {
                products: [['l_premium', 9.69], ['l_premium-quarter', 27.69], ['l_premium-year', 96.69]].map(([slug, amount]) => ({
                    productSlug: slug,
                    discountPercent: 0,
                    providers: [{ providerSlug: 'lemonsqueezy', currencyCode: 'EUR', originalPrice: Number(amount), discountedPrice: Number(amount) }]
                }))
            }
        })
        stubProducts()
        stubSubscriptions({ body: [] })
    })

    afterEach(() => {
        setTimeZone('')
    })

    function openDurations() {
        visitAuthenticatedPage('/premium?tier=premium')
        wizardOption(/^Subscription$/).click()
        wizardOption('Just for me').click()
        cy.contains('#buyPremium h3', 'Select Duration').should('be.visible')
    }

    function openCheckout(duration: '4 weeks' | 'Yearly') {
        openDurations()
        wizardOption(new RegExp(`^${duration}$`)).click()
        cy.contains('#buyPremium h3', 'Complete Purchase').should('be.visible')
    }

    function durationRow(title: string) {
        return wizardOption(new RegExp(`^${title}$`)).closest('label')
    }

    function stubCheckout(slug: string) {
        cy.intercept('POST', new RegExp(`/api/premium/subscription/${slug}(\\?|$)`), {
            statusCode: 200, body: { directLink: 'https://checkout.stripe.com/c/pay/test' }
        }).as('checkout')
        cy.window().then(window => cy.stub(window, 'open').as('checkoutNavigation'))
    }

    it('offers card and PayPal and opens the chosen provider for the buyer country', () => {
        stubProviders(directProviders)
        openCheckout('4 weeks')
        cy.get('@providers.all').should(calls => {
            expect(calls.map(call => (call as unknown as { request: { query: object } }).request.query)).to.deep.include({ country: 'US', productSlug: 'l_premium' })
        })
        cy.contains('button', 'Continue to our secure payment processor').should('not.exist')
        cy.get('[data-testid="checkout-payment"] button').should('have.length', 2)
        cy.get('[data-testid="checkout-payment"]').should('contain.text', 'Secure checkout by Stripe')
        cy.get('#buyPremium').screenshot('checkout-provider-buttons')
        stubCheckout('l_premium')
        confirmDeclaration()
        cy.get('button[aria-label="Pay with PayPal"]').click()
        cy.wait('@checkout').its('request.query').should('deep.equal', { provider: 'paypal', country: 'US' })
        cy.get('@checkoutNavigation').should('have.been.calledOnceWithExactly', 'https://checkout.stripe.com/c/pay/test', '_self')
        cy.contains('button', 'Redirecting to PayPal...').should('be.disabled').and('have.attr', 'aria-busy', 'true')
        cy.contains('button', 'Pay with card').should('be.disabled')
        // back from PayPal (back/forward cache) both buttons work again
        cy.window().then(window => window.dispatchEvent(new window.PageTransitionEvent('pageshow', { persisted: true })))
        confirmDeclaration()
        cy.contains('button', 'Pay with card').should('be.enabled').click()
        cy.wait('@checkout').its('request.query').should('deep.include', { provider: 'stripe', country: 'US' })
    })

    it('keeps the single Lemon Squeezy button when the providers cannot be loaded', () => {
        stubProviders({}, 404)
        stubPromotion()
        openCheckout('4 weeks')
        cy.wait('@providers')
        cy.contains('button', 'Pay with card').should('not.exist')
        cy.get('button[aria-label="Pay with PayPal"]').should('not.exist')
        cy.get('[data-testid="promotion-note"]').should('not.exist')
        cy.get('#buyPremium input[placeholder="Enter discount code"]').should('have.value', '')
        stubCheckout('l_premium')
        confirmDeclaration()
        cy.contains('button', 'Continue to our secure payment processor').click()
        cy.wait('@checkout').its('request.query').should('not.have.any.keys', 'provider', 'country', 'discountcode')
    })

    it('shows the promotion per billing period and applies its code at the card checkout', () => {
        stubProviders(directProviders)
        stubPromotion()
        openDurations()
        // regression: the end was formatted in UTC; a Berlin visitor's offer runs until 00:59 on December 1
        cy.get('[data-testid="promotion-note"]').invoke('text').should('match', /^Black Friday: up to 50% off your first payment\. Offer ends December 1, 12:59\sAM GMT\+1\./)
        durationRow('4 weeks').should('contain.text', '-25%').find('s').should('have.text', '~€9.69')
        // regression: the badge sat beside the title and wrapped onto its own line next to "Recommended"; it belongs to the price
        for (const [title, badge] of [['4 weeks', '-25%'], ['Quarterly', '-50%'], ['Yearly', '-50%']]) {
            durationRow(title).contains('span', badge).parent().find('s').should('exist')
        }
        // regression: prices read "per month" for 4-week periods; 13 and 52 weeks are spread over 4-week periods with their total
        durationRow('4 weeks').should('contain.text', '~€7.27').and('contain.text', 'per 4 weeks, first 4 weeks')
        durationRow('Quarterly').should('contain.text', '-50%').and('contain.text', '~€4.26').and('contain.text', '€13.84 for the first 13 weeks, then €9.69 every 4 weeks').find('s').should('have.text', '~€8.52')
        durationRow('Yearly').should('contain.text', '-50%').and('contain.text', '~€3.72').and('contain.text', '€48.34 for the first year, then €9.69 every 4 weeks').find('s').should('have.text', '~€7.44')
        cy.get('#buyPremium').should('not.contain.text', 'month')
        cy.get('#buyPremium').screenshot('promotion-durations')
        wizardOption(/^Yearly$/).click()
        cy.wait('@promotionCode').its('request.query').should('deep.equal', { isSubscription: 'true', provider: 'stripe' })
        cy.get('#buyPremium input[placeholder="Enter discount code"]').should('have.value', 'BF2026')
        cy.get('#buyPremium').should('contain.text', 'Discount code valid!').and('contain.text', 'Black Friday: 50% off the first year')
        cy.get('#buyPremium').should('contain.text', formatMoney(48.34, 'EUR'))
        cy.get('#buyPremium s').should('contain.text', formatMoney(96.69, 'EUR'))
        // a code for the first payment only does not touch the renewal: the 4-week plan's full price, no matter how long the first term is
        cy.get('#buyPremium').should('contain.text', '€48.34 for the first 52 weeks, then €9.69 every 4 weeks. Cancel anytime.').and('contain.text', 'per 52 weeks')
        cy.get('#buyPremium').should('contain.text', '52 weeks, then every 4 weeks until cancelled').and('not.contain.text', 'Renews every 52 weeks')
        cy.get('[data-testid="promotion-note"]').invoke('text').should('match', /50% off your first payment \(the first year\)\. Offer ends December 1, 12:59\sAM GMT\+1\./)
        cy.get('#buyPremium').screenshot('promotion-checkout')
        // back and forward again: the promotion is already loaded and still applied
        cy.get('#buyPremium').contains('button', 'Back').click()
        wizardOption(/^Yearly$/).click()
        cy.get('#buyPremium input[placeholder="Enter discount code"]').should('have.value', 'BF2026')
        cy.get('#buyPremium').should('contain.text', formatMoney(48.34, 'EUR'))
        stubCheckout('l_premium-year')
        confirmDeclaration()
        cy.contains('button', 'Pay with card').click()
        cy.wait('@checkout').its('request.query').should('deep.equal', { discountcode: 'BF2026', provider: 'stripe', country: 'US' })
    })

    const forever13 = { code: 'FOREVER13', name: 'Loyal', amountType: 'percent', amount: 25, periodAmounts: { 4: 10, 13: 25, 52: 25 }, duration: 'forever', isValid: true, durationInMonths: 0 }

    // the renewal is the 4-week plan (9.69) with the code's 4-week percent (10), not the 13-week plan with the 13-week percent
    it('continues a 13 week plan with a forever code every 4 weeks at the discounted 4-week price', () => {
        cy.intercept('GET', '**/api/discount/FOREVER13*', { body: forever13 }).as('forever')
        stubProviders(directProviders)
        openDurations()
        wizardOption(/^Quarterly$/).click()
        cy.contains('#buyPremium h3', 'Complete Purchase').should('be.visible')
        cy.get('#buyPremium').contains('button', 'Have a discount or creator code?').click()
        discountInput().type('FOREVER13')
        discountInput().closest('div').parent().contains('button', 'Apply').click()
        cy.wait('@forever')
        cy.get('#buyPremium').should('contain.text', 'Discount code valid!').and('contain.text', formatMoney(20.77, 'EUR'))
        cy.get('#buyPremium').should('contain.text', '13 weeks, then every 4 weeks until cancelled')
        cy.get('#buyPremium').should('contain.text', `Then ${formatMoney(8.72, 'EUR')} every 4 weeks after the first 13 weeks, until cancelled. Cancel anytime.`)
        cy.get('#buyPremium').should('not.contain.text', 'Renews every 13 weeks').and('not.contain.text', 'every 13 weeks')
    })

    it('continues a 52 week plan without a code every 4 weeks at the 4-week price', () => {
        stubProviders(directProviders)
        openCheckout('Yearly')
        cy.get('#buyPremium').should('contain.text', `Then ${formatMoney(9.69, 'EUR')} every 4 weeks after the first 52 weeks, until cancelled. Cancel anytime.`)
        cy.get('#buyPremium').should('not.contain.text', 'every 52 weeks')
    })

    // the upsell names what the applied code saves on Premium+ at the same billing period and provider
    it('names what a first payment code saves on the Premium+ upgrade of a yearly checkout', () => {
        const prices: Record<string, number> = { l_premium: 9.69, 'l_premium-year': 96.69, 'l_prem_plus-year': 354.2 }
        cy.intercept('POST', '**/api/topup/rates', request => {
            request.reply({
                body: {
                    products: (request.body.productSlugs as string[]).map(slug => ({
                        productSlug: slug, discountPercent: 0,
                        providers: [{ providerSlug: 'lemonsqueezy', currencyCode: 'EUR', originalPrice: prices[slug], discountedPrice: prices[slug] }]
                    }))
                }
            })
        })
        cy.intercept('GET', '**/api/discount/TEST90*', {
            body: { code: 'TEST90', amount: 90, amountType: 'percent', duration: 'once', isValid: true, isLimitedToProducts: false, isSubscriptionOnly: true, durationInMonths: 0 }
        })
        stubProviders(directProviders)
        visitAuthenticatedPage('/premium?tier=premium&code=TEST90')
        wizardOption(/^Subscription$/).click()
        wizardOption('Just for me').click()
        wizardOption(/^Yearly$/).click()
        cy.contains('#buyPremium h3', 'Complete Purchase').should('be.visible')
        cy.get('[data-testid="upsell-code-savings"]').should(
            'have.text',
            `With TEST90: ${formatMoney(35.42, 'EUR')} for the first 52 weeks instead of ${formatMoney(354.2, 'EUR')} (you save ${formatMoney(318.78, 'EUR')})`
        )
        // the bullets are the /premium plan card's features of the tier the upgrade adds
        cy.get('#buyPremium').should('contain.text', BAZAAR_ARCHIVE_BULLET)
        cy.get('#buyPremium').should('contain.text', 'In-game lowball helper').and('not.contain.text', 'Up to 1s slower')
    })

    const test90Code = { code: 'TEST90', amount: 90, amountType: 'percent', duration: 'once', isValid: true, isLimitedToProducts: false, isSubscriptionOnly: true, durationInMonths: 0 }

    /** quotes with the creator code `friend` taking 10% off */
    function stubUpgradeRates(extra: Record<string, number> = {}) {
        const prices: Record<string, number> = { l_premium: 9.69, 'l_premium-year': 96.69, 'l_prem_plus-year': 354.2, ...extra }
        cy.intercept('POST', '**/api/topup/rates', request => {
            const creator = request.body.creatorCode === 'friend'
            request.reply({
                body: {
                    products: (request.body.productSlugs as string[]).map(slug => ({
                        productSlug: slug, discountPercent: creator ? 10 : 0,
                        providers: [{ providerSlug: 'lemonsqueezy', currencyCode: 'EUR', originalPrice: prices[slug], discountedPrice: creator ? Math.round(prices[slug] * 90) / 100 : prices[slug] }]
                    }))
                }
            })
        })
    }

    function openYearlyPremium(path = '/premium?tier=premium') {
        visitAuthenticatedPage(path)
        wizardOption(/^Subscription$/).click()
        wizardOption('Just for me').click()
        wizardOption(/^Yearly$/).click()
        cy.contains('#buyPremium h3', 'Complete Purchase').should('be.visible')
    }

    // regression: the upgrade remounted the checkout, a code typed in (not from the link) and the creator code were lost
    it('carries a typed discount code and the creator code into the upgraded checkout', () => {
        stubUpgradeRates()
        cy.intercept('GET', '**/api/discount/TEST90*', { body: test90Code }).as('test90')
        stubProviders(directProviders)
        openYearlyPremium()
        cy.get('#buyPremium').contains('button', 'Have a discount or creator code?').click()
        cy.get('#buyPremium input[placeholder="Enter creator code"]').type('friend')
        cy.get('#buyPremium input[placeholder="Enter creator code"]').closest('div').parent().contains('button', 'Apply').click()
        cy.get('#buyPremium').should('contain.text', 'Creator code applied')
        discountInput().type('TEST90')
        discountInput().closest('div').parent().contains('button', 'Apply').click()
        cy.wait('@test90')
        // regression: the full price was stated twice, above and inside the code's savings line
        cy.get('[data-testid="upsell-price"]').should('not.exist')
        cy.get('[data-testid="upsell-code-savings"]').should('have.text', `With TEST90: ${formatMoney(31.88, 'EUR')} for the first 52 weeks instead of ${formatMoney(318.78, 'EUR')} (you save ${formatMoney(286.9, 'EUR')})`)
        cy.get('#buyPremium').contains('button', 'Upgrade to Premium Plus').click()
        cy.get('#buyPremium').should('contain.text', 'Creator code applied').and('contain.text', 'Discount code valid!')
        discountInput().should('have.value', 'TEST90')
        // the price is the panel's: 10% creator code, then the 90% code on the first term
        cy.get('#buyPremium').should('contain.text', formatMoney(31.88, 'EUR')).and('contain.text', '-10%').and('contain.text', '-90%')
    })

    it('offers the next tier with its price on a checkout without any code', () => {
        stubUpgradeRates()
        stubProviders(directProviders)
        openYearlyPremium()
        cy.get('[data-testid="upsell-price"]').should('have.text', `${formatMoney(354.2, 'EUR')} for the first 52 weeks, then every 4 weeks`)
        cy.get('[data-testid="upsell-code-savings"]').should('not.exist')
        cy.get('#buyPremium').should('contain.text', 'Step up to Premium Plus').and('contain.text', BAZAAR_ARCHIVE_BULLET)
        // the lower tier says it includes the one below, from its plan card
        cy.get('#buyPremium').should('contain.text', 'All Starter features plus advanced tools:')
    })

    // regression: opening slots in place kept the personal plan's choices, the slot heading sat over a personal checkout with pay buttons
    it('starts the slot flow fresh when slots are opened from a personal checkout', () => {
        stubUpgradeRates()
        stubProviders(directProviders)
        openYearlyPremium()
        cy.get('[data-testid="checkout-payment"]').should('exist')
        cy.contains('a', 'Explore Slots and Bundles').click()
        cy.contains('Choose the tier your friends will receive.').should('be.visible')
        cy.get('[data-testid="checkout-payment"]').should('not.exist')
        cy.contains('#buyPremium h3', 'Complete Purchase').should('not.exist')
    })

    // regression: the upsell said "per 52 weeks" although card and PayPal plans continue every 4 weeks; Lemon Squeezy renews every 52 weeks
    function openYearlyStarter(path: string) {
        visitAuthenticatedPage(path)
        wizardOption(/^Subscription$/).click()
        wizardOption(/^Yearly$/).click()
        cy.contains('#buyPremium h3', 'Complete Purchase').should('be.visible')
    }

    const starterPrices = { 'l_starter_premium-year': 16.69, l_starter_premium: 2.69 }

    // regression: the second upgrade passed "no preference" and the link's code came back on Premium+
    it('keeps a cleared link code cleared through two upgrades', () => {
        stubUpgradeRates(starterPrices)
        cy.intercept('GET', '**/api/discount/TEST90*', { body: test90Code }).as('test90')
        stubProviders(directProviders)
        openYearlyStarter('/premium?tier=starter&code=TEST90')
        cy.wait('@test90')
        cy.get('#buyPremium').should('contain.text', 'Discount code valid!')
        discountInput().closest('div').parent().contains('button', 'Clear').click()
        cy.get('#buyPremium').contains('button', /^Upgrade to Premium$/).click()
        discountInput().should('have.value', '')
        cy.get('#buyPremium').contains('button', 'Upgrade to Premium Plus').click()
        discountInput().should('have.value', '')
        cy.get('#buyPremium').should('not.contain.text', 'Discount code valid!')
    })

    // regression: the remounted checkout applied the running promotion again after the buyer cleared it
    it('keeps a cleared automatic promotion cleared after an upgrade', () => {
        stubUpgradeRates()
        stubPromotion()
        stubProviders(directProviders)
        openYearlyPremium()
        cy.wait('@promotionCode')
        cy.get('#buyPremium').should('contain.text', 'Discount code valid!')
        discountInput().closest('div').parent().contains('button', 'Clear').click()
        cy.get('#buyPremium').contains('button', 'Upgrade to Premium Plus').click()
        cy.contains('#buyPremium', 'Premium Plus').should('be.visible')
        // give the remounted checkout the time to apply the promotion again, were it going to
        cy.wait(1500)
        discountInput().should('have.value', '')
        cy.get('#buyPremium').should('not.contain.text', 'Discount code valid!')
        cy.get('@promotionCode.all').should('have.length', 1)
    })

    // regression: an upgrade while the link's code was still being checked dropped it
    it('carries a link code that is still being checked into the upgraded checkout', () => {
        stubUpgradeRates()
        cy.intercept('GET', '**/api/discount/TEST90*', { body: test90Code, delay: 2500 }).as('test90')
        stubProviders(directProviders)
        openYearlyPremium('/premium?tier=premium&code=TEST90')
        cy.get('#buyPremium').should('not.contain.text', 'Discount code valid!')
        cy.get('#buyPremium').contains('button', 'Upgrade to Premium Plus').click()
        discountInput().should('have.value', 'TEST90')
        cy.get('#buyPremium', { timeout: 10000 }).should('contain.text', 'Discount code valid!')
    })

    // regression: the next tier's quote kept the carried creator code after the main quote had dropped it
    it('quotes the next tier without a creator code whose quote failed after the upgrade', () => {
        const prices: Record<string, number> = { ...starterPrices, 'l_premium-year': 96.69, 'l_prem_plus-year': 354.2 }
        cy.intercept('POST', '**/api/topup/rates', request => {
            const slugs = request.body.productSlugs as string[]
            const creator = request.body.creatorCode === 'friend'
            if (creator && slugs.includes('l_premium-year')) return request.reply({ statusCode: 400, body: { error: 'Invalid or expired creator code' } })
            request.reply({
                body: {
                    products: slugs.map(slug => ({
                        productSlug: slug, discountPercent: creator ? 10 : 0,
                        providers: [{ providerSlug: 'lemonsqueezy', currencyCode: 'EUR', originalPrice: prices[slug], discountedPrice: creator ? Math.round(prices[slug] * 90) / 100 : prices[slug] }]
                    }))
                }
            })
        })
        stubProviders(directProviders)
        openYearlyStarter('/premium?tier=starter')
        cy.get('#buyPremium').contains('button', 'Have a discount or creator code?').click()
        cy.get('#buyPremium input[placeholder="Enter creator code"]').type('friend')
        cy.get('#buyPremium input[placeholder="Enter creator code"]').closest('div').parent().contains('button', 'Apply').click()
        cy.get('#buyPremium').should('contain.text', 'Creator code applied')
        cy.get('#buyPremium').contains('button', /^Upgrade to Premium$/).click()
        cy.get('#buyPremium').should('contain.text', 'Failed to load pricing information')
        cy.get('[data-testid="upsell-price"]').should('have.text', `${formatMoney(354.2, 'EUR')} for the first 52 weeks, then every 4 weeks`)
    })

    it('keeps "per 52 weeks" on the upsell price while only Lemon Squeezy takes payments', () => {
        stubUpgradeRates()
        stubProviders({}, 404)
        openYearlyPremium()
        cy.get('[data-testid="upsell-price"]').should('contain.text', 'per 52 weeks').and('not.contain.text', 'for the first')
    })

    // regression: Premium's 3 months matched the "3 weeks" option of Premium+ by its raw value, 8,100 CoflCoins for 3 weeks
    it('offers the 11 week Premium+ option next to 3 months of Premium paid with CoflCoins, and preselects it', () => {
        stubUpgradeRates()
        visitAuthenticatedPage('/premium?tier=premium')
        wizardOption(/^CoflCoins$/).click()
        wizardOption('Just for me').click()
        wizardOption(/^3 Months$/).click()
        cy.contains('#buyPremium h3', 'Complete Purchase').should('be.visible')
        cy.get('[data-testid="upsell-price"]').should('have.text', '21,600 CoflCoins for 11 weeks, paid once')
        cy.get('#buyPremium').contains('button', 'Upgrade to Premium Plus').click()
        cy.get('#buyPremium').should('contain.text', '11 weeks').and('not.contain.text', '3 weeks')
        cy.get('[data-testid="upsell-price"]').should('not.exist')
    })

    // regression: an upgrade brought the link's code back after the buyer cleared it
    it('does not bring back a code from the link that the buyer cleared before upgrading', () => {
        stubUpgradeRates()
        cy.intercept('GET', '**/api/discount/TEST90*', { body: test90Code }).as('test90')
        stubProviders(directProviders)
        openYearlyPremium('/premium?tier=premium&code=TEST90')
        cy.wait('@test90')
        cy.get('#buyPremium').should('contain.text', 'Discount code valid!')
        discountInput().closest('div').parent().contains('button', 'Clear').click()
        cy.get('#buyPremium').should('not.contain.text', 'Discount code valid!')
        cy.get('#buyPremium').contains('button', 'Upgrade to Premium Plus').click()
        discountInput().should('have.value', '')
        cy.get('#buyPremium').should('not.contain.text', 'Discount code valid!')
    })

    it('keeps the Lemon Squeezy wording of a 52 week plan', () => {
        stubProviders({}, 404)
        openCheckout('Yearly')
        cy.get('#buyPremium').should('contain.text', 'Renews every 52 weeks').and('not.contain.text', 'until cancelled')
    })

    // Starter is sold for 52 weeks only; the year continues every 4 weeks at the 4-week price of l_starter_premium
    it('continues a yearly Starter every 4 weeks at the Starter 4-week price', () => {
        const prices: Record<string, number> = { 'l_starter_premium': 2.69, 'l_starter_premium-quarter': 9.69, 'l_starter_premium-year': 16.69 }
        cy.intercept('POST', '**/api/topup/rates', request => {
            request.reply({
                body: {
                    products: (request.body.productSlugs as string[]).map(slug => ({
                        productSlug: slug, discountPercent: 0,
                        providers: [{ providerSlug: 'lemonsqueezy', currencyCode: 'EUR', originalPrice: prices[slug], discountedPrice: prices[slug] }]
                    }))
                }
            })
        }).as('starterRates')
        stubProviders(directProviders)
        visitAuthenticatedPage('/premium?tier=starter')
        wizardOption(/^Subscription$/).click()
        durationRow('Yearly').should('contain.text', 'First 52 weeks, then every 4 weeks until cancelled').and('contain.text', '€16.69 for the first year, then €2.69 every 4 weeks')
        durationRow('Yearly').should('contain.text', 'then €2.69 every 4 weeks').and('not.contain.text', 'renews every 52')
        wizardOption(/^Yearly$/).click()
        cy.contains('#buyPremium h3', 'Complete Purchase').should('be.visible')
        cy.get('#buyPremium').should('contain.text', formatMoney(16.69, 'EUR'))
        cy.get('#buyPremium').should('contain.text', `Then ${formatMoney(2.69, 'EUR')} every 4 weeks after the first 52 weeks, until cancelled. Cancel anytime.`)
        cy.get('#buyPremium').should('contain.text', '52 weeks, then every 4 weeks until cancelled').and('not.contain.text', 'every 52 weeks')
        cy.get('@starterRates.all').should(calls => {
            const slugs = calls.flatMap(call => (call as unknown as { request: { body: { productSlugs: string[] } } }).request.body.productSlugs)
            expect(slugs).to.include('l_starter_premium')
        })
    })

    // Stripe Managed Payments adds the tax itself: net prices with "(+tax)", never a VAT estimate
    it('shows net prices with (+tax) when Stripe Managed Payments bills the buyer', () => {
        cy.intercept('GET', '**/api/premium/country', { body: { country: 'BR' } })
        stubProviders([{ provider: 'stripe', mode: 'managed' }])
        openDurations()
        durationRow('Yearly').should('contain.text', '(+tax)').and('contain.text', 'then €9.69 every 4 weeks').and('not.contain.text', 'VAT')
        wizardOption(/^Yearly$/).click()
        cy.contains('#buyPremium h3', 'Complete Purchase').should('be.visible')
        cy.get('#buyPremium').should('contain.text', formatMoney(96.69, 'EUR')).and('contain.text', 'Tax is added at checkout.')
        cy.get('#buyPremium').should('contain.text', `Then ${formatMoney(9.69, 'EUR')} (+tax) every 4 weeks after the first 52 weeks, until cancelled.`)
        cy.get('#buyPremium').should('not.contain.text', 'Includes').and('not.contain.text', 'estimated')
    })

    // a fixed amount code states cents; the backend takes it off every renewal of a forever code
    it('takes a fixed forever code off the renewal', () => {
        const fixed = { code: 'FIVE', name: 'Five off', amountType: 'fixed', amount: 100, periodAmounts: { 4: 100, 52: 100 }, duration: 'forever', isValid: true, durationInMonths: 0 }
        cy.intercept('GET', '**/api/discount/FIVE*', { body: fixed }).as('fixed')
        stubProviders(directProviders)
        openCheckout('Yearly')
        cy.get('#buyPremium').contains('button', 'Have a discount or creator code?').click()
        discountInput().type('FIVE')
        discountInput().closest('div').parent().contains('button', 'Apply').click()
        cy.wait('@fixed')
        cy.get('#buyPremium').should('contain.text', `Then ${formatMoney(8.69, 'EUR')} every 4 weeks after the first 52 weeks, until cancelled.`)
    })

    // the page charges what the backend does: discount rounded half to even on the net, then German VAT rounded to the cent
    it('shows the exact charge of a German buyer, without rounding the discounted gross up', () => {
        cy.intercept('GET', '**/api/premium/country', { body: { country: 'DE' } })
        stubProviders(directProviders)
        stubPromotion()
        openCheckout('Yearly')
        cy.wait('@promotionCode')
        cy.get('#buyPremium').should('contain.text', `${formatMoney(57.52, 'EUR')}${formatMoney(115.06, 'EUR')}per 52 weeks`).and('contain.text', `You save ${formatMoney(57.54, 'EUR')}`)
        cy.get('#buyPremium s').should('contain.text', formatMoney(115.06, 'EUR'))
        cy.get('#buyPremium').should('not.contain.text', '(+VAT)').and('contain.text', 'Includes VAT.')
    })

    // regression: a failed country detection priced the buyer as the US and opened the checkout with country US
    it('prices an unknown country before VAT and needs the country before any payment button works', () => {
        cy.intercept('GET', '**/api/premium/country', { forceNetworkError: true })
        stubProviders(directProviders)
        openDurations()
        durationRow('4 weeks').should('contain.text', '~€9.69').and('contain.text', 'per 4 weeks, plus VAT where applicable')
        wizardOption(/^4 weeks$/).click()
        cy.contains('#buyPremium h3', 'Complete Purchase').should('be.visible')
        cy.get('#buyPremium').should('contain.text', formatMoney(9.69, 'EUR')).and('contain.text', 'per 4 weeks, plus VAT where applicable')
        cy.get('[data-testid="checkout-country-required"]').should('be.visible')
        cy.get('[data-testid="checkout-payment"]').find('button').should('not.exist')
        cy.get('@providers.all').should('have.length', 0)
        cy.get('#buyPremium input[placeholder="Select your country"]').click().type('Germany')
        cy.get('.rbt-menu').contains('Germany').click()
        cy.wait('@providers').its('request.query').should('deep.include', { country: 'DE', productSlug: 'l_premium' })
        cy.get('[data-testid="checkout-country-required"]').should('not.exist')
        cy.get('#buyPremium').should('contain.text', formatMoney(11.53, 'EUR')).and('not.contain.text', 'plus VAT where applicable')
        stubCheckout('l_premium')
        confirmDeclaration()
        cy.contains('button', 'Pay with card').click()
        cy.wait('@checkout').its('request.query').should('deep.equal', { provider: 'stripe', country: 'DE' })
        // regression: the detected country was kept on the device without consent (purchase and referral country)
        cy.window().then(window => {
            expect(window.localStorage.getItem('userCountryCode')).to.equal(null)
            expect(window.localStorage.getItem('referralRewardsCountry')).to.equal(null)
        })
    })

    // regression: a country detection that never answered kept the country select disabled ("Loading...") and the checkout blocked
    it('lets the buyer choose the country when the detection does not answer', () => {
        cy.intercept('GET', '**/api/premium/country', { delay: 30000, body: { country: 'US' } })
        stubProviders(directProviders)
        openCheckout('4 weeks')
        cy.get('[data-testid="checkout-country-required"] input[placeholder="Select your country"]', { timeout: 10000 }).should('not.be.disabled').click().type('Germany')
        cy.get('.rbt-menu').contains('Germany').click()
        cy.wait('@providers').its('request.query').should('deep.include', { country: 'DE', productSlug: 'l_premium' })
        cy.contains('button', 'Pay with card').should('be.visible')
    })

    // regression: the US direct checkout said VAT "is added at checkout in the US" although nothing is added there
    it('shows a US direct checkout without VAT and without the (+VAT) note', () => {
        stubProviders(directProviders)
        openCheckout('4 weeks')
        cy.wait('@providers')
        cy.get('#buyPremium').should('contain.text', formatMoney(9.69, 'EUR')).and('not.contain.text', '(+VAT)')
        cy.get('#buyPremium').should('contain.text', 'No tax added.').and('not.contain.text', 'added at checkout')
    })

    it('lets the buyer remove the promotion code', () => {
        stubProviders(directProviders)
        stubPromotion()
        openCheckout('4 weeks')
        cy.wait('@promotionCode')
        cy.get('#buyPremium').should('contain.text', formatMoney(7.27, 'EUR')).and('contain.text', 'The discount covers the first 4 weeks')
        cy.get('#buyPremium input[placeholder="Enter discount code"]').closest('div').parent().contains('button', 'Clear').click()
        cy.get('#buyPremium input[placeholder="Enter discount code"]').should('have.value', '')
        cy.get('#buyPremium').should('not.contain.text', 'Discount code valid!').and('not.contain.text', formatMoney(7.27, 'EUR'))
        stubCheckout('l_premium')
        confirmDeclaration()
        cy.contains('button', 'Pay with card').click()
        cy.wait('@checkout').its('request.query').should('not.have.property', 'discountcode')
    })

    it('shows no promotion while only Lemon Squeezy takes payments', () => {
        stubProviders([{ provider: 'lemonsqueezy', mode: 'direct' }])
        stubPromotion()
        openDurations()
        cy.wait('@providers')
        cy.get('[data-testid="promotion-note"]').should('not.exist')
        durationRow('Yearly').find('s').should('not.exist')
        durationRow('Yearly').should('not.contain.text', '-50%')
        wizardOption(/^Yearly$/).click()
        cy.contains('button', 'Continue to our secure payment processor').should('be.visible')
        cy.get('#buyPremium input[placeholder="Enter discount code"]').should('have.value', '')
        cy.get('#buyPremium').should('not.contain.text', 'Black Friday')
        cy.get('@promotionCode.all').should('have.length', 0)
    })

    function discountInput(options?: Partial<Cypress.Timeoutable>) {
        return cy.get('#buyPremium input[placeholder="Enter discount code"]', options)
    }

    // regression: with only Lemon Squeezy the code was checked without a provider, so a local code (the promotion) was shown
    // as a discount that the Lemon Squeezy checkout then rejects
    it('checks a typed code for Lemon Squeezy while it is the only checkout', () => {
        stubProviders({}, 404)
        cy.intercept('GET', '**/api/discount/BF2026*', request => {
            request.reply({ body: request.query.provider === 'lemonsqueezy' ? { code: 'BF2026', isValid: false, amount: 0 } : blackFridayCode })
        }).as('typedCode')
        openCheckout('4 weeks')
        cy.wait('@providers')
        cy.get('#buyPremium').contains('button', 'Have a discount or creator code?').click()
        discountInput().type('BF2026')
        discountInput().closest('div').parent().contains('button', 'Apply').click()
        cy.wait('@typedCode').its('request.query').should('deep.equal', { isSubscription: 'true', provider: 'lemonsqueezy' })
        cy.get('#buyPremium').should('contain.text', 'This discount code is not valid').and('not.contain.text', formatMoney(7.27, 'EUR'))
    })

    // regression: an invalid code from the link (e.g. a Lemon Squeezy code at the Stripe checkout) kept the promotion out, and a
    // check of it still running when the providers arrived was not repeated for them, so it stayed "valid"
    it('applies the promotion in place of a code from the link the card checkout does not accept', () => {
        cy.intercept('GET', '**/api/premium/subscription/providers*', { body: directProviders, delay: 300 }).as('providers')
        stubPromotion()
        cy.intercept('GET', '**/api/discount/SUMMER*', request => {
            // valid for Lemon Squeezy (checked without a provider), not for Stripe; the first answer arrives after the providers
            if (request.query.provider === 'stripe') return request.reply({ body: { code: 'SUMMER', isValid: false, amount: 0 } })
            request.reply({ delay: 2000, body: { code: 'SUMMER', name: 'Summer', amount: 20, amountType: 'percent', isValid: true, durationInMonths: 0 } })
        }).as('linkCode')
        visitAuthenticatedPage('/premium?tier=premium&code=SUMMER')
        wizardOption(/^Subscription$/).click()
        wizardOption('Just for me').click()
        wizardOption(/^4 weeks$/).click()
        cy.wait('@promotionCode')
        discountInput().should('have.value', 'BF2026')
        cy.get('#buyPremium').should('contain.text', 'Discount code valid!').and('contain.text', formatMoney(7.27, 'EUR'))
        cy.wait(2500)
        discountInput().should('have.value', 'BF2026')
        cy.get('#buyPremium').should('not.contain.text', 'Summer').and('contain.text', formatMoney(7.27, 'EUR'))
        stubCheckout('l_premium')
        confirmDeclaration()
        cy.contains('button', 'Pay with card').click()
        cy.wait('@checkout').its('request.query').should('deep.equal', { discountcode: 'BF2026', provider: 'stripe', country: 'US' })
    })

    // regression: an open checkout kept showing the promotion price and sending its code after the promotion ended
    it('stops applying the promotion when it ends while the checkout is open', () => {
        stubProviders(directProviders)
        cy.intercept('GET', '**/api/premium/discount/auto*', request => {
            request.reply({ body: { ...blackFriday, expiresAt: new Date(Date.now() + 12000).toISOString() } })
        }).as('promotion')
        cy.intercept('GET', '**/api/discount/BF2026*', { body: blackFridayCode }).as('promotionCode')
        openCheckout('4 weeks')
        cy.wait('@promotionCode')
        cy.get('#buyPremium').should('contain.text', formatMoney(7.27, 'EUR'))
        discountInput().should('have.value', 'BF2026')
        discountInput({ timeout: 20000 }).should('have.value', '')
        cy.get('[data-testid="promotion-note"]').should('not.exist')
        cy.get('#buyPremium').should('not.contain.text', formatMoney(7.27, 'EUR')).and('not.contain.text', 'Discount code valid!')
        stubCheckout('l_premium')
        confirmDeclaration()
        cy.contains('button', 'Pay with card').click()
        cy.wait('@checkout').its('request.query').should('not.have.property', 'discountcode')
    })

    // regression: upgrading the tier at the checkout kept the old tier's prices, so the summary fell back to built-in prices
    it('loads the Premium+ price after upgrading the tier at the checkout', () => {
        stubProviders(directProviders)
        const prices: Record<string, number> = { 'l_premium-year': 96.69, 'l_prem_plus-year': 300 }
        cy.intercept('POST', '**/api/topup/rates', request => {
            request.reply({
                body: {
                    products: (request.body.productSlugs as string[]).map(slug => ({
                        productSlug: slug,
                        discountPercent: 0,
                        providers: [{ providerSlug: 'lemonsqueezy', currencyCode: 'EUR', originalPrice: prices[slug], discountedPrice: prices[slug] }]
                    }))
                }
            })
        }).as('rates')
        openCheckout('Yearly')
        cy.get('#buyPremium').should('contain.text', formatMoney(96.69, 'EUR'))
        cy.get('#buyPremium').contains('button', 'Upgrade to Premium Plus').click()
        // the slot catalog asks for its own prices too
        cy.get('@rates.all').should(calls => {
            const slugs = calls.map(call => (call as unknown as { request: { body: { productSlugs: string[] } } }).request.body.productSlugs)
            expect(slugs).to.deep.include(['l_prem_plus-year'])
        })
        cy.get('#buyPremium').should('contain.text', formatMoney(300, 'EUR'))
    })

    const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

    function returnFromProvider() {
        cy.window().then(window => window.dispatchEvent(new window.PageTransitionEvent('pageshow', { persisted: true })))
    }

    // the early start declaration and withdrawal instructions of the prepaid purchase are part of every subscription checkout
    it('waits for the early start declaration and sends it, one request id per plan and payment provider', () => {
        stubProviders(directProviders)
        openCheckout('4 weeks')
        stubCheckout('l_premium')
        cy.get('[data-testid="purchase-declaration"]')
            .should('contain.text', 'Start my purchased access immediately.')
            .find('a')
            .should('have.attr', 'href', 'https://coflnet.com/withdrawal#withdraw-contract')
        cy.get('#subscription-early-start-declaration').should('not.be.checked')
        cy.contains('button', 'Pay with card').should('be.disabled')
        cy.get('button[aria-label="Pay with PayPal"]').should('be.disabled')
        confirmDeclaration()
        cy.contains('button', 'Pay with card').click()
        cy.wait('@checkout').its('request.body').then(body => {
            expect(body).to.include({
                immediatePerformanceRequested: true,
                withdrawalConsequenceAcknowledged: true,
                declarationVersion: 'test-declaration',
                legalLocale: 'en'
            })
            expect(body.declarationRequestId).to.match(GUID)
            // a retry with the same provider is the same attempt, another provider a new one
            returnFromProvider()
            cy.contains('button', 'Pay with card').click()
            cy.wait('@checkout').its('request.body.declarationRequestId').should('equal', body.declarationRequestId)
            returnFromProvider()
            cy.get('button[aria-label="Pay with PayPal"]').click()
            cy.wait('@checkout').its('request.body.declarationRequestId').should('match', GUID).and('not.equal', body.declarationRequestId)
        })
    })

    it('starts unticked again for another billing period', () => {
        stubProviders(directProviders)
        openCheckout('4 weeks')
        confirmDeclaration()
        cy.contains('button', 'Pay with card').should('be.enabled')
        cy.get('#buyPremium button[aria-label^="Change duration"]').click()
        wizardOption(/^Yearly$/).click()
        cy.get('#subscription-early-start-declaration').should('not.be.checked')
        cy.contains('button', 'Pay with card').should('be.disabled')
    })

    // the server refuses a missing or outdated declaration; the buyer is told what to do instead of "try again"
    it('explains a refused declaration, unticks it and loads it again', () => {
        stubProviders(directProviders)
        openCheckout('4 weeks')
        cy.intercept('POST', /\/api\/premium\/subscription\/l_premium(\?|$)/, {
            statusCode: 400,
            body: { slug: 'invalid_service_performance_declaration', message: 'invalid_service_performance_declaration' }
        }).as('refused')
        cy.intercept('GET', '**/api/user/terms*').as('termsReload')
        confirmDeclaration()
        cy.contains('button', 'Pay with card').click()
        cy.wait('@refused')
        cy.get('#buyPremium').should('contain.text', 'The early start declaration has changed or could not be verified')
        cy.wait('@termsReload')
        cy.get('#subscription-early-start-declaration').should('not.be.checked')
        cy.contains('button', 'Pay with card').should('be.disabled')
    })

    // SkyApi before the rollout of GET /api/premium/country: the country stays unknown and no third party is asked
    it('leaves the country to the buyer while SkyApi does not know the country endpoint', () => {
        cy.intercept('GET', '**/api/premium/country', { statusCode: 404, body: 'Not Found' }).as('country')
        cy.intercept('GET', 'https://api.country.is*', cy.spy().as('thirdParty'))
        stubProviders(directProviders)
        openCheckout('4 weeks')
        cy.get('[data-testid="checkout-country-required"]').should('be.visible')
        cy.get('@country.all').should('have.length', 1)
        cy.get('@thirdParty').should('not.have.been.called')
    })
})

describe('Slot subscriptions with Stripe, PayPal and the promotion', () => {
    beforeEach(() => {
        cy.intercept('GET', '**/api/premium/country', { body: { country: 'US' } })
        cy.intercept('GET', '**/api/premium/slots/products', { body: slotCatalog }).as('slotProducts')
        cy.intercept('POST', '**/api/topup/rates', request => request.reply({ body: slotPricing() })).as('slotPrices')
        stubProducts()
        stubSubscriptions({ body: [] })
    })

    it('shows the promotion on the offer and opens the PayPal checkout with its code', () => {
        stubProviders(directProviders)
        stubPromotion()
        cy.intercept('POST', '**/api/premium/subscription/l_premium-slots-4?*', {
            statusCode: 200, body: { directLink: 'https://www.paypal.com/checkoutnow?token=test' }
        }).as('slotCheckout')
        visitAuthenticatedPage('/premium?slots=true#buyPremium')
        wizardOption(/^Premium$/).click()
        wizardOption(/^Subscription$/).click()
        cy.get('[data-testid="premium-package"]').contains(OPTION_TITLE, 'Package of 4').click()
        cy.wait('@promotionCode')
        cy.get('[data-testid="slot-offer"]').should('contain.text', '-25%').and('contain.text', '22.27').and('contain.text', 'First 4 weeks, then')
        cy.get('[data-testid="slot-offer"] s').should('contain.text', '29.69')
        cy.contains('button', 'Continue with subscription').click()
        cy.get('.modal').should('contain.text', '22.27').and('contain.text', 'for the first 4 weeks, then').and('contain.text', 'Black Friday: 25% off')
        cy.get('.modal').contains('button', 'Pay with card').scrollIntoView().should('be.visible')
        cy.window().then(window => cy.stub(window, 'open').as('checkoutNavigation'))
        confirmDeclaration()
        cy.get('.modal button[aria-label="Pay with PayPal"]').click()
        cy.wait('@slotCheckout').its('request.query').should('deep.equal', {
            assignSlots: 'true', discountcode: 'BF2026', provider: 'paypal', country: 'US'
        })
        cy.get('@checkoutNavigation').should('have.been.calledOnceWithExactly', 'https://www.paypal.com/checkoutnow?token=test', '_self')
    })

    const test90 = { code: 'TEST90', amount: 90, amountType: 'percent', duration: 'once', isValid: true, isLimitedToProducts: false, isSubscriptionOnly: true, durationInMonths: 0 }

    function openSlotOffers(slotCount: 'One assignable slot' | 'Package of 4' = 'One assignable slot') {
        visitAuthenticatedPage('/premium?slots=true#buyPremium')
        wizardOption(/^Premium$/).click()
        wizardOption(/^Subscription$/).click()
        cy.get('[data-testid="premium-package"]').contains(OPTION_TITLE, slotCount).click()
        cy.get('[data-testid="slot-offer"]').should('have.length', 1)
    }

    // regression: a code could only be entered after "Continue with subscription" opened the review, nothing on the offers said so
    it('takes a discount code on the offers and reduces their price', () => {
        stubProviders(directProviders)
        cy.intercept('GET', '**/api/discount/TEST90*', { body: test90 }).as('test90')
        openSlotOffers('Package of 4')
        cy.get('#buyPremium').contains('button', 'Have a discount or creator code?').click()
        cy.get('#buyPremium input[placeholder="Enter discount code"]').type('TEST90')
        cy.get('#buyPremium input[placeholder="Enter discount code"]').closest('div').parent().contains('button', 'Apply').click()
        cy.wait('@test90').its('request.query').should('deep.equal', { isSubscription: 'true', provider: 'stripe' })
        cy.get('[data-testid="slot-offer"]').should('contain.text', '-90%').and('contain.text', '2.97').and('contain.text', 'First 4 weeks, then')
        cy.get('[data-testid="slot-offer"] s').should('contain.text', '29.69')
    })

    it('suggests the 4-slot bundle and Premium+ slots with prices, and the applied code saving on them', () => {
        stubProviders(directProviders)
        cy.intercept('GET', '**/api/discount/TEST90*', { body: test90 }).as('test90')
        visitAuthenticatedPage('/premium?slots=true&code=TEST90#buyPremium')
        wizardOption(/^Premium$/).click()
        wizardOption(/^Subscription$/).click()
        cy.get('[data-testid="premium-package"]').contains(OPTION_TITLE, 'One assignable slot').click()
        cy.wait('@test90')
        cy.get('[data-testid="slot-upsell"]').should('have.length', 2)
        cy.get('[data-testid="slot-upsell"]').eq(0).should('contain.text', 'Step up to 4 slots').and('not.contain.text', '29.69 every 4 weeks for all 4 slots').and('contain.text', '7.42 per slot instead of')
        cy.get('[data-testid="slot-upsell-savings"]').eq(0).should('contain.text', 'With TEST90: €2.97 for the first 4 weeks instead of €29.69 (you save €26.72)')
        // with a code the savings line states the price, the full price is not repeated above it
        cy.get('[data-testid="slot-upsell"]').eq(1).should('contain.text', 'Step up to Premium+').and('not.contain.text', '35.69 every 4 weeks for this slot').and('contain.text', BAZAAR_ARCHIVE_BULLET)
        cy.get('[data-testid="slot-upsell-savings"]').eq(1).should('contain.text', 'With TEST90: €3.57 for the first 4 weeks instead of €35.69 (you save €32.12)')
        cy.get('[data-testid="slot-upsell"]').eq(1).contains('button', 'Upgrade to Premium+').click()
        cy.get('[data-testid="slot-offer"]').should('contain.text', '35.69')
        cy.get('[data-testid="slot-upsell"]').should('have.length', 1).and('contain.text', 'Step up to 4 slots')
    })

    it('shows no code saving on the upsell for a code limited to products, and only the tier upsell for a Premium bundle of 4', () => {
        stubProviders(directProviders)
        cy.intercept('GET', '**/api/discount/TEST90*', { body: { ...test90, isLimitedToProducts: true } })
        visitAuthenticatedPage('/premium?slots=true&code=TEST90#buyPremium')
        wizardOption(/^Premium$/).click()
        wizardOption(/^Subscription$/).click()
        cy.get('[data-testid="premium-package"]').contains(OPTION_TITLE, 'One assignable slot').click()
        cy.get('[data-testid="slot-upsell"]').should('have.length', 2)
        cy.get('[data-testid="slot-upsell-savings"]').should('not.exist')
        cy.get('#buyPremium').contains('button', 'Back').click()
        cy.get('[data-testid="premium-package"]').contains(OPTION_TITLE, 'Package of 4').click()
        cy.get('[data-testid="slot-upsell"]').should('have.length', 1).and('contain.text', 'Step up to Premium+')
    })

    // regression: the upsell prices named no tax; Managed Payments shows net prices, an estimate says so
    it('names the tax of the slot upsell prices like the offer cards', () => {
        stubProviders([{ provider: 'stripe', mode: 'managed' }])
        openSlotOffers()
        cy.get('[data-testid="slot-upsell"]').first().should('contain.text', '(+tax)')
    })

    it('says tax is calculated at checkout on the slot upsell while only Lemon Squeezy takes payments', () => {
        stubProviders({}, 404)
        openSlotOffers()
        cy.get('[data-testid="slot-offer"]').invoke('text').should('contain', 'Tax calculated at checkout')
        cy.get('[data-testid="slot-upsell"]').first().should('contain.text', 'Tax calculated at checkout')
    })

    // regression: a 52 week bundle continues every 4 weeks after its first term, the upsell said it renewed every 52 weeks
    it('words a 52 week upsell bundle as its first term', () => {
        const yearSingle = { slug: 'l_premium-slots-year', slotTier: 'premium', slotCount: 1, cost: 18000, ownershipSeconds: 52 * 7 * 24 * 3600 }
        const yearBundle = { slug: 'l_premium-slots-4-year', slotTier: 'premium', slotCount: 4, cost: 72000, ownershipSeconds: 52 * 7 * 24 * 3600 }
        const fourWeek = slotCatalog.filter(product => !product.slug.startsWith('l_'))
        cy.intercept('GET', '**/api/premium/slots/products', { body: [...fourWeek, yearSingle, yearBundle] })
        cy.intercept('POST', '**/api/topup/rates', request => {
            const prices: Record<string, number> = { 'l_premium-slots-year': 90, 'l_premium-slots-4-year': 300 }
            request.reply({ body: { products: (request.body.productSlugs as string[]).map(productSlug => ({ productSlug, providers: [{ providerSlug: 'lemonsqueezy', currencyCode: 'EUR', originalPrice: prices[productSlug], discountedPrice: prices[productSlug] }] })) } })
        })
        stubProviders(directProviders)
        openSlotOffers()
        cy.get('[data-testid="slot-upsell"]').first().should('contain.text', '300.00 for the first 52 weeks for all 4 slots').and('not.contain.text', 'every 52 weeks')
    })

    // regression: the creator and discount fields of the offers and of the review dialog kept separate state
    it('keeps one code form while the review dialog is open', () => {
        stubProviders(directProviders)
        openSlotOffers()
        cy.get('[data-testid="slot-offer"]').contains('button', 'Continue with subscription').click()
        cy.get('input[placeholder="Enter discount code"]').should('have.length', 1)
        cy.get('.modal').contains('button', 'Back').click()
        cy.get('input[placeholder="Enter discount code"]').should('have.length.at.most', 1)
    })

    describe('a 52 week bundle', () => {
        const yearBundle = { slug: 'l_premium-slots-4-year', slotTier: 'premium', slotCount: 4, cost: 72000, ownershipSeconds: 52 * 7 * 24 * 3600 }

        beforeEach(() => {
            cy.intercept('GET', '**/api/premium/slots/products', { body: [...slotCatalog, yearBundle] })
            cy.intercept('POST', '**/api/topup/rates', request => {
                const { products } = slotPricing()
                const year = { productSlug: yearBundle.slug, providers: [{ providerSlug: 'lemonsqueezy', currencyCode: 'EUR', originalPrice: 300, discountedPrice: 300 }] }
                request.reply({ body: { products: [...products, year] } })
            })
        })

        function openYearBundle() {
            visitAuthenticatedPage('/premium?slots=true#buyPremium')
            wizardOption(/^Premium$/).click()
            wizardOption(/^Subscription$/).click()
            cy.get('[data-testid="premium-package"]').contains(OPTION_TITLE, 'Package of 4').click()
            cy.get('[data-testid="slot-offer"]').should('have.length', 2)
        }

        it('continues every 4 weeks at the 4-week bundle price after the first 52 weeks', () => {
            stubProviders(directProviders)
            openYearBundle()
            cy.get('[data-testid="slot-offer"]').eq(1).should('contain.text', 'First 52 weeks, then €29.69 every 4 weeks until cancelled').and('not.contain.text', 'Every 52 weeks')
            cy.get('[data-testid="slot-offer"]').eq(1).contains('button', 'Continue with subscription').click()
            cy.get('.modal').should('contain.text', 'for the first 52 weeks for the whole bundle')
                .and('contain.text', 'Then €29.69 every 4 weeks after the first 52 weeks, until cancelled. Cancel anytime.')
        })

        // a code for the first payment only does not change the renewal
        it('says a first-payment promotion covers the first 52 weeks and the renewal stays at the full 4-week price', () => {
            stubProviders(directProviders)
            stubPromotion()
            openYearBundle()
            cy.wait('@promotionCode')
            cy.get('[data-testid="slot-offer"]').eq(1).should('contain.text', '-50%').and('contain.text', 'First 52 weeks, then €29.69 every 4 weeks')
            cy.get('[data-testid="slot-offer"]').eq(1).contains('button', 'Continue with subscription').click()
            cy.get('.modal').should('contain.text', '€150.00').and('contain.text', 'for the first 52 weeks for the whole bundle. Then €29.69 every 4 weeks. Cancel anytime.')
            cy.get('.modal').should('not.contain.text', 'after the first 52 weeks')
            // the promotion is read for the bundle's 52 weeks (50%), not for 4 weeks (25%)
            cy.get('.modal').should('contain.text', '50% off your first payment (the first year)').and('not.contain.text', '25% off')
        })

        // the package card is keyed by slot count and period: the 52 week bundle does not replace the 4-week price
        it('keeps the 4-week price on the package card', () => {
            stubProviders(directProviders)
            openYearBundle()
            cy.get('#buyPremium').contains('button', 'Back').click()
            cy.get('[data-testid="premium-package"]').contains(OPTION_TITLE, 'Package of 4').closest('label').should('contain.text', '~€7.42 per slot · every 4 weeks').and('not.contain.text', '52 weeks')
        })

        it('keeps the Lemon Squeezy wording', () => {
            stubProviders({}, 404)
            openYearBundle()
            cy.get('[data-testid="slot-offer"]').eq(1).should('not.contain.text', 'until cancelled')
        })
    })

    // regression: the Back button sat squeezed beside the stacked provider buttons
    it('stacks the provider buttons full width with Back on its own row under them', () => {
        stubProviders(directProviders)
        stubPromotion()
        visitAuthenticatedPage('/premium?slots=true#buyPremium')
        wizardOption(/^Premium$/).click()
        wizardOption(/^Subscription$/).click()
        cy.get('[data-testid="premium-package"]').contains(OPTION_TITLE, 'Package of 4').click()
        cy.contains('button', 'Continue with subscription').click()
        cy.get('.modal').contains('button', 'Pay with card').scrollIntoView().should('be.visible')
        cy.get('.modal .modal-footer').then(footer => {
            const box = (selector: string) => footer.find(selector)[0].getBoundingClientRect()
            const footerBox = footer[0].getBoundingClientRect()
            const card = footer.find('button:contains("Pay with card")')[0].getBoundingClientRect()
            const paypal = box('button[aria-label="Pay with PayPal"]')
            const back = footer.find('button:contains("Back")')[0].getBoundingClientRect()
            expect(card.width).to.be.closeTo(paypal.width, 1)
            expect(card.width).to.be.greaterThan(footerBox.width * 0.8)
            expect(back.top).to.be.at.least(paypal.bottom)
            expect(back.left).to.be.closeTo(card.left, 1)
        })
        cy.get('.modal-footer').scrollIntoView()
        cy.get('.modal').screenshot('slot-review-providers')
    })

    // regression: after another country (or product) was chosen the previous answer's provider buttons stayed usable until
    // the new one arrived, so a checkout could open with a provider the buyer's country does not have
    it('shows no provider buttons while the providers of another country load', () => {
        cy.intercept('GET', '**/api/premium/subscription/providers*', request => {
            if (request.query.country === 'DE') return request.reply({ delay: 3000, body: [{ provider: 'lemonsqueezy', mode: 'direct' }] })
            request.reply({ body: directProviders })
        }).as('providers')
        visitAuthenticatedPage('/premium?slots=true#buyPremium')
        wizardOption(/^Premium$/).click()
        wizardOption(/^Subscription$/).click()
        cy.get('[data-testid="premium-package"]').contains(OPTION_TITLE, 'Package of 4').click()
        cy.get('[data-testid="slot-offer"]').should('have.length.at.least', 1)
        cy.contains('label', 'Your Country:').parent().find('input').filter(':visible').first().focus().type('Germany')
        cy.contains('[role="option"]', 'Germany').click()
        cy.contains('button', 'Continue with subscription').click()
        cy.get('.modal').contains('button', 'Loading payment options…').should('be.disabled')
        cy.get('.modal').contains('button', 'Pay with card').should('not.exist')
        cy.get('.modal').contains('button', 'Continue to checkout', { timeout: 10000 }).should('be.visible')
        cy.get('.modal button[aria-label="Pay with PayPal"]').should('not.exist')
    })
})

describe('Slot subscriptions for a buyer without a detected country', () => {
    beforeEach(() => {
        cy.intercept('GET', '**/api/premium/country', { forceNetworkError: true })
        cy.intercept('GET', '**/api/premium/slots/products', { body: slotCatalog }).as('slotProducts')
        cy.intercept('POST', '**/api/topup/rates', request => request.reply({ body: slotPricing() })).as('slotPrices')
        stubProducts()
        stubSubscriptions({ body: [] })
    })

    // regression: the slot checkout said "Includes estimated tax" for the exact charge of a direct checkout, and an unknown
    // country was quoted as the US
    it('needs the country for a price and says "Includes VAT" for the exact charge', () => {
        stubProviders(directProviders)
        visitAuthenticatedPage('/premium?slots=true#buyPremium')
        wizardOption(/^Premium$/).click()
        wizardOption(/^Subscription$/).click()
        cy.get('[data-testid="premium-package"]').contains(OPTION_TITLE, 'Package of 4').closest('label').should('contain.text', 'Choose your country at checkout')
        cy.get('[data-testid="premium-package"]').contains(OPTION_TITLE, 'Package of 4').click()
        cy.get('[data-testid="slot-offer"]').should('contain.text', 'Choose your country to see the price').and('contain.text', 'Plus VAT where applicable')
        cy.contains('button', 'Continue with subscription').should('be.disabled')
        cy.get('@slotPrices.all').should('have.length', 0)
        cy.contains('label', 'Your Country:').parent().find('input').filter(':visible').first().click().type('Germany')
        cy.contains('[role="option"]', 'Germany').click()
        cy.wait('@providers')
        cy.get('[data-testid="slot-offer"]').should('contain.text', '35.33').and('contain.text', 'Includes VAT').and('not.contain.text', 'estimated')
        cy.get('@slotPrices.all').each(call => expect((call as unknown as { request: { body: { countryCode: string } } }).request.body.countryCode).to.equal('DE'))
        cy.contains('button', 'Continue with subscription').click()
        cy.get('.modal').should('contain.text', 'Includes VAT. Checkout confirms the final price.')
    })
})

describe('PayPal subscriptions in the account', () => {
    const paypalSubscription = { ...activeSubscription, externalId: 'paypal-subscription', providerSlug: 'paypal', canResume: false, canChangePlan: false }

    it('offers no resume or plan change for PayPal and keeps them for Lemon Squeezy', () => {
        stubProducts()
        stubSubscriptions({ body: [
            { ...paypalSubscription, externalId: 'paypal-canceled', endsAt: '2099-01-15T00:00:00Z' },
            { ...activeSubscription, externalId: 'ls-canceled', endsAt: '2099-01-15T00:00:00Z', providerSlug: 'lemonsqueezy', canResume: true, canChangePlan: true }
        ] })
        visitAuthenticatedPage()
        cy.wait('@subscriptions')
        cy.get('[data-testid="reactivate-subscription"]').should('have.length', 1)
    })

    it('does not promise resuming when a PayPal subscription is canceled', () => {
        stubProducts()
        stubSubscriptions({ body: [paypalSubscription] })
        visitAuthenticatedPage()
        cy.wait('@subscriptions')
        cy.contains('button', 'Change subscription plan').should('not.exist')
        cy.contains('button', 'Cancel subscription').click()
        cy.get('.modal').should('contain.text', 'Access continues through the paid period')
            .and('contain.text', 'PayPal ends the subscription right away, so it cannot be resumed later')
    })

    it('keeps plan changes for subscriptions from an older backend without the new fields', () => {
        stubProducts()
        stubSubscriptions({ body: [activeSubscription] })
        visitAuthenticatedPage()
        cy.wait('@subscriptions')
        cy.contains('button', 'Change subscription plan').should('be.visible')
        cy.contains('button', 'Cancel subscription').click()
        cy.get('.modal').should('not.contain.text', 'cannot be resumed')
    })
})
