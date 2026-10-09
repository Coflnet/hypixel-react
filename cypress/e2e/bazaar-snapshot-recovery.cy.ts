import { appendLiveSnapshotPoint, getChartZoomTimestamp } from '../../utils/GraphUtils'

const snapshot = {
    productId: 'BOOSTER_COOKIE',
    timeStamp: '2026-09-01T12:00:00Z',
    buyPrice: 12000000,
    sellPrice: 11900000,
    buyOrders: [],
    sellOrders: []
}

function visitItem(onBeforeLoad?: (window: Cypress.AUTWindow) => void) {
    cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/history/*', [
        { timestamp: '2026-09-01T12:00:00Z', buy: 12000000, sell: 11900000 },
        { timestamp: '2026-09-01T12:05:00Z', buy: 12000000, sell: 11900000 }
    ]).as('history')
    cy.intercept('GET', '**/api/mayor*', [])
    // A build made without NEXT_PUBLIC_TEST_RUNNER injects the NitroPay ad script at hydration and shows a
    // consent banner. Keep both out of the page: a slow load of the script holds the window's load event (and
    // so cy.visit) open while the snapshot's 3s/9s quiet retries already fire, and either consent banner (the
    // NitroPay one, or the site's own cookie banner when NitroPay is absent) covers the page's buttons.
    cy.intercept('https://s.nitropay.com/**', { statusCode: 200, body: '' })
    cy.setCookie('nonEssentialCookiesAllowed', 'true')
    cy.visit('/item/BOOSTER_COOKIE', { onBeforeLoad })
}

