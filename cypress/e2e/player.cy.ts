import { skyApiFixtures as data } from '../../test-fixtures/skyApi'

const player = '/player/b876ec32e396476ba1158438d83c67d4'

describe('Player page', () => {
    beforeEach(() => {
        cy.intercept('GET', '**/api/player/b876ec32e396476ba1158438d83c67d4/bids*', request => {
            const page = new URL(request.url).searchParams.get('page')
            request.reply(page === '0' ? data.playerBids : page === '1' ? data.playerOlderBids : [])
        }).as('bids')
    })

    it('opens the first auction', () => {
        cy.visit(player)
        cy.contains('.list-group>button', '[MAYOR] Technoblade').click()
        cy.location('pathname').should('eq', '/auction/73137bc47df84d31a9d8b010078ada0f')
    })

    it('opens the first bid', () => {
        cy.visit(player)
        cy.contains('Bids').click()
        cy.wait('@bids')
        cy.contains('Highest Own').should('be.visible')
        cy.contains('.list-group>button', 'Jingle Bells').click()
        cy.location('pathname').should('eq', '/auction/c5ce8b40320b4b178e53cdfb746d8953')
    })

    it('loads an older bid on the next page', () => {
        cy.visit(player)
        cy.contains('Bids').click()
        cy.wait('@bids')
        cy.scrollTo('bottom')
        cy.wait('@bids').its('request.url').should('include', 'page=1')
        cy.contains('Cheap Coffee').should('be.visible')
    })
})
