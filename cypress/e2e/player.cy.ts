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

    function failSecondBidsPageOnce(response: { statusCode: number; headers?: Record<string, string>; body: unknown }) {
        let failedOnce = false
        cy.intercept('GET', '**/api/player/b876ec32e396476ba1158438d83c67d4/bids*', request => {
            const page = new URL(request.url).searchParams.get('page')
            if (page === '1' && !failedOnce) {
                failedOnce = true
                request.reply(response)
                return
            }
            request.reply(page === '0' ? data.playerBids : page === '1' ? data.playerOlderBids : [])
        }).as('bids')
    }

    function scrollToSecondBidsPage(expectedStatus: number) {
        cy.visit(player)
        cy.contains('Bids').click()
        cy.wait('@bids')
        cy.scrollTo('bottom')
        cy.wait('@bids').its('response.statusCode').should('eq', expectedStatus)
    }

    it('offers a retry when a bids page fails instead of ending the list', () => {
        // the generated client resolves error responses, their object body must not reach the list parser
        failSecondBidsPageOnce({ statusCode: 503, body: { slug: 'unavailable', message: 'Service unavailable' } })
        scrollToSecondBidsPage(503)
        cy.contains('Loading more bids failed.').should('be.visible')
        cy.contains('button', 'Try again').click()
        cy.contains('Cheap Coffee').should('be.visible')
    })

    it('shows the rate limit with its cooldown and allows a retry once it ran out', () => {
        failSecondBidsPageOnce({
            statusCode: 429,
            headers: { 'Retry-After': '2', 'Content-Type': 'text/plain' },
            body: 'API calls quota exceeded! maximum admitted 30 per 10s.'
        })
        scrollToSecondBidsPage(429)
        cy.contains('Too many requests were sent in a short time.').should('be.visible')
        cy.contains('button', /^Try again in \d s$/).should('be.disabled')
        // the list shows the cooldown, a toast with the raw rate limiter text would only repeat it
        cy.get('.Toastify__toast').should('not.exist')
        cy.contains('button', /^Try again$/).should('not.be.disabled').click()
        cy.contains('Cheap Coffee').should('be.visible')
    })

    it('keeps the cooldown when switching to auctions and back', () => {
        failSecondBidsPageOnce({ statusCode: 429, headers: { 'Retry-After': '30' }, body: 'API calls quota exceeded! maximum admitted 30 per 10s.' })
        scrollToSecondBidsPage(429)
        cy.contains('Too many requests were sent in a short time.').should('be.visible')
        cy.contains('Auctions').click()
        cy.contains('.list-group>button', '[MAYOR] Technoblade').should('be.visible')
        cy.contains('Bids').click()
        // the remounted bid list waits for the cooldown instead of requesting its first page again
        cy.contains('button', /^Try again in \d+ s$/).should('be.disabled')
        cy.get('@bids.all').should('have.length', 2)
    })

    it('loads the auctions in the browser when the server could not load them', () => {
        cy.intercept('GET', '**/api/player/cd0cc8da7fc148c280893a94e591f991/auctions*', request => {
            const page = new URL(request.url).searchParams.get('page')
            request.reply(page === '0' ? data.playerAuctions : [])
        }).as('auctions')
        cy.visit('/player/cd0cc8da7fc148c280893a94e591f991')
        cy.wait('@auctions')
        cy.contains('.list-group>button', '[MAYOR] Technoblade').should('be.visible')
        cy.contains('No auctions found').should('not.exist')
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
