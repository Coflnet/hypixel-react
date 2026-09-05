export {}

const googleToken = 'eyJhbGciOiJub25lIn0.eyJleHAiOjQxNDI0NDQ4MDAsImVtYWlsIjoidGVybXNAZXhhbXBsZS5jb20ifQ.signature'
const reminderDelay = 12 * 60 * 60 * 1000

function installAuthenticatedWebSocket(window: Cypress.AUTWindow, clearStorage = true, token = googleToken) {
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
            const response = request.type === 'loginWithToken' ? token : ''
            window.setTimeout(
                () =>
                    this.onmessage?.(
                        new MessageEvent('message', { data: JSON.stringify({ mId: request.mId, type: request.type, data: JSON.stringify(response) }) })
                    ),
                0
            )
        }

        close() {}
    }

    window.WebSocket = AuthenticatedWebSocket as unknown as typeof WebSocket
    if (clearStorage) {
        window.localStorage.clear()
        window.sessionStorage.clear()
    }
    window.localStorage.setItem('googleId', token)
}

function stubAccountRequests(overrides: Partial<TermsStatus> = {}) {
    cy.intercept('GET', '**/api/user/terms*', {
        statusCode: 200,
        body: {
            required: true,
            canContinueWithoutAccepting: true,
            canStartNewContract: false,
            agreementId: 'skycofl',
            agreementHash: 'future-hash',
            agreementUrl: 'https://coflnet.com/legal/agreements/future-hash.json',
            version: '2026-08-08',
            hash: 'future-hash',
            englishUrl: 'https://coflnet.com/legal/versions',
            germanUrl: 'https://coflnet.com/legal/versions',
            documents: [
                {
                    key: 'terms',
                    title: 'Core Terms',
                    version: '2026-08-08',
                    url: 'https://coflnet.com/legal/archive/terms-en.md',
                    sha256: 'a'.repeat(64),
                    acceptanceHash: 'b'.repeat(64),
                    changed: false
                },
                {
                    key: 'commerceTerms',
                    title: 'Commerce and Programme Terms',
                    version: '2026-09-04',
                    url: 'https://coflnet.com/legal/archive/commerce-en.md',
                    sha256: 'c'.repeat(64),
                    acceptanceHash: 'd'.repeat(64),
                    changed: true
                }
            ],
            ...overrides
        }
    }).as('terms')
    cy.intercept('POST', '**/api/premium/user/owns', { statusCode: 200, body: {} }).as('owns')
    cy.intercept('GET', '**/api/premium/subscription', { statusCode: 200, body: [] }).as('subscriptions')
    cy.intercept('GET', '**/api/premium/transactions', { statusCode: 200, body: [] })
}

