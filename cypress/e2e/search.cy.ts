const TECHNOBLADE = { id: 'b876ec32e396476ba1158438d83c67d4', name: 'Technoblade', type: 'player' }
const HYPERION = { id: 'HYPERION', name: 'Hyperion', type: 'item', tier: 'LEGENDARY' }
const VALKYRIE = { id: 'VALKYRIE', name: 'Valkyrie', type: 'item', tier: 'LEGENDARY' }
const SEARCH_INPUT = '[placeholder="Search player/item"]'

// the stubbed full search answers only after release() was called, so tests control the slow player stage
function holdFullSearch(glob: string, body: unknown[]) {
    const control = { release: () => {}, requested: false }
    cy.intercept('GET', glob, req => {
        control.requested = true
        return new Promise<void>(resolve => {
            control.release = () => {
                req.reply(body)
                resolve()
            }
        })
    }).as('fullSearch')
    return control
}

describe('Search', () => {
    it('search player technoblade with special player search query', () => {
        cy.intercept('GET', '**/api/search/player%20technoblade*', [{ id: 'b876ec32e396476ba1158438d83c67d4', name: 'Technoblade', type: 'player' }]).as(
            'playerSearch'
        )
        cy.visit('/')
        cy.get('[placeholder="Search player/item"]').click().type('player technoblade{enter}')
        cy.wait('@playerSearch')
        cy.url().should('include', '/player/b876ec32e396476ba1158438d83c67d4')
        cy.contains('Technoblade').should('be.visible')
    })

    it('search item sheep pet', { defaultCommandTimeout: 10000 }, () => {
        cy.intercept('GET', '**/api/item/search/sheep%20pet*', [{ id: 'PET_SHEEP', name: 'Sheep', type: 'item', tier: 'LEGENDARY' }]).as('itemSearch')
        cy.intercept('GET', '**/api/search/sheep%20pet*', [{ id: 'PET_SHEEP', name: 'Sheep', type: 'item', tier: 'LEGENDARY' }]).as('fullSearch')
        cy.visit('/')
        cy.get('[placeholder="Search player/item"]').click().type('sheep pet{enter}')
        cy.wait('@itemSearch')
        cy.url().should('match', /\/item\/PET_SHEEP(\?.*)?$/)
        cy.contains('Sheep').should('be.visible')
    })

    it('search for grappling hook and open reference', () => {
        cy.intercept('GET', '**/api/auctions/tag/GRAPPLING_HOOK/recent/overview*', [
            {
                uuid: 'b1960063255f4910b15ae3908c081891',
                seller: 'b56f36a615e04380b042de1bf6c577d6',
                playerName: 'Fixture seller',
                price: 50000,
                end: '2026-09-18T23:08:56Z'
            }
        ]).as('recentSales')
        cy.visit('/item/GRAPPLING_HOOK')
        cy.wait('@recentSales')
        cy.contains(/ended.*ago/i)
            .first()
            .click()
        cy.location('pathname').should('equal', '/auction/b1960063255f4910b15ae3908c081891')
        cy.contains('Enchantments:None').should('be.visible')
        cy.contains('button', 'Compare to ended auctions').click()
        cy.get('.modal-title').should('have.text', 'Similar auctions from the past')
    })

    it('search aspect of the dragon from auction page', () => {
        const dragon = [{ id: 'ASPECT_OF_THE_DRAGON', name: 'Aspect of the Dragons', type: 'item', tier: 'LEGENDARY' }]
        cy.intercept('GET', '**/api/item/search/aspect%20of%20the%20d*', dragon).as('itemSearch')
        cy.intercept('GET', '**/api/search/aspect%20of%20the%20d*', dragon).as('fullSearch')
        cy.visit('/auction/06f2c2033f4749708fbf921abfdddbf5')
        cy.get('[placeholder="Search player/item"]').click().type('aspect of the d{enter}')
        cy.wait('@itemSearch')
        cy.location('pathname').should('equal', '/item/ASPECT_OF_THE_DRAGON')
    })
    it('shows items before the slow full search and appends players below without moving the selection', () => {
        cy.intercept('GET', '**/api/item/search/hyperion*', [HYPERION]).as('itemSearch')
        const full = holdFullSearch('**/api/search/hyperion*', [HYPERION, TECHNOBLADE])
        cy.visit('/')
        cy.get(SEARCH_INPUT).click().type('hyperion')
        cy.wait('@itemSearch')
        cy.contains('.list-group-item', 'Hyperion').should('be.visible')
        cy.contains('Technoblade').should('not.exist')
        cy.then(() => expect(full.requested).to.equal(true))
        cy.then(() => full.release())
        cy.contains('.list-group-item', /^Players$/).should('be.visible')
        cy.contains('.list-group-item', 'Technoblade').should('be.visible')
        cy.contains('.list-group-item', /^Items$/).should('be.visible')
        cy.contains('.list-group-item', 'Hyperion').should('have.css', 'background-color', 'rgb(68, 68, 68)')
        cy.contains('.list-group-item', 'Technoblade').should('not.have.css', 'background-color', 'rgb(68, 68, 68)')
    })

    it('lists a matching previous player search under Recent, separate from the Items', () => {
        cy.intercept('GET', '**/api/item/search/hyperio*', [HYPERION]).as('itemSearch')
        cy.intercept('GET', '**/api/search/hyperio*', []).as('fullSearch')
        cy.visit('/', {
            onBeforeLoad(win) {
                win.localStorage.setItem(
                    'lastSearches',
                    JSON.stringify([
                        {
                            id: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
                            type: 'player',
                            route: '/player/a1b2c3d4e5f60718293a4b5c6d7e8f90',
                            tier: '',
                            dataItem: { name: 'Hyperion', iconUrl: 'https://crafatar.com/avatars/a1b2c3d4e5f60718293a4b5c6d7e8f90?size=32&overlay' }
                        }
                    ])
                )
            }
        })
        cy.get(SEARCH_INPUT).click().type('hyperio')
        cy.wait('@itemSearch')
        cy.get('.list-group-item').should($rows => {
            const texts = Array.from($rows).map(r => r.textContent?.trim() ?? '')
            expect(texts.length).to.equal(4)
            expect(texts[0]).to.match(/^Recent/i)
            expect(texts[1]).to.contain('Hyperion')
            expect(texts[2]).to.match(/^Items/i)
            expect(texts[3]).to.contain('Hyperion')
        })
        cy.get('.list-group-item').eq(1).invoke('attr', 'class').should('match', /previousSearch/)
    })

    it('prefetches the route of a hovered result', () => {
        cy.intercept('GET', '**/api/item/search/hyperi*', [HYPERION]).as('itemSearch')
        cy.intercept('GET', '**/api/search/hyperi*', []).as('fullSearch')
        cy.intercept('GET', '**/item/HYPERION*').as('prefetch')
        cy.visit('/')
        cy.get(SEARCH_INPUT).click().type('hyperi')
        cy.wait('@itemSearch')
        cy.contains('.list-group-item', 'Hyperion').trigger('mouseover').trigger('mouseenter')
        cy.wait('@prefetch')
    })

    it('opens a page shortcut with bz and Enter without waiting for the searches', () => {
        cy.intercept('GET', '**/api/item/search/bz*', []).as('itemSearch')
        cy.intercept('GET', '**/api/search/bz*', { body: [], delay: 3000 }).as('fullSearch')
        cy.visit('/')
        cy.get(SEARCH_INPUT).click().type('bz{enter}')
        cy.location('pathname').should('equal', '/bazaar')
    })

    it('shows page results with an icon and opens them without remembering them', () => {
        cy.intercept('GET', '**/api/item/search/bazaar*', []).as('itemSearch')
        cy.intercept('GET', '**/api/search/bazaar*', []).as('fullSearch')
        cy.visit('/')
        cy.get(SEARCH_INPUT).click().type('bazaar')
        cy.wait('@itemSearch')
        cy.contains('.list-group-item', /^Bazaar Flips/)
            .find('svg')
            .should('exist')
        cy.contains('.list-group-item', /^Bazaar Flips/).click()
        cy.location('pathname').should('equal', '/bazaar')
        cy.window().then(window => {
            expect(window.localStorage.getItem('lastSearches')).to.equal(null)
        })
    })

    it('opens the first item on Enter while the item request is pending without waiting for the full search', () => {
        const sheep = [{ id: 'PET_SHEEP', name: 'Sheep', type: 'item', tier: 'LEGENDARY' }]
        cy.intercept('GET', '**/api/item/search/sheep%20pet*', { body: sheep, delay: 800 }).as('itemSearch')
        const full = holdFullSearch('**/api/search/sheep%20pet*', sheep)
        cy.visit('/')
        cy.get(SEARCH_INPUT).click().type('sheep pet{enter}')
        cy.location('pathname', { timeout: 15000 }).should('equal', '/item/PET_SHEEP')
        cy.then(() => full.release())
    })

    it('waits for the full search when the item search finds nothing', () => {
        cy.intercept('GET', '**/api/item/search/technoblade*', []).as('itemSearch')
        const full = holdFullSearch('**/api/search/technoblade*', [TECHNOBLADE])
        cy.visit('/')
        cy.get(SEARCH_INPUT).click().type('technoblade{enter}')
        cy.wait('@itemSearch')
        cy.location('pathname').should('equal', '/')
        cy.wrap(null).should(() => expect(full.requested).to.equal(true))
        cy.then(() => full.release())
        cy.location('pathname', { timeout: 15000 }).should('equal', '/player/' + TECHNOBLADE.id)
    })

    it('skips section headers when navigating with the arrow keys', () => {
        cy.intercept('GET', '**/api/item/search/hyperion*', [HYPERION, VALKYRIE]).as('itemSearch')
        cy.intercept('GET', '**/api/search/hyperion*', [HYPERION, VALKYRIE, TECHNOBLADE]).as('fullSearch')
        cy.visit('/')
        cy.get(SEARCH_INPUT).click().type('hyperion')
        cy.wait('@fullSearch')
        cy.contains('.list-group-item', 'Technoblade').should('be.visible')
        cy.get(SEARCH_INPUT).type('{downarrow}')
        cy.contains('.list-group-item', 'Valkyrie').should('have.css', 'background-color', 'rgb(68, 68, 68)')
        cy.get(SEARCH_INPUT).type('{downarrow}{enter}')
        cy.location('pathname').should('equal', '/player/' + TECHNOBLADE.id)
    })

    it('offers the Skysearch link when nothing was found', () => {
        cy.intercept('GET', '**/api/item/search/zzzzqqxx*', []).as('itemSearch')
        cy.intercept('GET', '**/api/search/zzzzqqxx*', []).as('fullSearch')
        cy.visit('/')
        cy.get(SEARCH_INPUT).click().type('zzzzqqxx')
        cy.contains('No results here').should('be.visible')
        cy.contains('on Skysearch').should('be.visible')
    })

    it('answers a repeated query from the cache without a second item request', () => {
        cy.intercept('GET', '**/api/item/search/sheepcache*', [{ id: 'PET_SHEEP', name: 'Sheep', type: 'item', tier: 'LEGENDARY' }]).as('itemSearch')
        cy.intercept('GET', '**/api/search/sheepcache*', [TECHNOBLADE]).as('fullSearch')
        cy.visit('/')
        cy.get(SEARCH_INPUT).click().type('sheepcache')
        cy.wait('@itemSearch')
        cy.wait('@fullSearch')
        cy.contains('.list-group-item', 'Technoblade').should('be.visible')
        cy.get(SEARCH_INPUT).clear()
        cy.contains('.list-group-item', 'Sheep').should('not.exist')
        cy.get(SEARCH_INPUT).type('sheepcache')
        cy.contains('.list-group-item', 'Sheep').should('be.visible')
        cy.wait('@fullSearch')
        cy.get('@itemSearch.all').should('have.length', 1)
    })

    it('requests the update retrieve once when the capped full search has no players', () => {
        cy.intercept('GET', '**/api/item/search/technob*', [HYPERION]).as('itemSearch')
        cy.intercept('GET', '**/api/search/technob*', [HYPERION]).as('cappedSearch')
        cy.intercept('GET', '**/api/search/technob*update=true*', [TECHNOBLADE]).as('updateSearch')
        cy.visit('/')
        cy.get(SEARCH_INPUT).click().type('technob')
        cy.wait('@updateSearch')
        cy.contains('.list-group-item', /^Players$/).should('be.visible')
        cy.contains('.list-group-item', 'Technoblade').should('be.visible')
        cy.get('@updateSearch.all').should('have.length', 1)
        cy.get('@cappedSearch.all').should('have.length', 1)
    })
    it('offers a filter result for a multi-word phrase and opens the item with the flat filter', () => {
        cy.intercept('GET', '**/api/item/search/hyperion%20sharp%207*', [
            {
                name: 'Hyperion · Sharpness 7',
                id: 'HYPERION?sharpness=7',
                type: 'filter',
                iconUrl: 'https://sky.coflnet.com/static/icon/HYPERION',
                img: null,
                tier: 'MYTHIC',
                tag: 'HYPERION'
            },
            { name: 'Hyperion', id: 'HYPERION', type: 'item', iconUrl: 'https://sky.coflnet.com/static/icon/HYPERION', img: null, tier: 'MYTHIC', tag: 'HYPERION' }
        ]).as('itemSearch')
        cy.intercept('GET', '**/api/search/hyperion%20sharp%207*', []).as('fullSearch')
        cy.visit('/')
        cy.get(SEARCH_INPUT).click().type('hyperion sharp 7')
        cy.wait('@itemSearch')
        cy.contains('.list-group-item', 'Sharpness 7').should('contain.text', 'Hyperion').and('not.contain.text', 'Hyperion · ')
        cy.get(SEARCH_INPUT).type('{enter}')
        cy.location('pathname').should('equal', '/item/HYPERION')
        cy.location('search').should('equal', '?sharpness=7')
    })

    it('opens a remembered filter result from Recent with the flat filter url', () => {
        const filterResult = {
            name: 'Hyperion · Sharpness 7',
            id: 'HYPERION?sharpness=7',
            type: 'filter',
            iconUrl: 'https://sky.coflnet.com/static/icon/HYPERION',
            img: null,
            tier: 'MYTHIC',
            tag: 'HYPERION'
        }
        // the later (more specific) intercepts win over the generic hyperion* ones
        cy.intercept('GET', '**/api/item/search/hyperion*', [HYPERION]).as('itemSearch')
        cy.intercept('GET', '**/api/search/hyperion*', []).as('fullSearch')
        cy.intercept('GET', '**/api/item/search/hyperion%20sharp%207*', [filterResult, HYPERION]).as('filterSearch')
        cy.intercept('GET', '**/api/search/hyperion%20sharp%207*', []).as('filterFull')
        cy.visit('/')
        cy.get(SEARCH_INPUT).click().type('hyperion sharp 7')
        cy.wait('@filterSearch')
        cy.get(SEARCH_INPUT).type('{enter}')
        cy.location('search').should('equal', '?sharpness=7')
        cy.visit('/')
        cy.get(SEARCH_INPUT).click().type('hyperion')
        cy.wait('@itemSearch')
        cy.contains('.list-group-item', 'Sharpness 7').click()
        cy.location('pathname').should('equal', '/item/HYPERION')
        cy.location('search').should('equal', '?sharpness=7')
        cy.url().should('not.contain', 'object')
    })
})
