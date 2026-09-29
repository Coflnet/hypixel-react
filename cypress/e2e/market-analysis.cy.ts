import { buildArchiveUrl } from '../../utils/Parser/URLParser'
// Imported from sellSpeedUtils (not the marketAnalysisUtils barrel) so this spec's webpack bundle
// never has to parse utils/Formatter.tsx's real JSX - see that file's top comment.
import { getSellSpeedCategory } from '../../components/MarketAnalysis/sellSpeedUtils'

const itemTag = 'HYPERION'
const bazaarItemTag = 'BOOSTER_COOKIE'

// Sell-speed buckets deliberately straddle both relative thresholds of the fixture's own
// avgSellTimeSeconds (5400s = 1.5h reference -> fast < 4050s, slow > 8100s) so the
// fast/medium/slow classification is exercised on both sides of each boundary.
const soldAnalysisFixture = {
    volumeBuckets: [
        { minPrice: 1000000, maxPrice: 2000000, avgPrice: 1500000, count: 5 },
        { minPrice: 2000000, maxPrice: 3000000, avgPrice: 2500000, count: 20 },
        { minPrice: 3000000, maxPrice: 4000000, avgPrice: 3500000, count: 8 },
        { minPrice: 4000000, maxPrice: 5000000, avgPrice: 4500000, count: 3 }
    ],
    sellSpeedBuckets: [
        { minPrice: 1000000, maxPrice: 2000000, avgPrice: 1500000, avgSellTimeSeconds: 3000, speedCategory: 'FAST', sampleCount: 12 },
        { minPrice: 2000000, maxPrice: 3000000, avgPrice: 2500000, avgSellTimeSeconds: 4200, speedCategory: 'MEDIUM', sampleCount: 20 },
        { minPrice: 3000000, maxPrice: 4000000, avgPrice: 3500000, avgSellTimeSeconds: 7500, speedCategory: 'MEDIUM', sampleCount: 8 },
        { minPrice: 4000000, maxPrice: 5000000, avgPrice: 4500000, avgSellTimeSeconds: 9000, speedCategory: 'SLOW', sampleCount: 3 }
    ],
    totalSales: 43,
    avgSellTimeSeconds: 5400,
    medianSellTimeSeconds: 3600,
    avgPrice: 2400000,
    medianPrice: 2300000,
    minPrice: 1000000,
    maxPrice: 5000000,
    binPercentage: 62.5,
    salesPerDay: 6.1,
    hourlyBreakdown: [
        { hour: 0, count: 3, avgPrice: 2000000, avgSellTimeSeconds: 1200 },
        { hour: 12, count: 8, avgPrice: 2500000, avgSellTimeSeconds: 2400 },
        { hour: 23, count: 2, avgPrice: 1800000, avgSellTimeSeconds: 900 }
    ],
    priceStdDev: 450000,
    priceCoeffVariation: 0.19,
    topSellers: []
}

const liveAnalysisFixture = {
    binCount: 15,
    auctionCount: 20,
    sellerCount: 9,
    lowestBin: 2100000,
    medianBin: 2600000,
    highestBin: 5200000,
    avgTimeOnMarketSeconds: 7200,
    medianTimeOnMarketSeconds: 5400,
    bucketRangeMax: 5000000,
    aboveRangeCount: 2,
    priceBuckets: [
        { minPrice: 2000000, maxPrice: 3000000, avgPrice: 2500000, count: 9 },
        { minPrice: 3000000, maxPrice: 4000000, avgPrice: 3500000, count: 6 }
    ],
    timeOnMarketBuckets: [
        { minPrice: 2000000, maxPrice: 3000000, avgPrice: 2500000, avgSellTimeSeconds: 1800, speedCategory: 'FRESH', sampleCount: 9 },
        { minPrice: 3000000, maxPrice: 4000000, avgPrice: 3500000, avgSellTimeSeconds: 25000, speedCategory: 'STALE', sampleCount: 6 }
    ]
}

const relatedItemFixture = [{ tag: 'ASPECT_OF_THE_END', name: 'Aspect of the End', iconUrl: 'https://sky.coflnet.com/static/icon/ASPECT_OF_THE_END' }]

