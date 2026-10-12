// A shared cache keyed by URL only (Cloudflare) must never be able to store a flight payload as a page.
// The guard is experimental.validateRSCRequestHeaders (next.config.js): an RSC request whose _rsc param does not match is redirected instead of answered.
describe('RSC cache poisoning guard', () => {
    ;['/', '/flipper'].forEach(path => {
        it(`redirects an RSC request without _rsc on ${path} instead of answering with a flight body`, () => {
            cy.request({ url: path, headers: { RSC: '1' }, followRedirect: false, failOnStatusCode: false }).then(response => {
                expect(response.status).to.equal(307)
                expect(response.headers.location).to.contain('_rsc')
                expect(String(response.headers['cache-control'])).to.contain('no-store')
                expect(String(response.headers['content-type'] || '')).not.to.contain('text/x-component')
            })
        })

        it(`serves a plain document request on ${path} as html`, () => {
            cy.request({ url: path, followRedirect: false }).then(response => {
                expect(response.status).to.equal(200)
                expect(response.headers['content-type']).to.contain('text/html')
                expect(String(response.headers['cache-control'])).not.to.contain('no-store')
            })
        })
    })

    it('never bounces the router own requests of a client-side navigation', () => {
        cy.intercept({ method: 'GET', url: '**_rsc=*' }).as('rscFetch')
        cy.visit('/')
        // the first prefetch is issued by the hydrated router; a click before that is a plain document navigation
        cy.wait('@rscFetch')
        cy.get('a[href="/about"]').first().click({ force: true })
        cy.location('pathname').should('eq', '/about')
        cy.title().should('contain', 'About')
        cy.get('@rscFetch.all').should(interceptions => {
            const answered = (interceptions as unknown as any[]).filter(interception => interception.response)
            expect(answered.length, 'answered router requests').to.be.greaterThan(0)
            expect(
                answered
                    .filter(interception => interception.response.statusCode >= 300 && interception.response.statusCode < 400)
                    .map(interception => interception.request.url),
                'redirected router requests'
            ).to.deep.equal([])
            expect(
                answered.some(
                    interception =>
                        interception.response.statusCode === 200 && String(interception.response.headers['content-type']).includes('text/x-component')
                )
            ).to.equal(true)
        })
    })

    it('ends an RSC navigation to /player on the rendered home page without serving flight on a bare url', () => {
        cy.intercept({ method: 'GET', headers: { rsc: '1' } }).as('rscRequest')
        cy.visit('/')
        // the first prefetch is issued by the hydrated router; pushing before that throws
        cy.wait('@rscRequest')
        cy.window().then(win => {
            ;(win as any).next.router.push('/player')
        })
        cy.get('@rscRequest.all').should(interceptions => {
            const urls = (interceptions as unknown as any[]).map(interception => interception.request.url as string)
            expect(urls.some(url => url.includes('/player'))).to.equal(true)
        })
        cy.location('pathname').should('eq', '/')
        cy.title().should('contain', 'Skyblock Auction House History')
        cy.get('@rscRequest.all').then(interceptions => {
            const bareFlight = (interceptions as unknown as any[])
                .filter(interception => interception.response && !interception.request.url.includes('_rsc='))
                .filter(
                    interception =>
                        interception.response.statusCode === 200 && String(interception.response.headers['content-type']).includes('text/x-component')
                )
                .map(interception => interception.request.url)
            expect(bareFlight, 'flight payload served on a url without _rsc').to.deep.equal([])
        })
    })
})
