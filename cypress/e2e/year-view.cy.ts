describe('Item year view', () => {
    it('preserves year view while loading URL filters', () => {
        const historyRequests: string[] = []
        cy.intercept('GET', '**/api/filter/options?itemTag=STING', {
            delay: 800,
            body: [
                { name: 'ultimate_chimera', options: ['0', '5'], type: 48, longType: 'NUMERICAL, RANGE', description: null },
                { name: 'looting', options: ['0', '5'], type: 48, longType: 'NUMERICAL, RANGE', description: null },
                { name: 'divine_gift', options: ['0', '3'], type: 48, longType: 'NUMERICAL, RANGE', description: null }
            ]
        })
        cy.intercept('GET', '**/api/item/price/STING/history/year*', request => {
            historyRequests.push(request.url)
            request.alias = 'yearHistory'
            request.reply({
                delay: 250,
                body: {
                    averageSellTimeSeconds: 3600,
                    totalAuctionsSold: 2,
                    totalListed: 2,
                    totalSellers: 2,
                    totalBuyers: 2,
                    totalBids: 0,
                    totalCoinsTransferred: 1200000000,
                    totalAuctions: 2,
                    totalItemsSold: 2,
                    binCount: 2,
                    prices: [
                        { min: 590000000, max: 610000000, avg: 600000000, volume: 1, time: '2026-08-01T00:00:00Z' },
                        { min: 600000000, max: 600000000, avg: 600000000, volume: 1, time: '2026-08-02T00:00:00Z' }
                    ],
                    recentSamples: []
                }
            })
        })

        cy.visit('/item/STING?range=year&ultimate_chimera=4-4&looting=5-5&divine_gift=3-3', {
            onBeforeLoad(window) {
                window.sessionStorage.setItem('googleId', 'cypress-year-view-user')
            }
        })

        cy.wait('@yearHistory')
        // Include requests triggered after the range selector's 500ms initialization.
        cy.wait(6000)
        cy.then(() => {
            expect(historyRequests).not.to.be.empty
            historyRequests.forEach(url => {
                const params = new URL(url).searchParams
                expect(params.get('ultimate_chimera'), url).to.equal('4-4')
                expect(params.get('looting'), url).to.equal('5-5')
                expect(params.get('divine_gift'), url).to.equal('3-3')
            })
        })
        cy.location('search').should('include', 'range=year')
        cy.contains('Statistics Summary').should('be.visible')
        cy.contains('Avg Price:').should('be.visible')
    })
})