describe('Bazaar snapshot recovery', () => {
    it('selects a valid timestamp at the right edge and with a single data point', () => {
        const timestamps = [Date.parse('2026-09-01T12:00:00Z'), Date.parse('2026-09-01T12:05:00Z')]
        expect(getChartZoomTimestamp(timestamps, { start: 99, end: 100 })?.getTime()).to.equal(timestamps[1])
        expect(getChartZoomTimestamp([timestamps[0]], { start: 0, end: 100 })?.getTime()).to.equal(timestamps[0])
        expect(getChartZoomTimestamp(timestamps, { start: 0, end: 0 })?.getTime()).to.equal(timestamps[0])
    })

    it('does not create snapshot dates from missing or invalid chart data', () => {
        expect(getChartZoomTimestamp([], { start: 0, end: 100 })).to.equal(undefined)
        expect(getChartZoomTimestamp([NaN], { start: 0, end: 100 })).to.equal(undefined)
        expect(getChartZoomTimestamp([0], { start: NaN, end: 100 })).to.equal(undefined)
    })

    it('ignores invalid chart timestamps and keeps the item page usable', () => {
        cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/snapshot*', snapshot).as('snapshot')
        visitItem()
        cy.wait('@snapshot')
        cy.contains('(Insta) Buy information').should('be.visible')
        cy.window().then(window => {
            window.document.dispatchEvent(new window.CustomEvent('bazaarSnapshotUpdate', { detail: { timestamp: new window.Date(NaN) } }))
        })
        // Allow the snapshot's 100 ms debounce to process the chart event.
        cy.wait(250)
        cy.contains('Invalid time value').should('not.exist')
        cy.contains('(Insta) Buy information').should('be.visible')
        cy.contains('label', '1 Hour').click()
        cy.location('search').should('include', 'range=hour')
    })

    it('lets users retry failed order data without leaving the item page', () => {
        // A persistent 503 burns through the quiet retry schedule (3s, then 6s) before the panel
        // finally shows the error - this is the "give up" end of that schedule, test below covers
        // the "a transient failure recovers quietly" end.
        cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/snapshot*', { statusCode: 503, body: 'Unavailable' }).as('failedSnapshot')
        visitItem()
        cy.wait('@failedSnapshot')
        cy.wait('@history')
        cy.get('.echarts-for-react canvas').should('be.visible')
        cy.contains('Could not update Bazaar order data.').should('not.exist')
        cy.contains('Could not update Bazaar order data.', { timeout: 15000 }).should('be.visible')
        cy.contains('h1', 'Booster Cookie').should('be.visible')
        cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/snapshot*', snapshot).as('snapshot')
        cy.contains('button', 'Retry snapshot').click()
        cy.wait('@snapshot')
        cy.contains('(Insta) Buy information').should('be.visible')
        cy.contains('Could not update Bazaar order data.').should('not.exist')
    })

    it('retries a transient failure quietly and recovers before the error state ever shows', () => {
        let attempt = 0
        cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/snapshot*', request => {
            attempt++
            // Destroying the connection (same simulation recent-auctions-recovery.cy.ts uses for a
            // dropped request) surfaces as a network-level fetch rejection - the reported iPhone
            // Safari "Load failed" - on the very first attempt only.
            if (attempt === 1) return request.destroy()
            request.alias = 'recoveredSnapshot'
            request.reply(snapshot)
        })
        visitItem()
        cy.wait('@history')
        // Quiet means quiet: no error notice and no toast while the retry is still pending.
        cy.contains('Could not update Bazaar order data.').should('not.exist')
        cy.get('.Toastify__toast').should('not.exist')
        cy.wait('@recoveredSnapshot', { timeout: 8000 })
        cy.contains('(Insta) Buy information').should('be.visible')
        cy.contains('Could not update Bazaar order data.').should('not.exist')
        cy.get('.Toastify__toast').should('not.exist')
    })

    it('keeps auto-refreshing after a failed attempt instead of stopping until a manual retry', () => {
        let recovered = false
        cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/snapshot*', request => {
            if (!recovered) return request.reply({ statusCode: 503, body: 'Unavailable' })
            request.alias = 'recoveredPoll'
            request.reply(snapshot)
        })
        visitItem()
        cy.wait('@history')
        cy.contains('Could not update Bazaar order data.', { timeout: 15000 }).should('be.visible')
        // Flip the backend healthy without the user doing anything. Auto-refresh used to depend on a
        // successful snapshot to re-arm its own timer, so a failed attempt stopped it dead until
        // "Retry snapshot" was clicked - if that regressed, this wait times out.
        cy.then(() => {
            recovered = true
        })
        cy.wait('@recoveredPoll', { timeout: 25000 })
        cy.contains('(Insta) Buy information').should('be.visible')
        cy.contains('Could not update Bazaar order data.').should('not.exist')
    })

    it('reports the outage toast only once across repeated failed poll cycles', () => {
        const bazaarSnapshotErrorLogs: string[] = []
        cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/snapshot*', { statusCode: 503, body: 'Unavailable' })
        // apiErrorHandler's diagnostic console.error line only fires when getBazaarSnapshot's
        // shouldReportError predicate says so - spying on it is a timing-proof way to count reports,
        // since the rendered .Toastify__toast element auto-dismisses after a few seconds and can't be
        // counted reliably across a ~30s span.
        visitItem(window => {
            const originalError = window.console.error.bind(window.console)
            window.console.error = (...args: unknown[]) => {
                const [first] = args
                if (typeof first === 'string' && first.includes('"event":"web.api.error"') && first.includes('"requestType":"getBazaarSnapshot"')) {
                    bazaarSnapshotErrorLogs.push(first)
                }
                originalError(...args)
            }
        })
        cy.wait('@history')
        cy.contains('Could not update Bazaar order data.', { timeout: 15000 }).should('be.visible')
        // The toast is visible right after the first outage is detected...
        cy.get('.Toastify__toast').should('have.length', 1)
        cy.wrap(bazaarSnapshotErrorLogs).should('have.length', 1)
        // ...but react-toastify auto-dismisses it after a few seconds, so the DOM can't be polled for
        // "still exactly one" across a long span - the second failed cycle below is checked via the
        // (timing-proof) console-log count instead.
        // The panel keeps polling (previous bug: it would have stopped dead here) and burns through
        // another full quiet-retry schedule roughly 25s later - that second failed cycle of the same
        // ongoing outage must not report again.
        cy.wait(27000)
        cy.wrap(bazaarSnapshotErrorLogs).should('have.length', 1)
    })

    it('drops a stale retry instead of letting it clobber a newer timestamp', () => {
        const historicTimestampIso = '2020-06-15T12:00:00.000Z'
        const historicSnapshot = {
            productId: 'BOOSTER_COOKIE',
            timeStamp: historicTimestampIso,
            buyPrice: 500,
            sellPrice: 400,
            buyOrders: [],
            sellOrders: []
        }
        let requestsForInitialTimestamp = 0
        cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/snapshot*', request => {
            if (String(request.query.timestamp).startsWith('2020-06-15')) {
                request.alias = 'historicSnapshot'
                return request.reply(historicSnapshot)
            }
            requestsForInitialTimestamp++
            return request.reply({ statusCode: 503, body: 'Unavailable' })
        })
        visitItem()
        cy.wait('@history')
        cy.wrap(null).should(() => expect(requestsForInitialTimestamp).to.equal(1))
        // Jump to a historic timestamp (over an hour old, so it never polls) before the original
        // request's 3s quiet retry fires - this is what used to let the stale retry win the race.
        cy.window().then(window => {
            window.document.dispatchEvent(new window.CustomEvent('bazaarSnapshotUpdate', { detail: { timestamp: new window.Date(historicTimestampIso) } }))
        })
        cy.wait('@historicSnapshot')
        cy.contains('2020').should('be.visible')
        // Wait past the whole 3s+6s retry schedule for the original (now-stale) request - if it
        // weren't cancelled, it would fire in this window and either clobber the historic view or
        // have its own late result dropped as stale, and either way issue another request.
        cy.wait(10000)
        cy.contains('2020').should('be.visible')
        cy.contains('Could not update Bazaar order data.').should('not.exist')
        cy.wrap(null).should(() => expect(requestsForInitialTimestamp).to.equal(1))
    })

    it('offers a page retry after an unexpected client error', () => {
        cy.on('uncaught:exception', error => {
            if (error.message.includes('Temporary chart error')) return false
        })
        cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/snapshot*', snapshot).as('snapshot')
        visitItem(window => {
            const getItem = window.Storage.prototype.getItem
            window.Storage.prototype.getItem = function (key) {
                if (key === 'bazaarGraphLegendSelection') throw new window.Error('Temporary chart error')
                return getItem.call(this, key)
            }
        })
        cy.contains('Unable to load this page').should('be.visible')
        cy.contains('summary', 'Technical details').click()
        cy.get('pre').should('contain.text', 'Temporary chart error')
        cy.contains('button', 'Retry page').click()
        cy.wait('@snapshot')
        cy.contains('(Insta) Buy information').should('be.visible')
        cy.contains('Unable to load this page').should('not.exist')
    })
})

