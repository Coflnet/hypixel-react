export {}

const itemTag = 'FIERY_AURORA_LEGGINGS'
const recentUrl = `**/api/auctions/tag/${itemTag}/recent/overview*`
const googleToken = 'eyJhbGciOiJub25lIn0.eyJleHAiOjQxMDI0NDQ4MDAsImVtYWlsIjoiY3lwcmVzc0BleGFtcGxlLmNvbSIsIm5hbWUiOiJDeXByZXNzIn0.signature'
let sendLiveSale: ((auction: ReturnType<typeof sale>) => void) | undefined

function sale(index: number) {
    return {
        uuid: `00000000-0000-4000-8000-${index.toString().padStart(12, '0')}`,
        playerName: `Seller ${index}`,
        seller: { uuid: '00000000000040008000000000000000', name: `Seller ${index}` },
        price: 1000000 + index,
        end: '2026-09-17T16:45:00Z'
    }
}

function visitItem(premium = false) {
    cy.visit(`/item/${itemTag}?Stars=0-0`, {
        onBeforeLoad(window) {
            window.localStorage.clear()
            window.sessionStorage.clear()
            if (premium) window.localStorage.setItem('googleId', googleToken)
            class Socket {
                static OPEN = 1
                readyState = 1
                onopen: ((event: Event) => void) | null = null
                onmessage: ((event: MessageEvent) => void) | null = null
                constructor() {
                    window.setTimeout(() => this.onopen?.(new window.Event('open')), 0)
                }
                send(value: string) {
                    const request = JSON.parse(value)
                    if (request.type === 'subUpdates') {
                        sendLiveSale = auction =>
                            this.onmessage?.(
                                new window.MessageEvent('message', {
                                    data: JSON.stringify({ mId: request.mId, type: 'soldAuction', data: JSON.stringify(auction) })
                                })
                            )
                    }
                    const data = request.type === 'loginWithToken' ? googleToken : request.type === 'getCoflBalance' ? '0' : ''
                    window.setTimeout(
                        () =>
                            this.onmessage?.(
                                new window.MessageEvent('message', {
                                    data: JSON.stringify({ mId: request.mId, type: request.type, data: JSON.stringify(data), maxAge: 0 })
                                })
                            ),
                        0
                    )
                }
                close() {}
            }
            window.WebSocket = Socket as unknown as typeof WebSocket
        }
    })
    cy.contains('h3', 'Recent auctions').parent().as('sales')
}

