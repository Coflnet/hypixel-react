// Hydration on a starved CI runner can take longer than Cypress' 4s default before the range selector settles.
const PAGE_READY_TIMEOUT = 30000

describe('Bazaar price range', () => {
    it('falls back to the default time span when the url range is not offered for bazaar items', () => {
        cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/history/*', [
            { timestamp: '2026-09-01T12:00:00Z', buy: 12000000, sell: 11900000 },
            { timestamp: '2026-09-01T12:05:00Z', buy: 12000000, sell: 11900000 }
        ]).as('history')
        cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/snapshot*', { statusCode: 503, body: 'Unavailable' })
        cy.intercept('GET', '**/api/mayor*', [])

        // "active" only exists for auction house items, e.g. when the range is carried over from one
        cy.visit('/item/BOOSTER_COOKIE?range=active')

        cy.contains('label', '1 Day', { timeout: PAGE_READY_TIMEOUT }).should('have.class', 'btn-primary')
        cy.location('search').should('not.include', 'range=')
        cy.wait('@history', { timeout: PAGE_READY_TIMEOUT }).its('request.url').should('match', /\/history\/day$/)
        cy.get('.echarts-for-react canvas').should('be.visible')
    })
})