function mockAuctionHouseItemPage(tag: string) {
    cy.intercept('GET', '**/api/filter/options*', [])
    cy.intercept('GET', `**/api/item/price/${tag}/history/day*`, [])
    cy.intercept('GET', '**/api/mayor*', [])
    cy.intercept('GET', `**/api/auctions/tag/${tag}/recent/overview*`, [])
    cy.intercept('GET', `**/api/item/${tag}/similar`, relatedItemFixture)
}

// Retries for the whole spec: while the item page hydrates, the price graph subtree (item filter,
// range buttons and with them the Market analysis section) exists twice in the DOM for roughly
// 100-200ms in a sizeable share of page loads, before settling to one copy. A click landing in that
// window fails with "subject contained 2 elements". Any test here can hit it, so it is handled once
// for the spec instead of per test.
Cypress.config('retries', { runMode: 2, openMode: 0 })

function toggle() {
    // Wait until the section is down to a single copy (see the retries comment above) before clicking.
    return cy.get('[data-testid="market-analysis-toggle"]').should('have.length', 1)
}

// A syntactically valid, unexpired fake JWT: payload has `sub`, `email` and `exp` far in the future
// (year 2100), matching what isValidTokenAvailable (components/GoogleSignIn/GoogleSignIn.tsx) and
// authenticatedCacheKey (api/ApiHelper.tsx) both parse out of a real google credential.
const marketAnalysisAuthToken =
    'eyJhbGciOiJub25lIn0.eyJzdWIiOiJjeXByZXNzLW1hcmtldC1hbmFseXNpcyIsImVtYWlsIjoibWFya2V0LWFuYWx5c2lzQGV4YW1wbGUuY29tIiwiZXhwIjo0MTAyNDQ0ODAwfQ==.signature'

// Same shape, but `exp` is in the past. getGoogleToken() (used by useGoogleToken/our hook) reads it
// regardless - only the backend can really say whether a token is valid, so our own code still sends
// it as the GoogleToken header. Using an already-expired token for the invalid_token scenario (rather
// than the realistic-but-async dance of a fake websocket rejecting GoogleSignIn's own background
// re-validation) keeps that test deterministic: GoogleSignIn independently treats it as logged out
// too (isValidTokenAvailable checks `exp`), so it shows a plain "Sign in" button immediately, with no
// terms/login round trip to race against.
const expiredMarketAnalysisAuthToken =
    'eyJhbGciOiJub25lIn0.eyJzdWIiOiJjeXByZXNzLW1hcmtldC1hbmFseXNpcy1leHBpcmVkIiwiZW1haWwiOiJtYXJrZXQtYW5hbHlzaXNAZXhhbXBsZS5jb20iLCJleHAiOjEwMDAwMDAwMDB9.signature'

// GoogleSignIn treats a stored, still-valid token as "already logged in" and re-validates it on
// mount (terms status, then a loginWithToken round trip over the websocket) - without stubbing that
// chain it can reject/remove the very token these tests just planted in storage. See
// requestTermsAcceptance/finishLogin in components/GoogleSignIn/GoogleSignIn.tsx.
function mockGoogleAuthValidation() {
    cy.intercept('GET', '**/api/user/terms*', {
        statusCode: 200,
        body: {
            required: false,
            canContinueWithoutAccepting: true,
            canStartNewContract: false,
            agreementId: 'skycofl',
            agreementHash: 'market-analysis-hash',
            agreementUrl: 'https://coflnet.com/legal/agreements/market-analysis-hash.json',
            version: '2026-01-01',
            hash: 'market-analysis-hash',
            englishUrl: 'https://coflnet.com/legal/versions',
            germanUrl: 'https://coflnet.com/legal/versions',
            documents: []
        }
    })
}

// GoogleSignIn's cold-start effect (wasAlreadyLoggedInThisSession) always re-validates a stored token
// over the websocket via loginWithToken (see finishLogin in GoogleSignIn.tsx) before it will consider
// itself logged in - without stubbing that round trip it rejects/removes the very token these tests
// just planted in storage.
function installAuthenticatedWebSocket(window: Cypress.AUTWindow, token: string) {
    class AuthenticatedWebSocket {
        static OPEN = 1
        readyState = 1
        onopen: ((event: Event) => void) | null = null
        onmessage: ((event: MessageEvent) => void) | null = null
        onclose: ((event: Event) => void) | null = null

        constructor() {
            window.setTimeout(() => this.onopen?.(new Event('open')), 0)
        }

        send(value: string) {
            const request = JSON.parse(value)
            const response = request.type === 'loginWithToken' ? token : ''
            window.setTimeout(() => {
                this.onmessage?.(
                    new MessageEvent('message', { data: JSON.stringify({ mId: request.mId, type: request.type, data: JSON.stringify(response), maxAge: 0 }) })
                )
            }, 0)
        }

        close() {}
    }
    window.WebSocket = AuthenticatedWebSocket as unknown as typeof WebSocket
}

