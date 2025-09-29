describe('Profitable craft page', () => {
    afterEach(() => {
        // Prevents running into the rate limit
        cy.wait(10000)
    })
    it('works', { defaultCommandTimeout: 10000 }, () => {
        cy.visit('/crafts')
        cy.contains('The top 3 crafts can only be seen with starter premium or betterYou Cheated the ').should('be.visible')
        cy.contains('button', 'Crafting Cost', { timeout: 20000 }).filter(':visible').last().click()
        cy.get('.modal.show', { timeout: 10000 }).should('be.visible').within(() => {
            cy.contains('h3', 'Recipe').should('be.visible')
            cy.contains(/\)[\.,\d]* Coins.*/).should('be.visible')
        })
    })
})