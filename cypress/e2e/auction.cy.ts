describe('Auction page', () => {
    afterEach(() => {
        // Prevents running into the rate limit
        cy.wait(10000)
    })

    it('contains relevant information', () => {
        cy.visit('/auction/73137bc47df84d31a9d8b010078ada0f')
        cy.contains('Category: Misc').should('be.visible')
        cy.contains('Reforge:None').should('be.visible')
        cy.contains('Auction Created:').should('be.visible')
        cy.contains('Item Created:').should('be.visible')
        cy.contains('Enchantments:None').should('be.visible')
        cy.contains('span', 'Captured Player:').should('be.visible')
        cy.contains('§d[MAYOR] Technoblade§f').should('be.visible')
        cy.contains('4819c569b116').should('be.visible')
        cy.contains('p', 'Soul Durability:11').parent('div').should('be.visible')
        cy.contains('§7Whitelisted§7').should('be.visible')
        cy.contains('h6', 'Starting bid: 10 Coins').should('be.visible')
        cy.get('.list-group>a').first().click()
        cy.location('pathname').should('eq', '/player/0ae0f0282ee846fea7b1606a9fdf5128')
    })
})
