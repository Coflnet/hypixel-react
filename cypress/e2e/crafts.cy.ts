import { skyApiFixtures as data } from '../../test-fixtures/skyApi'

describe('Profitable craft page', () => {
    it('opens a nested craft and its craft link', () => {
        cy.intercept('GET', '**/api/craft/acquisition/WINTER_WATER_ORB*', data.craftPlan).as('plan')
        cy.intercept('GET', '**/api/craft/WINTER_WATER_ORB/instructions', data.craftInstructions)
        cy.intercept('GET', '**/api/craft/recipe/WINTER_WATER_ORB', data.craftRecipe)
        cy.visit('/crafts')

        cy.contains('The top 3 crafts can only be seen with starter premium or better').should('be.visible')
        cy.contains('You Cheated the').should('be.visible')
        cy.contains('.tooltipWrapper .list-group-item', 'Winter Water Orb').click()
        cy.wait('@plan')
        cy.contains('Loading the live acquisition plan').should('not.exist')
        cy.contains('h3', 'Recipe').should('be.visible')
        cy.contains('h3', 'Combined shopping list').scrollIntoView().should('be.visible')
        cy.contains('Potential profit').scrollIntoView().should('be.visible')
        cy.contains(/\)[\.,\d]* Coins.*/).scrollIntoView().should('be.visible')
        cy.get('.modal-body [data-ingredient-type="craft"]').first().scrollIntoView().should('be.visible')
        cy.window().then(win => cy.stub(win, 'open').as('openCraft'))
        cy.get('.modal-body [data-ingredient-type="craft"]').first().find('img').click()
        cy.get('@openCraft').should('have.been.calledWithMatch', /\/crafts\?craft=WATER_ORB/, '_blank')
    })
})
