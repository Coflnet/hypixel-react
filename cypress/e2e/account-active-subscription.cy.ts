beforeEach(() => {
    cy.then(() => Cypress.automation('remote:debugger:protocol', { command: 'Network.clearBrowserCache' }))
    cy.intercept('GET', '**/api/premium/slots', { body: [] })
    // Advancing the checkout clock also runs the background cache-version check.
    // Stub it on both localhost (remote commands) and 127.0.0.1 (relative commands).
    cy.intercept('GET', '**/command/version/**', { body: 'cypress-version' })
    // Analytics, push notifications and remote images are outside these purchase/account scenarios.
    cy.intercept('GET', 'https://track.coflnet.com/matomo.js*', { headers: { 'content-type': 'application/javascript' }, body: '' })
    cy.intercept('GET', 'https://accounts.google.com/gsi/client*', {
        headers: { 'content-type': 'application/javascript' },
        body: `window.google = { accounts: { id: {
            initialize(options) { this.options = options },
            renderButton(container) {
                const button = document.createElement('button');
                button.textContent = 'Confirm Google identity';
                button.onclick = () => this.options.callback({ credential: '${googleToken}' });
                container.appendChild(button);
            }, prompt() {}, cancel() {}
        } } };`
    })
    cy.intercept('GET', '**/preScript.js', { headers: { 'content-type': 'application/javascript' }, body: '' })
    cy.intercept({ resourceType: 'image', url: /^https:\/\// }, {
        headers: { 'content-type': 'image/svg+xml' }, body: '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'
    })
})

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
            const response = request.type === 'loginWithToken' ? googleToken : request.type === 'getCoflBalance' ? '30000' : ''
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

function visitAuthenticatedPage(path = '/account', setup?: (window: Cypress.AUTWindow) => void) {
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
            documents: [],
            premiumPurchaseDeclaration: { version: 'test-declaration', locale: 'en', text: 'Start my purchased access immediately.', sha256: 'test-hash' }
        }
    })
    cy.intercept('GET', '**/api/premium/transactions', { statusCode: 200, body: [] })
    cy.visit(path, {
        onBeforeLoad(window) {
            installAuthenticatedWebSocket(window)
            setup?.(window)
        }
    })
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

function waitForDialogTransition() {
    // Cypress actionability does not wait for opacity transitions. Let the dialog
    // finish entering before an immediate fixture response starts its exit.
    cy.get('[role="dialog"]').should('be.visible').then(dialog =>
        Cypress.Promise.all(dialog[0].getAnimations({ subtree: true }).map(animation => animation.finished))
    )
}

const activeSubscription = {
    externalId: 'active-subscription',
    endsAt: null,
    productName: 'premium_plus',
    paymentAmount: 499,
    renewsAt: '2099-02-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z'
}

describe('Premium refresh after checkout', () => {
    const ownership = { premium: { expiresAt: '2099-02-01T00:00:00Z' } }
    const cacheKey = 'skycoflApiCache:premium-products:cypress%40example.com'

    for (const path of ['/premium', '/account']) {
        it(`picks up delayed payment confirmation on ${path} without reloading`, () => {
            stubProducts()
            stubSubscriptions({ body: [] })
            visitAuthenticatedPage(path)
            cy.wait(['@products', '@subscriptions'])
            cy.contains('No Premium').should('be.visible')

            stubProducts({ body: ownership })
            stubSubscriptions({ body: [{ ...activeSubscription, productName: 'premium' }] })
            cy.contains('Premium (Subscription)', { timeout: 12000 }).should('be.visible')
            cy.contains('No Premium').should('not.exist')
            if (path === '/premium') cy.contains('You have a Premium account.').should('be.visible')
            cy.window().then(window => {
                expect(JSON.parse(window.sessionStorage.getItem(cacheKey)!).value).to.deep.equal(ownership)
                expect(JSON.parse(window.localStorage.getItem('lastPremiumProducts')!)).to.deep.equal(ownership)
            })
        })
    }

    it('refreshes immediately on returning to the tab despite a fresh empty cache', () => {
        stubProducts()
        stubSubscriptions({ body: [] })
        visitAuthenticatedPage('/premium', window => {
            cy.spy(window, 'addEventListener').as('windowListeners')
        })
        cy.wait(['@products', '@subscriptions'])
        cy.contains('No Premium').should('be.visible')
        cy.get('@windowListeners').should('have.been.calledWith', 'focus')
        // The initial empty UI can render before the first response is applied.
        // Returning to the tab must happen after that request has filled its cache.
        cy.window().should(window => {
            expect(JSON.parse(window.sessionStorage.getItem(cacheKey) || 'null')?.value).to.deep.equal({})
        })
        cy.intercept('POST', '**/api/premium/user/owns', { body: ownership }).as('refreshedProducts')
        cy.window().then(window => window.dispatchEvent(new window.Event('focus')))
        cy.wait('@refreshedProducts')
        cy.contains('You have a Premium account.').should('be.visible')
    })

    it('does not reset the selected purchase step when ownership is unchanged', () => {
        stubProducts({ body: ownership })
        stubSubscriptions({ body: [] })
        visitAuthenticatedPage('/premium?tier=premium_plus')
        cy.wait(['@products', '@subscriptions'])
        cy.get('#buyPremium').contains('h5', /^CoflCoins$/).click()
        cy.get('#buyPremium').contains('Choose Your Package').should('be.visible')
        cy.window().then(window => window.dispatchEvent(new window.Event('focus')))
        cy.wait('@products')
        cy.get('#buyPremium').contains('Choose Your Package').should('be.visible')
    })

    it('refreshes checkout-return caches, pauses in the background, and backs off after two minutes', () => {
        let fulfilled = false
        let updates = 0
        cy.intercept('POST', '**/api/premium/user/owns', request => request.reply({ body: fulfilled ? ownership : {} })).as('products')
        cy.clock(Date.now(), ['Date', 'setTimeout', 'clearTimeout'])
        visitAuthenticatedPage('/success', window => {
            window.sessionStorage.setItem(cacheKey, JSON.stringify({ expiresAt: Date.now() + 300000, value: {} }))
            window.addEventListener('premium.products.updated', () => { updates++ })
        })
        cy.wait('@products')
        cy.tick(0)
        cy.wrap(null).should(() => expect(updates).to.equal(1))
        cy.contains('Return to the Premium page').closest('a').should('have.attr', 'href', '/premium')
        cy.window().then(window => Object.defineProperty(window.document, 'visibilityState', { configurable: true, value: 'hidden' }))
        cy.tick(15000)
        cy.get('@products.all').should('have.length', 1)
        cy.then(() => { fulfilled = true })
        cy.window().then(window => {
            Object.defineProperty(window.document, 'visibilityState', { configurable: true, value: 'visible' })
            window.document.dispatchEvent(new window.Event('visibilitychange'))
        })
        cy.wait('@products')
        cy.wrap(null).should(() => expect(updates).to.equal(2))
        cy.window().should(window => expect(JSON.parse(window.sessionStorage.getItem(cacheKey)!).value).to.deep.equal(ownership))
        cy.tick(5000)
        cy.wait('@products')
        cy.wrap(null).should(() => expect(updates).to.equal(3))
        cy.clock().invoke('setSystemTime', Date.now() + 180000)
        cy.tick(5000)
        cy.wait('@products')
        cy.wrap(null).should(() => expect(updates).to.equal(4))
        cy.get('@products.all').then(requests => {
            const count = requests.length
            cy.tick(29000)
            cy.get('@products.all').should('have.length', count)
            cy.tick(1000)
            cy.wait('@products')
        })
        cy.get('@products.all').then(requests => {
            const count = requests.length
            cy.visit('/about')
            cy.tick(30000)
            cy.get('@products.all').should('have.length', count)
        })
    })
})

