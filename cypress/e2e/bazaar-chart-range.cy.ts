describe('Bazaar chart range slider', () => {
    const prices = Array.from({ length: 12 }, (_, index) => ({
        timestamp: `2026-08-${String(index + 1).padStart(2, '0')}T00:00:00Z`,
        buy: 100 + index,
        sell: 90 + index,
        minBuy: 99 + index,
        maxBuy: 101 + index,
        minSell: 89 + index,
        maxSell: 91 + index,
        buyVolume: 1000,
        sellVolume: 1000,
        buyMovingWeek: 100,
        sellMovingWeek: 100
    }))

    it('keeps a valid chart when the range handles meet at the right edge', () => {
        let invalidTimeError: Error | undefined
        let rangeSnapshotRequests = 0
        cy.on('uncaught:exception', error => {
            if (error.message.includes('Invalid time value')) {
                invalidTimeError = error
            }
            return false
        })

        cy.intercept('GET', '**/api/bazaar/ENCHANTED_CARROT/history/day', prices).as('history')
        cy.intercept('GET', '**/api/mayor*', [])
        cy.intercept('GET', '**/api/bazaar/ENCHANTED_CARROT/snapshot*', request => {
            if (new URL(request.url).searchParams.get('timestamp') === '2026-08-12T00:00:00.000Z') {
                rangeSnapshotRequests++
            }
            request.reply({
                productId: 'ENCHANTED_CARROT',
                timestamp: '2026-08-12T00:00:00Z',
                buyOrders: [],
                sellOrders: []
            })
        })

        cy.visit('/item/ENCHANTED_CARROT?range=day')
        cy.wait('@history')
        cy.contains('h3', 'Bazaar data').parent().find('canvas').should('be.visible').then($canvas => {
            const canvas = $canvas[0]
            const bounds = canvas.getBoundingClientRect()
            const sliderY = bounds.top + bounds.height - 20
            const leftHandleX = bounds.left + bounds.width * 0.15
            const rightHandleX = bounds.left + bounds.width * 0.89

            cy.wrap($canvas)
                .trigger('mousedown', { clientX: leftHandleX, clientY: sliderY, force: true })
                .trigger('mousemove', { clientX: rightHandleX, clientY: sliderY, force: true })
                .trigger('mouseup', { clientX: rightHandleX, clientY: sliderY, force: true })
        })

        cy.wait(1000)
        cy.then(() => expect(invalidTimeError, 'range selection error').to.be.undefined)
        cy.then(() => expect(rangeSnapshotRequests, 'valid snapshot request after handle overlap').to.equal(1))
        cy.contains('h3', 'Bazaar data').parent().find('canvas').should('be.visible')
    })
})
