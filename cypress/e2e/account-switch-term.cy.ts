import { formatMoney } from '../../utils/PricingUtils'
import { formatTermDate } from '../../utils/SubscriptionTermSwitch'

const googleToken = 'eyJhbGciOiJub25lIn0.eyJleHAiOjQxMDI0NDQ4MDAsImVtYWlsIjoiY3lwcmVzc0BleGFtcGxlLmNvbSIsIm5hbWUiOiJDeXByZXNzIn0.signature'

beforeEach(() => {
    cy.then(() => Cypress.automation('remote:debugger:protocol', { command: 'Network.clearBrowserCache' }))
    cy.intercept('GET', '**/api/premium/slots', { body: [] })
    cy.intercept('GET', '**/api/premium/subscription/providers*', { statusCode: 404, body: {} })
    cy.intercept('GET', '**/api/premium/discount/auto*', { statusCode: 204 })
    cy.intercept('GET', '**/api/premium/country', { body: { country: 'DE' } })
    cy.intercept('GET', '**/command/version/**', { body: 'cypress-version' })
    cy.intercept('GET', 'https://track.coflnet.com/matomo.js*', { headers: { 'content-type': 'application/javascript' }, body: '' })
    cy.intercept('GET', '**/preScript.js', { headers: { 'content-type': 'application/javascript' }, body: '' })
    cy.intercept(
        { resourceType: 'image', url: /^https:\/\// },
        {
            headers: { 'content-type': 'image/svg+xml' },
            body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'
        }
    )
    cy.intercept('GET', '**/api/user/terms*', {
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
    cy.intercept('GET', '**/api/premium/transactions', { body: [] })
    cy.intercept('POST', '**/api/premium/user/owns', { body: {} })
})

/** the websocket login the account page waits for, answered without a server */
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
                    new MessageEvent('message', { data: JSON.stringify({ mId: request.mId, type: request.type, data: JSON.stringify(response), maxAge: 0 }) })
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

const accessEnd = '2026-12-02T00:00:00Z'
const yearEnd = '2027-12-13T00:00:00Z'
const quarterEnd = '2027-03-15T00:00:00Z'

const subscription = {
    externalId: 'sub-4',
    endsAt: null,
    productName: 'premium_plus',
    paymentAmount: 11.53,
    renewsAt: accessEnd,
    createdAt: '2026-11-04T00:00:00Z',
    providerSlug: 'stripe',
    termWeeks: 4,
    canResume: true,
    canChangePlan: false,
    currency: 'EUR',
    currentTermEndsAt: accessEnd,
    canExtendLongTerm: false,
    extendedUntil: null
}

const blackweek = { code: 'BLACKWEEK', name: 'Blackweek sale', amountType: 'percent', amount: 50, expiresAt: '2026-11-30T23:00:00Z' }

const yearTerm = {
    weeks: 52,
    productSlug: 'premium_plus-year',
    title: 'Premium+ 52 weeks',
    regularPrice: 115.06,
    chargedNow: 57.52,
    currency: 'EUR',
    taxTreatment: 'included',
    promotion: blackweek,
    currentAccessEndsAt: accessEnd,
    newAccessEndsAt: yearEnd,
    carriedOverDays: 12,
    firstRenewalAt: yearEnd,
    renewsAsProductSlug: 'premium_plus',
    renewalPrice: 11.53,
    renewalWeeks: 4
}

const quarterTerm = {
    ...yearTerm,
    weeks: 13,
    productSlug: 'premium_plus-quarter',
    title: 'Premium+ 13 weeks',
    regularPrice: 32.5,
    chargedNow: 32.5,
    promotion: null,
    newAccessEndsAt: quarterEnd,
    firstRenewalAt: quarterEnd
}

function options(terms: object[], extra: object = {}) {
    return { subscriptionId: 'sub-4', currentWeeks: 4, currentAccessEndsAt: accessEnd, unavailableReason: null, pending: null, terms, ...extra }
}

const unavailable = options([], { currentWeeks: 52, unavailableReason: 'no_longer_term' })

function switchResult(status: string, extra: object = {}) {
    return {
        switched: status === 'completed',
        status,
        approvalUrl: null,
        weeks: 52,
        productSlug: 'premium_plus-year',
        chargedNow: 57.52,
        currency: 'EUR',
        taxTreatment: 'included',
        promotionCode: 'BLACKWEEK',
        accessUntil: yearEnd,
        firstRenewalAt: yearEnd,
        renewsAsProductSlug: 'premium_plus',
        renewalPrice: 11.53,
        renewalWeeks: 4,
        ...extra
    }
}

const money = (value: number) => formatMoney(value, 'EUR')
const date = (value: string) => formatTermDate(value)

/** stubs the term options with `respond` (called per request, so a test can change them) */
function stubTerms(respond: () => object) {
    cy.intercept('GET', '**/api/premium/subscription/sub-4/terms', request => request.reply({ body: respond() })).as('terms')
}

let listRequests = 0

/** stubs the subscription list with `respond` (called per request) and counts its requests */
function stubSubscriptions(respond: () => object = () => subscription) {
    listRequests = 0
    cy.intercept('GET', '**/api/premium/subscription', request => {
        listRequests++
        request.reply({ body: [respond()] })
    }).as('subscriptions')
}

/** the list was loaded again after `count` requests, at once (not by the premium refresh polling every 5 seconds) */
function expectListReloadedAfter(count: () => number) {
    cy.wrap(null, { timeout: 1_500 }).should(() => expect(listRequests).to.be.greaterThan(count()))
}

/** the premium refresh only polls visible pages: hidden, the list loads again only when the switch asks for it */
function hidePage(window: Cypress.AUTWindow) {
    Object.defineProperty(window.document, 'visibilityState', { configurable: true, get: () => 'hidden' })
}

/** stubs POST …/term with the answers in order, the last one repeating */
function stubSwitch(...answers: { statusCode?: number; body: object }[]) {
    let call = 0
    cy.intercept('POST', '**/api/premium/subscription/sub-4/term', request => {
        request.reply(answers[Math.min(call++, answers.length - 1)])
    }).as('switch')
}

function visitAccount(path = '/account', setup?: (window: Cypress.AUTWindow) => void) {
    cy.visit(path, {
        onBeforeLoad(window) {
            installAuthenticatedWebSocket(window)
            setup?.(window)
        }
    })
    cy.wait('@subscriptions')
}

const stubOpen = (window: Cypress.AUTWindow) => cy.stub(window, 'open').as('open')
const dialog = () => cy.get('[role="dialog"]')
const confirmButton = () => cy.contains('[role="dialog"] .modal-footer button', /Pay |Choose a term/)
const declaration = () => cy.get('[data-testid="purchase-declaration"] input[type="checkbox"]')

function confirm() {
    declaration().check()
    confirmButton().should('not.be.disabled').click()
}

describe('Switching a subscription to a longer term', () => {
    it('advertises the sale, states what is charged and kept, and switches at once with Stripe', () => {
        let switched = false
        let listRequestsAtSwitch = 0
        stubSubscriptions(() => (switched ? { ...subscription, termWeeks: 52 } : subscription))
        stubTerms(() => (switched ? unavailable : options([quarterTerm, yearTerm])))
        cy.intercept('POST', '**/api/premium/subscription/sub-4/term', request => {
            switched = true
            listRequestsAtSwitch = listRequests
            request.reply({ body: switchResult('completed') })
        }).as('switch')
        visitAccount('/account', hidePage)

        cy.contains('button', 'Save 50% with the Blackweek sale: switch to 52 weeks').click()
        dialog().should('be.visible').and('contain.text', 'Switch Premium+ to a longer term')
        dialog()
            .should('contain.text', 'The switch happens immediately and the new term is charged today.')
            .and('contain.text', 'It is paid with the payment method of this subscription (your bank may ask you to confirm it on Stripe).')
            .and('contain.text', 'Nothing is refunded: the days you have already paid for are kept')
        cy.get('[data-testid="term-option-52"]')
            .should('contain.text', `${money(57.52)} incl. VAT today (Blackweek sale, instead of ${money(115.06)}).`)
            .and('contain.text', `Your current period's remaining 12 days are kept, not refunded: your access then runs until ${date(yearEnd)}.`)
            .and('contain.text', `After that it continues every 4 weeks at ${money(11.53)} incl. VAT until you cancel.`)
            .find('input[type="radio"]')
            .should('be.checked')
        // access ends are dates without a time of day
        cy.get('[data-testid="term-option-52"]')
            .invoke('text')
            .should('not.match', /\d:\d\d/)
        cy.get('[data-testid="term-option-13"]')
            .should('contain.text', `${money(32.5)} incl. VAT today.`)
            .and('not.contain.text', 'instead of')
            .and('contain.text', `your access then runs until ${date(quarterEnd)}.`)

        // the declaration is required, the button names the chosen term and its charge
        confirmButton()
            .should('be.disabled')
            .and('contain.text', `Pay ${money(57.52)} incl. VAT today and switch to 52 weeks`)
        declaration().check()
        cy.get('[data-testid="term-option-13"] input[type="radio"]').check()
        confirmButton()
            .should('not.be.disabled')
            .and('contain.text', `Pay ${money(32.5)} incl. VAT today and switch to 13 weeks`)
        cy.get('[data-testid="term-option-52"] input[type="radio"]').check()
        confirmButton().click()

        cy.wait('@switch')
            .its('request.body')
            .then(body => {
                expect(body).to.deep.include({ weeks: 52, expectedChargedNow: 57.52 })
                expect(body.declaration).to.deep.include({
                    immediatePerformanceRequested: true,
                    withdrawalConsequenceAcknowledged: true,
                    declarationVersion: 'test-declaration'
                })
            })
        dialog().should('not.exist')
        cy.contains(`Switched to 52 weeks. Your access runs until ${date(yearEnd)}.`)
            .should('be.visible')
            .invoke('text')
            .should('not.match', /\d:\d\d/)
        expectListReloadedAfter(() => listRequestsAtSwitch)
        cy.get('[data-testid="term-switch-entry"]').should('not.exist')
    })

    it('without a sale offers the plain switch and sends PayPal buyers only to PayPal', () => {
        const netQuarter = { ...quarterTerm, taxTreatment: 'net', carriedOverDays: 0 }
        const approvalUrl = 'https://www.paypal.com/checkoutnow?token=switch'
        stubSubscriptions(() => ({ ...subscription, providerSlug: 'paypal' }))
        stubTerms(() => options([netQuarter]))
        stubSwitch(
            { body: switchResult('approval_required', { approvalUrl: 'https://www.paypal.com.example.net/checkoutnow' }) },
            { body: switchResult('approval_required', { approvalUrl }) }
        )
        visitAccount('/account', stubOpen)

        cy.contains('button', 'Switch to a longer term').click()
        dialog().should('contain.text', 'You approve the payment with PayPal now.').and('not.contain.text', 'sale')
        cy.get('[data-testid="term-option-13"]')
            .should('contain.text', `${money(32.5)} + applicable tax today.`)
            .and('contain.text', `Your access then runs until ${date(quarterEnd)}.`)
            .and('not.contain.text', 'kept')
            .find('input[type="radio"]')
            .should('be.checked')

        confirm()
        cy.wait('@switch')
        cy.get('[role="dialog"] [role="alert"]').should('contain.text', 'The payment page could not be opened.')
        cy.get('@open').should('not.have.been.called')

        confirm()
        cy.wait('@switch')
        cy.get('@open').should('have.been.calledWith', approvalUrl, '_self')
        confirmButton().should('be.disabled')
        dialog().should('contain.text', 'Processing…')
    })

    it('sends Stripe buyers to confirm the payment on an https Stripe page', () => {
        const paymentUrl = 'https://checkout.stripe.com/c/pay/switch'
        stubSubscriptions()
        stubTerms(() => options([yearTerm]))
        stubSwitch(
            { body: switchResult('payment_required', { approvalUrl: 'http://checkout.stripe.com/c/pay/switch' }) },
            { body: switchResult('payment_required', { approvalUrl: paymentUrl }) }
        )
        visitAccount('/account', stubOpen)
        cy.contains('button', 'switch to 52 weeks').click()
        confirm()
        cy.wait('@switch')
        cy.get('[role="dialog"] [role="alert"]').should('contain.text', 'The payment page could not be opened.')
        confirm()
        cy.wait('@switch')
        cy.get('@open').should('have.been.calledOnceWith', paymentUrl, '_self')
    })

    it('shows a processing switch, polls it, offers the terms again when the payment failed and refreshes the list once switched', () => {
        let state: 'offer' | 'processing' | 'done' = 'offer'
        let listRequestsAtDone = 0
        stubSubscriptions(() => (state === 'done' ? { ...subscription, termWeeks: 52 } : subscription))
        stubTerms(() => {
            if (state === 'offer') return options([yearTerm])
            if (state === 'processing') return options([], { pending: switchResult('processing') })
            listRequestsAtDone = listRequests
            return unavailable
        })
        cy.intercept('POST', '**/api/premium/subscription/sub-4/term', request => {
            state = 'processing'
            request.reply({ body: switchResult('processing') })
        }).as('switch')
        visitAccount()

        cy.contains('button', 'switch to 52 weeks').click()
        confirm()
        cy.wait('@switch')
        cy.get('[data-testid="term-switch-pending"]').should('contain.text', 'Your switch to 52 weeks is being processed. Processing, this can take a minute.')
        cy.get('[role="dialog"] input[type="radio"]').should('not.exist')

        // the provider declined: the terms are offered again
        cy.then(() => {
            state = 'offer'
        })
        dialog().contains('The payment did not go through, so your subscription has not been switched.', { timeout: 15_000 }).should('be.visible')
        cy.get('[data-testid="term-option-52"] input[type="radio"]').should('be.checked')

        confirm()
        cy.wait('@switch')
        cy.get('[data-testid="term-switch-pending"]').should('be.visible')
        cy.then(() => {
            state = 'done'
        })
        dialog().contains('The payment was processed.', { timeout: 15_000 }).should('be.visible')
        expectListReloadedAfter(() => listRequestsAtDone)
    })

    it('opens the dialog again from the Stripe and PayPal return links and shows a pending switch instead of the options', () => {
        const approvalUrl = 'https://www.paypal.com/checkoutnow?token=pending'
        let pending: object | null = null
        stubSubscriptions()
        stubTerms(() => (pending ? options([], { pending }) : options([yearTerm])))

        // back without paying: the dialog opens again, the link leaves the url
        visitAccount('/account?switch=sub-4&ref=mail')
        dialog().should('be.visible').and('contain.text', 'The payment was not completed, so your subscription has not been switched.')
        cy.location('search').should('eq', '?ref=mail')

        // a switch waiting for the PayPal approval replaces the options
        cy.then(() => {
            pending = switchResult('approval_required', { approvalUrl })
        })
        visitAccount('/account?switch=sub-4')
        cy.get('[data-testid="term-switch-pending"]').should(
            'contain.text',
            `Your switch to 52 weeks waits for your approval of ${money(57.52)} incl. VAT with PayPal.`
        )
        cy.contains('[role="dialog"] a', 'Continue to PayPal').should('have.attr', 'href', approvalUrl)
        cy.get('[role="dialog"] input[type="radio"]').should('not.exist')
        cy.get('body').type('{esc}')
        cy.contains('button', 'Switch to 52 weeks: in progress').should('be.visible')

        // back after paying: the thanks notice, the link leaves the url
        cy.then(() => {
            pending = switchResult('processing')
        })
        visitAccount('/account?switched=sub-4')
        cy.get('[data-testid="switched-notice"]').should('contain.text', 'your payment for the longer term was received')
        cy.location('search').should('eq', '')
        cy.get('[role="dialog"]').should('not.exist')
    })

    it('explains every rejection and asks for the declaration again when it was refused', () => {
        let pendingNow = false
        const cases: [number, object, string][] = [
            [400, { slug: 'renewal_due', message: 'renews soon' }, 'Your subscription renews within 24 hours; switch after the renewal.'],
            [400, { slug: 'extension_booked' }, 'already renewed for another term'],
            [400, { slug: 'term_switch_unavailable' }, "This subscription can't switch to a longer term right now."],
            [400, { message: 'subscription_not_switchable: legacy plan' }, "This subscription can't switch to a longer term right now."],
            [500, { slug: 'term_switch_failed' }, 'The switch could not be completed. Please try again.'],
            [503, {}, 'The switch could not be completed. Please try again.'],
            [428, {}, 'Accept the current agreement on the Premium page before switching.'],
            [400, { slug: 'service_performance_declaration_required' }, 'Please tick the early start declaration']
        ]
        stubSubscriptions()
        stubTerms(() => (pendingNow ? options([], { pending: switchResult('payment_required') }) : options([yearTerm])))
        stubSwitch(
            ...cases.map(([statusCode, body]) => ({ statusCode, body })),
            { statusCode: 400, body: { slug: 'invalid_service_performance_declaration' } },
            { statusCode: 409, body: { slug: 'term_switch_pending' } }
        )
        visitAccount()
        cy.contains('button', 'switch to 52 weeks').click()

        for (const [statusCode, , message] of cases) {
            confirm()
            cy.wait('@switch')
            cy.get('[role="dialog"] [role="alert"]').should('contain.text', message)
            if (statusCode === 428) cy.contains('[role="dialog"] [role="alert"] a', 'Review agreement').should('have.attr', 'href', '/premium#terms-acceptance')
        }

        confirm()
        cy.wait('@switch')
        cy.get('[role="dialog"] [role="alert"]').should('contain.text', 'The early start declaration has changed')
        declaration().should('not.be.checked')
        confirmButton().should('be.disabled')

        cy.then(() => {
            pendingNow = true
        })
        confirm()
        cy.wait('@switch')
        cy.get('[data-testid="term-switch-pending"]').should('contain.text', `Your switch to 52 weeks waits for your payment of ${money(57.52)} incl. VAT.`)
    })

    it('reloads the options when the price changed and charges the new price after confirming again, without a link notice afterwards', () => {
        let price = 57.52
        let switched = false
        stubSubscriptions(() => (switched ? { ...subscription, termWeeks: 52 } : subscription))
        stubTerms(() => (switched ? unavailable : options([{ ...yearTerm, chargedNow: price }])))
        stubSwitch({ statusCode: 400, body: { slug: 'term_switch_price_changed' } }, { body: switchResult('completed', { chargedNow: 60 }) })
        // back from Stripe without paying: the dialog opens again
        visitAccount('/account?switch=sub-4')
        dialog().should('contain.text', 'The payment was not completed')
        cy.then(() => {
            price = 60
        })
        confirm()
        cy.wait('@switch').its('request.body.expectedChargedNow').should('eq', 57.52)
        cy.get('[role="dialog"] [role="alert"]').should('contain.text', 'The price has changed. Please check the new price below and confirm again.')
        cy.get('[data-testid="term-option-52"]').should('contain.text', `${money(60)} incl. VAT today`)
        confirmButton().should('contain.text', `Pay ${money(60)} incl. VAT today`)
        let listRequestsAtSwitch = 0
        cy.then(() => {
            switched = true
            listRequestsAtSwitch = listRequests
        })
        confirm()
        cy.wait('@switch').its('request.body.expectedChargedNow').should('eq', 60)
        cy.contains('Switched to 52 weeks.').should('be.visible')
        dialog().should('not.exist')
        // the list now has the 52 week term: the row has nothing to offer and the used link says nothing
        cy.wrap(null).should(() => expect(listRequests).to.be.greaterThan(listRequestsAtSwitch))
        cy.contains('Premium+ (Subscription)').should('be.visible')
        cy.get('[data-testid="switch-link-notice"]').should('not.exist')
    })
})
