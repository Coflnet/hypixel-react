import { PAGE_SEARCH_ENTRIES, matchPages, toPageSearchResultItem, normalizePageQuery } from '../../utils/Search/PageSearchRegistry'
import { SITEMAP_CONFIG } from '../../utils/sitemap-config'

const routesOf = (query: string) => matchPages(query).map(m => m.entry.route)

describe('Page search registry', () => {
    it('matches the bazaar aliases exactly', () => {
        for (const query of ['bz', 'bazaar', 'Bazaar ', 'BAZAAR FLIPS']) {
            const matches = matchPages(query)
            expect(matches[0].entry.route, query).to.equal('/bazaar')
            expect(matches[0].exact, query).to.equal(true)
        }
    })

    it('matches short aliases of other tools exactly', () => {
        const expectations: Record<string, string> = {
            ah: '/flipper',
            notifier: '/subscriptions',
            alerts: '/subscriptions',
            lb: '/profitLeaderboard',
            changelog: '/updates'
        }
        for (const [query, route] of Object.entries(expectations)) {
            const matches = matchPages(query)
            expect(matches[0].entry.route, query).to.equal(route)
            expect(matches[0].exact, query).to.equal(true)
        }
    })

    it('does not treat a prefix as an exact match', () => {
        const matches = matchPages('baz')
        expect(matches[0].entry.route).to.equal('/bazaar')
        expect(matches[0].exact).to.equal(false)
    })

    it('supports multi-word queries', () => {
        expect(routesOf('low sup')).to.include('/lowSupply')
        expect(routesOf('bazaar flip')[0]).to.equal('/bazaar')
    })

    it('limits the amount of non exact matches', () => {
        const matches = matchPages('flip').filter(m => !m.exact)
        expect(matches.filter(m => m.entry.priority !== 'low').length).to.be.at.most(3)
        expect(matches.filter(m => m.entry.priority === 'low').length).to.be.at.most(2)
        expect(matches.length).to.be.greaterThan(0)
        expect(matches[0].entry.priority).to.not.equal('low')
    })

    it('returns nothing for too short or unknown queries', () => {
        expect(matchPages('b')).to.deep.equal([])
        expect(matchPages('')).to.deep.equal([])
        expect(matchPages('zzzzqq')).to.deep.equal([])
    })

    it('never marks low priority pages as exact', () => {
        for (const entry of PAGE_SEARCH_ENTRIES.filter(e => e.priority === 'low')) {
            const matches = matchPages(entry.title)
            expect(matches.find(m => m.entry.route === entry.route)?.exact ?? false, entry.route).to.equal(false)
        }
    })

    it('converts a match to a page search result', () => {
        const item = toPageSearchResultItem(matchPages('bz')[0])
        expect(item.id).to.equal('page:/bazaar')
        expect(item.type).to.equal('page')
        expect(item.route).to.equal('/bazaar')
        expect(item.dataItem).to.deep.equal({ name: 'Bazaar Flips', iconUrl: '' })
        expect(item.tier).to.equal('')
        expect(item.iconKey).to.equal('bazaar')
        expect(item.exact).to.equal(true)
    })

    it('only links to existing pages', () => {
        const sitemapUrls = new Set(['/', ...SITEMAP_CONFIG.staticPages.map(p => p.url)])
        // routes that exist in app/ but are intentionally not part of the sitemap
        const notInSitemap = new Set(['/updates', '/data', '/ref'])
        for (const entry of PAGE_SEARCH_ENTRIES) {
            expect(sitemapUrls.has(entry.route) || notInSitemap.has(entry.route), entry.route).to.equal(true)
        }
    })

    it('does not share an alias between two pages', () => {
        const owner = new Map<string, string>()
        for (const entry of PAGE_SEARCH_ENTRIES) {
            for (const alias of entry.aliases.map(normalizePageQuery)) {
                expect(owner.has(alias) && owner.get(alias) !== entry.route, `alias ${alias}`).to.equal(false)
                owner.set(alias, entry.route)
            }
        }
    })

    it('registers guides and wiki pages with a clean title', () => {
        const guide = PAGE_SEARCH_ENTRIES.find(e => e.route === '/guides/what-is-bazaar-flipping')
        expect(guide?.title).to.equal('What is Bazaar Flipping? Guide to Basics')
        expect(guide?.priority).to.equal('low')
        const wiki = PAGE_SEARCH_ENTRIES.find(e => e.route === '/wiki/quick-start')
        expect(wiki?.title).to.equal('Quick Start Guide')
    })
})
