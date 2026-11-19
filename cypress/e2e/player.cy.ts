import { skyApiFixtures as data } from '../../test-fixtures/skyApi'
import { recordHydrationErrors } from '../support/hydrationErrors'

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

    it('hydrates the auction end time for a visitor with another locale and time zone', () => {
        const hydrationErrors = recordHydrationErrors()
        cy.visit(player, {
            onBeforeLoad(window) {
                // a browser formats dates in its own locale and time zone, the server cannot know them
                window.Date.prototype.toLocaleDateString = () => 'LOCAL-DATE'
                window.Date.prototype.toLocaleTimeString = () => 'LOCAL-TIME'
            }
        })
        cy.contains('p', /^End of Auction: .*LOCAL-DATE/).should('exist')
        cy.wrap(hydrationErrors).should('be.empty')
    })

    it('hydrates the auction status for a visitor whose clock differs from the server', () => {
        const hydrationErrors = recordHydrationErrors()
        cy.visit(player, {
            onBeforeLoad(window) {
                // the fixture auctions ended in 2022, a browser clock before that still considers them running
                window.Date.now = () => Date.UTC(2022, 0, 1)
            }
        })
        cy.contains('.list-group>button', '[MAYOR] Technoblade').contains('.badge', 'Running').should('exist')
        cy.wrap(hydrationErrors).should('be.empty')
    })

    it('hydrates without starting the ad script for a visitor whose browser remembers a premium account', () => {
        const hydrationErrors = recordHydrationErrors()
        cy.intercept('GET', '**/s.nitropay.com/**', '').as('adScript')
        cy.intercept('GET', '**/api/filter/options*').as('filters')
        cy.visit(player, {
            onBeforeLoad(window) {
                // the server does not know the premium cache and renders the ad slots, the browser must not start the ads
                window.localStorage.setItem('lastPremiumProducts', JSON.stringify({ premium: { expiresAt: '2099-02-01T00:00:00Z' } }))
            }
        })
        cy.contains('.list-group>button', '[MAYOR] Technoblade').should('be.visible')
        cy.wrap(hydrationErrors).should('be.empty')
        // the filter request is sent by the same mount effects that would inject the ad script tag
        cy.wait('@filters')
        cy.get('script[src*="nitropay"]').should('not.exist')
        cy.get('@adScript.all').should('have.length', 0)
    })

    it('keeps the auction list when the filter options cannot be loaded', () => {
        cy.intercept('GET', '**/api/filter/options*', { forceNetworkError: true }).as('filters')
        cy.visit(player)
        cy.wait('@filters')
        // the api helper reports the failure, the page must not leave the error unhandled
        cy.contains('.Toastify__toast', 'Request-Type').should('be.visible')
        cy.contains('.list-group>button', '[MAYOR] Technoblade').should('be.visible')
    })
})