describe('Bazaar live graph point', () => {
    // The canvas cannot be queried, so read what the chart was given from its echarts-for-react instance.
    function getChart(element: HTMLElement) {
        const fiberKey = Object.keys(element).find(key => key.startsWith('__reactFiber$'))!
        let fiber = (element as any)[fiberKey]
        while (fiber && !fiber.stateNode?.getEchartsInstance) fiber = fiber.return
        return fiber.stateNode.getEchartsInstance()
    }
    const candle = (data: (number | string)[]) => data.map(value => +value)

    it('ends the day graph at the live order book and follows it without refetching or re-zooming', () => {
        const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60000).toISOString()
        const firstLiveTime = minutesAgo(1)
        let hasMoved = false
        let setOptionCalls = 0
        cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/snapshot*', request => {
            // A time picked on the chart is far older than the "now" of a poll.
            const isHistoric = Date.now() - Date.parse(String(request.query.timestamp)) > 10 * 60000
            const move = hasMoved && !isHistoric ? 100000 : 0
            request.alias = isHistoric ? 'historicSnapshot' : 'liveSnapshot'
            request.reply({
                productId: 'BOOSTER_COOKIE',
                timeStamp: isHistoric ? minutesAgo(25) : hasMoved ? minutesAgo(0) : firstLiveTime,
                buyPrice: 1500000 + move,
                sellPrice: 1000000 + move,
                buyOrders: [{ pricePerUnit: 1500000 + move, amount: 1, orders: 1 }],
                sellOrders: [{ pricePerUnit: 1000000 + move, amount: 1, orders: 1 }]
            })
        })
        // The history is stale: its newest aggregate is 25 minutes old and still at ~750k.
        cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/history/*', [
            { timestamp: minutesAgo(30), buy: 760000, sell: 740000, minBuy: 759000, maxBuy: 761000, minSell: 739000, maxSell: 741000 },
            { timestamp: minutesAgo(25), buy: 750000, sell: 730000, minBuy: 749000, maxBuy: 751000, minSell: 729000, maxSell: 731000 }
        ]).as('history')
        cy.intercept('GET', '**/api/mayor*', [])
        cy.visit('/item/BOOSTER_COOKIE?range=day')
        cy.wait('@history')
        cy.wait('@liveSnapshot')
        cy.get('.echarts-for-react canvas').should('be.visible')

        cy.get('.echarts-for-react').should($chart => {
            const { xAxis, series } = getChart($chart[0]).getOption()
            expect(xAxis[0].data).to.have.length(3)
            // [open, close, min, max]: the live point is its own flat candle on each line...
            expect(candle(series[0].data[2]), 'live buy').to.deep.equal([1500000, 1500000, 1500000, 1500000])
            expect(candle(series[5].data[2]), 'live sell').to.deep.equal([1000000, 1000000, 1000000, 1000000])
            // ...and the last aggregated candle still closes on its own price.
            expect(candle(series[0].data[1]), 'last history buy').to.deep.equal([750000, 750000, 749000, 751000])
            expect(candle(series[5].data[1]), 'last history sell').to.deep.equal([730000, 730000, 729000, 731000])
        })

        cy.get('.echarts-for-react').then($chart => {
            const chart = getChart($chart[0])
            const setOption = chart.setOption.bind(chart)
            chart.setOption = (...args: unknown[]) => {
                setOptionCalls++
                return setOption(...args)
            }
        })
        // An identical poll response leaves the chart untouched.
        cy.wait('@liveSnapshot', { timeout: 15000 })
        cy.wait(500)
        cy.wrap(null).should(() => expect(setOptionCalls).to.equal(0))

        // The next poll has moved: the live point follows it.
        cy.then(() => {
            hasMoved = true
        })
        cy.get('.echarts-for-react', { timeout: 15000 }).should($chart => {
            const { xAxis, series } = getChart($chart[0]).getOption()
            expect(xAxis[0].data).to.have.length(3)
            expect(candle(series[0].data[2])[0]).to.equal(1600000)
            expect(candle(series[5].data[2])[0]).to.equal(1100000)
        })

        // Zooming selects a historic snapshot time: its order book must not become the newest point.
        cy.get('.echarts-for-react').then($chart => getChart($chart[0]).dispatchAction({ type: 'dataZoom', start: 40, end: 100 }))
        cy.wait('@historicSnapshot')
        cy.get('.echarts-for-react').should($chart => {
            const { xAxis, dataZoom } = getChart($chart[0]).getOption()
            expect(xAxis[0].data).to.have.length(2)
            expect(dataZoom[0].start).to.equal(40)
        })

        // The poll returns to the live book: the point is back, the zoom is kept, the history was loaded once.
        cy.get('.echarts-for-react', { timeout: 15000 }).should($chart => {
            const { xAxis, dataZoom } = getChart($chart[0]).getOption()
            expect(xAxis[0].data).to.have.length(3)
            expect(dataZoom[0].start).to.equal(40)
        })
        cy.get('@history.all').should('have.length', 1)
    })

    const historyPoint = (time: string, buy: number, sell: number): BazaarPrice => ({
        buyData: { price: buy, min: buy - 10, max: buy + 10, volume: 100, moving: 1000 },
        sellData: { price: sell, min: sell - 10, max: sell + 10, volume: 200, moving: 2000 },
        timestamp: new Date(time)
    })
    const order = (pricePerUnit: number): BazaarOrder => ({ pricePerUnit, amount: 1, orders: 1 })
    // The stale history still shows ~750k while the order book has already moved to 1.5m / 1m.
    const history = [historyPoint('2026-09-01T12:00:00Z', 760000, 740000), historyPoint('2026-09-01T12:05:00Z', 750000, 730000)]
    const liveSnapshot = (overrides: Partial<BazaarSnapshot> = {}): BazaarSnapshot => ({
        item: { tag: 'SHARD_FLORA' } as Item,
        buyData: { orderCount: 3, price: 1, volume: 300, moving: 3000 },
        sellData: { orderCount: 3, price: 1, volume: 400, moving: 4000 },
        timeStamp: new Date('2026-09-01T12:30:00Z'),
        // buyOrders are the sell offers an instant-buy fills (cheapest first), sellOrders the buy orders.
        buyOrders: [order(1500000), order(1500001), order(1600000)],
        sellOrders: [order(1000000), order(999999), order(900000)],
        ...overrides
    })

    it('appends the top of the live order book to the matching graph line', () => {
        const merged = appendLiveSnapshotPoint(history, liveSnapshot(), true)

        expect(merged.slice(0, 2)).to.deep.equal(history)
        expect(merged).to.have.length(3)
        expect(merged[2].timestamp.toISOString()).to.equal('2026-09-01T12:30:00.000Z')
        expect(merged[2].buyData).to.deep.equal({ price: 1500000, min: 1500000, max: 1500000, volume: 300, moving: 3000 })
        expect(merged[2].sellData).to.deep.equal({ price: 1000000, min: 1000000, max: 1000000, volume: 400, moving: 4000 })
    })

    it('keeps the history unchanged when the order book cannot provide a newer live point', () => {
        const unchanged = {
            'snapshot older than the last history point': liveSnapshot({ timeStamp: new Date('2026-09-01T12:04:00Z') }),
            'snapshot as old as the last history point': liveSnapshot({ timeStamp: new Date('2026-09-01T12:05:00Z') }),
            'no sell offers': liveSnapshot({ buyOrders: [] }),
            'no buy orders': liveSnapshot({ sellOrders: [] }),
            'snapshot not loaded': undefined
        }
        Object.entries(unchanged).forEach(([reason, snapshot]) => {
            expect(appendLiveSnapshotPoint(history, snapshot, true), reason).to.equal(history)
        })
        expect(appendLiveSnapshotPoint([], liveSnapshot(), true), 'empty history').to.deep.equal([])
    })

    it('does not append the order book of a historic snapshot view', () => {
        expect(appendLiveSnapshotPoint(history, liveSnapshot(), false)).to.equal(history)
    })
})
