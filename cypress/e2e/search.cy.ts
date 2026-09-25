describe('Search', () => {
    it('search player technoblade with special player search query', () => {
        cy.intercept('GET', '**/api/search/player%20technoblade*', [{ id: 'b876ec32e396476ba1158438d83c67d4', name: 'Technoblade', type: 'player' }]).as(
            'playerSearch'
        )
        cy.visit('/')
        cy.get('[placeholder="Search player/item"]').click().type('player technoblade{enter}')
        cy.wait('@playerSearch')
        cy.url().should('include', '/player/b876ec32e396476ba1158438d83c67d4')
        cy.contains('Technoblade').should('be.visible')
    })

    it('search item sheep pet', { defaultCommandTimeout: 10000 }, () => {
        cy.intercept('GET', '**/api/search/sheep%20pet*', [{ id: 'PET_SHEEP', name: 'Sheep', type: 'item', tier: 'LEGENDARY' }]).as('itemSearch')
        cy.visit('/')
        cy.get('[placeholder="Search player/item"]').click().type('sheep pet{enter}')
        cy.wait('@itemSearch')
        cy.url().should('match', /\/item\/PET_SHEEP(\?.*)?$/)
        cy.contains('Sheep').should('be.visible')
    })

    it('search for grappling hook and open reference', () => {
        cy.intercept('GET', '**/api/auctions/tag/GRAPPLING_HOOK/recent/overview*', [
            {
                uuid: 'b1960063255f4910b15ae3908c081891',
                seller: 'b56f36a615e04380b042de1bf6c577d6',
                playerName: 'Fixture seller',
                price: 50000,
                end: '2026-09-18T23:08:56Z'
            }
        ]).as('recentSales')
        cy.visit('/item/GRAPPLING_HOOK')
        cy.wait('@recentSales')
        cy.contains(/ended.*ago/i)
            .first()
            .click()
        cy.location('pathname').should('equal', '/auction/b1960063255f4910b15ae3908c081891')
        cy.contains('Enchantments:None').should('be.visible')
        cy.contains('button', 'Compare to ended auctions').click()
        cy.get('.modal-title').should('have.text', 'Similar auctions from the past')
    })

    it('search aspect of the dragon from auction page', () => {
        cy.intercept('GET', '**/api/search/aspect%20of%20the%20d*', [
            { id: 'ASPECT_OF_THE_DRAGON', name: 'Aspect of the Dragons', type: 'item', tier: 'LEGENDARY' }
        ]).as('itemSearch')
        cy.visit('/auction/06f2c2033f4749708fbf921abfdddbf5')
        cy.get('[placeholder="Search player/item"]').click().type('aspect of the d{enter}')
        cy.wait('@itemSearch')
        cy.location('pathname').should('equal', '/item/ASPECT_OF_THE_DRAGON')
    })
})
