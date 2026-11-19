// cypress/integration/item.spec.js
describe('Item page', () => {
    it('opens item with sharpness 5', () => {
        cy.intercept('GET', '**/api/auctions/tag/ASPECT_OF_THE_DRAGON/recent/overview*', [{
            uuid: '11111111111141118111111111111111',
            seller: 'b56f36a615e04380b042de1bf6c577d6',
            playerName: 'Fixture seller',
            price: 50000,
            end: '2022-09-18T23:08:56Z'
        }]).as('recentSales')
        cy.visit('/item/ASPECT_OF_THE_DRAGON')
        cy.wait('@recentSales')
        cy.contains('Add Filter').click()
        cy.get('input[placeholder="Add filter"]').type('shar')
        cy.contains('a', /sharpness/i).click()
        cy.get('form').contains(/SharpnessNone1234567Please fill the filter or remove it/i).find('input').type('5')
        cy.contains(/ended.*ago/i).click()
        cy.url().should('match', /.*\/auction\/.*/i)
        cy.contains('Sharpness 5').should('be.visible')
    })

    it('sends item filters as top-level price history query parameters', () => {
        cy.intercept('GET', '**/api/item/price/HYPERION/history/day*', request => {
            if (new URL(request.url).searchParams.has('StartingBid')) {
                request.alias = 'filteredPriceHistory'
            }
        })
        cy.visit('/item/HYPERION?StartingBid=%3C60m')

        cy.wait('@filteredPriceHistory').then(({ request }) => {
            let params = new URL(request.url).searchParams
            expect(params.get('StartingBid')).to.equal('<60m')
            expect(params.has('filters')).to.equal(false)
        })
    })
})
