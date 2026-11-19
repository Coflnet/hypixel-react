import { appendLiveSnapshotPoint, getChartZoomTimestamp } from '../../utils/GraphUtils'
import { pageText, tickUntil } from '../support/clock'

const snapshot = {
    productId: 'BOOSTER_COOKIE',
    timeStamp: '2026-09-01T12:00:00Z',
    buyPrice: 12000000,
    sellPrice: 11900000,
    buyOrders: [],
    sellOrders: []
}
const ERROR_NOTICE = 'Could not update Bazaar order data.'
const unavailable = { statusCode: 503, body: 'Unavailable' }
// The quiet retries (3s, then 6s), the ~25s auto-refresh and the debounces all run on the page's
// timers. Faking them lets a test step through that schedule instead of waiting for it in real time.
// Date stays real: the hook computes its delays from it when it schedules them.
const FAKED_TIMERS = ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] as const
const RETRY_DELAYS_MS = [3000, 6000]
// The chart's mount effect requests its history after a 100 ms and then a 500 ms timer.
const HISTORY_TIMERS_MS = 600
// Hydrating the item page and loading its chart chunk can take long on a starved CI runner. Only the
// readiness gate gets this budget (in 50 ms steps of fake time), the behaviour is asserted after it.
const PAGE_READY_STEPS = 1200

let page: Cypress.AUTWindow

// What the page itself did, in order. Recorded inside the page, so it is exact when cy.tick returns,
// unlike intercept counts, which arrive later through the proxy.
interface SnapshotActivity {
    nowFetches: number
    events: Array<'now fetched' | 'retry armed' | 'retry fired'>
}

function showsErrorNotice() {
    return pageText(page).includes(ERROR_NOTICE)
}

function isNowSnapshotRequest(input: RequestInfo | URL) {
    const url = input instanceof Request ? input.url : String(input)
    return url.includes('/snapshot') && !url.includes('timestamp=2020-')
}

function recordSnapshotActivity(window: Cypress.AUTWindow, activity: SnapshotActivity) {
    const fetch = window.fetch
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
        if (isNowSnapshotRequest(input)) {
            activity.nowFetches++
            activity.events.push('now fetched')
        }
        return fetch.call(window, input, init)
    }
    const setTimeout = window.setTimeout
    window.setTimeout = ((handler: TimerHandler, delay?: number, ...args: unknown[]) => {
        if (typeof handler !== 'function' || !RETRY_DELAYS_MS.includes(delay ?? 0)) return setTimeout(handler, delay, ...args)
        activity.events.push('retry armed')
        return setTimeout(() => {
            activity.events.push('retry fired')
            handler(...args)
        }, delay)
    }) as typeof window.setTimeout
}

function stubHistory() {
    cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/history/*', [
        { timestamp: '2026-09-01T12:00:00Z', buy: 12000000, sell: 11900000 },
        { timestamp: '2026-09-01T12:05:00Z', buy: 12000000, sell: 11900000 }
    ]).as('history')
    cy.intercept('GET', '**/api/mayor*', [])
}

function visitItem(onBeforeLoad?: (window: Cypress.AUTWindow) => void) {
    const activity: SnapshotActivity = { nowFetches: 0, events: [] }
    stubHistory()
    cy.clock(Date.now(), [...FAKED_TIMERS])
    cy.visit('/item/BOOSTER_COOKIE', {
        onBeforeLoad(window) {
            page = window
            recordSnapshotActivity(window, activity)
            onBeforeLoad?.(window)
        }
    })
    // The chart renders only on the client, from the mount effect that also arms its history timers.
    // React commits the loaded chart chunk on a timer of its own, so the clock has to move meanwhile;
    // small steps keep the snapshot's quiet retry far away.
    tickUntil(() => page.document.querySelector('.echarts-for-react') !== null, 'the chart mounts', 50, PAGE_READY_STEPS)
    cy.tick(HISTORY_TIMERS_MS)
    // No time passes on the faked clock while the history is on its way.
    cy.wait('@history')
    return activity
}

// Answers snapshot requests with `reply` and counts them per kind of timestamp.
function stubSnapshots(reply: (historic: boolean) => object) {
    const counts = { now: 0, historic: 0 }
    cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/snapshot*', request => {
        const historic = String(request.query.timestamp).startsWith('2020-')
        counts[historic ? 'historic' : 'now']++
        request.reply(reply(historic))
    })
    return counts
}

function recordSnapshotErrorReports(window: Cypress.AUTWindow, reports: string[]) {
    // apiErrorHandler's diagnostic console.error line only fires when getBazaarSnapshot's
    // shouldReportError predicate says so; it counts reports independent of the toast's lifetime.
    const originalError = window.console.error.bind(window.console)
    window.console.error = (...args: unknown[]) => {
        const [first] = args
        if (typeof first === 'string' && first.includes('"event":"web.api.error"') && first.includes('"requestType":"getBazaarSnapshot"')) {
            reports.push(first)
        }
        originalError(...args)
    }
}

