export {}

const googleToken = 'eyJhbGciOiJub25lIn0.eyJleHAiOjQxMDI0NDQ4MDAsImVtYWlsIjoibm90aWZpZXJzQGV4YW1wbGUuY29tIn0.signature'
const targets = [
    { id: 1, name: 'First channel', type: 'DiscordWebhook', target: 'https://discord.com/api/webhooks/111/first', when: 'ALWAYS', useCount: 0 },
    { id: 2, name: 'Second channel', type: 'DiscordWebhook', target: 'https://discord.com/api/webhooks/222/second', when: 'AfterFail', useCount: 0 }
]

function editChannel(name: string) {
    cy.get('[role="dialog"] tr').contains('td', name).parent().find('[aria-label="Edit channel"]').click()
}

beforeEach(() => {
    cy.intercept('GET', '**/api/user/terms*', { body: { required: false, canContinueWithoutAccepting: true } })
    cy.intercept('POST', '**/api/premium/user/owns', { body: {} })
    cy.intercept('GET', '**/api/notifications/listeners', { body: [] })
    cy.intercept('GET', '**/api/notifications/subscriptions', { body: [] })
    cy.intercept('GET', '**/api/notifications/targets', { body: targets }).as('targets')
    cy.intercept('PUT', '**/api/notifications/targets', request => request.reply({ body: request.body })).as('update')
    cy.intercept('POST', '**/api/notifications/targets', request => request.reply({ body: { ...request.body, id: 3 } })).as('create')
    cy.intercept('GET', '**/preScript.js', { headers: { 'content-type': 'application/javascript' }, body: '' })
    cy.visit('/subscriptions', {
        onBeforeLoad(window) {
            class AuthenticatedWebSocket {
                static OPEN = 1
                readyState = 1
                onopen: (() => void) | null = null
                onmessage: ((event: MessageEvent) => void) | null = null
                constructor() { window.setTimeout(() => this.onopen?.(), 0) }
                send(value: string) {
                    const request = JSON.parse(value)
                    const response = request.type === 'loginWithToken' ? googleToken : ''
                    window.setTimeout(() => this.onmessage?.(new MessageEvent('message', {
                        data: JSON.stringify({ mId: request.mId, type: request.type, data: JSON.stringify(response), maxAge: 0 })
                    })), 0)
                }
                close() {}
            }
            window.WebSocket = AuthenticatedWebSocket as unknown as typeof WebSocket
            window.localStorage.clear()
            window.sessionStorage.clear()
            window.localStorage.setItem('googleId', googleToken)
            window.document.cookie = 'nonEssentialCookiesAllowed=false; path=/'
        }
    })
    cy.contains('button', /^Channels$/).click()
    cy.get('[role="dialog"] tr').contains('td', 'First channel').should('be.visible')
})

describe('Notification channel forms', () => {
    it('creates a fresh channel after editing an existing one', () => {
        editChannel('First channel')
        cy.get('[placeholder="Enter name"]').clear().type('Renamed channel')
        cy.contains('[role="dialog"] button', /^Update$/).click()
        cy.wait('@update').its('request.body').should('include', { id: 1, name: 'Renamed channel' })
        cy.contains('[role="dialog"] button', /^Add channel$/).click()
        cy.get('[placeholder="Enter name"]').should('have.value', '').type('New channel')
        cy.get('[role="dialog"] select').first().select('DiscordWebhook')
        cy.get('[placeholder^="Discord Webhook Url"]').type('https://discord.com/api/webhooks/333/new')
        cy.contains('[role="dialog"] button', /^Add$/).click()
        cy.wait('@create').its('request.body').should(body => {
            expect(body).to.include({ name: 'New channel', target: 'https://discord.com/api/webhooks/333/new', type: 'DiscordWebhook' })
            expect(body).not.to.have.property('id')
        })
    })

    it('loads the selected channel when switching edits with the form open', () => {
        editChannel('First channel')
        cy.get('[placeholder="Enter name"]').clear().type('Unsaved first edit')
        editChannel('Second channel')
        cy.get('[placeholder="Enter name"]').should('have.value', 'Second channel')
        cy.get('[placeholder^="Discord Webhook Url"]').should('have.value', targets[1].target)
        cy.get('[role="dialog"] select').last().should('have.value', 'AfterFail')
        cy.contains('[role="dialog"] button', /^Update$/).click()
        cy.wait('@update').its('request.body').should('include', targets[1])
    })
})
