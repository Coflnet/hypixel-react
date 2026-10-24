export {}

const googleToken = 'eyJhbGciOiJub25lIn0.eyJleHAiOjQxNDI0NDQ4MDAsImVtYWlsIjoidGVybXNAZXhhbXBsZS5jb20ifQ.signature'
const PAGE_READY_TIMEOUT = 30000

type PlanBody = {
    modes?: string[]
    investingHorizonHours?: number
    budgetCoins?: number
    sellTaxRate?: number
}

function installLogin(window: Cypress.AUTWindow, userSettings?: Record<string, unknown>) {
    class AuthenticatedWebSocket {
        static OPEN = 1
        readyState = AuthenticatedWebSocket.OPEN
        onopen: ((event: Event) => void) | null = null
        onmessage: ((event: MessageEvent) => void) | null = null

        constructor() {
            window.setTimeout(() => this.onopen?.(new Event('open')), 0)
        }

        send(value: string) {
            const request = JSON.parse(value)
            const response = request.type === 'loginWithToken' ? googleToken : ''
            window.setTimeout(
                () => this.onmessage?.(new MessageEvent('message', { data: JSON.stringify({ mId: request.mId, type: request.type, data: JSON.stringify(response) }) })),
                0
            )
        }

        close() {}
    }
    window.WebSocket = AuthenticatedWebSocket as unknown as typeof WebSocket
    window.localStorage.clear()
    window.sessionStorage.clear()
    window.document.cookie = 'nonEssentialCookiesAllowed=false; path=/'
    window.localStorage.setItem('googleId', googleToken)
    if (userSettings) {
        window.localStorage.setItem('userSettings', JSON.stringify(userSettings))
    }
}

function stubAccount() {
    cy.intercept('GET', '**/api/user/terms*', { required: false })
    cy.intercept('POST', '**/api/premium/user/owns', { premium: { expiresAt: new Date(Date.now() + 86400000).toISOString() } })
    cy.intercept('GET', '**/api/referral/info*', { oldInfo: {} })
    cy.intercept('GET', '**/api/mod/goals*', { goals: [] })
}

function visitPlan(fixture: string, userSettings?: Record<string, unknown>) {
    stubAccount()
    cy.intercept('POST', '**/api/flip/bazaar/plan', { fixture: `bazaar-plan/${fixture}.json` }).as('plan')
    cy.visit('/bazaarPlan', { onBeforeLoad: window => installLogin(window, userSettings) })
    cy.wait('@plan', { timeout: PAGE_READY_TIMEOUT })
}

function requestBody(interception: { request: { body: unknown } }): PlanBody {
    const body = interception.request.body
    return typeof body === 'string' ? JSON.parse(body) : (body as PlanBody)
}

