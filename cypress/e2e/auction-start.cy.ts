const auctionId = '73137bc47df84d31a9d8b010078ada0f'
const recordedStart = '2022-02-26T06:59:28'

function setTimezone(timezoneId: string) {
    return Cypress.automation('remote:debugger:protocol', {
        command: 'Emulation.setTimezoneOverride',
        params: { timezoneId }
    })
}

function visitAuctionWithStart(start: string) {
    cy.intercept('GET', `/auction/${auctionId}`, request => {
        request.continue(response => {
            response.body = response.body.replaceAll(recordedStart, start)
        })
    })

    cy.visit(`/auction/${auctionId}`)
}

function dismissConsentDialog() {
    cy.get('body').then(body => {
        const acceptButton = body.find('button').toArray().find(button => button.textContent?.trim() === 'Accept')
        if (acceptButton) {
            cy.wrap(acceptButton).click()
        }
    })
}

describe('Auction start date', () => {
    it('applies the year-2000 cutoff in UTC', () => {
        cy.then(() => setTimezone('Asia/Tokyo'))
        visitAuctionWithStart('1999-12-31T23:30:00Z')

        cy.contains('div', 'Auction Created:').should('be.visible').and('contain.text', 'No start available').and('not.contain.text', '1/1/1')
        dismissConsentDialog()
        cy.screenshot('auction-missing-start-wide', { capture: 'viewport' })
        cy.viewport(375, 667)
        cy.contains('div', 'Auction Created:').scrollIntoView()
        cy.screenshot('auction-missing-start-mobile', { capture: 'viewport' })

        cy.then(() => setTimezone('America/Los_Angeles'))
        visitAuctionWithStart('2000-01-01T00:30:00Z')
        cy.contains('div', 'Auction Created:').should('be.visible').and('not.contain.text', 'No start available').and('contain.text', '1999')
    })
})
