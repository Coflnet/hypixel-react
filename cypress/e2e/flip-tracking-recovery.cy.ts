export {}

const failedPlayer = '00000000000040008000000000000001'
const emptyPlayer = '00000000000040008000000000000002'
const emptyMessage = "We couldn't find any flips for this player within the selected timeframe."

describe('Tracked flip recovery', () => {
    it('distinguishes a server failure from empty history and recovers after retry', () => {
        cy.intercept('GET', `**/api/flip/stats/player/${failedPlayer}*`, { statusCode: 503, body: { message: 'Tracker unavailable' } }).as('failedFlips')
        cy.visit(`/player/${failedPlayer}/flips`)
        cy.contains('[role="alert"]', 'Could not load tracked flips.').should('be.visible')
        cy.contains(emptyMessage).should('not.exist')
        cy.contains('button', 'Retry flips').click()
        cy.wait('@failedFlips')
        cy.contains('[role="alert"]', 'Tracker unavailable').should('be.visible')
        cy.contains(emptyMessage).should('not.exist')
        cy.intercept('GET', `**/api/flip/stats/player/${failedPlayer}*`, { flips: [], totalProfit: 0 }).as('recoveredFlips')
        cy.contains('button', 'Retry flips').click()
        cy.wait('@recoveredFlips').then(({ request }) => {
            expect(Date.parse(request.query.end as string) - Date.parse(request.query.start as string)).to.equal(7 * 24 * 60 * 60 * 1000)
        })
        cy.contains(emptyMessage).should('be.visible')
        cy.contains('button', 'Retry flips').should('not.exist')
    })

    it('keeps loaded flips when a date-range request fails and retries that range', () => {
        const flip = { itemTag: 'DIAMOND', itemName: 'Tracked Diamond', tier: 'COMMON', uId: 1, finder: 0,
            originAuction: failedPlayer, soldAuction: emptyPlayer, pricePaid: 100, soldFor: 200, profit: 100,
            buyTime: '2026-10-01T12:00:00Z', sellTime: '2026-10-02T12:00:00Z', propertyChanges: [], flags: 'None' }
        cy.intercept('GET', `**/api/flip/stats/player/${failedPlayer}*`, { flips: [flip], totalProfit: 100 }).as('loadedFlips')
        cy.visit(`/player/${failedPlayer}/flips`)
        cy.contains('button', 'Retry flips').click()
        cy.wait('@loadedFlips')
        cy.contains('Tracked Diamond').should('be.visible')
        let failedStart: string
        cy.intercept('GET', `**/api/flip/stats/player/${failedPlayer}*`, request => {
            failedStart = request.query.start as string
            request.reply({ statusCode: 503, body: { message: 'Tracker unavailable' } })
        }).as('rangeFailure')
        cy.get('.react-datepicker__input-container input').first().click()
        cy.get('.react-datepicker__day--today').click()
        cy.wait('@rangeFailure')
        cy.contains('[role="alert"]', 'Showing previously loaded flips.').should('be.visible')
        cy.contains('Tracked Diamond').should('be.visible')
        cy.intercept('GET', `**/api/flip/stats/player/${failedPlayer}*`, request => {
            expect(request.query.start).to.equal(failedStart)
            request.reply({ flips: [], totalProfit: 0 })
        }).as('rangeRecovery')
        cy.contains('button', 'Retry flips').click()
        cy.wait('@rangeRecovery')
        cy.contains(emptyMessage).should('be.visible')
        cy.contains('Tracked Diamond').should('not.exist')
    })

    it('shows empty history after a successful empty server response', () => {
        cy.visit(`/player/${emptyPlayer}/flips`)
        cy.contains(emptyMessage).should('be.visible')
        cy.contains('button', 'Retry flips').should('not.exist')
    })
})
