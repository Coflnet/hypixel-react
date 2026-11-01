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
const FIRST_RETRY_MS = 3000

let page: Cypress.AUTWindow

function showsErrorNotice() {
    return pageText(page).includes(ERROR_NOTICE)
}

function stubHistory() {
    const history = { requests: 0 }
    cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/history/*', request => {
        history.requests++
        request.reply([
            { timestamp: '2026-09-01T12:00:00Z', buy: 12000000, sell: 11900000 },
            { timestamp: '2026-09-01T12:05:00Z', buy: 12000000, sell: 11900000 }
        ])
    }).as('history')
    cy.intercept('GET', '**/api/mayor*', [])
    return history
}

function visitItem(onBeforeLoad?: (window: Cypress.AUTWindow) => void) {
    const history = stubHistory()
    cy.clock(Date.now(), [...FAKED_TIMERS])
    cy.visit('/item/BOOSTER_COOKIE', {
        onBeforeLoad(window) {
            page = window
            onBeforeLoad?.(window)
        }
    })
    // Hydration and the dynamically imported chart take real time. Once the chart's range control is
    // there, the chart has armed the timer that requests its history.
    cy.contains('label', '1 Hour').should('exist')
    // Small steps: the first quiet retry must not fire before a test gets to look at the page.
    tickUntil(() => history.requests > 0, 'the price history is requested', 50)
    cy.wait('@history')
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

// Logs when the page arms the first quiet retry of a failed snapshot load.
function recordFirstRetries(window: Cypress.AUTWindow, events: string[]) {
    const setTimeout = window.setTimeout
    window.setTimeout = ((handler: TimerHandler, delay?: number, ...args: unknown[]) => {
        if (delay === FIRST_RETRY_MS) events.push('retry armed')
        return setTimeout(handler, delay, ...args)
    }) as typeof window.setTimeout
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
        visitItem()
        cy.contains('(Insta) Buy information').should('be.visible')
        cy.contains(ERROR_NOTICE).should('not.exist')
        cy.window().then(window => {
            window.document.dispatchEvent(new window.CustomEvent('bazaarSnapshotUpdate', { detail: { timestamp: new window.Date(NaN) } }))
        })
        // Past the snapshot's 100 ms debounce of the chart event.
        cy.tick(1000)
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
        // Safari "Load failed". Every load the page starts while it hydrates fails this way, so the
        // recovery can only come from a quiet retry.
        let healthy = false
        let failedLoads = 0
        let sawErrorState = false
        cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/snapshot*', request => {
            if (healthy) return request.reply(snapshot)
            failedLoads++
            request.destroy()
        })
        visitItem()
        cy.then(() => {
            healthy = true
        })
        tickUntil(() => {
            sawErrorState ||= showsErrorNotice() || page.document.querySelector('.Toastify__toast') !== null
            return pageText(page).includes('(Insta) Buy information')
        }, 'the snapshot recovers')
        cy.then(() => {
            expect(failedLoads, 'failed loads').to.be.at.least(1)
            expect(sawErrorState, 'error notice or toast while retrying').to.equal(false)
        })
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
        // The page may load the "now" snapshot more than once while it starts, so only the count at
        // the moment the historic view takes over matters: no "now" request may follow it.
        const events: string[] = []
        let nowRequestsBeforeHistoric = -1
        const counts = stubSnapshots(historic => {
            if (historic) {
                nowRequestsBeforeHistoric = counts.now
                return { body: historicSnapshot }
            }
            events.push('now requested')
            return unavailable
        })
        visitItem(window => recordFirstRetries(window, events))
        // The latest "now" load has failed and armed its quiet retry, which the faked clock holds back.
        cy.wrap(events).should(() => expect(events.at(-1)).to.equal('retry armed'))
        cy.window().then(window => {
            window.document.dispatchEvent(new window.CustomEvent('bazaarSnapshotUpdate', { detail: { timestamp: new window.Date(historicTimestampIso) } }))
        })
        tickUntil(() => counts.historic > 0, 'the historic snapshot is requested')
        cy.contains('2020').should('be.visible')
        // Past the whole retry schedule of the stale request. Over an hour old, the historic view
        // never polls, so any further "now" request would be that stale retry.
        cy.tick(30000)
        cy.contains('2020').should('be.visible')
        cy.contains(ERROR_NOTICE).should('not.exist')
        cy.then(() => expect(counts.now).to.equal(nowRequestsBeforeHistoric))
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