/** Visits the item page with `token` already present in both storages before any app code runs. */
function visitItemPageAuthenticated(tag: string, token: string) {
    cy.visit(`/item/${tag}`, {
        onBeforeLoad(window) {
            window.localStorage.setItem('googleId', token)
            window.sessionStorage.setItem('googleId', token)
            installAuthenticatedWebSocket(window, token)
        }
    })
}

function visitItemPageSignedOut(tag: string) {
    cy.visit(`/item/${tag}`, {
        onBeforeLoad(window) {
            window.localStorage.removeItem('googleId')
            window.sessionStorage.removeItem('googleId')
        }
    })
}

describe('Market analysis premium gating (backend-driven)', () => {
    it('STEP A reproduction: a fully-premium signed-in user selecting 30 days gets the sold block, not a premium gate', () => {
        mockAuctionHouseItemPage(itemTag)
        mockGoogleAuthValidation()
        const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        cy.intercept('POST', '**/api/premium/user/owns', {
            premium: { expiresAt },
            premium_plus: { expiresAt },
            starter_premium: { expiresAt }
        })
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis*`, soldAnalysisFixture).as('soldAnalysis')
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis?days=30*`, soldAnalysisFixture).as('soldAnalysis30')
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis/live*`, { statusCode: 404, body: 'Not Found' })

        visitItemPageAuthenticated(itemTag, marketAnalysisAuthToken)
        toggle().click()
        cy.get('[data-testid="market-analysis-body-content"]', { timeout: 10000 }).should('exist')
        cy.get('[data-testid="market-analysis-period-30"]').click()

        cy.wait('@soldAnalysis30', { timeout: 10000 })
            .its('request.headers')
            .should('have.property', 'googletoken', marketAnalysisAuthToken)
        cy.get('[data-testid="market-analysis-sold"]', { timeout: 10000 }).should('be.visible')
        cy.contains(/requires/i).should('not.exist')
    })

    it('a signed-in user with a valid token whose backend refuses for premium sees "Go to Premium"', () => {
        mockAuctionHouseItemPage(itemTag)
        mockGoogleAuthValidation()
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis*`, soldAnalysisFixture)
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis?days=30*`, {
            statusCode: 400,
            body: { slug: 'premium_required', message: 'Analyzing 30 days of history requires Starter Premium.', trace: null }
        }).as('soldAnalysis30')
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis/live*`, { statusCode: 404, body: 'Not Found' })

        visitItemPageAuthenticated(itemTag, marketAnalysisAuthToken)
        toggle().click()
        cy.get('[data-testid="market-analysis-body-content"]', { timeout: 10000 }).should('exist')
        cy.get('[data-testid="market-analysis-period-30"]').click()
        cy.wait('@soldAnalysis30')

        cy.contains(/requires/i).should('be.visible')
        cy.contains('button', 'Go to Premium').should('be.visible')
        cy.contains('button', /^Sign in$/).should('not.exist')
    })

    it('shows the sign-in variant (not "Go to Premium") when the backend says the token is invalid', () => {
        mockAuctionHouseItemPage(itemTag)
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis*`, soldAnalysisFixture)
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis?days=30*`, {
            statusCode: 400,
            body: { slug: 'invalid_token', message: 'The provided credential token could not be validated by google.', trace: null }
        }).as('soldAnalysis30')
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis/live*`, { statusCode: 404, body: 'Not Found' })

        // An expired token, localStorage only: our own hook still sends it (getGoogleToken reads
        // sessionStorage-or-localStorage and doesn't pre-validate; only the backend can really know),
        // reproducing "a token exists but the backend rejects it". GoogleSignIn treats an expired
        // localStorage token as logged out via wasAlreadyLoggedInThisSession - but it ALSO has a
        // separate effect that sets isLoggedIn=true whenever sessionStorage alone has *any* value,
        // regardless of expiry (see the props.rerenderFlip effect in GoogleSignIn.tsx), which would
        // suppress its "Sign in" button if the token were seeded into sessionStorage too.
        cy.visit(`/item/${itemTag}`, {
            onBeforeLoad(window) {
                window.localStorage.setItem('googleId', expiredMarketAnalysisAuthToken)
            }
        })
        toggle().click()
        cy.get('[data-testid="market-analysis-body-content"]', { timeout: 10000 }).should('exist')
        cy.get('[data-testid="market-analysis-period-30"]').click()
        cy.wait('@soldAnalysis30')

        cy.contains(/requires/i).should('be.visible')
        cy.contains('button', 'Go to Premium').should('not.exist')
        cy.contains('button', /^Sign in$/).should('be.visible')
    })

    it('sends no request for a premium-gated range and shows the sign-in variant when there is no token', () => {
        mockAuctionHouseItemPage(itemTag)
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis*`, soldAnalysisFixture).as('soldAnalysis')
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis/live*`, { statusCode: 404, body: 'Not Found' })

        visitItemPageSignedOut(itemTag)
        toggle().click()
        cy.wait('@soldAnalysis') // the free 7-day default range, fetched anonymously
        cy.get('[data-testid="market-analysis-period-30"]').click()

        cy.wait(300)
        cy.get('@soldAnalysis.all').should('have.length', 1)
        cy.contains(/requires/i).should('be.visible')
        cy.contains('button', /^Sign in$/).should('be.visible')
    })

    it('shows the error state with Retry - never "not enough sales" - for an unrelated non-200 response', () => {
        mockAuctionHouseItemPage(itemTag)
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis*`, { statusCode: 500, body: { message: 'boom' } }).as('soldAnalysis')
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis/live*`, { statusCode: 404, body: 'Not Found' })

        cy.visit(`/item/${itemTag}`)
        toggle().click()
        cy.wait('@soldAnalysis')

        cy.contains(/could not load/i).should('be.visible')
        cy.contains('button', 'Retry').should('be.visible')
        cy.contains(/not enough sales/i).should('not.exist')
        cy.contains(/requires/i).should('not.exist')
    })
})

describe('Market analysis buyers/sellers KPI tiles', () => {
    it('shows the Buyers and Sellers tiles when the response includes them', () => {
        mockAuctionHouseItemPage(itemTag)
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis*`, { ...soldAnalysisFixture, uniqueBuyers: 27, uniqueSellers: 19 }).as('soldAnalysis')
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis/live*`, { statusCode: 404, body: 'Not Found' })

        cy.visit(`/item/${itemTag}`)
        toggle().click()
        cy.wait('@soldAnalysis')

        cy.get('[data-testid="market-analysis-buyers-tile"]').should('be.visible').and('contain.text', '27')
        cy.get('[data-testid="market-analysis-sellers-tile"]').should('be.visible').and('contain.text', '19')
    })

    it('hides the Buyers and Sellers tiles when the response omits them (current deployed backend)', () => {
        mockAuctionHouseItemPage(itemTag)
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis*`, soldAnalysisFixture).as('soldAnalysis')
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis/live*`, { statusCode: 404, body: 'Not Found' })

        cy.visit(`/item/${itemTag}`)
        toggle().click()
        cy.wait('@soldAnalysis')

        cy.get('[data-testid="market-analysis-sold"]').should('be.visible')
        cy.get('[data-testid="market-analysis-buyers-tile"]').should('not.exist')
        cy.get('[data-testid="market-analysis-sellers-tile"]').should('not.exist')
    })
})

describe('getSellSpeedCategory', () => {
    const REFERENCE_16H = 16 * 60 * 60

    it('classifies buckets relative to the item’s own average sell time', () => {
        expect(getSellSpeedCategory(10 * 3600 + 42 * 60, REFERENCE_16H)).to.equal('fast')
        expect(getSellSpeedCategory(11 * 3600 + 22 * 60, REFERENCE_16H)).to.equal('fast')
        expect(getSellSpeedCategory(18 * 3600 + 56 * 60, REFERENCE_16H)).to.equal('medium')
        expect(getSellSpeedCategory(1 * 86400 + 2 * 3600, REFERENCE_16H)).to.equal('slow')
    })

    it('falls back to medium when the reference average is missing, zero or not finite', () => {
        expect(getSellSpeedCategory(3600, 0)).to.equal('medium')
        expect(getSellSpeedCategory(3600, NaN)).to.equal('medium')
    })
})

describe('Market analysis relative sell-speed rendering', () => {
    it('classifies sell-speed tiles and shows the computed legend thresholds for the item’s own average', () => {
        const relativeSpeedFixture = {
            ...soldAnalysisFixture,
            avgSellTimeSeconds: 16 * 60 * 60,
            sellSpeedBuckets: [
                { minPrice: 1000000, maxPrice: 2000000, avgPrice: 1500000, avgSellTimeSeconds: 10 * 3600 + 42 * 60, speedCategory: 'FAST', sampleCount: 4 },
                { minPrice: 2000000, maxPrice: 3000000, avgPrice: 2500000, avgSellTimeSeconds: 11 * 3600 + 22 * 60, speedCategory: 'FAST', sampleCount: 6 },
                { minPrice: 3000000, maxPrice: 4000000, avgPrice: 3500000, avgSellTimeSeconds: 18 * 3600 + 56 * 60, speedCategory: 'MEDIUM', sampleCount: 5 },
                { minPrice: 4000000, maxPrice: 5000000, avgPrice: 4500000, avgSellTimeSeconds: 26 * 3600, speedCategory: 'SLOW', sampleCount: 2 }
            ]
        }
        mockAuctionHouseItemPage(itemTag)
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis*`, relativeSpeedFixture).as('soldAnalysis')
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis/live*`, { statusCode: 404, body: 'Not Found' })

        cy.visit(`/item/${itemTag}`)
        toggle().click()
        cy.wait('@soldAnalysis')

        cy.get('[data-testid="market-analysis-sell-speed-tile"][data-speed-category="fast"]').should('have.length', 2)
        cy.get('[data-testid="market-analysis-sell-speed-tile"][data-speed-category="medium"]').should('have.length', 1)
        cy.get('[data-testid="market-analysis-sell-speed-tile"][data-speed-category="slow"]').should('have.length', 1)

        cy.contains('Fast (< 12h)').should('be.visible')
        cy.contains('Medium (12h – 1d)').should('be.visible')
        cy.contains('Slow (> 1d)').should('be.visible')
    })
})

describe('Market analysis section', () => {
    it('starts collapsed and sends no analysis request before the section is expanded', () => {
        mockAuctionHouseItemPage(itemTag)
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis*`, soldAnalysisFixture).as('soldAnalysis')
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis/live*`, liveAnalysisFixture).as('liveAnalysis')

        cy.visit(`/item/${itemTag}`)

        toggle().should('be.visible').and('have.attr', 'aria-expanded', 'false').and('have.attr', 'aria-controls', 'market-analysis-body')
        cy.contains('[data-testid="market-analysis"]', 'Market analysis').should('be.visible')
        cy.get('[data-testid="market-analysis-body-content"]').should('not.exist')

        // give any accidental eager fetch a chance to fire before asserting it never did
        cy.wait(300)
        cy.get('@soldAnalysis.all').should('have.length', 0)
        cy.get('@liveAnalysis.all').should('have.length', 0)
    })

    it('fetches sold and live analysis in parallel on first expand and renders both blocks', () => {
        mockAuctionHouseItemPage(itemTag)
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis*`, soldAnalysisFixture).as('soldAnalysis')
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis/live*`, liveAnalysisFixture).as('liveAnalysis')

        cy.visit(`/item/${itemTag}`)
        toggle().click()

        cy.wait(['@soldAnalysis', '@liveAnalysis'])
        toggle().should('have.attr', 'aria-expanded', 'true')

        cy.get('[data-testid="market-analysis-sold"]').should('be.visible')
        cy.get('[data-testid="market-analysis-volume-chart"]').should('be.visible')

        cy.get('[data-testid="market-analysis-sell-speed-tile"]').should('have.length', 4)
        cy.get('[data-testid="market-analysis-sell-speed-tile"][data-speed-category="fast"]').should('have.length', 1)
        cy.get('[data-testid="market-analysis-sell-speed-tile"][data-speed-category="medium"]').should('have.length', 2)
        cy.get('[data-testid="market-analysis-sell-speed-tile"][data-speed-category="slow"]').should('have.length', 1)

        cy.get('[data-testid="market-analysis-live"]').should('be.visible').and('contain.text', '15 BINs').and('contain.text', '20 auctions').and('contain.text', '9 sellers')
        cy.get('[data-testid="market-analysis-live-distribution-chart"]').should('be.visible')
        cy.get('[data-testid="market-analysis-time-on-market-tile"]').should('have.length', 2)
    })

    // Every `<Col lg={N}>` in the tiles/chart Rows also carries `xs={12}`: react-bootstrap's <Col>
    // only adds the base `.col` class when given NO breakpoint props at all (see useCol in
    // node_modules/react-bootstrap/esm/Col.js - it pushes `!spans.length && bsPrefix`), so a bare
    // `<Col lg={8}>` has no width-related class below `lg`. A manual mobile screenshot during this
    // change showed the chart cards rendering blank; adding `xs={12}` is the objectively-correct fix
    // for that missing base class either way. I could not, however, reproduce a measurable width
    // difference in an automated check (a getBoundingClientRect assertion passed identically with and
    // without `xs={12}`) - the flex item still resolved to a sensible width in practice - so the blank
    // render was more likely echarts not having painted yet under this machine's heavy background load
    // than a permanent layout collapse. No regression test added for this one since I could not
    // demonstrate a reliable repro; `xs={12}` is kept regardless as more correct Bootstrap usage.

    it('still renders the sold block when live analysis 404s, without an error message', () => {
        mockAuctionHouseItemPage(itemTag)
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis*`, soldAnalysisFixture).as('soldAnalysis')
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis/live*`, { statusCode: 404, body: 'Not Found' }).as('liveAnalysis')

        cy.visit(`/item/${itemTag}`)
        toggle().click()
        cy.wait(['@soldAnalysis', '@liveAnalysis'])

        cy.get('[data-testid="market-analysis-sold"]').should('be.visible')
        cy.get('[data-testid="market-analysis-live"]').should('not.exist')
        cy.get('.Toastify__toast').should('not.exist')
        cy.contains(/could not load/i).should('not.exist')
    })

    it('does not refetch when the section is collapsed and re-expanded', () => {
        mockAuctionHouseItemPage(itemTag)
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis*`, soldAnalysisFixture).as('soldAnalysis')
        cy.intercept('GET', `**/api/item/price/${itemTag}/analysis/live*`, liveAnalysisFixture).as('liveAnalysis')

        cy.visit(`/item/${itemTag}`)
        toggle().click()
        cy.wait(['@soldAnalysis', '@liveAnalysis'])
        // Let any in-flight hydration-mismatch recovery (see the retries comment at the top of this spec) settle before
        // the next click, rather than paying that cost on every toggle() call across the whole spec.
        cy.wait(250)

        toggle().click()
        cy.get('[data-testid="market-analysis-body-content"]').should('not.exist')

        toggle().click()
        cy.get('[data-testid="market-analysis-sold"]').should('be.visible')

        cy.get('@soldAnalysis.all').should('have.length', 1)
        cy.get('@liveAnalysis.all').should('have.length', 1)
    })

    it('shows Related items below the FAQ and no longer shows the old Similar items heading', () => {
        mockAuctionHouseItemPage(itemTag)
        cy.visit(`/item/${itemTag}`)

        cy.contains('h3', 'Related items').should('be.visible')
        cy.contains('Similar items').should('not.exist')
        cy.contains('Hide similar items').should('not.exist')

        // "below the FAQ": the FAQ heading must precede the Related items heading in DOM order
        cy.get('h2, h3').then($headings => {
            const texts = $headings.toArray().map(el => el.textContent?.trim() || '')
            const faqIndex = texts.findIndex(t => t === 'FAQ')
            const relatedIndex = texts.findIndex(t => t.startsWith('Related items'))
            expect(faqIndex, 'FAQ heading found').to.be.greaterThan(-1)
            expect(relatedIndex, 'Related items heading found').to.be.greaterThan(faqIndex)
        })
    })

    it('shows an Archive link next to Wiki for an auction-house item and preserves the active filter', () => {
        mockAuctionHouseItemPage(itemTag)
        cy.visit(`/item/${itemTag}?Stars=5-5`)

        cy.contains('a, button', 'Wiki').should('be.visible')
        cy.contains('a', 'Archive')
            .should('have.attr', 'title', 'Query archived auctions')
            .invoke('attr', 'href')
            .should('equal', buildArchiveUrl(itemTag, { Stars: '5-5' }))
    })

    it('hides the Archive link for a bazaar item', () => {
        cy.intercept('GET', `**/api/bazaar/${bazaarItemTag}/history/*`, [])
        cy.intercept('GET', '**/api/mayor*', [])
        cy.intercept('GET', `**/api/item/${bazaarItemTag}/similar`, [])

        cy.visit(`/item/${bazaarItemTag}`)

        cy.contains('a, button', 'Wiki').should('be.visible')
        cy.contains('a', 'Archive').should('not.exist')
    })

    it('updates the Archive link href reactively when the item filter changes after load', () => {
        // Reuses the proven "Add Filter -> sharpness -> fill level" interaction from filter.cy.ts
        // (`sends item filters as top-level price history query parameters` uses the same flow) so
        // the item filter actually changes through the real UI, after the initial page load - not by
        // revisiting with a different URL - to prove OptionsMenu's Archive link is reactive rather
        // than only reading the filter once at mount.
        cy.intercept('GET', '**/api/item/price/ASPECT_OF_THE_DRAGON/history/day*', [])
        cy.intercept('GET', '**/api/mayor*', [])
        cy.intercept('GET', '**/api/auctions/tag/ASPECT_OF_THE_DRAGON/recent/overview*', [])
        cy.intercept('GET', '**/api/item/ASPECT_OF_THE_DRAGON/similar', [])

        cy.visit('/item/ASPECT_OF_THE_DRAGON')

        const initialHref = buildArchiveUrl('ASPECT_OF_THE_DRAGON', {})
        cy.contains('a', 'Archive').invoke('attr', 'href').should('equal', initialHref)

        cy.contains('Add Filter').click()
        cy.get('input[placeholder="Add filter"]').type('shar')
        cy.contains('a', /sharpness/i).click()
        cy.get('form').contains(/SharpnessNone1234567Please fill the filter or remove it/i).find('input').type('5')

        // Read back whatever flat filter param(s) setFilterIntoUrlParams actually wrote, then assert
        // the Archive link matches buildArchiveUrl applied to that real filter - this is what "stays
        // in sync" means, independent of the exact key/value the ItemFilter UI assigns.
        cy.location('search', { timeout: 10000 }).should(search => {
            expect(new URLSearchParams(search).toString().length, 'a filter was written into the URL').to.be.greaterThan(0)
        })
        cy.location('search').then(search => {
            const params = new URLSearchParams(search)
            params.delete('range')
            const filter: Record<string, string> = {}
            params.forEach((value, key) => {
                filter[key] = value
            })
            expect(Object.keys(filter).length, 'a filter param was added to the URL').to.be.greaterThan(0)

            const expectedHref = buildArchiveUrl('ASPECT_OF_THE_DRAGON', filter)
            expect(expectedHref, 'the new href differs from the pre-filter href').not.to.equal(initialHref)
            cy.contains('a', 'Archive').invoke('attr', 'href').should('equal', expectedHref)
        })
    })
})

describe('buildArchiveUrl', () => {
    it('carries the filter as flat query params the archive page filter can prefill from', () => {
        expect(buildArchiveUrl('HYPERION')).to.equal('/item/HYPERION/archive')
        expect(buildArchiveUrl('HYPERION', {})).to.equal('/item/HYPERION/archive')

        const href = buildArchiveUrl('HYPERION', { Stars: '5-5', Reforge: 'Heroic' })
        // Regression guard for the RecentAuctions link this replaced, which produced `archive??...`
        expect(href.match(/\?/g)?.length, 'exactly one "?" in the URL').to.equal(1)

        const params = new URL(href, 'http://localhost').searchParams
        const filter: Record<string, string> = {}
        params.forEach((value, key) => {
            filter[key] = value
        })
        // getItemFilterFromUrl treats every query param as a filter key, so a wrapper param like
        // `filter=<base64>` would prefill the archive page with a bogus filter
        expect(filter).to.deep.equal({ Stars: '5-5', Reforge: 'Heroic' })
    })
})