describe('Account deletion with subscription lookup', () => {
    it('shows delegated premium as owner-managed without subscription controls', () => {
        stubProducts({ statusCode: 200, body: {
            premium_plus: { expiresAt: '2099-02-01T00:00:00Z', ownerId: 'another-account', slotId: 42, canManage: false }
        } })
        stubSubscriptions({ statusCode: 200, body: [] })
        visitAuthenticatedPage()
        cy.wait(['@products', '@subscriptions'])
        cy.contains('Provided by another account. Only the purchaser can change or cancel this slot.').should('be.visible')
        cy.contains('button', 'Cancel subscription').should('not.exist')
        cy.contains('Reactivate subscription').should('not.exist')
    })

    for (const path of ['/account', '/premium']) {
        it(`refreshes assigned Premium on ${path} despite a cached empty ownership response`, () => {
            stubProducts({ body: {
                premium: { expiresAt: '2099-02-01T00:00:00Z', ownerId: '7', slotId: 1, canManage: false },
                starter_premium: { expiresAt: '2099-02-01T00:00:00Z', ownerId: '7', slotId: 1, canManage: false }
            } })
            stubSubscriptions({ body: [] })
            visitAuthenticatedPage(path, window => {
                window.sessionStorage.setItem('skycoflApiCache:premium-products:cypress%40example.com', JSON.stringify({
                    expiresAt: Date.now() + 300000, value: {}
                }))
            })
            cy.wait(['@products', '@subscriptions'])
            cy.contains('Provided by another account. Only the purchaser can change or cancel this slot.').should('be.visible')
            cy.contains('button', 'Cancel subscription').should('not.exist')
        })
    }

    it('stays disabled while subscriptions load, then preserves authenticated deletion', () => {
        stubProducts()
        stubSubscriptions({ statusCode: 200, delay: 1200, body: [] })
        cy.intercept('DELETE', '**/api/user/me', request => {
            expect(request.headers.googletoken).to.equal(googleToken)
            request.reply({ statusCode: 200, body: { message: 'Deleted' } })
        }).as('deleteAccount')

        visitAuthenticatedPage()

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

        visitAuthenticatedPage()

        cy.wait('@subscriptions')
        deleteAccountButton().should('be.disabled')
        cy.contains('Premium subscriptions could not be loaded').should('be.visible')
    })

    it('allows deletion when only product loading fails and there is no subscription', () => {
        stubProducts({ forceNetworkError: true })
        stubSubscriptions({ statusCode: 200, body: [] })

        visitAuthenticatedPage()

        cy.wait(['@products', '@subscriptions'])
        cy.contains('Premium products could not be loaded').should('be.visible')
        deleteAccountButton().should('be.enabled')
    })

    it('blocks an active subscription and shows a labeled cancel control without products', () => {
        stubProducts({ forceNetworkError: true })
        stubSubscriptions({ statusCode: 200, body: [activeSubscription] })
        cy.intercept('DELETE', '**/api/premium/subscription/active-subscription', { statusCode: 200 }).as('cancelSubscription')

        visitAuthenticatedPage()

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

        visitAuthenticatedPage()

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
        visitAuthenticatedPage()
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


describe('Premium page upgrade button', () => {
    const upgrade = { productSlug: 'l_prem_plus-slots-4', title: 'Four Premium+ slots', price: 99.69,
        currencyCode: 'eur', ownershipSeconds: 2419200, slotCount: 4, isUpgrade: true }
    const downgrade = { ...upgrade, productSlug: 'l_premium-slots-4', title: 'Four Premium slots', price: 29.69, isUpgrade: false }

    function visitPremium(subscriptions: StubResponse) {
        stubProducts({ statusCode: 200, body: { premium: { expiresAt: '2099-02-01T00:00:00Z' } } })
        stubSubscriptions(subscriptions)
        visitAuthenticatedPage('/premium')
        cy.wait(['@products', '@subscriptions'])
    }

    it('upgrades the existing subscription instead of opening a purchase wizard', () => {
        cy.intercept('GET', '**/api/premium/subscription/active-subscription/plans', { statusCode: 200, body: [downgrade, upgrade] }).as('plans')
        cy.intercept('PUT', '**/api/premium/subscription/active-subscription/switch*', request => {
            expect(request.headers.googletoken).to.equal(googleToken)
            expect(request.query.targetProductSlug).to.equal(upgrade.productSlug)
            request.reply({ statusCode: 200, body: { status: 'completed' } })
        }).as('upgrade')
        visitPremium({ statusCode: 200, body: [{ ...activeSubscription, productName: 'premium' }] })
        cy.contains('button', 'Upgrade to Higher Tier').click()
        cy.wait('@plans')
        cy.contains('.modal-title', 'Upgrade subscription').should('be.visible')
        cy.contains('Four Premium+ slots').should('contain', '99.69')
        cy.get('.modal input[type="radio"]').should('have.length', 1)
        cy.contains('The upgrade applies after payment.').should('be.visible')
        cy.get('#buyPremium').should('not.exist')
        cy.contains('button', 'Upgrade and pay difference').click()
        cy.wait('@upgrade')
        cy.contains('Your subscription plan has been updated.').should('be.visible')
    })

    it('does not offer downgrades or a new purchase when no higher tier is available', () => {
        cy.intercept('GET', '**/api/premium/subscription/active-subscription/plans', { statusCode: 200, body: [downgrade] }).as('plans')
        visitPremium({ statusCode: 200, body: [activeSubscription] })
        cy.contains('button', 'Upgrade to Higher Tier').click()
        cy.wait('@plans')
        cy.contains('No higher-tier plan is available for this subscription.').should('be.visible')
        cy.contains('button', 'Change next renewal').should('not.exist')
        cy.contains('button', 'Upgrade and pay difference').should('not.exist')
        cy.get('#buyPremium').should('not.exist')
    })

    it('keeps the purchase wizard for prepaid accounts without a subscription', () => {
        visitPremium({ statusCode: 200, body: [] })
        cy.contains('button', 'Upgrade to Higher Tier').click()
        cy.get('#buyPremium').should('be.visible').and('contain', 'Upgrade Premium')
        cy.contains('.modal-title', 'Upgrade subscription').should('not.exist')
    })

    it('disables upgrading when subscription lookup fails', () => {
        visitPremium({ forceNetworkError: true })
        cy.contains('Premium subscriptions could not be loaded').should('be.visible')
        cy.contains('button', 'Upgrade to Higher Tier').should('be.disabled')
        cy.get('#buyPremium').should('not.exist')

        let releaseSubscriptions: () => void
        const pending = new Promise<void>(resolve => { releaseSubscriptions = resolve })
        cy.intercept('GET', '**/api/premium/subscription', request =>
            pending.then(() => request.reply({ body: [activeSubscription] }))
        ).as('refreshedSubscriptions')
        cy.window().then(window => window.dispatchEvent(new window.Event('focus')))
        cy.contains('Premium subscriptions could not be loaded').should('be.visible')
        cy.contains('button', 'Upgrade to Higher Tier').should('be.disabled')
        cy.then(() => releaseSubscriptions())
        cy.wait('@refreshedSubscriptions')
        cy.contains('Premium subscriptions could not be loaded').should('not.exist')
        cy.contains('button', 'Upgrade to Higher Tier').should('be.enabled')
    })

    it('keeps each active subscription separate and excludes canceled subscriptions', () => {
        cy.intercept('GET', '**/api/premium/subscription/active-subscription/plans', { statusCode: 200, body: [upgrade] }).as('plans')
        visitPremium({ statusCode: 200, body: [
            { ...activeSubscription, externalId: 'canceled-subscription', endsAt: '2099-01-15T00:00:00Z' },
            { ...activeSubscription, externalId: 'plus-subscription', productName: 'premium_plus' },
            { ...activeSubscription, productName: 'premium' }
        ] })
        cy.contains('h2', 'Extend Premium').parent().find('button').should('have.length', 2)
        cy.contains('span', /^Premium — renews/).parent().contains('button', 'Upgrade to Higher Tier').click()
        cy.wait('@plans')
        cy.contains('.modal-title', 'Upgrade subscription').should('be.visible')
    })
})

const purchasedSlot: {
    id: string
    tier: string
    expires: string
    version: number
    assignedUserId: string | null
    minecraftUuid: string | null
    recipientEmail: string | null
    minecraftName: string | null
} = {
    id: '9007199254740993',
    tier: 'premium_plus',
    expires: '2099-02-01T00:00:00Z',
    version: 7,
    assignedUserId: null,
    minecraftUuid: null,
    recipientEmail: null,
    minecraftName: null
}

function visitSlots() {
    stubProducts()
    stubSubscriptions({ statusCode: 200, body: [] })
    visitAuthenticatedPage()
    cy.wait('@slots')
}

describe('Purchased slot assignments', () => {
    for (const slotCount of [1, 4]) {
        it(`cancels the selected ${slotCount}-slot subscription while keeping other subscriptions and assignments`, () => {
            const subscription = { ...activeSubscription, externalId: 'slot-subscription', productName: `Premium+ ${slotCount} slot`, slotCount }
            let canceled = false
            stubProducts()
            cy.intercept('GET', '**/api/premium/subscription', request => request.reply({ body: [
                activeSubscription, { ...subscription, endsAt: canceled ? subscription.renewsAt : null }
            ] })).as('subscriptions')
            cy.intercept('GET', '**/api/premium/slots', { body: [
                { ...purchasedSlot, subscriptionId: subscription.externalId, recipientEmail: 'friend@example.com', assignedUserId: 'friend' }
            ] }).as('slots')
            cy.intercept('DELETE', '**/api/premium/subscription/*', request => {
                expect(request.url).to.contain('/subscription/slot-subscription')
                expect(request.headers.googletoken).to.equal(googleToken)
                canceled = true
                request.reply({ statusCode: 200 })
            }).as('cancelSlot')
            visitAuthenticatedPage()
            cy.get('#purchased-slots').should('contain.text', 'keeps billing active')
            cy.get('[data-testid="tier-slot"]').contains('button', slotCount === 1 ? 'Cancel slot subscription' : 'Cancel 4-slot subscription').click()
            cy.get('.modal').should('contain.text', 'Subscription #slot-subscription')
                .and('contain.text', slotCount === 1 ? 'this single slot only' : 'all 4 slots')
                .and('contain.text', 'Access continues through the paid period')
            waitForDialogTransition()
            cy.contains('button', 'Confirm cancelation').click()
            cy.wait('@cancelSlot')
            cy.get('.modal').should('not.exist')
            cy.get('[data-testid="tier-slot"]').should('contain.text', 'Canceled · access until').and('contain.text', 'friend@example.com')
            cy.get('[data-testid="tier-slot"]').contains('button', 'Cancel').should('not.exist')
            cy.contains('button', 'Cancel subscription').should('be.visible')
        })
    }

    it('keeps a failed cancellation open and allows retry without claiming success', () => {
        const subscription = { ...activeSubscription, externalId: 'single-slot', productName: 'Premium+ single slot', slotCount: 1 }
        stubProducts()
        stubSubscriptions({ body: [subscription] })
        cy.intercept('GET', '**/api/premium/slots', { body: [{ ...purchasedSlot, subscriptionId: subscription.externalId }] })
        cy.intercept('DELETE', '**/api/premium/subscription/single-slot', { statusCode: 503, delay: 500, body: { message: 'Try again' } }).as('failedCancel')
        visitAuthenticatedPage()
        cy.get('[data-testid="tier-slot"]').contains('button', 'Cancel slot subscription').click()
        cy.contains('button', 'Confirm cancelation').click()
        cy.contains('button', 'Canceling…').should('be.disabled')
        cy.wait('@failedCancel')
        cy.get('.modal').should('contain.text', 'Could not confirm cancellation')
        cy.contains('Subscription cancelled').should('not.exist')
        stubSubscriptions({ body: [{ ...subscription, endsAt: subscription.renewsAt }] })
        cy.intercept('DELETE', '**/api/premium/subscription/single-slot', { statusCode: 200 }).as('retryCancel')
        cy.contains('button', 'Confirm cancelation').click()
        cy.wait('@retryCancel')
        cy.get('.modal').should('not.exist')
        cy.get('[data-testid="tier-slot"]').should('contain.text', 'Canceled · access until')
    })

    it('assigns by email without rounding the slot ID and shows the saved recipient after reloading', () => {
        let slot = { ...purchasedSlot }
        const remaining = ['9007199254740994', '9007199254740995', '9007199254740996'].map(id => ({ ...purchasedSlot, id }))
        cy.intercept('GET', '**/api/premium/slots', request => request.reply({ statusCode: 200, body: [slot, ...remaining] })).as('slots')
        cy.intercept('PUT', `**/api/premium/slots/${slot.id}/assignment`, request => {
            expect(request.headers.googletoken).to.equal(googleToken)
            expect(request.body).to.deep.equal({ email: 'friend@example.com', version: 7 })
            slot = { ...slot, assignedUserId: '123', recipientEmail: 'friend@example.com', version: 8 }
            request.reply({ statusCode: 204 })
        }).as('assignSlot')
        visitSlots()
        cy.get('[data-testid="tier-slot"]').should('have.length', 4).first().contains('button', 'Assign slot').click()
        waitForDialogTransition()
        cy.get('#slot-recipient').type('friend@example.com')
        cy.contains('button', 'Save assignment').click()
        cy.wait('@assignSlot')
        cy.get('[data-testid="tier-slot"]').should('contain.text', 'friend@example.com')
        cy.get('[data-testid="tier-slot"]').filter(':contains("Unassigned")').should('have.length', 3)
        cy.get('[role="dialog"]').should('not.exist')
        cy.contains('button', 'Refresh slots').click()
        cy.wait('@slots')
        cy.get('[data-testid="tier-slot"]').should('contain.text', 'friend@example.com')
    })

    it('assigns a Minecraft name and displays the resolved name', () => {
        let slot = { ...purchasedSlot }
        cy.intercept('GET', '**/api/premium/slots', request => request.reply({ body: [slot] })).as('slots')
        cy.intercept('PUT', '**/api/premium/slots/*/assignment', request => {
            expect(request.body).to.deep.equal({ minecraftAccount: 'Notch', version: 7 })
            slot = { ...purchasedSlot, version: 8, minecraftUuid: '069a79f444e94726a5befca90e38aaf5', minecraftName: 'Notch' }
            request.reply({ statusCode: 204 })
        }).as('assignSlot')
        visitSlots()
        cy.contains('button', 'Assign slot').click()
        cy.get('#slot-recipient-type').select('minecraft')
        cy.get('#slot-recipient').type('Notch')
        cy.contains('button', 'Save assignment').click()
        cy.wait('@assignSlot')
        cy.get('[data-testid="tier-slot"]').should('contain.text', 'Notch')
        cy.get('.Toastify__toast', { timeout: 15000 }).should('not.exist')
        cy.get('#purchased-slots').screenshot('purchased-slot-management')
    })

    it('can use the current account and release an assignment without retaining either recipient field', () => {
        let slot: typeof purchasedSlot = {
            ...purchasedSlot,
            assignedUserId: '123',
            recipientEmail: 'friend@example.com',
            minecraftUuid: '069a79f444e94726a5befca90e38aaf5',
            minecraftName: 'Notch'
        }
        cy.intercept('GET', '**/api/premium/slots', request => request.reply({ body: [slot] })).as('slots')
        cy.intercept('PUT', '**/api/premium/slots/*/assignment', request => {
            slot = { ...purchasedSlot, version: slot.version + 1, assignedUserId: request.body.email ? '7' : null, recipientEmail: request.body.email || null }
            request.reply({ statusCode: 204 })
        }).as('assignSlot')
        visitSlots()
        cy.contains('button', 'Reassign').click()
        waitForDialogTransition()
        cy.get('#slot-recipient-type').select('email')
        cy.contains('button', 'Use my email').click()
        cy.get('#slot-recipient').should('have.value', 'cypress@example.com')
        cy.contains('button', 'Save assignment').click()
        cy.wait('@assignSlot').its('request.body').should('deep.equal', { email: 'cypress@example.com', version: 7 })
        cy.get('[data-testid="tier-slot"]').should('contain.text', 'cypress@example.com').and('not.contain.text', 'Notch')
        cy.get('[role="dialog"]').should('not.exist')
        cy.get('[data-testid="tier-slot"]').contains('button', 'Release slot').click()
        cy.wait('@assignSlot').its('request.body').should('deep.equal', { version: 8 })
        cy.get('[data-testid="tier-slot"]').should('contain.text', 'Unassigned')
    })

    it('refreshes a stale assignment before allowing a retry and prevents duplicate submissions', () => {
        cy.intercept('GET', '**/api/premium/slots', { body: [purchasedSlot] }).as('slots')
        cy.intercept('PUT', '**/api/premium/slots/*/assignment', {
            statusCode: 400,
            delay: 600,
            body: { Message: 'Slot changed; review the current assignment before trying again.' }
        }).as('conflict')
        visitSlots()
        cy.contains('button', 'Assign slot').click()
        cy.get('#slot-recipient').type('friend@example.com')
        cy.intercept('GET', '**/api/premium/slots', { body: [{ ...purchasedSlot, recipientEmail: 'new@example.com', assignedUserId: '333', version: 8 }] }).as(
            'slots'
        )
        cy.contains('button', 'Save assignment').click()
        cy.contains('button', 'Saving…').should('be.disabled')
        cy.wait('@conflict')
        cy.get('.modal').should('contain.text', 'Slot changed').and('contain.text', 'Currently: new@example.com')
        cy.intercept('PUT', '**/api/premium/slots/*/assignment', { statusCode: 204 }).as('retry')
        cy.contains('button', 'Save assignment').click()
        cy.wait('@retry').its('request.body').should('deep.equal', { email: 'friend@example.com', version: 8 })
    })

    it('keeps the form and recipient error visible when the email has no account', () => {
        cy.intercept('GET', '**/api/premium/slots', { body: [purchasedSlot] }).as('slots')
        cy.intercept('PUT', '**/api/premium/slots/*/assignment', {
            statusCode: 400,
            body: 'The recipient must first sign in to SkyCofl with that email.',
            headers: { 'content-type': 'text/plain' }
        }).as('invalidRecipient')
        visitSlots()
        cy.contains('button', 'Assign slot').click()
        cy.get('#slot-recipient').type('unknown@example.com')
        cy.contains('button', 'Save assignment').click()
        cy.wait('@invalidRecipient')
        cy.get('.modal [role="alert"]').should('contain.text', 'must first sign in')
        cy.get('#slot-recipient').should('have.value', 'unknown@example.com')
    })

    it('disables assignment for expired slots and shows an empty state only after a successful load', () => {
        cy.intercept('GET', '**/api/premium/slots', { body: [{ ...purchasedSlot, expires: '2020-01-01T00:00:00Z' }] }).as('slots')
        visitSlots()
        cy.contains('button', 'Assign slot').should('be.disabled')
        cy.intercept('GET', '**/api/premium/slots', { statusCode: 503, body: {} }).as('slots')
        cy.contains('button', 'Refresh slots').click()
        cy.wait('@slots')
        cy.contains('Could not load purchased slots').should('be.visible')
        cy.contains('You don’t own any slots yet').should('not.exist')
        cy.intercept('GET', '**/api/premium/slots', { body: [] }).as('slots')
        cy.contains('button', 'Refresh slots').click()
        cy.wait('@slots')
        cy.contains('You don’t own any slots yet').should('be.visible')
    })
})

const slotCatalog = [
    { slug: 'premium-slots', slotTier: 'premium', slotCount: 1, cost: 1800, ownershipSeconds: 2592000 },
    { slug: 'premium-slots-4', slotTier: 'premium', slotCount: 4, cost: 6000, ownershipSeconds: 2592000 },
    { slug: 'premium_plus-slot-weeks', slotTier: 'premium_plus', slotCount: 1, cost: 9000, ownershipSeconds: 2419200 },
    { slug: 'premium_plus-slots-4', slotTier: 'premium_plus', slotCount: 4, cost: 27000, ownershipSeconds: 2419200 },
    { slug: 'l_premium-slots', slotTier: 'premium', slotCount: 1, cost: 1800, ownershipSeconds: 2419200 },
    { slug: 'l_prem_plus-slots', slotTier: 'premium_plus', slotCount: 1, cost: 8500, ownershipSeconds: 2419200 },
    { slug: 'l_premium-slots-4', slotTier: 'premium', slotCount: 4, cost: 7200, ownershipSeconds: 2419200 },
    { slug: 'l_prem_plus-slots-4', slotTier: 'premium_plus', slotCount: 4, cost: 27000, ownershipSeconds: 2419200 }
]

function slotPricing() {
    return {
        products: [['l_premium-slots', 9.69], ['l_prem_plus-slots', 35.69], ['l_premium-slots-4', 29.69], ['l_prem_plus-slots-4', 99.69]].map(([slug, amount]) => ({
            productSlug: slug, providers: [{ providerSlug: 'lemonsqueezy', currencyCode: 'EUR', originalPrice: Number(amount), discountedPrice: Number(amount) }]
        }))
    }
}

describe('Slot packages in the Premium wizard', () => {
    beforeEach(() => {
        cy.intercept('GET', 'https://api.country.is*', { body: { country: 'US' } })
        cy.intercept('GET', '**/api/premium/slots/products', { body: slotCatalog }).as('slotProducts')
        cy.intercept('POST', '**/api/topup/rates', request => request.reply({ body: slotPricing() })).as('slotPrices')
        stubProducts()
        stubSubscriptions({ body: [] })
    })

    function visitShop(path = '/premium?slots=true#buyPremium') {
        visitAuthenticatedPage(path)
        cy.contains('Which premium tier would you like?').should('be.visible')
        cy.get('#buyPremium h5').should('have.length', 2)
    }

    function packageButton(count: number) {
        return cy.get('[data-testid="premium-package"]').contains('h5', count === 0 ? 'Just for me' : count === 1 ? 'One assignable slot' : 'Package of 4')
    }

    function choosePackage(tier = 'Premium+', count = 4, payment = 'CoflCoins') {
        cy.get('#buyPremium').contains('h5', tier === 'Premium+' ? /^Premium Plus$/ : /^Premium$/).click()
        cy.get('#buyPremium').contains('h5', payment).click()
        packageButton(count).click()
    }

    function confirmCoins() {
        cy.contains('button', 'Confirm Google identity').click()
        cy.get('#premium-early-start-declaration').check()
        cy.contains('button', 'Buy now for').click()
    }

    it('offers all three packages between payment and duration and skips duration for assignable slots', () => {
        cy.viewport(1280, 1300)
        visitAuthenticatedPage('/premium')
        cy.get('#buyPremium').contains('h5', /^Premium Plus$/).click()
        cy.contains('Step 2 of 5').should('be.visible')
        cy.contains('How would you like to pay?').should('be.visible')
        cy.get('[data-testid="premium-package"]').should('not.exist')
        cy.get('#buyPremium').contains('h5', /^CoflCoins$/).click()
        cy.contains('Choose Your Package').should('be.visible')
        cy.contains('Step 3 of 5').should('be.visible')
        cy.get('[data-testid="premium-package"]').should('have.length', 3).and('be.enabled')
        packageButton(0).should('be.visible')
        packageButton(1).closest('button').should('contain.text', '9,000 CoflCoins per slot · 4 weeks')
        packageButton(4).closest('button').should('contain.text', '6,750 CoflCoins per slot · 4 weeks')
        cy.get('[data-testid="slot-offer"]').should('not.exist')
        cy.get('#buyPremium input[placeholder="Select your country"]').should('not.exist')
        cy.contains('#buyPremium h3', 'Choose Your Package').closest('.card').screenshot('package-before-duration')
        packageButton(4).click()
        cy.contains('Step 4 of 4').should('be.visible')
        cy.contains('h3', 'Select Duration').should('not.exist')
        cy.get('[data-testid="slot-offer"]').should('have.length', 1).and('contain.text', '27,000 CoflCoins').and('not.contain.text', 'Subscription')
        cy.get('#buyPremium').screenshot('package-checkout')
        cy.get('#buyPremium').contains('button', 'Back').click()
        packageButton(1).click()
        cy.contains('Step 4 of 4').should('be.visible')
        cy.get('[data-testid="slot-offer"]').should('have.length', 1).and('contain.text', '9,000 CoflCoins')
        cy.get('#buyPremium').contains('button', 'Back').click()
        packageButton(0).click()
        cy.contains('h3', 'Select Duration').should('be.visible')
        cy.contains('Step 4 of 5').should('be.visible')
        cy.get('#buyPremium').contains('h5', '4 Weeks').click()
        cy.contains('Step 5 of 5').should('be.visible')
        cy.contains('h3', 'Complete Purchase').should('be.visible')
        cy.get('#buyPremium').contains('button', 'Back').click()
        cy.contains('Step 4 of 5').should('be.visible')
    })

    it('keeps both friends choices selectable with an empty catalog', () => {
        cy.intercept('GET', '**/api/premium/slots/products', { body: [] }).as('slotProducts')
        visitShop()
        cy.get('#buyPremium').contains('h5', /^Premium Plus$/).click()
        cy.get('#buyPremium').contains('h5', /^CoflCoins$/).click()
        cy.get('[data-testid="premium-package"]').should('have.length', 2).and('be.enabled')
        cy.contains('No slots are currently available').should('not.exist')
        packageButton(4).closest('button').should('contain.text', 'Price unavailable').and('be.enabled')
        packageButton(4).click()
        cy.contains('This package is currently unavailable').should('be.visible')
        cy.get('[data-testid="slot-offer"]').should('not.exist')
        cy.get('#buyPremium').contains('button', 'Back').click()
        packageButton(0).should('not.exist')
        packageButton(1).click()
        cy.contains('This package is currently unavailable').should('be.visible')
        cy.contains('h3', 'Select Duration').should('not.exist')
    })

    it('keeps Starter on its four-step personal flow and skips unsupported slot packages', () => {
        visitAuthenticatedPage('/premium')
        cy.get('#buyPremium').contains('h5', /^Starter$/).click()
        cy.contains('Step 2 of 4').should('be.visible')
        cy.contains('How would you like to pay?').should('be.visible')
        cy.get('[data-testid="premium-package"]').should('not.exist')
        cy.get('#buyPremium').contains('button', 'Back').click()
        cy.contains('Choose Your Premium Tier').should('be.visible')
        cy.contains('Step 1 of 4').should('be.visible')
    })

    it('opens payment for a preselected tier, then shows packages before duration', () => {
        visitAuthenticatedPage('/premium?tier=premium_plus')
        cy.contains('How would you like to pay?').should('be.visible')
        cy.contains('Step 2 of 5').should('be.visible')
        cy.get('#buyPremium').contains('h5', /^Subscription$/).click()
        cy.contains('Choose Your Package').should('be.visible')
        cy.contains('Step 3 of 5').should('be.visible')
        packageButton(0).should('be.visible')
        cy.get('[data-testid="premium-package"]').should('have.length', 3)
        cy.contains('#buyPremium h5', 'One assignable slot').should('be.visible')
        packageButton(4).closest('button').should('contain.text', '~€24.92 per slot · every 4 weeks')
    })

    it('makes bundles reachable for an existing subscriber without entering the upgrade dialog', () => {
        stubProducts({ body: { premium_plus: { expiresAt: '2099-02-01T00:00:00Z' } } })
        stubSubscriptions({ body: [activeSubscription] })
        visitAuthenticatedPage('/premium')
        cy.on('window:before:load', installAuthenticatedWebSocket)
        cy.contains('a', 'Explore slots & bundles').click()
        cy.location('search').should('contain', 'slots=true')
        cy.contains('h2', 'Get slots').should('be.visible')
        cy.get('#buyPremium h5').should('have.length', 2)
        cy.contains('.modal-title', 'Upgrade subscription').should('not.exist')
    })

    for (const [index, slug, count, amount] of [[0, 'l_premium-slots', 1, '9.69'], [1, 'l_prem_plus-slots', 1, '35.69'], [0, 'l_premium-slots-4', 4, '29.69'], [1, 'l_prem_plus-slots-4', 4, '99.69']] as const) {
        it(`reviews and opens the correct ${slug} checkout with assignment as the return destination`, () => {
            cy.intercept('POST', `**/api/premium/subscription/${slug}?*`, request => {
                expect(request.query.assignSlots).to.equal('true')
                expect(request.headers.googletoken).to.equal(googleToken)
                request.reply({ statusCode: 200, delay: 500, body: { directLink: 'https://test.lemonsqueezy.com/checkout/slot-bundle' } })
            }).as('slotCheckout')
            visitShop()
            choosePackage(index === 0 ? 'Premium' : 'Premium+', count, 'Subscription')
            cy.get('[data-testid="slot-offer"]').should('contain.text', amount)
            if (count === 1) cy.contains('Same price as a normal subscription.').should('be.visible')
            cy.window().then(window => cy.stub(window, 'open').as('checkoutNavigation'))
            cy.contains('button', 'Continue with subscription').click()
            cy.contains('.modal-title', 'Review your slot subscription').should('be.visible')
            cy.get('.modal').should('contain.text', 'new subscription').and('contain.text', 'assign the slots')
            if (count === 1) cy.get('.modal').should('contain.text', 'Cancel slot subscription').and('contain.text', 'Only this slot subscription')
            cy.contains('button', 'Continue to checkout').click()
            cy.contains('button', 'Opening checkout…').should('be.disabled')
            cy.get('#buyPremium').contains('button', 'Back').should('be.disabled')
            cy.wait('@slotCheckout')
            cy.get('@checkoutNavigation').should('have.been.calledOnceWithExactly', 'https://test.lemonsqueezy.com/checkout/slot-bundle', '_self')
            cy.contains('Your 4 slots are ready').should('not.exist')
        })
    }

    it('purchases one four-slot package for 27,000 coins with the existing declaration and identity confirmation', () => {
        cy.intercept('POST', '**/api/service/purchase', request => {
            expect(request.headers.googletoken).to.equal(googleToken)
            expect(request.body).to.include({ slug: 'premium_plus-slots-4', count: 1, immediatePerformanceRequested: true, withdrawalConsequenceAcknowledged: true, declarationVersion: 'test-declaration', legalLocale: 'en' })
            expect(request.body.declarationRequestId).to.be.a('string').and.not.be.empty
            expect(request.body).not.to.have.property('slotIds')
            request.reply({ statusCode: 200 })
        }).as('buySlots')
        visitShop()
        choosePackage()
        cy.get('[data-testid="slot-offer"]').filter(':contains("CoflCoins · pay once")').should('have.length', 1).and('contain.text', '27,000 CoflCoins').and('contain.text', 'Save 25%')
        cy.get('#buyPremium').screenshot('four-slot-coflcoin-bundle')
        cy.contains('button', 'Buy with CoflCoins').click()
        cy.get('.modal').should('contain.text', '4 Premium+ slots').and('contain.text', '4 weeks').and('not.contain.text', 'cannot ordinarily be moved')
        cy.contains('button', 'Buy now for').should('be.disabled')
        confirmCoins()
        cy.wait('@buySlots')
        cy.contains('Your 4 slots are ready').should('be.visible')
        cy.contains('a', 'Assign your slots').should('have.attr', 'href', '/account#purchased-slots')
    })

    it('offers individual slots with their actual durations and purchases the single-slot product', () => {
        cy.intercept('POST', '**/api/service/purchase', { statusCode: 200 }).as('buySlots')
        visitShop()
        choosePackage('Premium', 1)
        cy.get('[data-testid="slot-offer"]').first().should('contain.text', '1,800 CoflCoins').and('contain.text', '30 days')
        cy.get('[data-testid="slot-offer"]').first().contains('button', 'Buy with CoflCoins').click()
        confirmCoins()
        cy.wait('@buySlots').its('request.body').should('include', { slug: 'premium-slots', count: 1 })
        cy.contains('Your slot is ready').should('be.visible')
    })

    it('routes an insufficient balance to top-up instead of attempting a purchase', () => {
        let purchaseAttempts = 0
        cy.intercept('POST', '**/api/service/purchase', request => { purchaseAttempts++; request.reply({ statusCode: 400 }) })
        visitShop()
        choosePackage()
        cy.window().then(window => window.document.dispatchEvent(new CustomEvent('coflCoinRefresh', { detail: { coflCoins: 1000 } })))
        cy.contains('Add 26,000 CoflCoins').should('be.visible')
        cy.contains('button', 'Top up CoflCoins').click()
        cy.get('.modal').should('not.exist')
        cy.then(() => expect(purchaseAttempts).to.equal(0))
    })

    it('blocks subscription checkout when prices fail and allows going back to CoflCoins', () => {
        cy.intercept('POST', '**/api/topup/rates', { statusCode: 503, body: {} }).as('slotPrices')
        visitShop()
        choosePackage('Premium+', 4, 'Subscription')
        cy.contains('Could not load subscription prices').should('be.visible')
        cy.contains('button', 'Continue with subscription').should('be.disabled')
        cy.get('#buyPremium').contains('button', 'Back').click()
        cy.get('#buyPremium').contains('button', 'Back').click()
        cy.get('#buyPremium').contains('h5', /^CoflCoins$/).click()
        packageButton(4).click()
        cy.contains('button', 'Buy with CoflCoins').should('be.enabled')
        cy.contains('button', 'Continue with subscription').should('not.exist')
    })

    it('hides personal access in slot mode for subscriptions and CoflCoins', () => {
        visitShop()
        cy.contains('Step 1 of 4').should('be.visible')
        cy.get('#buyPremium').contains('h5', /^Premium$/).click()
        cy.get('#buyPremium').contains('h5', /^Subscription$/).click()
        cy.get('[data-testid="premium-package"]').should('have.length', 2)
        packageButton(0).should('not.exist')
        packageButton(4).should('be.visible')
        cy.contains('Step 3 of 4').should('be.visible')
        cy.contains('#buyPremium h5', 'One assignable slot').should('be.visible')
        cy.get('#buyPremium').contains('button', 'Back').click()
        cy.get('#buyPremium').contains('h5', /^CoflCoins$/).click()
        cy.get('[data-testid="premium-package"]').should('have.length', 2)
        packageButton(0).should('not.exist')
        packageButton(4).should('be.visible')
        packageButton(1).click()
        cy.contains('Step 4 of 4').should('be.visible')
        cy.contains('h3', 'Select Duration').should('not.exist')
        cy.get('[data-testid="slot-offer"]').should('contain.text', '1,800 CoflCoins')
    })

    it('preloads the catalog and quotes once and reuses them across steps', () => {
        let catalogs = 0
        let quotes = 0
        cy.intercept('GET', '**/api/premium/slots/products', request => {
            catalogs++
            request.reply({ body: slotCatalog })
        }).as('preloadCatalog')
        cy.intercept('POST', '**/api/topup/rates', request => {
            if (request.body.productSlugs.includes('l_premium-slots-4')) quotes++
            request.reply({ body: slotPricing() })
        }).as('preloadQuotes')
        visitShop()
        cy.wait('@preloadCatalog')
        cy.wait('@preloadQuotes')
        choosePackage('Premium', 4, 'Subscription')
        cy.get('[data-testid="slot-offer"]').should('contain.text', '29.69')
        cy.get('#buyPremium').contains('button', 'Back').click()
        packageButton(4).closest('button').should('contain.text', '~€7.42 per slot')
        cy.contains('#buyPremium h3', 'Choose Your Package').closest('.card').screenshot('subscription-package-options')
        packageButton(4).click()
        cy.contains('Renews automatically. Cancel anytime.').trigger('mouseover')
        cy.get('[role="tooltip"]').should('contain.text', 'account page').and('contain.text', 'time you have already paid for')
        cy.then(() => { expect(catalogs).to.equal(1); expect(quotes).to.equal(1) })
    })

    it('purchases four Premium slots for 6,000 CoflCoins and shows their per-slot cost', () => {
        cy.intercept('POST', '**/api/service/purchase', { statusCode: 200 }).as('buySlots')
        visitShop()
        cy.get('#buyPremium').contains('h5', /^Premium$/).click()
        cy.get('#buyPremium').contains('h5', /^CoflCoins$/).click()
        packageButton(4).closest('button').should('contain.text', '1,500 CoflCoins per slot · 30 days')
        packageButton(4).click()
        cy.get('[data-testid="slot-offer"]').should('contain.text', '6,000 CoflCoins').and('contain.text', '1,500 CoflCoins')
        cy.contains('button', 'Buy with CoflCoins').click()
        cy.get('.modal').should('contain.text', '4 Premium slots').and('contain.text', '30 days')
        confirmCoins()
        cy.wait('@buySlots').its('request.body').should('include', { slug: 'premium-slots-4', count: 1 })
        cy.contains('Your 4 slots are ready').should('be.visible')
    })

    it('recovers from catalog errors and does not show invented offers', () => {
        cy.intercept('GET', '**/api/premium/slots/products', { statusCode: 503, body: {} }).as('slotProducts')
        visitShop()
        choosePackage()
        cy.contains('Could not load slot options').should('be.visible')
        cy.get('[data-testid="slot-offer"]').should('not.exist')
        cy.intercept('GET', '**/api/premium/slots/products', { body: slotCatalog }).as('slotProducts')
        cy.contains('button', 'Try again').click()
        cy.get('[data-testid="slot-offer"]').should('have.length', 1)
    })

    it('does not keep old tax-inclusive prices available while another country is loading', () => {
        cy.intercept('POST', '**/api/topup/rates', request => {
            request.reply({ body: slotPricing(), delay: request.body.countryCode === 'DE' ? 1000 : 0 })
        })
        visitShop()
        choosePackage('Premium', 4, 'Subscription')
        cy.contains('button', 'Continue with subscription').should('be.enabled')
        cy.get('#buyPremium input[placeholder="Select your country"]').click().type('Germany')
        cy.get('.rbt-menu').contains('Germany').click()
        cy.contains('button', 'Continue with subscription').should('be.disabled')
        cy.get('[data-testid="slot-offer"]').should('not.contain.text', '29.69')
        cy.get('#buyPremium input[placeholder="Select your country"]').clear().type('France')
        cy.get('.rbt-menu').contains('France').click()
        cy.get('[data-testid="slot-offer"]').should('contain.text', '35.63')
        cy.contains('button', 'Continue with subscription').should('be.enabled')
        cy.get('#buyPremium').contains('button', 'Back').click()
        packageButton(4).closest('button').should('contain.text', '~€8.91 per slot')
    })

    it('keeps the cards usable on a phone and confirms price changes when the country changes', () => {
        cy.viewport(390, 844)
        visitShop()
        choosePackage('Premium', 4, 'Subscription')
        cy.get('[data-testid="slot-offer"]').first().should('contain.text', '29.69')
        cy.get('#buyPremium input[placeholder="Select your country"]').click().type('Germany')
        cy.get('.rbt-menu').contains('Germany').click()
        cy.get('[data-testid="slot-offer"]').first().should('contain.text', '35.33')
        cy.get('#buyPremium').contains('button', 'Back').click()
        packageButton(4).closest('button').should('contain.text', '~€8.83 per slot · every 4 weeks')
        cy.document().then(document => expect(document.documentElement.scrollWidth).to.be.at.most(390))
        packageButton(4).click()
        cy.get('[data-testid="slot-offer"]').first().should('contain.text', '35.33')
        cy.contains('button', 'Continue with subscription').click()
        cy.get('.modal').should('contain.text', '35.33').and('contain.text', 'Includes estimated tax')
        cy.get('.modal').contains('button', 'Back').click()
        cy.document().then(document => expect(document.documentElement.scrollWidth).to.be.at.most(390))
        cy.get('[data-testid="slot-offer"]').first().scrollIntoView()
        cy.screenshot('slot-bundles-mobile', { capture: 'viewport', blackout: ['#nprogress'] })
    })
})
