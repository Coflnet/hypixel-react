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
    it('shows delegated premium as owner-managed without subscription controls', () => {
        stubProducts({ statusCode: 200, body: {
            premium_plus: { expiresAt: '2099-02-01T00:00:00Z', ownerId: 'another-account', slotId: 42, canManage: false }
        } })
        stubSubscriptions({ statusCode: 200, body: [] })
        visitAccount()
        cy.wait(['@products', '@subscriptions'])
        cy.contains('Provided by another account. Only the purchaser can change or cancel this slot.').should('be.visible')
        cy.contains('button', 'Cancel subscription').should('not.exist')
        cy.contains('Reactivate subscription').should('not.exist')
    })

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
        cy.intercept('DELETE', '**/api/premium/subscription/active-subscription', { statusCode: 200 }).as('cancelSubscription')

        visitAccount()

        cy.wait(['@products', '@subscriptions'])
        deleteAccountButton().should('be.disabled')
        cy.contains('button', 'Cancel subscription').should('be.visible')
        cy.contains('h2', 'Danger Zone')
            .parent()
            .then(dangerZone => {
                let buttons = dangerZone.find('button').toArray()
                let cancelButtonIndex = buttons.findIndex(button => button.textContent?.includes('Cancel subscription'))
                let deleteButtonIndex = buttons.findIndex(button => button.textContent?.trim() === 'Delete account')
                expect(cancelButtonIndex).to.be.lessThan(deleteButtonIndex)
                cy.wrap(buttons[cancelButtonIndex]).click()
            })
        cy.contains('.modal-title', 'Cancel Subscription').should('be.visible')
        cy.contains('button', 'Confirm cancelation').click()
        cy.wait('@cancelSubscription')
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


describe('Subscription plan changes', () => {
    const plan = { productSlug: 'l_prem_plus-slots-4', title: 'Four Premium+ slots', price: 99.69,
        currencyCode: 'eur', ownershipSeconds: 2419200, slotCount: 4, isUpgrade: true }

    function openPlan(response: StubResponse = { statusCode: 200, body: [plan] }) {
        stubProducts()
        stubSubscriptions({ statusCode: 200, body: [activeSubscription] })
        cy.intercept('GET', '**/api/premium/subscription/active-subscription/plans', response).as('plans')
        visitAccount()
        cy.wait('@subscriptions')
        cy.contains('button', 'Change subscription plan').click()
        cy.wait('@plans')
    }

    it('shows the price, authenticates the change, and prevents duplicate submission', () => {
        cy.intercept('PUT', '**/api/premium/subscription/active-subscription/switch*', request => {
            expect(request.headers.googletoken).to.equal(googleToken)
            expect(request.query.targetProductSlug).to.equal(plan.productSlug)
            request.reply({ statusCode: 200, delay: 700, body: { status: 'completed' } })
        }).as('changePlan')
        openPlan()
        cy.contains('Four Premium+ slots').should('contain', '99.69')
        cy.contains('button', 'Upgrade and pay difference').click().should('be.disabled')
        cy.wait('@changePlan')
        cy.contains('Your subscription plan has been updated.').should('be.visible')
        cy.get('@changePlan.all').should('have.length', 1)
    })

    it('explains that downgrades preserve the paid tier until renewal', () => {
        cy.intercept('PUT', '**/api/premium/subscription/active-subscription/switch*', { statusCode: 200, body: { status: 'completed' } }).as('changePlan')
        openPlan({ statusCode: 200, body: [{ ...plan, productSlug: 'l_premium-slots-4', title: 'Four Premium slots', price: 29.69, isUpgrade: false }] })
        cy.contains('Your current paid tier stays active until renewal.').should('be.visible')
        cy.contains('Four Premium slots').should('contain', '29.69')
        cy.contains('button', 'Change next renewal').click()
        cy.wait('@changePlan')
    })

    it('provides the PayPal confirmation link without claiming completion', () => {
        const portal = 'https://test.lemonsqueezy.com/billing/subscription/update'
        cy.intercept('PUT', '**/api/premium/subscription/active-subscription/switch*', { statusCode: 200, body: { status: 'redirect', redirectUrl: portal } })
        openPlan()
        cy.contains('button', 'Upgrade and pay difference').click()
        cy.contains('a', 'Continue in Lemon Squeezy').should('have.attr', 'href', portal)
        cy.contains('Your subscription plan has been updated.').should('not.exist')
    })

    it('shows agreement errors without claiming the plan changed', () => {
        cy.intercept('PUT', '**/api/premium/subscription/active-subscription/switch*', { statusCode: 428, body: {} })
        openPlan()
        cy.contains('button', 'Upgrade and pay difference').click()
        cy.get('[role="alert"]').should('contain', 'agreement')
        cy.contains('a', 'Review agreement').should('have.attr', 'href', '/premium')
    })
})