describe('Bazaar plan', () => {
    it('applies the smart defaults on the first load and sends no overrides', () => {
        visitPlan('qualified')
        cy.get('@plan.all').should('have.length', 1)
        cy.get('@plan').then(interception => {
            expect(requestBody(interception as never)).to.deep.equal({ modes: ['active'] })
        })
        cy.get('[data-cy=plan-mode-active]').should('have.attr', 'aria-pressed', 'true')
        cy.get('[data-cy=plan-mode-investing]').should('have.attr', 'aria-pressed', 'false')
        cy.get('[data-cy=plan-horizon]').should('not.exist')
        // the budget is prefilled with what the server planned with and says where it comes from
        cy.get('[data-cy=plan-budget]').should('have.value', '4000000')
        cy.get('[data-cy=plan-budget-source]').should('contain.text', 'two thirds of your purse')
        cy.get('[data-cy=plan-row]').should('have.length', 2)
        cy.get('[data-cy=plan-quote]').should('contain.text', 'valid until')
        cy.get('[data-cy=plan-stale]').should('not.exist')
        cy.get('[data-cy=plan-row][data-item-tag=ENCHANTED_DIAMOND]').within(() => {
            cy.get('[data-cy=plan-prices]').should('contain.text', '105.1').and('contain.text', '209.9')
            cy.get('[data-cy=plan-net]').should('contain.text', '19,618')
            cy.get('[data-cy=plan-lock]').should('contain.text', '≤ 1 h')
            cy.contains('first accepted buy order').should('exist')
        })
    })

    it('shows a confidence badge per status and never renders an unknown probability as a percentage', () => {
        visitPlan('qualified')
        cy.get('[data-cy=plan-row][data-item-tag=ENCHANTED_GOLD] [data-cy=plan-badge]')
            .should('have.class', 'bg-success')
            .and('contain.text', '>95% full cycle (lb 96.2%)')
        cy.get('[data-cy=plan-row][data-item-tag=ENCHANTED_DIAMOND] [data-cy=plan-badge]').should('not.exist')

        visitPlan('unknown')
        cy.get('[data-cy=plan-row][data-item-tag=ENCHANTED_IRON] [data-cy=plan-badge]').should('have.class', 'bg-secondary').and('have.text', 'unknown')
        cy.get('[data-cy=plan-row][data-item-tag=ENCHANTED_COAL] [data-cy=plan-badge]').should('have.class', 'bg-warning').and('contain.text', 'simulation only')
        cy.get('[data-cy=plan-row][data-item-tag=ENCHANTED_LAPIS] [data-cy=plan-badge]').should('have.text', 'unknown')
        cy.get('[data-cy=plan-row]').each(row => {
            expect(row.find('[data-cy=plan-badge]').text()).not.to.match(/\d\s*%/)
        })
    })

    it('marks an expired quote as stale', () => {
        visitPlan('stale')
        cy.get('[data-cy=plan-stale]').should('contain.text', 'stale')
        cy.get('[data-cy=plan-track]').should('be.disabled')
    })

    it('explains an empty qualified investing result with one-click alternatives', () => {
        visitPlan('empty', { bazaarPlanMode: 'Investing' })
        cy.get('[data-cy=plan-empty-investing]').should('contain.text', 'No Investing order qualifies')
        cy.get('[data-cy=plan-row]').should('not.exist')
        cy.get('[data-cy=plan-error]').should('not.exist')
        cy.get('[data-cy=plan-candidates]').should('not.have.attr', 'open')
        cy.get('[data-cy=plan-candidates]').should('contain.text', 'no proven odds')
        cy.get('[data-cy=plan-alt-active]').click()
        cy.wait('@plan').then(interception => {
            expect(requestBody(interception as never).modes).to.deep.equal(['active'])
        })
        cy.get('[data-cy=plan-mode-active]').should('have.attr', 'aria-pressed', 'true')
    })

    it('shows an error with retry for an unavailable planner and keeps the inputs', () => {
        let unavailable = false
        stubAccount()
        cy.intercept('POST', '**/api/flip/bazaar/plan', request => {
            if (unavailable) {
                request.reply({ statusCode: 503, body: { slug: 'plan_unavailable', message: 'The planner is currently unavailable, please try again shortly.' } })
            } else {
                request.reply({ fixture: 'bazaar-plan/qualified.json' })
            }
        }).as('plan')
        cy.visit('/bazaarPlan', { onBeforeLoad: window => installLogin(window) })
        cy.wait('@plan', { timeout: PAGE_READY_TIMEOUT })
        cy.get('[data-cy=plan-row]').should('have.length', 2)

        cy.then(() => {
            unavailable = true
        })
        cy.get('[data-cy=plan-budget]').clear().type('2m')
        cy.get('[data-cy=plan-tax]').type('1.25')
        cy.get('[data-cy=plan-error]', { timeout: 10000 }).should('contain.text', 'currently unavailable')
        cy.get('[data-cy=plan-row]').should('not.exist')
        cy.get('[data-cy=plan-budget]').should('have.value', '2m')
        cy.get('[data-cy=plan-tax]').should('have.value', '1.25')

        cy.then(() => {
            unavailable = false
        })
        cy.get('[data-cy=plan-retry]').click()
        cy.wait('@plan').then(interception => {
            expect(requestBody(interception as never)).to.deep.equal({ modes: ['active'], budgetCoins: 2000000, sellTaxRate: 0.0125 })
        })
        cy.get('[data-cy=plan-row]').should('have.length', 2)
        cy.get('[data-cy=plan-error]').should('not.exist')
        cy.get('[data-cy=plan-budget]').should('have.value', '2m')
        cy.get('[data-cy=plan-tax]').should('have.value', '1.25')
    })

    it('rejects a horizon of 49 hours in the browser without sending a request', () => {
        visitPlan('qualified')
        cy.get('[data-cy=plan-mode-investing]').click()
        cy.wait('@plan').then(interception => {
            expect(requestBody(interception as never)).to.deep.equal({ modes: ['investing'], investingHorizonHours: 24 })
        })
        cy.get('@plan.all').then(requests => {
            const before = requests.length
            cy.get('[data-cy=plan-horizon]').clear().type('49')
            cy.get('[data-cy=plan-horizon-error]').should('be.visible').and('contain.text', 'between 1 and 48')
            // wait longer than the input settling time, nothing may be sent
            cy.wait(1200)
            cy.get('@plan.all').should('have.length', before)
            cy.get('[data-cy=plan-horizon]').clear().type('48')
            cy.wait('@plan').then(interception => {
                expect(requestBody(interception as never).investingHorizonHours).to.equal(48)
            })
        })
    })

    it('sends one request with one budget for both modes', () => {
        visitPlan('qualified')
        cy.get('[data-cy=plan-budget]').clear().type('3m')
        cy.wait('@plan')
        cy.get('@plan.all').then(requests => {
            const before = requests.length
            cy.get('[data-cy=plan-mode-both]').click()
            cy.wait('@plan').then(interception => {
                expect(requestBody(interception as never)).to.deep.equal({ modes: ['active', 'investing'], investingHorizonHours: 24, budgetCoins: 3000000 })
            })
            cy.wait(1200)
            cy.get('@plan.all').should('have.length', before + 1)
        })
        cy.window().then(window => {
            expect(JSON.parse(window.localStorage.getItem('userSettings')!).bazaarPlanMode).to.equal('Both')
        })
    })

    it('shows exactly the sampled rows and a premium prompt to free users', () => {
        visitPlan('free-samples')
        cy.get('[data-cy=plan-row]').should('have.length', 3)
        cy.get('[data-cy=plan-premium-prompt]').should('contain.text', '+9 more with Starter Premium')
        cy.contains('a', 'See premium plans').should('have.attr', 'href', '/premium')
    })

    it('tracks an order in game with the quote it was planned with', () => {
        stubAccount()
        cy.intercept('POST', '**/api/flip/bazaar/plan/track', { statusCode: 204 }).as('track')
        visitPlan('qualified')
        cy.get('[data-cy=plan-row][data-item-tag=ENCHANTED_GOLD] [data-cy=plan-track]').click()
        cy.wait('@track').then(interception => {
            expect(requestBody(interception as never)).to.deep.equal({ quoteId: '00000000-0000-0000-0000-0000000000a1', itemTag: 'ENCHANTED_GOLD' })
        })
        cy.contains('Tracking').should('be.visible')
    })

    it('redirects the old premium bazaar address to the bazaar plan', () => {
        cy.request({ url: '/premiumBazaar', followRedirect: false }).then(response => {
            expect(response.status).to.equal(308)
            expect(response.headers.location).to.match(/\/bazaarPlan$/)
        })
        stubAccount()
        cy.visit('/premiumBazaar')
        cy.location('pathname').should('eq', '/bazaarPlan')
    })

    it('links to the personal plan from the bazaar flips page', () => {
        cy.visit('/bazaar')
        cy.get('[data-cy=personal-plan-link]').should('have.attr', 'href', '/bazaarPlan')
    })
})
