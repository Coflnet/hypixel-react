describe('Player page', () => {
    it('Player auction opens', () => {
        cy.visit('/player/b876ec32e396476ba1158438d83c67d4')
        cy.contains('Highest Bid').first().click()
        cy.location().should(loc => {
            expect(loc.pathname).to.match(/.*\/auction\/73137bc47df84d31a9d8b010078ada0f/i)
        })
    })

    it('Opens last bid', () => {
        cy.visit('/player/b876ec32e396476ba1158438d83c67d4')
        switchToBids()
        cy.contains('Highest Bid').first().click()
        cy.location().should(loc => {
            expect(loc.pathname).to.match(/.*\/auction\/c5ce8b40320b4b178e53cdfb746d8953/i)
        })
    })

    it('Scroll down to older bid', () => {
        cy.visit('/player/b876ec32e396476ba1158438d83c67d4')
        switchToBids()
        for (let i = 1; i < 8; i++) {
            cy.scrollTo(0, i * 1000)
            cy.wait(1000)
        }
        cy.contains('Cheap Coffee').should('be.visible')
    })
})

function switchToBids() {
    cy.contains('Bids').click()
    cy.contains('Highest Own')
}
