describe('Forge flip page', () => {
    afterEach(() => {
        // Prevents running into the rate limit
        cy.wait(10000)
    })

    it('opens the forge input breakdown', { defaultCommandTimeout: 15000 }, () => {
        cy.visit('/forge')
        cy.contains('Select a forge flip to see its inputs and the cheapest way to source them').should('be.visible')
        cy.contains('No-wait flips only').should('be.visible')
        cy.get('#forge-no-wait').click().should('be.checked')
        cy.get('.tooltipWrapper .list-group-item').first().click()
        cy.contains('h3', 'Combined shopping list').should('be.visible')
        cy.contains('Selected input cost').should('be.visible')
        cy.contains('Potential profit').should('be.visible')
        cy.contains('h3', 'Recipe breakdown').scrollIntoView().should('be.visible')
        cy.get('#modal-no-wait-costs').should('be.checked')
        cy.get('#forge-no-wait').should('be.checked')
        cy.contains('button', 'Compare costs').first().click()
        cy.get('.popover').within(() => {
            cy.contains('NPC + buy orders (~30 min)').should('be.visible')
            cy.contains('NPC + insta-buy').should('be.visible')
            cy.contains('NPC shop').should('be.visible')
            cy.contains('td', 'Buy order (~30 min)').parent().contains('Skipped')
        })
    })
})
