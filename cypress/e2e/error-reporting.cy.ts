import { onRequestError } from '../../instrumentation'
import { serializeError } from '../../utils/ErrorDiagnostics'

const stack = [
    'RangeError: Chart render failed',
    ...Array.from({ length: 50 }, (_, i) => `    at chartFrame${i} (https://sky.coflnet.com/_next/static/chart.js:${i + 1}:20)`)
].join('\n')
const traceId = '1234567890abcdef1234567890abcdef'

function visitError(digest?: string) {
    cy.visit('/item/BOOSTER_COOKIE', {
        onBeforeLoad(window) {
            window.sessionStorage.clear()
            window.sessionStorage.setItem('googleId', 'malformed-token')
            const error = Object.assign(new window.Error('Chart render failed'), {
                stack,
                cause: new window.Error('Original chart failure'),
                traceId,
                digest
            })
            const getItem = window.Storage.prototype.getItem
            window.Storage.prototype.getItem = function (key) {
                if (key === 'bazaarGraphLegendSelection') throw error
                return getItem.call(this, key)
            }
        }
    })
    cy.contains('Unable to load this page').should('be.visible')
}

describe('Error diagnostics', () => {
    beforeEach(() => {
        cy.intercept('POST', 'https://feedback.coflnet.com/api/**', { statusCode: 200, body: {} }).as('feedback')
        cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/snapshot*', { body: null })
        cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/history/*', [])
        cy.intercept('GET', '**/api/mayor*', [])
    })

    it('preserves stack traces, causes, and circular causes during serialization', () => {
        const error = new Error('Outer', { cause: new Error('Inner') })
        error.stack = stack
        expect(serializeError(error).stack).to.equal(stack)
        expect(serializeError(error).cause?.stack).to.equal((error.cause as Error).stack)
        error.cause = error
        expect(() => JSON.stringify(serializeError(error))).not.to.throw()
    })

    it('logs server digests alongside real trace IDs and full server stacks', () => {
        const log = cy.stub(console, 'error')
        const error = Object.assign(new Error('Server render failed', { cause: new Error('Upstream failed') }), { digest: 'server-digest', stack })
        onRequestError(
            error,
            {
                path: '/item/BOOSTER_COOKIE?private=value',
                method: 'GET',
                headers: { traceparent: `00-${traceId}-1234567890abcdef-01`, cookie: 'not-for-logs' }
            },
            { routerKind: 'App Router', routePath: '/item/[tag]', routeType: 'render', revalidateReason: undefined }
        )
        const entry = JSON.parse(log.firstCall.args[0])
        expect(entry).to.include({ event: 'web.request.error', digest: 'server-digest', traceId, path: '/item/BOOSTER_COOKIE' })
        expect(entry.error.stack).to.equal(stack)
        expect(entry.error.cause.stack).to.contain('Upstream failed')
        expect(JSON.stringify(entry)).not.to.contain('not-for-logs')
    })

    it('sends complete client diagnostics with the displayed report reference and retains them after reload', () => {
        visitError()
        cy.contains('Server trace ID:').should('contain.text', traceId)
        cy.contains('Report reference:')
            .find('code')
            .invoke('text')
            .then(reportId => {
                cy.contains('button', 'Send error report').click()
                cy.wait('@feedback').then(({ request }) => {
                    expect(request.body.FeedbackName).to.equal('web-error')
                    const report = JSON.parse(request.body.Feedback)
                    expect(report.reportId).to.equal(reportId)
                    expect(report.error.stack).to.equal(stack)
                    expect(report.error.cause.stack).to.contain('Original chart failure')
                    expect(report.error.traceId).to.equal(traceId)
                    expect(report.errorLog.find(entry => entry.id === reportId).error.stack).to.equal(stack)
                    expect(report.userAgent).to.be.a('string')
                })
                cy.contains('button', 'Report sent').should('be.disabled')
                cy.reload()
                cy.window().then(window => {
                    const log = JSON.parse(window.sessionStorage.getItem('skycoflClientErrors')!)
                    expect(log.find(entry => entry.id === reportId).error.stack).to.equal(stack)
                })
            })
    })

    it('shows server references and allows retrying a failed report without losing its trace ID', () => {
        cy.intercept('POST', 'https://feedback.coflnet.com/api/**', {
            statusCode: 503,
            body: { message: 'Feedback temporarily unavailable', traceId }
        }).as('failedFeedback')
        visitError('server-digest')
        cy.contains('Server error reference:').should('contain.text', 'server-digest')
        cy.contains('The server could not finish loading this page.').should('be.visible')
        cy.contains('button', 'Send error report').click()
        cy.wait('@failedFeedback')
        cy.contains('The report could not be sent.').should('be.visible')
        cy.window().then(window => {
            Object.defineProperty(window.navigator, 'clipboard', { configurable: true, value: { writeText: cy.stub().as('copyDetails') } })
        })
        cy.contains('button', 'Copy error details').click()
        cy.get('@copyDetails')
            .should('have.been.calledOnce')
            .then((copy: any) => {
                expect(JSON.parse(copy.firstCall.args[0]).error.stack).to.equal(stack)
            })
        cy.window().then(window => {
            const log = JSON.parse(window.sessionStorage.getItem('skycoflClientErrors')!)
            expect(log.some(entry => entry.error.message === 'Feedback temporarily unavailable' && entry.error.traceId === traceId)).to.equal(true)
        })
        cy.intercept('POST', 'https://feedback.coflnet.com/api/**', { statusCode: 200, body: {} }).as('retriedFeedback')
        cy.contains('button', 'Send error report').click()
        cy.wait('@retriedFeedback')
        cy.contains('button', 'Report sent').should('be.disabled')
    })

    it('captures uncaught errors and rejected promises with source locations before a report is sent', () => {
        cy.visit('/account')
        cy.window().then(window => {
            window.dispatchEvent(
                new window.ErrorEvent('error', {
                    message: 'Uncaught test error',
                    error: new window.Error('Uncaught test error'),
                    filename: 'chart.js',
                    lineno: 42,
                    colno: 10
                })
            )
            window.dispatchEvent(
                new window.PromiseRejectionEvent('unhandledrejection', {
                    reason: new window.Error('Rejected test promise'),
                    promise: window.Promise.resolve()
                })
            )
            const log = JSON.parse(window.sessionStorage.getItem('skycoflClientErrors')!)
            const uncaught = log.find(entry => entry.error.message === 'Uncaught test error')
            expect(uncaught).to.include({ source: 'window.error', filename: 'chart.js', line: 42, column: 10 })
            expect(uncaught.error.stack).to.contain('Uncaught test error')
            expect(log.find(entry => entry.source === 'unhandledrejection').error.stack).to.contain('Rejected test promise')
        })
        cy.get('@feedback.all').should('have.length', 0)
    })
})
