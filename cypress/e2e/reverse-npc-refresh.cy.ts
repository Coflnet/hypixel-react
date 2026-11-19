export {}

// The on-demand reverse NPC refresh is a Premium feature: the backend ignores it below Premium,
// so Starter accounts must not get a refresh button that silently does nothing.

const googleToken = 'eyJhbGciOiJub25lIn0.eyJleHAiOjQxMDI0NDQ4MDAsImVtYWlsIjoiY3lwcmVzc0BleGFtcGxlLmNvbSIsIm5hbWUiOiJDeXByZXNzIn0.signature'
const expiresAt = '2099-02-01T00:00:00Z'

function visitWithOwnership(ownership: Record<string, { expiresAt: string }>) {
    cy.intercept('POST', '**/api/premium/user/owns', { statusCode: 200, body: ownership }).as('products')
    cy.intercept('GET', '**/api/flip/npc/reverse*', { statusCode: 200, body: [] })
    cy.intercept('GET', 'https://track.coflnet.com/matomo.js*', { headers: { 'content-type': 'application/javascript' }, body: '' })
    cy.intercept('GET', 'https://accounts.google.com/gsi/client*', { headers: { 'content-type': 'application/javascript' }, body: '' })
    cy.visit('/reverseNpc', {
        onBeforeLoad(window) {
            window.localStorage.clear()
            window.sessionStorage.clear()
            window.localStorage.setItem('googleId', googleToken)
            window.sessionStorage.setItem('googleId', googleToken)
        }
    })
    cy.wait('@products')
}

describe('Reverse NPC refresh', () => {
    it('asks Starter accounts for Premium instead of showing the refresh button', () => {
        visitWithOwnership({ starter_premium: { expiresAt } })
        cy.contains('Premium required').should('be.visible')
        cy.contains('Starter Premium required').should('not.exist')
        cy.contains('button', 'Refresh reverse NPC flips').should('not.exist')
    })

    it('offers the refresh to Premium accounts', () => {
        visitWithOwnership({ premium: { expiresAt } })
        cy.contains('button', 'Refresh reverse NPC flips').should('be.visible')
        cy.contains('Premium required').should('not.exist')
    })
})
