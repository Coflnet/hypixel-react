describe('Profitable craft page', () => {
    it('works', () => {
        cy.visit('/crafts')
        cy.contains('The top 3 crafts can only be seen with starter premium or betterYou Cheated the ').should('be.visible')
        cy.contains('button', 'Crafting Cost').click()
        cy.contains('h3', 'Recipe').should('be.visible')
        cy.contains(/\)[\.,\d]* Coins.*/).should('be.visible')
    })
})
