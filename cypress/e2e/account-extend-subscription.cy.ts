import { getLocalDateAndTime } from '../../utils/Formatter'
import { formatMoney } from '../../utils/PricingUtils'

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

function visitAuthenticatedPage(path = '/account', setup?: (window: Cypress.AUTWindow) => void, termsOverride?: object) {
    cy.intercept('GET', '**/api/user/terms*', {
        statusCode: 200,
        body: termsOverride ?? {
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


const termEnd = '2099-12-31T00:00:00Z'
const extendedUntil = '2100-12-30T00:00:00Z'

const longTermSubscription = {
    externalId: 'long-term',
    endsAt: null,
    productName: 'premium_plus',
    paymentAmount: 499,
    renewsAt: termEnd,
    createdAt: '2026-01-01T00:00:00Z',
    providerSlug: 'stripe',
    termWeeks: 52,
    canResume: true,
    canChangePlan: false,
    currency: 'EUR',
    currentTermEndsAt: termEnd,
    canExtendLongTerm: true,
    extensionPrice: 99,
    extensionTaxTreatment: 'included',
    renewalPrice: 11.5,
    extendedUntil: null
}

const date = (value: string) => getLocalDateAndTime(new Date(value))

function visitExtendable(subscription: object = longTermSubscription, path = '/account', setup?: (window: Cypress.AUTWindow) => void, terms?: object) {
    stubProducts()
    stubSubscriptions({ statusCode: 200, body: [subscription] })
    visitAuthenticatedPage(path, setup, terms)
    cy.wait('@subscriptions')
}

function openDialog() {
    cy.contains('button', 'Renew for another 52 weeks').click()
    cy.get('[role="dialog"]').should('be.visible')
}

function orderButton() {
    return cy.contains('[role="dialog"] button', 'Renew for 52 weeks — pay')
}

describe('Renewing a long term subscription', () => {
    // legacy PayPal plans and Stripe ones before their schedule renew for their full period at the renewal price: no term line
    it('shows no term line when the backend has no renewal terms for the long term yet', () => {
        visitExtendable({ ...longTermSubscription, canExtendLongTerm: false, extendedUntil: null })
        cy.contains('Premium+ (Subscription)').should('be.visible')
        cy.get('[data-testid="subscription-term"]').should('not.exist')
        cy.contains('button', /Renew for another/).should('not.exist')
    })

    for (const [name, overrides] of [
        ['a 4-week subscription', { termWeeks: 4 }],
        ['a Lemon Squeezy subscription', { providerSlug: 'lemonsqueezy', renewalPrice: 0, currency: null }],
        ['a subscription without a real term end', { currentTermEndsAt: '0001-01-01T00:00:00Z' }]
    ] as const) {
        it(`shows no term for ${name}`, () => {
            visitExtendable({ ...longTermSubscription, ...overrides })
            cy.contains('Premium+ (Subscription)').should('be.visible')
            cy.get('[data-testid="subscription-term"]').should('not.exist')
            cy.contains('button', /Renew for another/).should('not.exist')
        })
    }

    it('names the term end, the continuation price and the renewal button', () => {
        visitExtendable()
        cy.get('[data-testid="subscription-term"]')
            .should('contain.text', `Your 52-week term ends on ${date(termEnd)}.`)
            .and('contain.text', `Afterwards it continues every 4 weeks at ${formatMoney(11.5, 'EUR')} incl. VAT.`)
        cy.contains('button', 'Renew for another 52 weeks').should('be.visible')
    })

    it('uses the real term length and the net tax wording', () => {
        visitExtendable({ ...longTermSubscription, termWeeks: 13, extensionTaxTreatment: 'net' })
        cy.get('[data-testid="subscription-term"]')
            .should('contain.text', 'Your 13-week term ends on')
            .and('contain.text', `${formatMoney(11.5, 'EUR')} + applicable tax.`)
        cy.contains('button', 'Renew for another 13 weeks').should('be.visible')
    })

    it('shows prices, tax and the declaration, and orders only after it is ticked', () => {
        visitExtendable()
        openDialog()
        cy.get('[role="dialog"]')
            .should('contain.text', `for ${formatMoney(99, 'EUR')} incl. VAT`)
            .and('contain.text', `every 4 weeks at ${formatMoney(11.5, 'EUR')} incl. VAT`)
        cy.get('[role="dialog"]')
            .should('contain.text', 'Renew Premium+ for another 52 weeks')
            .and('contain.text', `from ${date(termEnd)}`)
            .and('contain.text', `Charged on ${date(termEnd)} to the payment method of this subscription.`)
            .and('contain.text', 'The renewed term runs for its full 52 weeks; cancelling takes effect at its end.')
        cy.get('[data-testid="purchase-declaration"]').should('contain.text', 'Start my purchased access immediately.')
        orderButton().should('contain.text', formatMoney(99, 'EUR')).and('be.disabled')
        cy.get('[data-testid="purchase-declaration"] input[type="checkbox"]').check()
        orderButton().should('not.be.disabled')
    })

    it('leaves out the tax wording for prices without tax', () => {
        visitExtendable({ ...longTermSubscription, extensionTaxTreatment: 'none' })
        openDialog()
        orderButton().should('have.text', ` Renew for 52 weeks — pay ${formatMoney(99, 'EUR')}`)
    })

    it('renews with Stripe at once, sends the declaration and shows the renewal after the refresh', () => {
        let extended = false
        cy.intercept('GET', '**/api/premium/subscription', request =>
            request.reply({ body: [extended ? { ...longTermSubscription, canExtendLongTerm: false, extendedUntil } : longTermSubscription] })
        ).as('subscriptions')
        cy.intercept('POST', '**/api/premium/subscription/long-term/extend', request => {
            extended = true
            request.reply({ body: { extended: true, approvalUrl: null, termEndsAt: termEnd, extendedUntil } })
        }).as('extend')
        stubProducts()
        visitAuthenticatedPage()
        cy.wait('@subscriptions')
        openDialog()
        cy.get('[data-testid="purchase-declaration"] input[type="checkbox"]').check()
        orderButton().click()
        cy.wait('@extend').its('request.body').should('deep.include', {
            immediatePerformanceRequested: true,
            withdrawalConsequenceAcknowledged: true,
            declarationVersion: 'test-declaration'
        })
        cy.get('[role="dialog"]').should('not.exist')
        cy.contains('Your subscription was renewed for another 52 weeks.').should('be.visible')
        cy.get('[data-testid="subscription-term"]')
            .should('contain.text', `Renewed for another 52 weeks until ${date(extendedUntil)}; afterwards it continues every 4 weeks.`)
        cy.contains('button', /Renew for another/).should('not.exist')
    })

    it('sends PayPal buyers to the approval page', () => {
        const approvalUrl = 'https://www.paypal.com/approve/test'
        cy.intercept('POST', '**/api/premium/subscription/long-term/extend', {
            body: { extended: false, approvalUrl, termEndsAt: termEnd, extendedUntil }
        }).as('extend')
        visitExtendable({ ...longTermSubscription, providerSlug: 'paypal' }, '/account', window => {
            cy.stub(window, 'open').as('open')
        })
        openDialog()
        cy.get('[data-testid="purchase-declaration"] input[type="checkbox"]').check()
        cy.get('[role="dialog"]').should('contain.text', `You approve it with PayPal now; PayPal charges it on ${date(termEnd)}.`)
        orderButton().click()
        cy.wait('@extend')
        cy.get('@open').should('have.been.calledWith', approvalUrl, '_self')
        orderButton().should('be.disabled')
        cy.contains('[role="dialog"]', 'Processing…').should('be.visible')
        // back from PayPal the cached page is usable again; a pageshow that is not from the cache changes nothing
        cy.window().then(window => window.dispatchEvent(new window.PageTransitionEvent('pageshow', { persisted: false })))
        orderButton().should('be.disabled')
        cy.window().then(window => window.dispatchEvent(new window.PageTransitionEvent('pageshow', { persisted: true })))
        orderButton().should('not.be.disabled')
        cy.get('[role="dialog"]').should('not.contain.text', 'Processing…')
    })

    it('keeps the dialog open while the request is in flight', () => {
        cy.intercept('POST', '**/api/premium/subscription/long-term/extend', { delay: 1500, statusCode: 400, body: { slug: 'extension_unavailable', message: 'Not renewable' } }).as('extend')
        visitExtendable()
        openDialog()
        cy.get('[data-testid="purchase-declaration"] input[type="checkbox"]').check()
        orderButton().click()
        cy.get('[role="dialog"]').find('button.btn-close').should('not.exist')
        cy.get('body').type('{esc}')
        cy.get('[role="dialog"]').should('be.visible')
        cy.wait('@extend')
        cy.get('[role="alert"]').should('be.visible')
    })

    it('says when the subscription cannot be renewed right now', () => {
        cy.intercept('POST', '**/api/premium/subscription/long-term/extend', { statusCode: 400, body: { slug: 'extension_unavailable', message: 'Not renewable' } }).as('extend')
        visitExtendable()
        openDialog()
        cy.get('[data-testid="purchase-declaration"] input[type="checkbox"]').check()
        orderButton().click()
        cy.wait('@extend')
        cy.get('[role="alert"]').should('contain.text', "This subscription can't be renewed for another term right now.")
        orderButton().should('not.be.disabled')
    })

    it('asks to accept the agreement first when the terms gate answers', () => {
        cy.intercept('POST', '**/api/premium/subscription/long-term/extend', { statusCode: 428, body: {} })
        visitExtendable()
        openDialog()
        cy.get('[data-testid="purchase-declaration"] input[type="checkbox"]').check()
        orderButton().click()
        cy.get('[role="alert"]').should('contain.text', 'agreement')
        cy.contains('[role="alert"] a', 'Review agreement').should('have.attr', 'href', '/premium#terms-acceptance')
    })

    it('asks to accept the agreement when the terms are not accepted yet', () => {
        visitExtendable(longTermSubscription, '/account', undefined, {
            required: false,
            canContinueWithoutAccepting: true,
            canStartNewContract: false,
            agreementId: 'test-agreement',
            agreementHash: 'test-hash',
            agreementUrl: '/terms',
            version: 'test-version',
            hash: 'test-hash',
            englishUrl: '/terms/en',
            germanUrl: '/terms/de',
            documents: []
        })
        openDialog()
        cy.get('[role="dialog"] [role="alert"]').should('contain.text', 'Accept the current agreement on the Premium page before renewing.')
        cy.contains('[role="dialog"] a', 'Review agreement').should('have.attr', 'href', '/premium#terms-acceptance')
        cy.get('[role="dialog"]').should('not.contain.text', 'temporarily unavailable')
        orderButton().should('be.disabled')
    })

    it('shows the generic failure for extension_failed and keeps the declaration', () => {
        cy.intercept('POST', '**/api/premium/subscription/long-term/extend', { statusCode: 400, body: { slug: 'extension_failed', message: 'boom' } })
        visitExtendable()
        openDialog()
        cy.get('[data-testid="purchase-declaration"] input[type="checkbox"]').check()
        orderButton().click()
        cy.get('[role="alert"]').should('contain.text', 'could not be started')
        cy.get('[data-testid="purchase-declaration"] input[type="checkbox"]').should('be.checked')
        cy.get('@subscriptions.all').should('have.length.at.least', 2)
    })

    it('asks to review the declaration on payment_error and unticks it', () => {
        cy.intercept('POST', '**/api/premium/subscription/long-term/extend', {
            statusCode: 400,
            body: { slug: 'payment_error', message: 'The Premium declaration changed. Review it and try again.' }
        })
        visitExtendable()
        openDialog()
        cy.get('[data-testid="purchase-declaration"] input[type="checkbox"]').check()
        orderButton().click()
        cy.get('[role="alert"]').should('contain.text', 'declaration changed. Review it and try again')
        cy.get('[data-testid="purchase-declaration"] input[type="checkbox"]').should('not.be.checked')
    })

    it('unticks the declaration when the server refused it', () => {
        cy.intercept('POST', '**/api/premium/subscription/long-term/extend', { statusCode: 400, body: { slug: 'invalid_service_performance_declaration', message: 'declaration changed' } })
        visitExtendable()
        openDialog()
        cy.get('[data-testid="purchase-declaration"] input[type="checkbox"]').check()
        orderButton().click()
        cy.get('[role="alert"]').should('contain.text', 'early start declaration has changed').and('contain.text', 'order the renewal again')
        cy.get('[role="alert"]').should('not.contain.text', 'payment method')
        cy.get('[data-testid="purchase-declaration"] input[type="checkbox"]').should('not.be.checked')
        orderButton().should('be.disabled')
    })
})

describe('Links to the renewal', () => {
    it('opens the dialog of the subscription the reminder mail links to', () => {
        visitExtendable(longTermSubscription, '/account?extend=long-term')
        cy.get('[role="dialog"]').should('be.visible').and('contain.text', 'Renew Premium+ for another 52 weeks')
    })

    it('shows the booked renewal instead of the dialog when the term is already renewed', () => {
        visitExtendable({ ...longTermSubscription, canExtendLongTerm: false, extendedUntil }, '/account?extend=long-term')
        cy.get('[role="dialog"]').should('not.exist')
        cy.get('[data-testid="subscription-term"]').should('contain.text', `Renewed for another 52 weeks until ${date(extendedUntil)}`)
    })

    it('only says a long term without renewal terms cannot be renewed, without terms or prices', () => {
        visitExtendable({ ...longTermSubscription, canExtendLongTerm: false }, '/account?extend=long-term')
        cy.get('[role="dialog"]').should('not.exist')
        cy.get('[data-testid="extend-link-notice"]')
            .should('have.text', "This subscription can't be renewed for another term right now.")
            .and('not.contain.text', '52')
    })

    for (const [name, overrides] of [
        ['a 4-week subscription', { termWeeks: 4 }],
        ['a Lemon Squeezy subscription', { providerSlug: 'lemonsqueezy', renewalPrice: 0, currency: null }]
    ] as const) {
        it(`only says ${name} cannot be renewed, without terms or prices`, () => {
            visitExtendable({ ...longTermSubscription, ...overrides }, '/account?extend=long-term')
            cy.get('[role="dialog"]').should('not.exist')
            cy.get('[data-testid="extend-link-notice"]')
                .should('have.text', "This subscription can't be renewed for another term right now.")
                .and('not.contain.text', '52')
        })
    }

    it('shows the PayPal confirmation', () => {
        visitExtendable(longTermSubscription, '/account?extended=long-term')
        cy.get('[data-testid="extended-paypal-notice"]').should('contain.text', 'PayPal confirmed your approval')
    })

    it('removes the link params from the url but keeps the others', () => {
        visitExtendable(longTermSubscription, '/account?extend=long-term&ref=mail')
        cy.get('[role="dialog"]').should('be.visible')
        cy.location('search').should('eq', '?ref=mail')
    })

    it('removes ?extended from the url once handled', () => {
        visitExtendable(longTermSubscription, '/account?extended=long-term')
        cy.get('[data-testid="extended-paypal-notice"]').should('be.visible')
        cy.location('search').should('eq', '')
    })
})
