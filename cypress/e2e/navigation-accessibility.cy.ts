describe('Navigation accessibility', () => {
    it('opens the navigation menu with the keyboard', () => {
        cy.viewport(1000, 800)
        cy.visit('/')
        cy.get('button[aria-label="Navigation menu"]')
            .should('have.attr', 'aria-controls', 'pro-sidebar')
            .and('have.attr', 'aria-expanded', 'false')
            .focus()
        cy.press(Cypress.Keyboard.Keys.SPACE)
        cy.get('#hamburgerIcon').should('have.attr', 'aria-expanded', 'true')
        cy.get('#pro-sidebar').should('be.visible')
        cy.get('#pro-sidebar a[href="/account"]').should('be.visible')
    })

    it('opens the selected recent search with Enter and an empty query', () => {
        cy.visit('/', {
            onBeforeLoad(win) {
                win.localStorage.setItem(
                    'lastSearches',
                    JSON.stringify(
                        ['HYPERION', 'VALKYRIE'].map(id => ({
                            id,
                            type: 'item',
                            route: `/item/${id}`,
                            dataItem: { name: id === 'HYPERION' ? 'Hyperion' : 'Valkyrie', iconUrl: '/Barrier.png' }
                        }))
                    )
                )
            }
        })
        cy.get('#search-bar').click().should('have.value', '')
        cy.contains('.list-group-item', 'Valkyrie').should('be.visible')
        cy.get('#search-bar').type('{downarrow}{enter}')
        cy.location('pathname').should('equal', '/item/HYPERION')
    })

    it('offers a keyboard-focusable fallback link with an encoded search query', () => {
        cy.intercept('GET', '**/api/item/search/**', [])
        cy.intercept('GET', '**/api/search/**', [])
        cy.visit('/')
        const query = 'zzzzqqxx & test'
        cy.get('#search-bar').click().type(query)
        cy.contains('a', 'on Skysearch')
            .should('have.attr', 'href', `https://skysearch.app/search?q=${encodeURIComponent(query)}`)
            .focus()
            .should('be.focused')
    })

    for (const method of ['push', 'replace'] as const) {
        it(`leaves the top loading bar idle for router.${method}`, () => {
            cy.intercept({ method: 'GET', headers: { rsc: '1' } }).as('routerReady')
            cy.visit('/')
            cy.wait('@routerReady')
            cy.document().then(document => cy.spy(document.body, 'appendChild').as('appendToBody'))
            cy.window().its('next.router').invoke(method, '/about')
            cy.location('pathname').should('equal', '/about')
            cy.contains('h2', 'Links/Legal').should('be.visible')
            cy.get('@appendToBody').should('not.have.been.calledWithMatch', Cypress.sinon.match.has('id', 'nprogress'))
            cy.get('#nprogress').should('not.exist')
        })
    }

    it('starts the top loading bar for a Link click', () => {
        cy.intercept({ method: 'GET', headers: { rsc: '1' } }).as('routerReady')
        cy.visit('/')
        cy.wait('@routerReady')
        cy.get('button[aria-label="Navigation menu"]').click().should('have.attr', 'aria-expanded', 'true')
        cy.document().then(document => cy.spy(document.body, 'appendChild').as('appendToBody'))
        cy.get('#pro-sidebar a[href="/about"]').click()
        cy.get('@appendToBody').should('have.been.calledWithMatch', Cypress.sinon.match.has('id', 'nprogress'))
        cy.location('pathname').should('equal', '/about')
        cy.get('#nprogress').should('not.exist')
    })
})
