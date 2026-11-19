import { forgeFlips, subcraft } from '../../test-fixtures/forge'

describe('Forge flip page', () => {
    it('opens the forge input breakdown', { defaultCommandTimeout: 15000 }, () => {
        cy.intercept('GET', '**/api/flip/forge*', { body: forgeFlips }).as('forge')
        cy.intercept('GET', '**/command/version/**', { body: 'cypress-version' })
        // Keep the lazy response pending until the loading state has been observed.
        let releaseSubcrafts: () => void
        const subcraftsReady = new Cypress.Promise<void>(resolve => { releaseSubcrafts = resolve })
        cy.intercept('GET', '**/api/craft/profit*', request =>
            subcraftsReady.then(() => { request.reply({ body: [subcraft] }) })
        ).as('subcrafts')
        // SSR query data is fresh for one minute. Advance only Date so hydration
        // refetches through the fixture before we select a flip; real timers still run.
        cy.clock(Date.now() + 120000, ['Date'])
        cy.visit('/forge')
        cy.wait('@forge')
        cy.contains('Select a forge flip to see its inputs and the cheapest way to source them').should('be.visible')
        cy.contains('No-wait flips only').should('be.visible')
        cy.get('.tooltipWrapper .list-group-item').should('have.length', 2)
        cy.get('#forge-no-wait').click().should('be.checked')
        cy.get('.tooltipWrapper .list-group-item').should('have.length', 1).and('contain.text', 'Mithril Plate').click()
        cy.contains('Loading the live acquisition plan').should('be.visible').then(() => releaseSubcrafts())
        cy.wait('@subcrafts')
        cy.contains('Loading the live acquisition plan').should('not.exist')
        cy.contains('h3', 'Combined shopping list').should('be.visible')
        cy.contains('Selected input cost').should('be.visible')
        cy.contains('Potential profit').should('be.visible')
        cy.contains('h3', 'Recipe breakdown').scrollIntoView().should('be.visible')
        cy.get('#modal-no-wait-costs').should('be.checked')
        cy.get('#forge-no-wait').should('be.checked')
        cy.get('.modal-body').contains('button', 'Compare costs').click()
        cy.get('.popover').within(() => {
            cy.contains('NPC + buy orders (~30 min)').should('be.visible')
            cy.contains('NPC + insta-buy').should('be.visible')
            cy.contains('NPC shop').should('be.visible')
            cy.contains('td', 'Buy order (~30 min)').parent().contains('Skipped')
        })
    })
})
