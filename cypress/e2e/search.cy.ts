describe('Search', () => {
    afterEach(() => {
        // Prevents running into the rate limit
        cy.wait(10000)
    })
    it('search player technoblade with special player search query', () => {
        cy.visit('/')
        cy.get('[placeholder="Search player/item"]').click().type('player technoblade{enter}')
        cy.url().should('include', '/player/b876ec32e396476ba1158438d83c67d4')
        cy.contains('Technoblade').should('be.visible')
    })

    it('search item sheep pet', () => {
        cy.visit('/')
        cy.get('[placeholder="Search player/item"]').click().type('sheep pet{enter}')
        cy.url().should('match', /\/item\/PET_SHEEP(\?.*)?$/)
        cy.contains('Sheep').should('be.visible')
    })

    it('search for grappling hook and open reference', () => {
        cy.visit('/item/GRAPPLING_HOOK')
        cy.contains(/ended.*ago/i)
            .first()
            .click()
        cy.url().should('match', /.*\/auction\/.*/i)
        cy.contains('Enchantments:None').should('be.visible')
        cy.contains('button', 'Compare to ended auctions').click()
        cy.get('.modal-title').should('have.text', 'Similar auctions from the past')
    })

    it('search aspect of the dragon from auction page', () => {
        cy.visit('/auction/06f2c2033f4749708fbf921abfdddbf5')
        cy.get('[placeholder="Search player/item"]').click().type('aspect of the d{enter}')
        cy.url().should('match', /.*\/item\/.*/i)
    })
})
