import { RETURNED_AT_PARAM } from '../../utils/PaymentConfirmation'
import { pageText, tickUntil } from '../support/clock'

// The success page after a payment provider: it waits for Payments to book the purchase before it says so.

const googleToken = 'eyJhbGciOiJub25lIn0.eyJleHAiOjQxMDI0NDQ4MDAsImVtYWlsIjoiY3lwcmVzc0BleGFtcGxlLmNvbSIsIm5hbWUiOiJDeXByZXNzIn0.signature'

// the PayPal purchase of the report: back on the page at 15:06:32 UTC, the period booked at 15:07:11
const RETURNED_AT = Date.UTC(2026, 10, 19, 15, 6, 32)
const OLD_TOPUP = { productId: 'p_cc_1800', reference: 'old-capture', amount: 1800, timeStamp: '2026-10-01T10:00:00' }
// a PayPal subscription period: the plan's coins credited and spent on it
const BOOKED_PERIOD = [
    { productId: 'l_premium', reference: 'paypal-sale-1', amount: -1800, timeStamp: '2026-11-19T15:07:11' },
    { productId: 'l_premium', reference: 'paypal-sale-1-topup', amount: 1800, timeStamp: '2026-11-19T15:07:11' }
]

beforeEach(() => {
    cy.intercept('GET', '**/command/version/**', { body: 'cypress-version' })
    cy.intercept('GET', 'https://track.coflnet.com/matomo.js*', { headers: { 'content-type': 'application/javascript' }, body: '' })
    cy.intercept('GET', 'https://accounts.google.com/gsi/client*', {
        headers: { 'content-type': 'application/javascript' },
        body: 'window.google = { accounts: { id: { initialize() {}, renderButton(container) { container.textContent = "Google sign in" }, prompt() {}, cancel() {} } } };'
    })
    cy.intercept('GET', '**/preScript.js', { headers: { 'content-type': 'application/javascript' }, body: '' })
    cy.intercept('GET', '**/api/user/terms*', { body: { required: false, canContinueWithoutAccepting: true, canStartNewContract: true } })
    cy.intercept('POST', '**/api/premium/user/owns', { body: {} }).as('owns')
})

/** answers the socket requests a logged in page makes: the token login and the CoflCoins balance */
function installAuthenticatedWebSocket(window: Cypress.AUTWindow) {
    class AuthenticatedWebSocket {
        static OPEN = 1
        readyState = AuthenticatedWebSocket.OPEN
        onopen: ((event: Event) => void) | null = null
        onmessage: ((event: MessageEvent) => void) | null = null
        onclose: ((event: CloseEvent) => void) | null = null
        onerror: ((event: Event) => void) | null = null

        constructor() {
            window.setTimeout(() => this.onopen?.(new Event('open')), 0)
        }

        send(value: string) {
            const request = JSON.parse(value)
            const response = request.type === 'loginWithToken' ? googleToken : request.type === 'getCoflBalance' ? '30000' : ''
            const data = JSON.stringify({ mId: request.mId, type: request.type, data: JSON.stringify(response), maxAge: 0 })
            window.setTimeout(() => this.onmessage?.(new MessageEvent('message', { data })), 0)
        }

        addEventListener() {}
        removeEventListener() {}
        close() {}
    }
    window.WebSocket = AuthenticatedWebSocket as unknown as typeof WebSocket
}

function visitSuccess(path: string, loggedIn: boolean, onLoad?: (window: Cypress.AUTWindow) => void) {
    cy.visit(path, {
        onBeforeLoad(window) {
            installAuthenticatedWebSocket(window)
            window.localStorage.clear()
            window.sessionStorage.clear()
            if (loggedIn) window.localStorage.setItem('googleId', googleToken)
            window.document.cookie = 'nonEssentialCookiesAllowed=false; path=/'
            onLoad?.(window)
        }
    })
}

