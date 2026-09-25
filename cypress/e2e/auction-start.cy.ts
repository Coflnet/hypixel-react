export {}

const auctionId = '00000000000040008000000000000001'
const explanation = 'No start available. This auction was never seen active on the auction house; only its sale was recorded.'

function openAuction(start: string) {
    cy.intercept('GET', `**/api/auction/${auctionId}`, {
        uuid: auctionId,
        itemName: 'Start date test',
        tag: 'STONE',
        tier: 'COMMON',
        category: 'BLOCK',
        start,
        itemCreatedAt: '2025-12-01T00:00:00Z',
        end: '2026-01-02T00:00:00Z',
        startingBid: 0,
        highestBidAmount: 100,
        auctioneer: { uuid: auctionId, name: 'Test seller' },
        bids: [],
        enchantments: [],
        flatNbt: {},
        count: 1,
        bin: true,
        claimed: true
    }).as('auction')
    cy.intercept('GET', '**/api/item/STONE/details', { tag: 'STONE', name: 'Start date test', tier: 'COMMON' })
    cy.intercept('GET', '**/api/flip/update/when', { body: '2026-01-02T00:00:00Z' })
    cy.intercept('GET', '**/preScript.js', { body: '' })
    visitFlipper()
    selectAuction()
    cy.wait('@auction')
    cy.contains('.badge', 'Auction Created:').parent().parent().as('created')
}

function visitFlipper() {
    cy.visit('/flipper', {
        onBeforeLoad(window) {
            window.localStorage.clear()
            window.sessionStorage.clear()
            window.document.cookie = 'nonEssentialCookiesAllowed=false; path=/'
            class Socket {
                static OPEN = 1
                readyState = 1
                onopen: ((event: Event) => void) | null = null
                onmessage: ((event: MessageEvent) => void) | null = null
                subscriptionId?: number
                constructor() {
                    window.setTimeout(() => this.onopen?.(new window.Event('open')), 0)
                }
                send(value: string) {
                    const request = JSON.parse(value)
                    if (request.type === 'subFlipAnonym') this.subscriptionId = request.mId
                    window.setTimeout(() => this.onmessage?.(new window.MessageEvent('message', {
                        data: JSON.stringify({ mId: request.mId, type: 'ok', data: JSON.stringify(''), maxAge: 0 })
                    })), 0)
                }
                close() {}
            }
            window.WebSocket = Socket as unknown as typeof WebSocket
        }
    })
}

function selectAuction() {
    cy.window().its('websocket.subscriptionId').should('be.a', 'number')
    cy.window().then(window => {
        const socket = (window as any).websocket
        socket.onmessage(new MessageEvent('message', {
            data: JSON.stringify({
                mId: socket.subscriptionId,
                type: 'flip',
                data: JSON.stringify({
                    uuid: auctionId, name: 'Start date test', tag: 'STONE', tier: 'COMMON',
                    cost: 100, median: 200, lowestBin: 200, secondLowestBin: 210,
                    sellerName: 'Test seller', finder: 1, Profit: 100, volume: 10, bin: true, sold: true
                })
            })
        }))
    })
    cy.contains('Start date test').trigger('mousedown')
}

describe('Auction creation date availability', () => {
    for (const start of ['0001-01-01T00:00:00Z', '1999-12-31T23:59:59Z']) {
        it(`explains the unavailable start for ${start}`, () => {
            cy.viewport(390, 844)
            openAuction(start)
            cy.get('@created').should('contain.text', explanation)
            cy.get('@created').find('.ellipse').should('not.exist')
            cy.get('@created').scrollIntoView().should('be.visible')
            cy.screenshot(`auction-start-${start.slice(0, 4)}-mobile`, { capture: 'viewport' })
            cy.viewport(1280, 900)
            cy.get('@created').scrollIntoView().should('be.visible')
            cy.screenshot(`auction-start-${start.slice(0, 4)}-desktop`, { capture: 'viewport' })
        })
    }

    for (const start of ['2000-01-01T00:00:00Z', '2026-01-01T12:00:00Z']) {
        it(`preserves the localized creation date for ${start}`, () => {
            openAuction(start)
            cy.window().then(window => {
                const date = new window.Date(start)
                cy.get('@created').should('contain.text', date.toLocaleDateString() + ' ' + date.toLocaleTimeString())
            })
            cy.get('@created').should('not.contain.text', 'No start available')
        })
    }
})