function dispatchSnapshotTimestamp(window: Cypress.AUTWindow, timestamp: Date) {
    window.document.dispatchEvent(new window.CustomEvent('bazaarSnapshotUpdate', { detail: { timestamp } }))
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

    it('shows a snapshot without order lists, ignores invalid chart timestamps and stays usable', () => {
        // undefined fields are left out of the stubbed JSON body
        stubSnapshots(() => ({ body: { ...snapshot, buyOrders: undefined, sellOrders: undefined } }))
        const activity = visitItem()
        cy.contains('(Insta) Buy information').should('be.visible')
        cy.contains(ERROR_NOTICE).should('not.exist')
        let fetchesBefore = 0
        cy.window().then(window => {
            fetchesBefore = activity.nowFetches
            dispatchSnapshotTimestamp(window, new window.Date(NaN))
        })
        // An invalid timestamp used to replace the pending auto-refresh with a load that could never
        // succeed. The poll armed by the first snapshot has to keep running.
        tickUntil(() => activity.nowFetches > fetchesBefore, 'auto-refresh loads the next snapshot')
        cy.contains('Invalid time value').should('not.exist')
        cy.contains('(Insta) Buy information').should('be.visible')
        cy.contains('label', '1 Hour').click()
        cy.location('search').should('include', 'range=hour')
    })

    it('lets users retry failed order data without leaving the item page', () => {
        // A persistent 503 burns through the quiet retry schedule before the panel shows the error.
        let healthy = false
        stubSnapshots(() => (healthy ? { body: snapshot } : unavailable))
        visitItem()
        cy.get('.echarts-for-react canvas').should('be.visible')
        cy.contains(ERROR_NOTICE).should('not.exist')
        tickUntil(showsErrorNotice, 'the quiet retries give up')
        cy.contains('h1', 'Booster Cookie').should('be.visible')
        cy.then(() => {
            healthy = true
        })
        cy.contains('button', 'Retry snapshot').click()
        cy.contains('(Insta) Buy information').should('be.visible')
        cy.contains(ERROR_NOTICE).should('not.exist')
    })

    it('retries a transient failure quietly and recovers before the error state ever shows', () => {
        // Destroying the connection surfaces as a network-level fetch rejection - the reported iPhone
        // Safari "Load failed". Every load fails this way until a quiet retry has fired, so the
        // recovery can only come from that retry.
        let sawErrorState = false
        cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/snapshot*', request => {
            if (activity.events.includes('retry fired')) return request.reply(snapshot)
            request.destroy()
        })
        const activity = visitItem()
        tickUntil(() => {
            sawErrorState ||= showsErrorNotice() || page.document.querySelector('.Toastify__toast') !== null
            return pageText(page).includes('(Insta) Buy information')
        }, 'the snapshot recovers')
        cy.then(() => expect(sawErrorState, 'error notice or toast while retrying').to.equal(false))
        cy.contains(ERROR_NOTICE).should('not.exist')
        cy.get('.Toastify__toast').should('not.exist')
    })

    it('keeps polling through an outage, reports it once and recovers without a manual retry', () => {
        // Auto-refresh used to depend on a successful snapshot to re-arm its own timer, so a failed
        // attempt stopped it dead until "Retry snapshot" was clicked.
        const reports: string[] = []
        let healthy = false
        const counts = stubSnapshots(() => (healthy ? { body: snapshot } : unavailable))
        visitItem(window => recordSnapshotErrorReports(window, reports))
        tickUntil(showsErrorNotice, 'the first outage is reported')
        cy.get('.Toastify__toast').should('have.length', 1)
        cy.wrap(reports).should('have.length', 1)
        // The next poll and its two quiet retries are a second failed cycle of the same outage and
        // must not report again; the poll after them proves that cycle was handled.
        cy.then(() => {
            const requestsBefore = counts.now
            tickUntil(() => counts.now >= requestsBefore + 4, 'a second failed cycle ends and polling continues')
        })
        cy.wrap(reports).should('have.length', 1)
        cy.then(() => {
            healthy = true
            const requestsBefore = counts.now
            tickUntil(() => counts.now > requestsBefore, 'the next poll after the backend recovered')
        })
        cy.contains('(Insta) Buy information').should('be.visible')
        cy.contains(ERROR_NOTICE).should('not.exist')
    })

    it('drops a stale retry instead of letting it clobber a newer timestamp', () => {
        const historicTimestampIso = '2020-06-15T12:00:00.000Z'
        const historicSnapshot = { ...snapshot, timeStamp: historicTimestampIso, buyPrice: 500, sellPrice: 400 }
        const counts = stubSnapshots(historic => (historic ? { body: historicSnapshot } : unavailable))
        const activity = visitItem()
        // The latest "now" load has failed and armed its quiet retry, which the faked clock holds back.
        cy.wrap(activity).should(() => expect(activity.events.at(-1)).to.equal('retry armed'))
        let fetchesAtSwitch = 0
        cy.window().then(window => {
            fetchesAtSwitch = activity.nowFetches
            dispatchSnapshotTimestamp(window, new window.Date(historicTimestampIso))
        })
        tickUntil(() => counts.historic > 0, 'the historic snapshot is requested')
        cy.contains('2020').should('be.visible')
        // Past the whole retry schedule of the stale request. Over an hour old, the historic view
        // never polls, so any further "now" fetch would be that stale retry.
        cy.tick(30000)
        cy.contains('2020').should('be.visible')
        cy.contains(ERROR_NOTICE).should('not.exist')
        cy.then(() => expect(activity.nowFetches, '"now" fetches after the switch').to.equal(fetchesAtSwitch))
    })

    it('offers a page retry after an unexpected client error', () => {
        cy.on('uncaught:exception', error => {
            if (error.message.includes('Temporary chart error')) return false
        })
        cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/snapshot*', snapshot).as('snapshot')
        stubHistory()
        cy.visit('/item/BOOSTER_COOKIE', {
            onBeforeLoad(window) {
                const getItem = window.Storage.prototype.getItem
                window.Storage.prototype.getItem = function (key) {
                    if (key === 'bazaarGraphLegendSelection') throw new window.Error('Temporary chart error')
                    return getItem.call(this, key)
                }
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
