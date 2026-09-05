import { getChartZoomTimestamp } from '../../utils/GraphUtils'

const snapshot = {
    productId: 'BOOSTER_COOKIE',
    timeStamp: '2026-09-01T12:00:00Z',
    buyPrice: 12000000,
    sellPrice: 11900000,
    buyOrders: [],
    sellOrders: []
}

function visitItem(onBeforeLoad?: (window: Cypress.AUTWindow) => void) {
    cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/history/*', [
        { timestamp: '2026-09-01T12:00:00Z', buy: 12000000, sell: 11900000 },
        { timestamp: '2026-09-01T12:05:00Z', buy: 12000000, sell: 11900000 }
    ]).as('history')
    cy.intercept('GET', '**/api/mayor*', [])
    cy.visit('/item/BOOSTER_COOKIE', { onBeforeLoad })
}

describe('Bazaar snapshot recovery', () => {
    it('selects a valid timestamp at the right edge and with a single data point', () => {
        const timestamps = [Date.parse('2026-09-01T12:00:00Z'), Date.parse('2026-09-01T12:05:00Z')]
        expect(getChartZoomTimestamp(timestamps, { start: 99, end: 100 })?.getTime()).to.equal(timestamps[1])
        expect(getChartZoomTimestamp([timestamps[0]], { start: 0, end: 100 })?.getTime()).to.equal(timestamps[0])
        expect(getChartZoomTimestamp(timestamps, { start: 0, end: 0 })?.getTime()).to.equal(timestamps[0])
    })

    it('does not create snapshot dates from missing or invalid chart data', () => {
        expect(getChartZoomTimestamp([], { start: 0, end: 100 })).to.equal(undefined)
        expect(getChartZoomTimestamp([NaN], { start: 0, end: 100 })).to.equal(undefined)
        expect(getChartZoomTimestamp([0], { start: NaN, end: 100 })).to.equal(undefined)
    })

    it('ignores invalid chart timestamps and keeps the item page usable', () => {
        cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/snapshot*', snapshot).as('snapshot')
        visitItem()
        cy.wait('@snapshot')
        cy.contains('(Insta) Buy information').should('be.visible')
        cy.window().then(window => {
            window.document.dispatchEvent(new window.CustomEvent('bazaarSnapshotUpdate', { detail: { timestamp: new window.Date(NaN) } }))
        })
        // Allow the snapshot's 100 ms debounce to process the chart event.
        cy.wait(250)
        cy.contains('Invalid time value').should('not.exist')
        cy.contains('(Insta) Buy information').should('be.visible')
        cy.contains('label', '1 Hour').click()
        cy.location('search').should('include', 'range=hour')
    })

    it('lets users retry failed order data without leaving the item page', () => {
        cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/snapshot*', { statusCode: 503, body: 'Unavailable' }).as('failedSnapshot')
        visitItem()
        cy.wait('@failedSnapshot')
        cy.wait('@history')
        cy.get('.echarts-for-react canvas').should('be.visible')
        cy.contains('Could not update Bazaar order data.').should('be.visible')
        cy.contains('h1', 'Booster Cookie').should('be.visible')
        cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/snapshot*', snapshot).as('snapshot')
        cy.contains('button', 'Retry snapshot').click()
        cy.wait('@snapshot')
        cy.contains('(Insta) Buy information').should('be.visible')
        cy.contains('Could not update Bazaar order data.').should('not.exist')
    })

    it('offers a page retry after an unexpected client error', () => {
        cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/snapshot*', snapshot).as('snapshot')
        visitItem(window => {
            const getItem = window.Storage.prototype.getItem
            window.Storage.prototype.getItem = function (key) {
                if (key === 'bazaarGraphLegendSelection') throw new window.Error('Temporary chart error')
                return getItem.call(this, key)
            }
        })
        cy.contains('Unable to load this page').should('be.visible')
        cy.contains('summary', 'Technical details').click()
        cy.get('pre').should('contain.text', 'Temporary chart error')
        cy.contains('button', 'Retry page').click()
        cy.wait('@snapshot')
        cy.contains('(Insta) Buy information').should('be.visible')
        cy.contains('Unable to load this page').should('not.exist')
    })
})
