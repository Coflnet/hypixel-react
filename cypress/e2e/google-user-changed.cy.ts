export {}

function makeToken(email: string) {
    return `eyJhbGciOiJub25lIn0.${btoa(JSON.stringify({ exp: 4142444800, email })).replace(/=+$/, '')}.signature`
}

const tokenB = makeToken('account-b@example.com')

interface FakeSocket {
    loggedInAs?: string
    sent: { type: string; mId: number; data: unknown }[]
}

// The sockets of every page load, including the one after the reload.
const sockets: FakeSocket[] = []

beforeEach(() => {
    sockets.length = 0
    cy.intercept('GET', 'https://track.coflnet.com/matomo.js*', { headers: { 'content-type': 'application/javascript' }, body: '' })
    cy.intercept('GET', '**/preScript.js', { headers: { 'content-type': 'application/javascript' }, body: '' })
    cy.intercept('GET', '**/command/version/**', { body: 'cypress-version' })
    cy.intercept('GET', 'https://accounts.google.com/gsi/client*', {
        headers: { 'content-type': 'application/javascript' },
        body: `window.google = { accounts: { id: {
            initialize(options) { this.options = options },
            renderButton(container) {
                const button = document.createElement('button');
                button.textContent = 'Confirm Google identity';
                button.onclick = () => this.options.callback({ credential: '${tokenB}' });
                container.appendChild(button);
            }, prompt() {}, cancel() {}
        } } };`
    })
    cy.intercept('GET', '**/api/user/terms*', { body: { required: false, canContinueWithoutAccepting: true, documents: [] } })
    cy.intercept('POST', '**/api/premium/user/owns', { body: {} })
    cy.intercept('GET', '**/api/premium/subscription', { body: [] })
    cy.intercept('GET', '**/api/premium/transactions', { body: [] })
    cy.intercept('GET', '**/api/premium/slots', { body: [] })
})