describe('Recent auction recovery', () => {
    beforeEach(() => {
        sendLiveSale = undefined
        cy.intercept('GET', '**/api/filter/options*', [{ name: 'Stars', options: ['0', '15'], type: 48, longType: 'NUMERICAL, RANGE' }])
        cy.intercept('GET', '**/api/item/price/*/history/*', [])
        cy.intercept('GET', '**/api/mayor*', [])
        cy.intercept('GET', '**/preScript.js', { body: '', headers: { 'content-type': 'application/javascript' } })
        cy.intercept('GET', 'https://accounts.google.com/gsi/client*', {
            headers: { 'content-type': 'application/javascript' },
            body: 'window.google = { accounts: { id: { initialize() {}, renderButton() {}, prompt() {}, cancel() {} } } }'
        })
        cy.intercept('GET', '**/api/user/terms*', { required: false, canContinueWithoutAccepting: true, canStartNewContract: true, documents: [] })
        cy.intercept('POST', '**/api/premium/user/owns', { premium: { expiresAt: '2099-01-01T00:00:00Z' } }).as('premium')
    })

    it('offers a retry for a failed fetch and preserves Stars=0-0 and sold-only filtering', () => {
        cy.intercept('GET', recentUrl, request => {
            if (request.query.Stars === '0-0') request.alias = 'failedSales'
            request.destroy()
        })
        visitItem()
        cy.wait('@failedSales')
        cy.get('@sales').contains('Could not load recent auctions.').should('be.visible')
        cy.get('@sales').contains('No recent auctions found.').should('not.exist')
        cy.intercept('GET', recentUrl, request => {
            if (request.query.Stars !== '0-0') return request.reply([])
            request.alias = 'retriedSales'
            expect(request.query).to.include({ Stars: '0-0', HighestBid: '>0', page: '0' })
            request.reply([sale(1)])
        })
        cy.get('@sales').contains('button', 'Retry past sales').click()
        cy.wait('@retriedSales')
        cy.get('@sales').contains('Seller 1').should('be.visible')
        cy.get('@sales').contains('Could not load recent auctions.').should('not.exist')
    })

    it('shows an empty result only after a successful empty response', () => {
        cy.intercept('GET', recentUrl, []).as('emptySales')
        visitItem()
        cy.get('@sales').contains('No recent auctions found.').should('be.visible')
        cy.get('@sales').contains('Retry past sales').should('not.exist')
    })

    for (const fails of [false, true]) {
        it(`ignores a stale ${fails ? 'failure' : 'response'} after switching from sold to expired`, () => {
            let release: () => void
            let requested = false
            const pending = new Promise<void>(resolve => {
                release = resolve
            })
            cy.intercept('GET', recentUrl, request => {
                if (request.query.Stars !== '0-0') return request.reply([])
                if (request.query.HighestBid === '0') return request.reply([sale(2)])
                requested = true
                request.alias = 'staleSales'
                return pending.then(() => request.reply(fails ? { statusCode: 503, body: 'Unavailable' } : { body: [sale(1)] }))
            })
            visitItem()
            cy.wrap(null).should(() => expect(requested).to.equal(true))
            cy.get('@sales').find('select').select('unsold')
            cy.get('@sales').contains('Seller 2').should('be.visible')
            cy.then(() => release())
            cy.wait('@staleSales')
            cy.get('@sales').contains('Seller 2').should('be.visible')
            cy.get('@sales').contains('Seller 1').should('not.exist')
            cy.get('@sales').contains('Could not load recent auctions.').should('not.exist')
        })
    }

    it('reopens pagination when an empty selection changes to one with sales', () => {
        cy.intercept('GET', recentUrl, request => {
            if (request.query.Stars !== '0-0' || request.query.HighestBid !== '0') return request.reply([])
            request.reply(request.query.page === '0' ? Array.from({ length: 12 }, (_, i) => sale(i + 1)) : [sale(13)])
        })
        visitItem(true)
        cy.wait('@premium')
        cy.get('@sales').contains('No recent auctions found.').should('be.visible')
        cy.get('@sales').find('select').select('unsold')
        cy.get('@sales').find('a[href^="/auction/"]').should('have.length', 12)
        cy.scrollTo('bottom')
        cy.get('@sales').contains('Seller 13', { timeout: 10000 }).should('be.visible')
    })

    it('keeps loaded and live sales and retries the same failed page without skipping or duplicating rows', () => {
        let recovered = false
        cy.intercept('GET', recentUrl, request => {
            if (request.query.Stars !== '0-0') return request.reply([])
            if (request.query.page === '0') return request.reply(Array.from({ length: 12 }, (_, i) => sale(i + 1)))
            expect(request.query.page).to.equal('1')
            request.reply(recovered ? { body: [sale(12), sale(13)] } : { statusCode: 503, body: 'Unavailable' })
        })
        visitItem(true)
        cy.wait('@premium')
        cy.get('@sales').find('a[href^="/auction/"]').should('have.length', 12)
        cy.scrollTo('bottom')
        cy.get('@sales').contains('Retry past sales').should('be.visible')
        cy.get('@sales').find('a[href^="/auction/"]').should('have.length', 12)
        cy.wrap(null).should(() => expect(sendLiveSale).to.be.a('function'))
        cy.then(() => {
            sendLiveSale!(sale(99))
            recovered = true
        })
        cy.get('@sales').find('a[href^="/auction/"]').should('have.length', 13)
        cy.get('@sales').contains('button', 'Retry past sales').click()
        cy.get('@sales').find('a[href^="/auction/"]').should('have.length', 14)
        cy.get('@sales').contains('Seller 13').should('be.visible')
        cy.get('@sales').contains('Seller 99').should('exist')
        cy.get('@sales').contains('Could not load recent auctions.').should('not.exist')
    })
})
