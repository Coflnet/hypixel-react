describe('search', () => {

    // basic search bar
    it('check search bar', () => {
        cy.visit('/')
        cy.get('input.searchBar', {
            timeout: 15000
        }).type('Diamond')
        cy.get('div.list-group')
            .should('contain', 'Diamond')
        cy.get('img.search-result-icon')
            .first()
            .should('be.visible')

        cy.get('button.list-group-item')
            .first()
            .click()

        // check if diagram is visible
        cy.get('div.graph-canvas-container')
            .should('be.visible')
    })
})