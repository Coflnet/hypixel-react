import { recordHydrationErrors } from '../support/hydrationErrors'

describe('Startpage favorites', () => {
    it('hydrates the startpage of a visitor with stored favorites', () => {
        const hydrationErrors = recordHydrationErrors()
        cy.intercept('GET', '**/api/prices/change*', [])
        cy.visit('/', {
            onBeforeLoad(window) {
                window.localStorage.setItem('userSettings', JSON.stringify({ favoriteItems: JSON.stringify([{ tag: 'HYPERION', name: 'Hyperion' }]) }))
            }
        })
        cy.contains('section[aria-label="Favorite items summary"]', 'Hyperion').should('be.visible')
        cy.wrap(hydrationErrors).should('be.empty')
    })
})
