function visitFlipper() {
    cy.intercept('GET', '**/api/flip/update/when', { forceNetworkError: true }).as('updateTime')
    cy.visit('/flipper', {
        onBeforeLoad(window) {
            window.localStorage.clear()
            window.sessionStorage.clear()
            window.document.cookie = 'nonEssentialCookiesAllowed=false; path=/'
            window.localStorage.setItem(
                'userSettings',
                JSON.stringify({
                    flipperFilters: JSON.stringify({ minProfit: 10_000_000 })
                })
            )

            class FlipWebSocket {
                static OPEN = 1
                readyState = 1
                onopen: ((event: Event) => void) | null = null
                onclose: ((event: Event) => void) | null = null
                onmessage: ((event: MessageEvent) => void) | null = null
                subscriptionId?: number

                constructor() {
                    window.setTimeout(() => this.onopen?.(new Event('open')), 0)
                }

                send(value: string) {
                    const request = JSON.parse(value)
                    if (request.type === 'subFlipAnonym') this.subscriptionId = request.mId
                    window.setTimeout(
                        () =>
                            this.onmessage?.(
                                new MessageEvent('message', {
                                    data: JSON.stringify({ mId: request.mId, type: 'ok', data: '""', maxAge: 0 })
                                })
                            ),
                        0
                    )
                }

                close() {
                    this.readyState = 3
                    this.onclose?.(new Event('close'))
                }
            }
            window.WebSocket = FlipWebSocket as unknown as typeof WebSocket
        }
    })
    cy.wait('@updateTime')
    cy.contains('Clear flips!').click()
}

describe('Flipper recovery', () => {
    it('receives anonymous flips after reconnecting even when the countdown request fails', () => {
        visitFlipper()
        cy.window().its('websocket.subscriptionId').should('be.a', 'number')
        cy.window().then(window => (window as any).websocket.close())
        cy.window().its('websocket.readyState', { timeout: 10000 }).should('equal', 1)
        cy.window().its('websocket.subscriptionId', { timeout: 10000 }).should('be.a', 'number')
        cy.window().then(window => {
            const socket = (window as any).websocket
            socket.onmessage(
                new MessageEvent('message', {
                    data: JSON.stringify({
                        mId: socket.subscriptionId,
                        type: 'flip',
                        data: JSON.stringify({
                            uuid: 'reconnected-flip',
                            name: 'Reconnected Test Flip',
                            tag: 'STONE',
                            tier: 'COMMON',
                            cost: 100,
                            median: 200,
                            lowestBin: 200,
                            secondLowestBin: 210,
                            sellerName: 'TestSeller',
                            finder: 1,
                            Profit: 100,
                            volume: 10,
                            bin: true,
                            sold: false
                        })
                    })
                })
            )
        })
        cy.contains('Reconnected Test Flip').should('be.visible')
        cy.contains('Waiting for new auctions').should('not.exist')
    })

    for (const width of [1280, 375]) {
        it(`allows loosening filters without an overlapping list at ${width}px`, () => {
            cy.viewport(width, 900)
            visitFlipper()
            cy.contains('button', 'Loosen limiting filters').should('be.visible').click()
            cy.window().should(window => {
                const settings = JSON.parse(window.localStorage.getItem('userSettings')!)
                expect(JSON.parse(settings.flipperFilters).minProfit).to.equal(3_000_000)
            })
        })
    }
})
