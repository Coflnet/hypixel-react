import { getChartZoomTimestamp } from '../../utils/GraphUtils'
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
