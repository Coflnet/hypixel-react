import { skyApiFixtures as data } from '../../test-fixtures/skyApi'

// Counts craft cards removed from the page. Records inside React's hidden streaming container are
// skipped: streaming moves nodes from there into place. So is the detail dialog, which swaps its own
// tooltips while it loads.
function countRemovedCards(window: Cypress.AUTWindow) {
    const removed = { count: 0 }
    new window.MutationObserver(records => {
        for (const record of records) {
            if (record.target instanceof window.Element && record.target.closest('[hidden], .modal')) continue
            record.removedNodes.forEach(node => {
                if (!(node instanceof window.Element)) return
                removed.count += node.matches('.tooltipWrapper') ? 1 : node.querySelectorAll('.tooltipWrapper').length
            })
        }
    }).observe(window.document, { childList: true, subtree: true })
    return removed
}

describe('Profitable craft page', () => {
    it('opens a nested craft and its craft link', () => {
        cy.intercept('GET', '**/api/craft/acquisition/WINTER_WATER_ORB*', data.craftPlan).as('plan')
        cy.intercept('GET', '**/api/craft/WINTER_WATER_ORB/instructions', data.craftInstructions)
        cy.intercept('GET', '**/api/craft/recipe/WINTER_WATER_ORB', data.craftRecipe)
        let removedCards = { count: 0 }
        cy.visit('/crafts', {
            onBeforeLoad(window) {
                removedCards = countRemovedCards(window)
            }
        })

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
        // The list used to swap every card for a spinner right after hydration, so an early click opened a
        // dialog on a card that was then thrown away and the plan was never requested.
        cy.then(() => expect(removedCards.count, 'craft cards removed').to.equal(0))
    })
})
