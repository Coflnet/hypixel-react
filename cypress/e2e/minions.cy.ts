const ranking = (name: string, coinsPerDay: number, storageLimited: boolean) => ({
    minions: [
        {
            name,
            tier: 11,
            coinsPerDay,
            experiencePerDay: 2400,
            setupCost: 1200000,
            paybackDays: 4,
            secondsBetweenHarvests: 30,
            hoursToFill: storageLimited ? 48 : 1000,
            storageLimited,
            compacted: true,
            missingRequirements: [],
            unpricedIngredients: [],
            productTags: ['COBBLESTONE'],
            itemPages: ['https://sky.coflnet.com/item/COBBLESTONE']
        }
    ],
    generatedAt: '2026-08-24T12:00:00Z'
})

describe('Minion calculator', () => {
    it('normalizes a fractional result limit from the URL', () => {
        cy.visit('/minions?limit=1.5')
        cy.get('#limit').should('have.value', '1')
    })

    it('changes the ranking when the collection interval changes', () => {
        cy.intercept('GET', '**/api/minions/best*', request => {
            const url = new URL(request.url)
            const hours = Number(url.searchParams.get('offlineHours'))
            request.reply(hours === 100 ? ranking('Long Interval Minion', 250000, true) : ranking('Daily Minion', 900000, false))
        }).as('bestMinions')

        cy.visit('/minions')
        cy.get('#offlineHours').clear()
        cy.get('#offlineHours').type('24')
        cy.contains('button', 'Calculate ranking').click()
        cy.wait('@bestMinions').its('request.query.offlineHours').should('equal', '24')
        cy.get('[data-cy="minion-ranking"] tr').first().should('contain.text', 'Daily Minion')

        cy.get('#offlineHours').clear()
        cy.get('#offlineHours').type('100')
        cy.contains('button', 'Calculate ranking').click()
        cy.wait('@bestMinions').its('request.query.offlineHours').should('equal', '100')
        cy.get('[data-cy="minion-ranking"] tr').first().should('contain.text', 'Long Interval Minion').and('contain.text', 'Fills before collection')
    })
})
