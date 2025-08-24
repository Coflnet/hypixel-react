describe('Auction page', () => {
    afterEach(() => {
        // Prevents running into the rate limit
        cy.wait(10000)
    })

    it('contains relevant information', () => {
        cy.visit('/auction/73137bc47df84d31a9d8b010078ada0f')
        cy.contains('div', 'Category:').parent().within(() => {
            cy.contains('Misc').should('be.visible')
        })
        cy.contains('div', 'Reforge:').parent().within(() => {
            cy.contains('None').should('be.visible')
        })
        cy.contains('div', 'Auction Created:').should('be.visible')
        cy.contains('div', 'Item Created:').should('be.visible')
        cy.contains('div', 'Enchantments:').parent().within(() => {
            cy.contains('None').should('be.visible')
        })
        cy.contains('div', 'Captured Player:').should('be.visible')
        cy.contains('4819c569b116').should('be.visible')
        cy.contains('div', 'Soul Durability:').parent().within(() => {
            cy.contains('11').should('be.visible')
        })
        cy.contains('div', 'Whitelisted').should('be.visible')
        cy.contains('h6', 'Starting bid: 10 Coins').should('be.visible')
        cy.get('.list-group>a').first().click()
        cy.location('pathname').should('eq', '/player/0ae0f0282ee846fea7b1606a9fdf5128')
    })
})