describe('Login for a different account on a logged-in socket', () => {
    it('reloads and logs in once on a fresh socket without an error toast or losing the new token', () => {
        // window:before:load runs on every load, so the page after the reload gets the fake server too
        cy.on('window:before:load', window => {
            class FakeWebSocket {
                static OPEN = 1
                readyState = 1
                onopen: ((event: Event) => void) | null = null
                onclose: ((event: any) => void) | null = null
                onerror: ((event: Event) => void) | null = null
                onmessage: ((event: MessageEvent) => void) | null = null
                state: FakeSocket = { sent: [] }

                constructor() {
                    // the first socket is still bound to account A, as the server remembers it
                    if (sockets.length === 0) this.state.loggedInAs = 'account-a'
                    sockets.push(this.state)
                    window.setTimeout(() => this.onopen?.(new Event('open')), 0)
                }

                send(value: string) {
                    const request = JSON.parse(value)
                    const data = JSON.parse(window.atob(request.data))
                    this.state.sent.push({ type: request.type, mId: request.mId, data })
                    if (request.type === 'loginWithToken') {
                        if (this.state.loggedInAs && this.state.loggedInAs !== data) {
                            window.setTimeout(() => {
                                this.readyState = 3
                                this.onclose?.({ code: 1008, reason: 'user_changed' })
                            }, 0)
                            return
                        }
                        this.state.loggedInAs = data
                    }
                    window.setTimeout(
                        () =>
                            this.onmessage?.(
                                new MessageEvent('message', {
                                    data: JSON.stringify({
                                        mId: request.mId,
                                        type: 'ok',
                                        data: JSON.stringify(request.type === 'loginWithToken' ? data : request.type === 'getCoflBalance' ? '30000' : ''),
                                        maxAge: 0
                                    })
                                })
                            ),
                        0
                    )
                }

                close() {
                    this.readyState = 3
                }
            }
            // keep the dev server's own hot-reload socket real
            const RealWebSocket = window.WebSocket
            const Patched = function (url: string | URL, protocols?: string | string[]) {
                return String(url).includes('/_next/') ? new RealWebSocket(url, protocols) : new FakeWebSocket()
            } as unknown as typeof WebSocket
            Object.assign(Patched, { OPEN: 1, CLOSED: 3, CONNECTING: 0, CLOSING: 2 })
            window.WebSocket = Patched
            if (!window.sessionStorage.getItem('seeded')) {
                window.localStorage.clear()
                window.sessionStorage.clear()
                window.sessionStorage.setItem('seeded', '1')
            }
            window.document.cookie = 'nonEssentialCookiesAllowed=false; path=/'
        })
        cy.visit('/account')

        cy.contains('button', 'Sign in').click()
        cy.contains('button', 'Confirm Google identity').click()

        // the page reloads and logs in as account B on the fresh socket
        cy.window()
            .its('localStorage')
            .should(storage => expect(storage.getItem('googleId')).to.equal(tokenB))
        cy.window({ timeout: 20000 }).should(window => {
            expect(sockets.length, 'a second socket was opened').to.be.at.least(2)
            const fresh = sockets[sockets.length - 1]
            expect(fresh.sent.filter(request => request.type === 'loginWithToken').map(request => request.data)).to.deep.equal([tokenB])
            expect(
                fresh.sent.some(request => request.type === 'getCoflBalance'),
                'per-account state reloaded'
            ).to.equal(true)
            expect(window.sessionStorage.getItem('googleId')).to.equal(tokenB)
            expect(window.sessionStorage.getItem('userChangedReload')).to.equal(null)
        })
        cy.get('.Toastify__toast--error').should('not.exist')
        cy.then(() => expect(sockets[0].sent.filter(request => request.type === 'loginWithToken')).to.have.length(1))
    })

    it('drops the socket and shows the sign-in button again after "Reset Google login"', () => {
        cy.on('window:before:load', window => {
            class IdleWebSocket {
                static OPEN = 1
                readyState = 1
                onopen: ((event: Event) => void) | null = null
                onmessage: ((event: MessageEvent) => void) | null = null

                constructor() {
                    sockets.push({ sent: [] })
                    window.setTimeout(() => this.onopen?.(new Event('open')), 0)
                }

                send(value: string) {
                    const request = JSON.parse(value)
                    const data = JSON.parse(window.atob(request.data))
                    sockets[sockets.length - 1].sent.push({ type: request.type, mId: request.mId, data })
                    window.setTimeout(
                        () =>
                            this.onmessage?.(
                                new MessageEvent('message', {
                                    data: JSON.stringify({
                                        mId: request.mId,
                                        type: 'ok',
                                        data: JSON.stringify(request.type === 'loginWithToken' ? data : ''),
                                        maxAge: 0
                                    })
                                })
                            ),
                        0
                    )
                }

                close() {
                    this.readyState = 3
                }
            }
            const RealWebSocket = window.WebSocket
            const Patched = function (url: string | URL, protocols?: string | string[]) {
                return String(url).includes('/_next/') ? new RealWebSocket(url, protocols) : new IdleWebSocket()
            } as unknown as typeof WebSocket
            Object.assign(Patched, { OPEN: 1, CLOSED: 3, CONNECTING: 0, CLOSING: 2 })
            window.WebSocket = Patched
            if (!window.sessionStorage.getItem('seeded')) {
                window.localStorage.clear()
                window.sessionStorage.clear()
                window.sessionStorage.setItem('seeded', '1')
                window.localStorage.setItem('googleId', makeToken('account-a@example.com'))
            }
            window.document.cookie = 'nonEssentialCookiesAllowed=false; path=/'
        })
        cy.visit('/account')
        // the page is hydrated and logged in once it loaded the account's balance
        cy.wrap(sockets).should(all => expect(all[0]?.sent.some(request => request.type === 'getCoflBalance')).to.equal(true))
        cy.contains('button', 'Reset Google login').click()
        cy.contains('button', 'Sign in', { timeout: 20000 }).should('be.visible')
        cy.window().should(window => {
            expect(window.localStorage.getItem('googleId')).to.equal(null)
            expect(window.sessionStorage.getItem('googleId')).to.equal(null)
        })
        cy.then(() => {
            // only the login before the reset; the reloaded page logs in nowhere
            const logins = sockets.flatMap(socket => socket.sent.filter(request => request.type === 'loginWithToken'))
            expect(logins).to.have.length(1)
        })
    })
})
