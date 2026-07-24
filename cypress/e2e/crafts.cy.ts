function openCraftWithSubcraft(index = 0): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('.tooltipWrapper .list-group-item').then(items => {
        expect(index, 'index of a visible craft with a subcraft').to.be.lessThan(items.length)
        cy.wrap(items.eq(index)).click()
        return cy.get('.modal-body').then(modal => {
            const craftIngredient = modal.find('[data-ingredient-type="craft"]').first()
            if (craftIngredient.length) {
                return cy.wrap(craftIngredient)
            }
            cy.get('.modal-header .btn-close').click()
            return openCraftWithSubcraft(index + 1)
        })
    })
}

describe('Profitable craft page', () => {
    afterEach(() => {
        // Prevents running into the rate limit
        cy.wait(10000)
    })
    it('works', { defaultCommandTimeout: 10000 }, () => {
        cy.visit('/crafts')
        cy.wait(5000)
        // Assert the two non-premium states separately instead of as one contiguous string.
        // The premium overlay may contain an active-sale discount note (see FlipListDiscountNote),
        // which would sit between these two texts and break a combined `contains` match.
        cy.contains('The top 3 crafts can only be seen with starter premium or better').should('be.visible')
        cy.contains('You Cheated the').should('be.visible')
        openCraftWithSubcraft()
        cy.contains('h3', 'Recipe').should('be.visible')
        cy.contains('h3', 'Combined shopping list').should('be.visible')
        cy.contains('Potential profit').should('be.visible')
        cy.contains(/\)[\.,\d]* Coins.*/).should('be.visible')
        cy.window().then(win => cy.stub(win, 'open').as('openCraft'))
        cy.get('[data-ingredient-type="craft"]').first().click()
        cy.get('@openCraft').should('have.been.calledWithMatch', /\/crafts\?craft=/, '_blank')
    })
})
