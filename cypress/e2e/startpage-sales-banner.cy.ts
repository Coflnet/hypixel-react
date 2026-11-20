import { recordHydrationErrors } from '../support/hydrationErrors'

// The start page's sale banner: the automatic promotion of the visitor's country (GET /api/premium/discount/auto), no code needed.

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
const googleToken = 'eyJhbGciOiJub25lIn0.eyJleHAiOjQxMDI0NDQ4MDAsImVtYWlsIjoiY3lwcmVzc0BleGFtcGxlLmNvbSIsIm5hbWUiOiJDeXByZXNzIn0.signature'
const premiumPlus = { premium_plus: { expiresAt: '2099-02-01T00:00:00Z' } }

function stubSale(promotion: object | null = blackweek) {
    cy.intercept('GET', '**/api/premium/country', { body: { country: 'DE' } })
    cy.intercept('GET', '**/api/premium/subscription/providers*', {
        body: [
            { provider: 'stripe', mode: 'direct' },
            { provider: 'paypal', mode: 'direct' }
        ]
    }).as('providers')
    cy.intercept('GET', '**/api/premium/discount/auto*', promotion ? { body: promotion } : { statusCode: 204 }).as('promotion')
    cy.intercept('GET', '**/api/prices/change*', [])
}

function visitStartPage(onBeforeLoad?: (window: Cypress.AUTWindow) => void) {
    cy.visit('/', {
        onBeforeLoad(window) {
            window.localStorage.clear()
            window.sessionStorage.clear()
            onBeforeLoad?.(window)
        }
    })
}

describe('Start page sale banner', () => {
    it('advertises the running promotion and links to the plans without a code', () => {
        const hydrationErrors = recordHydrationErrors()
        stubSale()
        visitStartPage()
        cy.get('[data-testid="promotion-banner"]')
            .should('be.visible')
            .and('contain.text', 'Blackweek sale:')
            .and('contain.text', 'up to 50% OFF')
            .and('contain.text', 'your first payment — ends November 30')
            .and('contain.text', 'Applied automatically')
            .and('have.attr', 'href', '/premium#plans')
        cy.get('[data-testid="promotion-banner"]').invoke('attr', 'href').should('not.contain', 'code=')
        cy.wrap(hydrationErrors).should('be.empty')
    })

    it('shows nothing while no promotion runs', () => {
        stubSale(null)
        visitStartPage()
        cy.wait('@promotion')
        // the space held while loading (when a sale runs for most visitors) is given back
        cy.get('[data-testid="promotion-banner-placeholder"]').should('not.exist')
        cy.get('[data-testid="promotion-banner"]').should('not.exist')
    })

    it('shows nothing when the promotion has ended', () => {
        stubSale({ ...blackweek, expiresAt: '2026-01-01T00:00:00Z' })
        visitStartPage()
        cy.wait(['@promotion', '@providers'])
        cy.get('[data-testid="promotion-banner-placeholder"]').should('not.exist')
        cy.get('[data-testid="promotion-banner"]').should('not.exist')
    })

    // a subscription discount is useless to a Premium+ owner: the CoflCoins sale takes its place
    it('advertises the CoflCoins sale instead of the subscription promotion to a Premium+ owner', () => {
        // a day of the CoflCoins sale (July); only Date is changed, timers keep running
        cy.clock(new Date('2026-07-15T12:00:00Z').getTime(), ['Date'])
        // the server renders today's dates (e.g. this month's news): only the moved clock makes the page hydrate differently
        cy.on('uncaught:exception', error => !error.message.includes('Hydration failed'))
        stubSale({ ...blackweek, startsAt: '2026-01-01T00:00:00Z' })
        cy.intercept('POST', '**/api/premium/user/owns', { body: premiumPlus }).as('products')
        visitStartPage(window => {
            window.localStorage.setItem('googleId', googleToken)
            window.localStorage.setItem('lastPremiumProducts', JSON.stringify(premiumPlus))
        })
        // the banner shows either sale, so the CoflCoins one being there means the subscription promotion was left out
        cy.contains('a', 'Summer CoflCoins Sale').should('be.visible')
        cy.get('[data-testid="promotion-banner"]').should('not.exist')
    })
})