describe('Terms acceptance reminder', () => {
    it('highlights changed terms, uses the readable viewer, and waits twelve hours after continuing', () => {
        stubAccountRequests()
        cy.visit('/account', { onBeforeLoad: installAuthenticatedWebSocket })
        cy.wait('@terms')

        cy.contains('li', 'Commerce and Programme Terms')
            .should('contain.text', 'Changed')
            .find('a')
            .should('have.attr', 'href')
            .and('include', 'compareVersion=2026-08-08')

        const clickedAt = Date.now()
        cy.contains('button', 'Continue under previous terms').click()
        cy.wait(['@owns', '@subscriptions'])
        cy.window().then(window => {
            const reminder = JSON.parse(window.localStorage.getItem('skycoflTermsReminder')!)
            expect(reminder.agreementHash).to.equal('future-hash')
            expect(reminder.user).to.equal('terms@example.com')
            expect(reminder.showAfter).to.be.at.least(clickedAt + reminderDelay)
        })
        cy.window().should(window => {
            const cacheKeys = Object.keys(window.sessionStorage).filter(key => key.startsWith('skycoflApiCache:'))
            expect(cacheKeys).to.have.length(1)
            cacheKeys.forEach(key => {
                const entry = JSON.parse(window.sessionStorage.getItem(key)!)
                expect(entry.expiresAt).to.be.at.least(Date.now() + 5 * 60 * 1000 - 1000)
            })
        })

        cy.visit('/account', { onBeforeLoad: window => installAuthenticatedWebSocket(window, false) })
        cy.wait('@subscriptions')
        cy.get('@terms.all').should('have.length', 1)
        cy.get('@owns.all').should('have.length', 1)
        cy.contains('Review the SkyCofl agreement').should('not.exist')
    })

    it('reuses terms across refreshes and tabs for an hour, then checks again', () => {
        stubAccountRequests()
        const now = Date.now()
        cy.visit('/account', {
            onBeforeLoad(window) {
                installAuthenticatedWebSocket(window)
                window.Date.now = () => now
            }
        })
        cy.wait('@terms')
        cy.contains('button', 'Continue under previous terms').click()
        cy.wait('@subscriptions')

        cy.visit('/account', {
            onBeforeLoad(window) {
                installAuthenticatedWebSocket(window, false)
                window.sessionStorage.clear()
                window.Date.now = () => now + 59 * 60 * 1000
            }
        })
        cy.wait('@subscriptions')
        cy.get('@terms.all').should('have.length', 1)

        cy.visit('/account', {
            onBeforeLoad(window) {
                installAuthenticatedWebSocket(window, false)
                window.Date.now = () => now + 60 * 60 * 1000
            }
        })
        cy.wait('@terms')
        cy.wait('@subscriptions')
        cy.get('@terms.all').should('have.length', 2)
        cy.contains('Review the SkyCofl agreement').should('not.exist')
    })

    it('checks again on a fresh Google login and presents privacy and terms before sign-in', () => {
        cy.then(() => Cypress.automation('remote:debugger:protocol', { command: 'Network.clearBrowserCache' }))
        cy.intercept('GET', 'https://accounts.google.com/gsi/client*', {
            headers: { 'content-type': 'application/javascript' },
            body: `window.google = { accounts: { id: {
                initialize(options) { this.options = options },
                renderButton(container) {
                    const button = document.createElement('button');
                    button.textContent = 'Sign in with Google';
                    button.onclick = () => this.options.callback({ credential: '${googleToken}' });
                    container.appendChild(button);
                },
                prompt() {}, cancel() {}
            } } };`
        })
        stubAccountRequests()
        cy.visit('/account', { onBeforeLoad: installAuthenticatedWebSocket })
        cy.wait('@terms')
        cy.contains('button', 'Continue under previous terms').click()
        cy.wait('@subscriptions')

        cy.visit('/account', {
            onBeforeLoad(window) {
                installAuthenticatedWebSocket(window, false)
                window.localStorage.removeItem('googleId')
                window.localStorage.removeItem('skycoflTermsReminder')
                window.sessionStorage.removeItem('googleId')
            }
        })
        cy.viewport(375, 812)
        cy.get('[role="dialog"]').should('not.exist')
        cy.contains('button', /^Sign in$/).click()
        cy.get('[role="dialog"]')
            .should('be.visible')
            .within(() => {
                cy.contains('Sign in to SkyCofl').should('be.visible')
                cy.get('button[aria-label="Close"]').click()
            })
        cy.get('[role="dialog"]').should('not.exist')
        cy.get('@terms.all').should('have.length', 1)
        cy.contains('button', /^Sign in$/).click()
        cy.get('[role="dialog"]')
            .should('be.visible')
            .within(() => {
                cy.contains('a', 'Privacy Policy').should('have.attr', 'href', 'https://coflnet.com/privacy')
                cy.contains('a', 'Terms of Service').should('have.attr', 'href', 'https://coflnet.com/terms-of-service')
                cy.screenshot('sign-in-mobile')
                cy.contains('button', 'Sign in with Google').click()
            })
        cy.wait('@terms')
        cy.get('[role="dialog"]').should('have.length', 1).and('contain.text', 'Review the SkyCofl agreement')
        cy.contains('button', 'Continue under previous terms').click()
        cy.wait('@subscriptions')
        cy.get('@terms.all').should('have.length', 2)
    })

    it('stores successful acceptance so refresh does not ask again', () => {
        stubAccountRequests()
        cy.intercept('POST', '**/api/user/terms*', {
            statusCode: 200,
            body: { required: false, canContinueWithoutAccepting: true, canStartNewContract: true }
        }).as('acceptTerms')
        cy.visit('/account', { onBeforeLoad: installAuthenticatedWebSocket })
        cy.wait('@terms')
        cy.get('[role="dialog"]').within(() => {
            cy.contains('a', 'Privacy Policy').should('be.visible')
            cy.screenshot('agreement-desktop')
            cy.contains('button', 'Accept agreement package').click()
        })
        cy.wait('@acceptTerms')
        cy.wait('@subscriptions')
        cy.visit('/account', { onBeforeLoad: window => installAuthenticatedWebSocket(window, false) })
        cy.wait('@subscriptions')
        cy.get('@terms.all').should('have.length', 1)
        cy.contains('Review the SkyCofl agreement').should('not.exist')
    })

    it('also postpones the reminder when saving acceptance fails', () => {
        stubAccountRequests()
        cy.intercept('POST', '**/api/user/terms*', { statusCode: 500, body: 'save failed' }).as('acceptTerms')
        cy.visit('/account', { onBeforeLoad: installAuthenticatedWebSocket })
        cy.wait('@terms')

        cy.contains('button', 'Accept agreement package').click()
        cy.wait('@acceptTerms')
        cy.window().then(window => {
            const reminder = JSON.parse(window.localStorage.getItem('skycoflTermsReminder')!)
            expect(reminder.agreementHash).to.equal('future-hash')
            expect(reminder.showAfter).to.be.greaterThan(Date.now())
        })
    })

    it('keeps required acceptance on refresh and does not continue when saving fails', () => {
        stubAccountRequests({ canContinueWithoutAccepting: false })
        cy.intercept('POST', '**/api/user/terms*', { statusCode: 500, body: 'save failed' }).as('acceptTerms')
        cy.visit('/account', { onBeforeLoad: installAuthenticatedWebSocket })
        cy.wait('@terms')
        cy.visit('/account', { onBeforeLoad: window => installAuthenticatedWebSocket(window, false) })
        cy.contains('button', 'Continue under previous terms').should('not.exist')
        cy.contains('button', 'Accept agreement package').click()
        cy.wait('@acceptTerms')
        cy.get('[role="dialog"]').should('be.visible')
        cy.get('@terms.all').should('have.length', 1)
        cy.get('@subscriptions.all').should('have.length', 0)
    })

    it('does not reuse another account’s cached terms', () => {
        stubAccountRequests({ required: false })
        cy.visit('/account', { onBeforeLoad: installAuthenticatedWebSocket })
        cy.wait('@terms')
        cy.wait('@subscriptions')
        stubAccountRequests({ canContinueWithoutAccepting: false })
        cy.visit('/account', {
            onBeforeLoad(window) {
                const otherToken = `eyJhbGciOiJub25lIn0.${window.btoa(JSON.stringify({ exp: 4142444800, email: 'other@example.com' }))}.signature`
                window.sessionStorage.clear()
                installAuthenticatedWebSocket(window, false, otherToken)
            }
        })
        cy.wait('@terms')
        cy.contains('Review the SkyCofl agreement').should('be.visible')
        cy.contains('button', 'Continue under previous terms').should('not.exist')
    })
})
