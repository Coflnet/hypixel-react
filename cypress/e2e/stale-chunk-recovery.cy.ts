import { isStaleChunkError } from '../../utils/StaleChunkUtils'

const webpackFrameStack = [
    "TypeError: Cannot read properties of undefined (reading 'call')",
    '    at r (https://sky.coflnet.com/_next/static/chunks/webpack-5d6b5990b3bf9b0c.js:1:143)',
    '    at s (https://sky.coflnet.com/_next/static/chunks/1255-abcdef123456.js:1:151214)',
    '    at k (https://sky.coflnet.com/_next/static/chunks/1255-abcdef123456.js:1:151980)',
    '    at lf (https://sky.coflnet.com/_next/static/chunks/4bd1b696-abcdef123456.js:1:12345)'
].join('\n')

const noWebpackFrameStack = [
    "TypeError: Cannot read properties of undefined (reading 'call')",
    '    at Object.render (https://sky.coflnet.com/_next/static/chunks/app-page-abcdef.js:1:143)',
    '    at renderWithHooks (https://sky.coflnet.com/_next/static/chunks/4bd1b696-abcdef123456.js:1:12345)'
].join('\n')

describe('isStaleChunkError', () => {
    it('is true for the exact production error (message + webpack stack frame)', () => {
        const error = Object.assign(new Error("Cannot read properties of undefined (reading 'call')"), { stack: webpackFrameStack })
        expect(isStaleChunkError(error)).to.equal(true)
    })

    it('is true for ChunkLoadError regardless of message', () => {
        const error = Object.assign(new Error('Loading chunk 1255 failed'), { name: 'ChunkLoadError' })
        expect(isStaleChunkError(error)).to.equal(true)
    })

    it('is true for the "Loading chunk ... failed" / "Loading CSS chunk ... failed" message shapes', () => {
        expect(isStaleChunkError(new Error('Loading chunk 42 failed.\n(missing: https://sky.coflnet.com/_next/static/chunks/42.js)'))).to.equal(true)
        expect(isStaleChunkError(new Error('Loading CSS chunk 7 failed.\n(https://sky.coflnet.com/_next/static/css/7.css)'))).to.equal(true)
    })

    it('is true for the Firefox spelling with a webpack frame', () => {
        const error = Object.assign(new Error('can\'t access property "call", n[e] is undefined'), { stack: webpackFrameStack })
        expect(isStaleChunkError(error)).to.equal(true)
    })

    it('is true for the Safari spelling with a webpack frame', () => {
        const error = Object.assign(new Error("undefined is not an object (evaluating 'n[e].call')"), { stack: webpackFrameStack })
        expect(isStaleChunkError(error)).to.equal(true)
    })

    it('is false for the same message when the stack has no webpack runtime frame', () => {
        const error = Object.assign(new Error("Cannot read properties of undefined (reading 'call')"), { stack: noWebpackFrameStack })
        expect(isStaleChunkError(error)).to.equal(false)
    })

    it('is false for an unrelated error', () => {
        expect(isStaleChunkError(new Error('Chart render failed'))).to.equal(false)
    })

    it('is false for null/string input', () => {
        expect(isStaleChunkError(null)).to.equal(false)
        expect(isStaleChunkError('Cannot read properties of undefined (reading \'call\')')).to.equal(false)
        expect(isStaleChunkError(undefined)).to.equal(false)
    })
})

describe('Stale chunk recovery (react error boundary)', () => {
    let pageLoads: number

    beforeEach(() => {
        pageLoads = 0
        cy.on('uncaught:exception', error => {
            if (error.message.includes("Cannot read properties of undefined (reading 'call')")) return false
        })
        cy.intercept('POST', 'https://feedback.coflnet.com/api/**', { statusCode: 200, body: {} }).as('feedback')
        cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/snapshot*', { body: null })
        cy.intercept('GET', '**/api/bazaar/BOOSTER_COOKIE/history/*', [])
        cy.intercept('GET', '**/api/mayor*', [])
    })

    // Unlike onBeforeLoad, window:before:load also runs for the reload the app triggers itself.
    function visitWithStaleChunkError(failingLoads: number) {
        cy.on('window:before:load', window => {
            pageLoads++
            if (pageLoads > failingLoads) return
            const error = Object.assign(new window.Error("Cannot read properties of undefined (reading 'call')"), {
                stack: webpackFrameStack
            })
            const getItem = window.Storage.prototype.getItem
            window.Storage.prototype.getItem = function (key) {
                if (key === 'bazaarGraphLegendSelection') throw error
                return getItem.call(this, key)
            }
        })
        cy.visit('/item/BOOSTER_COOKIE')
    }

    function expectRecordedBoundaryError() {
        cy.window().then(window => {
            expect(window.localStorage.getItem('chunkErrorReload')).to.be.a('string')
            const log = JSON.parse(window.sessionStorage.getItem('skycoflClientErrors') || '[]')
            expect(log.some(entry => entry.source === 'react-boundary' && entry.error.stack === webpackFrameStack)).to.equal(true)
        })
    }

    it('reloads automatically and shows the page when the reload fixes the error', () => {
        visitWithStaleChunkError(1)
        cy.wrap(null).should(() => expect(pageLoads).to.equal(2))
        cy.contains('Bazaar data').should('be.visible')
        cy.contains('Unable to load this page').should('not.exist')
        expectRecordedBoundaryError()
    })

    it('reloads only once and shows the error page when the error persists', () => {
        visitWithStaleChunkError(Infinity)
        cy.contains('Unable to load this page', { timeout: 15000 }).should('be.visible')
        cy.contains('button', 'Send error report').should('be.visible')
        cy.wait(2000)
        cy.wrap(null).should(() => expect(pageLoads).to.equal(2))
        expectRecordedBoundaryError()
    })
})
