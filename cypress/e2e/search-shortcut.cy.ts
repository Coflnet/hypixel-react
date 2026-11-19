function stubSearch() {
    cy.intercept('GET', '**/api/item/search/**', []).as('itemSearch')
    cy.intercept('GET', '**/api/search/**', []).as('fullSearch')
}

describe('Global search shortcuts', () => {
    beforeEach(stubSearch)

    it('Ctrl+K focuses the search bar', () => {
        cy.visit('/')
        cy.get('#search-bar').focus().blur()
        cy.get('#search-bar').should('not.be.focused')
        cy.get('body').type('{ctrl}k')
        cy.get('#search-bar').should('be.focused')
    })

    it('"/" focuses the search bar', () => {
        cy.visit('/')
        cy.get('#search-bar').focus().blur()
        cy.get('body').type('/')
        cy.get('#search-bar').should('be.focused')
        cy.get('#search-bar').should('have.value', '')
    })

    it('keeps "/" as text when typed inside the search bar', () => {
        cy.visit('/')
        cy.get('#search-bar').type('a/b')
        cy.get('#search-bar').should('have.value', 'a/b')
    })

    it('Ctrl+K on a page without a search bar opens the home page and focuses the bar', () => {
        cy.visit('/about')
        cy.get('#search-bar').should('not.exist')
        cy.get('body').type('{ctrl}k')
        cy.location('pathname').should('equal', '/')
        cy.get('#search-bar').should('be.focused')
    })
})
