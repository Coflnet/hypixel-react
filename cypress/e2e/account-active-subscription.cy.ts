const googleToken = 'eyJhbGciOiJub25lIn0.eyJleHAiOjQxMDI0NDQ4MDAsImVtYWlsIjoiY3lwcmVzc0BleGFtcGxlLmNvbSIsIm5hbWUiOiJDeXByZXNzIn0.signature'

interface StubResponse {
    statusCode?: number
    body?: unknown
    delay?: number
    forceNetworkError?: boolean
}

function installAuthenticatedWebSocket(window: Cypress.AUTWindow) {
    class AuthenticatedWebSocket {
        static OPEN = 1
        readyState = AuthenticatedWebSocket.OPEN
        onopen: ((event: Event) => void) | null = null
        onclose: ((event: CloseEvent) => void) | null = null
        onerror: ((event: Event) => void) | null = null
        onmessage: ((event: MessageEvent) => void) | null = null

        constructor() {
            window.setTimeout(() => this.onopen?.(new Event('open')), 0)
        }

        send(value: string) {
            const request = JSON.parse(value)
            const response = request.type === 'loginWithToken' ? googleToken : ''
            window.setTimeout(() => {
                this.onmessage?.(
                    new MessageEvent('message', {
                        data: JSON.stringify({ mId: request.mId, type: request.type, data: JSON.stringify(response), maxAge: 0 })
                    })
                )
            }, 0)
        }

        close() {}
    }

    window.WebSocket = AuthenticatedWebSocket as unknown as typeof WebSocket
    window.localStorage.clear()
    window.sessionStorage.clear()
    window.localStorage.setItem('googleId', googleToken)
    window.document.cookie = 'nonEssentialCookiesAllowed=false; path=/'
}

function visitAccount() {
    cy.intercept('GET', '**/api/user/terms*', {
        statusCode: 200,
        body: {
            required: false,
            canContinueWithoutAccepting: true,
            canStartNewContract: true,
            agreementId: 'test-agreement',
            agreementHash: 'test-hash',
            agreementUrl: '/terms',
            version: 'test-version',
            hash: 'test-hash',
            englishUrl: '/terms/en',
            germanUrl: '/terms/de',
            documents: []
        }
    })
    cy.intercept('GET', '**/api/premium/transactions', { statusCode: 200, body: [] })
    cy.visit('/account', { onBeforeLoad: installAuthenticatedWebSocket })
}

function stubProducts(response: StubResponse = { statusCode: 200, body: {} }) {
    cy.intercept('POST', '**/api/premium/user/owns', response).as('products')
}

function stubSubscriptions(response: StubResponse) {
    cy.intercept('GET', '**/api/premium/subscription', response).as('subscriptions')
}

function deleteAccountButton() {
    return cy.contains('button', /^Delete account$/)
}

const activeSubscription = {
    externalId: 'active-subscription',
    endsAt: null,
    productName: 'premium_plus',
    paymentAmount: 499,
    renewsAt: '2099-02-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z'
}

describe('Account deletion with subscription lookup', () => {
    it('stays disabled while subscriptions load, then preserves authenticated deletion', () => {
        stubProducts()
        stubSubscriptions({ statusCode: 200, delay: 1200, body: [] })
        cy.intercept('DELETE', '**/api/user/me', request => {
            expect(request.headers.googletoken).to.equal(googleToken)
            request.reply({ statusCode: 200, body: { message: 'Deleted' } })
        }).as('deleteAccount')

        visitAccount()

        deleteAccountButton().should('be.disabled')
        cy.wait('@subscriptions')
        deleteAccountButton().should('be.enabled').click()
        cy.get('#deleteAccountConfirmation').type('DELETE')
        cy.contains('button', 'Permanently delete my account').should('be.enabled').click()
        cy.wait('@deleteAccount')
    })

    it('stays disabled when subscription lookup fails', () => {
        stubProducts()
        stubSubscriptions({ forceNetworkError: true })

        visitAccount()

        cy.wait('@subscriptions')
        deleteAccountButton().should('be.disabled')
        cy.contains('Premium subscriptions could not be loaded').should('be.visible')
    })

    it('allows deletion when only product loading fails and there is no subscription', () => {
        stubProducts({ forceNetworkError: true })
        stubSubscriptions({ statusCode: 200, body: [] })

        visitAccount()

        cy.wait(['@products', '@subscriptions'])
        cy.contains('Premium products could not be loaded').should('be.visible')
        deleteAccountButton().should('be.enabled')
    })

    it('blocks an active subscription and shows a labeled cancel control without products', () => {
        stubProducts({ forceNetworkError: true })
        stubSubscriptions({ statusCode: 200, body: [activeSubscription] })

        visitAccount()

        cy.wait(['@products', '@subscriptions'])
        deleteAccountButton().should('be.disabled')
        cy.contains('button', 'Cancel subscription').should('be.visible')
        cy.contains('Premium products could not be loaded').should('be.visible')
    })

    it('blocks a canceled subscription until its paid period expires', () => {
        stubProducts()
        stubSubscriptions({
            statusCode: 200,
            body: [{ ...activeSubscription, externalId: 'canceled-subscription', endsAt: '2099-01-15T00:00:00Z' }]
        })

        visitAccount()

        cy.wait('@subscriptions')
        deleteAccountButton().should('be.disabled')
        cy.contains('Canceled').should('be.visible')
        cy.contains('button', 'Cancel subscription').should('not.exist')
    })
})
