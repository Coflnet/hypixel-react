import { getChartZoomTimestamp } from '../../utils/GraphUtils'

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