/** fakes the page's clock (react-query polls with setInterval), starting when the buyer came back */
function fakeClock() {
    cy.clock(RETURNED_AT, ['Date', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'])
}

/** stubs the transactions with `body()` and records the page's (fake) time of every lookup */
function stubTransactions(body: () => unknown, page: () => Cypress.AUTWindow | undefined): number[] {
    const lookups: number[] = []
    cy.intercept('GET', '**/api/premium/transactions', request => {
        expect(request.headers.googletoken).to.equal(googleToken)
        lookups.push(page()?.Date.now() ?? NaN)
        request.reply({ body: body() })
    }).as('transactions')
    return lookups
}

const SLOW_HINT = '[data-testid="payment-slow"]'

describe('Payment success page', () => {
    it('waits for the payment confirmation, then shows the success state and stops polling', () => {
        let page: Cypress.AUTWindow | undefined
        let booked = false
        const ownership = { premium: { expiresAt: '2099-02-01T00:00:00Z' } }
        cy.intercept('POST', '**/api/premium/user/owns', request => request.reply({ body: booked ? ownership : {} })).as('owns')
        const lookups = stubTransactions(() => (booked ? [...BOOKED_PERIOD, OLD_TOPUP] : [OLD_TOPUP]), () => page)
        fakeClock()
        visitSuccess('/success?subscription_id=I-TEST123&ba_token=BA-1&token=EC-1', true, window => {
            page = window
        })
        cy.wait('@transactions')
        cy.contains('h2', 'Waiting for payment confirmation…').should('be.visible')
        cy.contains('Your payment provider is confirming the payment.').should('be.visible')
        // react-query hands the answer to the page in a (faked) timeout; the transactions are cross-origin here, so their Date
        // header is unreadable and the return time is the page load on the device clock
        tickUntil(() => page!.location.search.includes(`${RETURNED_AT_PARAM}=`), 'the return time is kept in the url')
        cy.location('search').should('contain', `${RETURNED_AT_PARAM}=${RETURNED_AT}`)
        tickUntil(() => lookups.length >= 2, 'the next lookup')
        cy.contains('h2', 'Waiting for payment confirmation…').should('be.visible')
        cy.contains('Payment confirmed').should('not.exist')

        cy.then(() => {
            booked = true
        })
        tickUntil(() => pageText(page!).includes('Payment confirmed'), 'the booked payment is confirmed')
        cy.contains('Waiting for payment confirmation').should('not.exist')
        // the premium and account pages read the refreshed ownership the success state links to
        cy.window().should(window => {
            const cached = window.sessionStorage.getItem('skycoflApiCache:premium-products:cypress%40example.com')
            expect(JSON.parse(cached || 'null')?.value).to.deep.equal(ownership)
        })
        cy.get('canvas').should('exist')
        cy.contains('a', 'Go to the Premium page').should('have.attr', 'href', '/premium')
        cy.contains('a', 'Go to your account').should('have.attr', 'href', '/account')

        cy.then(() => {
            const count = lookups.length
            cy.tick(120000)
            cy.wait(300)
            cy.then(() => expect(lookups).to.have.length(count))
        })
    })

    it('recognises a payment booked before the buyer came back', () => {
        let page: Cypress.AUTWindow | undefined
        stubTransactions(() => [...BOOKED_PERIOD, OLD_TOPUP], () => page)
        // reloaded half an hour later: the return time in the url still recognises the payment booked 1 s before the return
        // (a Stripe webhook can be faster than the redirect)
        cy.clock(RETURNED_AT + 30 * 60 * 1000, ['Date', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'])
        visitSuccess(`/success?returnedAt=${RETURNED_AT + 40000}`, true, window => {
            page = window
        })
        tickUntil(() => pageText(page!).includes('Payment confirmed'), 'the booked payment is confirmed')
    })

    it('reads the return time off the server clock when the device clock is fast', () => {
        let page: Cypress.AUTWindow | undefined
        const serverNow = RETURNED_AT + 1000
        // a card payment booked 30 s before the return, before the first lookup
        const cardTopUp = { productId: 's_cc_1800', reference: 'pi_1', amount: 1800, timeStamp: '2026-11-19T15:06:02' }
        cy.intercept('GET', '**/api/premium/transactions', {
            headers: { date: new Date(serverNow).toUTCString(), 'access-control-expose-headers': 'date' },
            body: [cardTopUp, OLD_TOPUP]
        }).as('transactions')
        cy.clock(RETURNED_AT + 10 * 60 * 1000, ['Date', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'])
        visitSuccess('/success', true, window => {
            page = window
        })
        cy.wait('@transactions')
        tickUntil(() => pageText(page!).includes('Payment confirmed'), 'the card payment is confirmed')
        // the page load moved onto the server clock: the server's now less the (fake) time the device spent until the answer,
        // which depends on how many clock steps ran before the response arrived; far from the device's 10 minutes ahead
        cy.location('search').should(search => {
            const returnedAt = Number(new URLSearchParams(search).get(RETURNED_AT_PARAM))
            expect(returnedAt).to.be.within(serverNow - 5000, serverNow)
        })
    })

    it('explains after a minute without confirmation that some payment methods take longer, then polls less often', () => {
        let page: Cypress.AUTWindow | undefined
        const lookups = stubTransactions(() => [OLD_TOPUP], () => page)
        fakeClock()
        visitSuccess('/success?token=5O190127TN364715T&PayerID=X', true, window => {
            page = window
        })
        cy.wait('@transactions')
        tickUntil(() => page!.Date.now() >= RETURNED_AT + 59000, 'just before a minute passed')
        cy.contains('h2', 'Waiting for payment confirmation…').should('be.visible')
        cy.get(SLOW_HINT).should('not.exist')

        tickUntil(() => !!page!.document.querySelector(SLOW_HINT), 'the hint about slower payment methods')
        cy.get(SLOW_HINT).should('contain.text', 'Some payment methods take longer to confirm').and('contain.text', 'support@coflnet.com')
        cy.get('[data-testid="payment-reference"]').should('have.text', '5O190127TN364715T')
        cy.get(SLOW_HINT).contains('a', 'Discord').should('have.attr', 'href').and('include', 'discord.gg')
        cy.contains('h2', 'Waiting for payment confirmation…').should('be.visible')

        tickUntil(() => page!.Date.now() >= RETURNED_AT + 120000, 'two minutes passed', 1000)
        cy.then(() => {
            const gaps = lookups.slice(1).map((time, index) => ({ after: lookups[index] - RETURNED_AT, gap: time - lookups[index] }))
            // every 3 s in the first minute (a lookup still in flight when the next is due is skipped), every 10 s after it
            expect(lookups.filter(time => time < RETURNED_AT + 60000).length, 'lookups in the first minute').to.be.at.least(10)
            const late = gaps.filter(({ after }) => after >= 60000)
            expect(late.length, 'lookups in the second minute').to.be.within(3, 6)
            late.forEach(({ gap }) => expect(gap).to.be.at.least(10000))
            gaps.forEach(({ gap }) => expect(gap).to.be.at.least(3000))
        })
    })

    it('asks for the account details when the return url has no reference', () => {
        let page: Cypress.AUTWindow | undefined
        stubTransactions(() => [], () => page)
        fakeClock()
        visitSuccess('/success', true, window => {
            page = window
        })
        cy.wait('@transactions')
        tickUntil(() => !!page!.document.querySelector(SLOW_HINT), 'the hint about slower payment methods', 1000)
        cy.get(SLOW_HINT).should('contain.text', 'the email address of your account and the time of your purchase')
        cy.get('[data-testid="payment-reference"]').should('not.exist')
    })

    it('asks a logged out visitor to log in instead of polling', () => {
        cy.intercept('GET', '**/api/premium/transactions', cy.spy().as('transactions'))
        visitSuccess('/success?token=EC-1', false)
        cy.contains('h2', 'Thank you for your purchase!').should('be.visible')
        cy.contains('Please log in with the account you made the purchase with to see the status of your payment.').should('be.visible')
        cy.contains('bank transfers or crypto payments').should('be.visible')
        cy.contains('Waiting for payment confirmation').should('not.exist')
        cy.contains('Payment confirmed').should('not.exist')
        cy.get('@transactions').should('not.have.been.called')
    })

    it('asks to log in again when the stored login is rejected', () => {
        cy.intercept('GET', '**/api/premium/transactions', { statusCode: 401, body: { message: 'no googletoken header' } }).as('transactions')
        visitSuccess('/success', true)
        cy.wait('@transactions')
        cy.contains('Please log in with the account you made the purchase with').should('be.visible')
    })
})
