export {}

const googleToken = 'eyJhbGciOiJub25lIn0.eyJleHAiOjQxNDI0NDQ4MDAsImVtYWlsIjoidGVybXNAZXhhbXBsZS5jb20ifQ.signature'
const reminderDelay = 12 * 60 * 60 * 1000

function installAuthenticatedWebSocket(window: Cypress.AUTWindow, clearStorage = true) {
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
    window.localStorage.setItem('googleId', googleToken)
}

function stubAccountRequests() {
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
            ]
        }
    }).as('terms')
    cy.intercept('POST', '**/api/premium/user/owns', { statusCode: 200, body: {} })
    cy.intercept('GET', '**/api/premium/subscription', { statusCode: 200, body: [] })
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
        cy.window().then(window => {
            const reminder = JSON.parse(window.localStorage.getItem('skycoflTermsReminder')!)
            expect(reminder.agreementHash).to.equal('future-hash')
            expect(reminder.user).to.equal('terms@example.com')
            expect(reminder.showAfter).to.be.at.least(clickedAt + reminderDelay)
        })

        cy.visit('/account', { onBeforeLoad: window => installAuthenticatedWebSocket(window, false) })
        cy.wait('@terms')
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
})
