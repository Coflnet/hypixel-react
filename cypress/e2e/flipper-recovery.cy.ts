export {}

function visitFlipper(
    options: {
        filter?: Record<string, unknown>
        dropFirstHandshake?: boolean
        authenticated?: boolean
        dropReconnectLogin?: boolean
        failCountdown?: boolean
    } = {}
) {
    const token = 'eyJhbGciOiJub25lIn0.eyJleHAiOjQxNDI0NDQ4MDAsImVtYWlsIjoidGVybXNAZXhhbXBsZS5jb20ifQ.signature'
    cy.intercept('GET', '**/api/user/terms*', { required: false })
    cy.intercept('POST', '**/api/premium/user/owns', { premium: { expiresAt: new Date(Date.now() + 86400000).toISOString() } })
    cy.intercept('GET', '**/api/referral/info*', { oldInfo: {} })
    cy.intercept('GET', '**/api/flip/update/when', options.failCountdown ? { forceNetworkError: true } : { body: new Date().toISOString() }).as('updateTime')
    cy.visit('/flipper', {
        onBeforeLoad(window) {
            window.localStorage.clear()
            window.sessionStorage.clear()
            window.document.cookie = 'nonEssentialCookiesAllowed=false; path=/'
            window.localStorage.setItem(
                'userSettings',
                JSON.stringify({
                    flipperFilters: JSON.stringify(options.filter ?? { minProfit: 10_000_000 })
                })
            )

            if (options.authenticated) window.localStorage.setItem('googleId', token)
            let droppedHandshake = false
            ;(window as any).flipSockets = []

            class FlipWebSocket {
                static OPEN = 1
                readyState = 1
                onopen: ((event: Event) => void) | null = null
                onclose: ((event: Event) => void) | null = null
                onmessage: ((event: MessageEvent) => void) | null = null
                subscriptionId?: number
                sent: { type: string; mId: number; data: unknown }[] = []

                constructor() {
                    ;(window as any).flipSockets.push(this)
                    window.setTimeout(() => this.onopen?.(new Event('open')), 0)
                }

                send(value: string) {
                    const request = JSON.parse(value)
                    this.sent.push({ ...request, data: JSON.parse(window.atob(request.data)) })
                    if (options.dropFirstHandshake && !droppedHandshake && request.type === 'setConId') {
                        droppedHandshake = true
                        return
                    }
                    if (options.dropReconnectLogin && request.type === 'loginWithToken' && (window as any).flipSockets.length === 2) return
                    if (request.type === 'subFlipAnonym' || request.type === 'subFlip') this.subscriptionId = request.mId
                    window.setTimeout(
                        () =>
                            this.onmessage?.(
                                new MessageEvent('message', {
                                    data: JSON.stringify({
                                        mId: request.mId,
                                        type: 'ok',
                                        data: JSON.stringify(request.type === 'loginWithToken' ? token : ''),
                                        maxAge: 0
                                    })
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
    if (options.failCountdown) {
        cy.get('.Toastify__close-button').click()
        cy.get('.Toastify__toast').should('not.exist')
    }
    cy.contains('Clear flips!').click()
}

function emitFlip(name: string, sold = false) {
    cy.window().then(window => {
        const socket = (window as any).websocket
        socket.onmessage(
            new MessageEvent('message', {
                data: JSON.stringify({
                    mId: socket.subscriptionId,
                    type: 'flip',
                    data: JSON.stringify({
                        uuid: name,
                        name,
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
                        sold
                    })
                })
            })
        )
    })
}

function expectSubscriptionCount(count: number, type = 'subFlipAnonym') {
    cy.window().should(window => {
        expect((window as any).websocket.sent.filter(request => request.type === type)).to.have.length(count)
    })
}

describe('Flipper recovery', () => {
    it('receives anonymous flips after reconnecting even when the countdown request fails', () => {
        visitFlipper({ failCountdown: true })
        cy.window().its('websocket.subscriptionId').should('be.a', 'number')
        cy.window().then(window => (window as any).websocket.close())
        cy.window().its('websocket.readyState', { timeout: 10000 }).should('equal', 1)
        cy.window().its('websocket.subscriptionId', { timeout: 10000 }).should('be.a', 'number')
        emitFlip('Reconnected Test Flip')
        cy.contains('Reconnected Test Flip').should('be.visible')
        cy.contains('Waiting for new auctions').should('not.exist')
    })

    it('replaces the server subscription when anonymous filters are cleared', () => {
        visitFlipper({ filter: { onlyBin: true } })
        expectSubscriptionCount(1)
        cy.get('#onlyBinCheckbox').should('be.checked').uncheck()
        expectSubscriptionCount(2)
        cy.window().should(window => {
            const subscriptions = (window as any).websocket.sent.filter(request => request.type === 'subFlipAnonym')
            expect(subscriptions[1].data.onlyBin).to.equal(false)
            expect(subscriptions[1].data.minProfit).to.equal(0)
            expect(subscriptions[1].data.blacklist).to.deep.equal([])
        })
        cy.window().then(window => (window as any).websocket.close())
        cy.window().its('flipSockets', { timeout: 10000 }).should('have.length', 2)
        expectSubscriptionCount(1)
        emitFlip('Unfiltered Flip')
        cy.contains('Unfiltered Flip').should('be.visible')
    })

    it('uses the current sold filter and can show a cleared flip again', () => {
        visitFlipper({ filter: { onlyUnsold: true } })
        expectSubscriptionCount(1)
        cy.contains('Advanced').click()
        cy.get('#onlyUnsoldCheckbox').uncheck()
        expectSubscriptionCount(2)
        emitFlip('Previously Hidden Flip', true)
        cy.contains('Previously Hidden Flip').should('be.visible')
        emitFlip('Previously Hidden Flip', true)
        cy.contains('Total flips received:').should('contain.text', '1')
        cy.contains('Clear flips!').click()
        emitFlip('Previously Hidden Flip', true)
        cy.contains('Previously Hidden Flip').should('be.visible')
        cy.get('#onlyUnsoldCheckbox').check()
        emitFlip('Still Hidden Flip', true)
        cy.contains('Still Hidden Flip').should('not.exist')
    })

    it('reconnects a silent socket even when the browser still reports it open', () => {
        cy.clock(Date.now(), ['Date', 'setInterval', 'clearInterval'])
        visitFlipper({ filter: {} })
        expectSubscriptionCount(1)
        cy.tick(95_000)
        cy.window().its('flipSockets', { timeout: 10000 }).should('have.length', 2)
        expectSubscriptionCount(1)
        emitFlip('Recovered Silent Feed')
        cy.contains('Recovered Silent Feed').should('be.visible')
    })

    it('keeps a healthy quiet feed connected when server heartbeats arrive', () => {
        cy.clock(Date.now(), ['Date', 'setInterval', 'clearInterval'])
        visitFlipper({ filter: {} })
        expectSubscriptionCount(1)
        for (let minute = 0; minute < 4; minute++) {
            cy.tick(60_000)
            cy.window().then(window => {
                const socket = (window as any).websocket
                socket.onmessage(
                    new MessageEvent('message', {
                        data: JSON.stringify({ mId: socket.subscriptionId, type: 'ping', data: 'null' })
                    })
                )
            })
        }
        cy.window().its('flipSockets').should('have.length', 1)
        emitFlip('Healthy Quiet Feed')
        cy.contains('Healthy Quiet Feed').should('be.visible')
    })

    it('recovers when the connection setup reply never arrives', () => {
        cy.clock(Date.now(), ['Date', 'setInterval', 'clearInterval'])
        visitFlipper({ dropFirstHandshake: true, filter: {} })
        cy.window().should(window => {
            expect((window as any).websocket.sent.some(request => request.type === 'setConId')).to.equal(true)
        })
        cy.tick(20_000)
        cy.window().its('flipSockets', { timeout: 10000 }).should('have.length', 2)
        expectSubscriptionCount(1)
        emitFlip('Recovered Setup')
        cy.contains('Recovered Setup').should('be.visible')
    })

    it('restores only the authenticated feed after reconnecting', () => {
        visitFlipper({ authenticated: true, filter: {} })
        expectSubscriptionCount(1, 'subFlip')
        cy.window().then(window => (window as any).websocket.close())
        cy.window().its('flipSockets', { timeout: 10000 }).should('have.length', 2)
        expectSubscriptionCount(1, 'subFlip')
        expectSubscriptionCount(0)
        cy.window().should(window => {
            const sent = (window as any).websocket.sent.map(request => request.type)
            expect(sent.indexOf('loginWithToken')).to.be.lessThan(sent.indexOf('subFlip'))
        })
        emitFlip('Authenticated Reconnected Flip')
        cy.contains('Authenticated Reconnected Flip').should('be.visible')
    })

    it('retries a lost login reply before restoring the account subscription', () => {
        cy.clock(Date.now(), ['Date', 'setInterval', 'clearInterval'])
        visitFlipper({ authenticated: true, dropReconnectLogin: true, filter: {} })
        expectSubscriptionCount(1, 'subFlip')
        cy.window().then(window => (window as any).websocket.close())
        cy.window().its('flipSockets', { timeout: 10000 }).should('have.length', 2)
        cy.window().should(window => {
            expect((window as any).websocket.sent.some(request => request.type === 'loginWithToken')).to.equal(true)
        })
        expectSubscriptionCount(0, 'subFlip')
        cy.tick(20_000)
        cy.window().its('flipSockets', { timeout: 10000 }).should('have.length', 3)
        expectSubscriptionCount(1, 'subFlip')
        expectSubscriptionCount(0)
        emitFlip('Recovered Account Login')
        cy.contains('Recovered Account Login').should('be.visible')
    })

    it('does not resurrect the flipper subscription after leaving the page', () => {
        visitFlipper({ filter: {} })
        expectSubscriptionCount(1)
        cy.get('#onlyBinCheckbox').check()
        cy.get('a[href="/premium"]:visible').first().click()
        cy.location('pathname').should('equal', '/premium')
        cy.window().should(window => {
            expect((window as any).websocket.sent.some(request => request.type === 'unsubFlip')).to.equal(true)
        })
        cy.window().then(window => (window as any).websocket.close())
        cy.window().its('flipSockets', { timeout: 10000 }).should('have.length', 2)
        cy.window().should(window => {
            expect((window as any).websocket.sent.some(request => request.type === 'setConId')).to.equal(true)
        })
        expectSubscriptionCount(0)
    })

    it('does not let an offline unsubscribe stop a newly mounted feed', () => {
        cy.clock(Date.now(), ['Date', 'setInterval', 'clearInterval'])
        visitFlipper({ dropFirstHandshake: true, filter: {} })
        cy.get('a[href="/premium"]:visible').first().click()
        cy.location('pathname').should('equal', '/premium')
        cy.go('back')
        cy.location('pathname').should('equal', '/flipper')
        cy.contains('Clear flips!').click()
        cy.tick(20_000)
        cy.window().its('flipSockets', { timeout: 10000 }).should('have.length', 2)
        expectSubscriptionCount(1)
        cy.window().should(window => {
            expect((window as any).websocket.sent.filter(request => request.type === 'unsubFlip')).to.have.length(0)
        })
        emitFlip('Returned While Offline')
        cy.contains('Returned While Offline').should('be.visible')
    })

    it('refreshes visible account filters even when restriction lists do not change', () => {
        visitFlipper({ authenticated: true, filter: {} })
        expectSubscriptionCount(1, 'subFlip')
        cy.window().then(window => {
            const socket = (window as any).websocket
            socket.onmessage(
                new MessageEvent('message', {
                    data: JSON.stringify({
                        mId: socket.subscriptionId,
                        type: 'flipSettings',
                        data: JSON.stringify({
                            minProfit: 25000000,
                            onlyBin: true,
                            blacklist: [],
                            whitelist: []
                        })
                    })
                })
            )
        })
        cy.get('#onlyBinCheckbox').should('be.checked')
        cy.get('#min-profit')
            .invoke('val')
            .should(value => expect(String(value).replace(/\D/g, '')).to.equal('25000000'))
        cy.get('#min-profit').clear().type('0')
        cy.get('#onlyBinCheckbox').uncheck()
        cy.window().should(window => {
            const filter = JSON.parse(JSON.parse(window.localStorage.getItem('userSettings')!).flipperFilters)
            expect(filter.minProfit).to.equal(0)
            expect(filter.onlyBin).to.equal(false)
        })
        emitFlip('Cleared Account Filters')
        cy.contains('Cleared Account Filters').should('be.visible')
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
