const yearHistory = {
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

describe('Item year view', () => {
    it('preserves year view while loading URL filters', () => {
        const yearRequests: URLSearchParams[] = []
        cy.intercept('GET', '**/api/filter/options?itemTag=STING', {
            delay: 800,
            body: [
                { name: 'ultimate_chimera', options: ['0', '5'], type: 48, longType: 'NUMERICAL, RANGE', description: null },
                { name: 'looting', options: ['0', '5'], type: 48, longType: 'NUMERICAL, RANGE', description: null },
                { name: 'divine_gift', options: ['0', '3'], type: 48, longType: 'NUMERICAL, RANGE', description: null }
            ]
        })
        cy.intercept('GET', '**/api/item/price/STING/history/year*', request => {
            const params = new URL(request.url).searchParams
            yearRequests.push(new URLSearchParams(params))
            if (params.has('ultimate_chimera')) {
                request.alias = 'yearHistory'
            }
            request.reply({ delay: 250, body: yearHistory })
        })

        cy.visit('/item/STING?range=year&ultimate_chimera=4-4&looting=5-5&divine_gift=3-3', {
            onBeforeLoad(window) {
                window.sessionStorage.setItem('googleId', 'cypress-year-view-user')
            }
        })

        cy.wait('@yearHistory')
        // Include requests triggered after the range selector's 500ms initialization.
        cy.wait(6000)
        cy.location('search').should('include', 'range=year')
        cy.contains('Statistics Summary').should('be.visible')
        cy.contains('Avg Price:').should('be.visible')
        cy.then(() => {
            expect(yearRequests.length, 'all initial year-history requests').to.be.greaterThan(0)
            for (const params of yearRequests) {
                const query = params.toString()
                expect(params.get('ultimate_chimera'), query).to.equal('4-4')
                expect(params.get('looting'), query).to.equal('5-5')
                expect(params.get('divine_gift'), query).to.equal('3-3')
            }
        })
    })
    it('loads year history without filters when the URL has none', () => {
        cy.intercept('GET', '**/api/filter/options?itemTag=STING', { body: [] })
        cy.intercept('GET', '**/api/item/price/STING/history/year*', request => {
            request.alias = 'unfilteredYearHistory'
            request.reply(yearHistory)
        })

        cy.visit('/item/STING?range=year', {
            onBeforeLoad(window) {
                window.sessionStorage.setItem('googleId', 'cypress-year-view-user')
            }
        })

        cy.wait('@unfilteredYearHistory').then(({ request }) => {
            expect(new URL(request.url).searchParams.toString()).to.equal('')
        })
        cy.contains('Statistics Summary').should('be.visible')
    })
})

function expectGraph(price: number) {
    cy.contains('b', 'Avg Price:').parent().should('contain', price.toLocaleString('en-US'))
    cy.get('.echarts-for-react').should(element => {
        const node = element[0] as any
        const key = Object.keys(node).find(key => key.startsWith('__reactFiber'))!
        let fiber = node[key]
        while (fiber && !fiber.stateNode?.getEchartsInstance) fiber = fiber.return
        const options = fiber.stateNode.getEchartsInstance().getOption()
        expect(options.series.slice(0, 4).map((series: any) => series.data)).to.deep.equal([
            [price.toFixed(2)], [(price - 10).toFixed(2)], [(price + 10).toFixed(2)], [(price / 100).toFixed(2)]
        ])
        expect(options.xAxis[0].data).to.have.length(1)
    })
}

function stubRanges() {
    cy.intercept('GET', '**/api/filter/options?itemTag=STING', { body: [] })
    const prices: Record<string, number> = { day: 100, week: 200, month: 300, full: 400 }
    Object.entries(prices).forEach(([range, avg]) => {
        cy.intercept('GET', `**/api/item/price/STING/history/${range}*`, {
            body: [{ avg, min: avg - 10, max: avg + 10, volume: avg / 100, time: `2026-08-0${avg / 100}T00:00:00Z` }]
        }).as(range)
    })
    cy.intercept('GET', '**/api/mayor*', { body: [] })
}

function visitGraph(range: string) {
    cy.visit(`/item/STING?range=${range}`, {
        onBeforeLoad(window) {
            window.sessionStorage.setItem('googleId', 'cypress-year-view-user')
        }
    })
}

describe('Price range statistics', () => {
    beforeEach(stubRanges)

    it('refreshes average and chart series across ranges and ignores late annotations', () => {
        visitGraph('day')
        expectGraph(100)
        cy.wait(1000)
        const scopes = [['1 Week', 200], ['1 Month', 300], ['All Time', 400], ['1 Month', 300], ['1 Week', 200], ['1 Day', 100]] as const
        scopes.forEach(([label, price]) => {
            cy.contains('.price-range-button', label).click()
            expectGraph(price)
            cy.contains('Statistics Summary').should('not.exist')
        })
        let lateMayorStarted = false
        cy.intercept('GET', '**/api/item/price/STING/history/week*', { body: [{ avg: 200, min: 190, max: 210, volume: 2, time: '2026-09-01T00:00:00Z' }] }).as('lateWeek')
        cy.intercept('GET', '**/api/mayor*', request => {
            lateMayorStarted = true
            request.reply({ delay: 1500, body: [] })
        }).as('lateMayor')
        cy.contains('.price-range-button', '1 Week').click()
        cy.wait('@lateWeek')
        cy.wrap(null).should(() => expect(lateMayorStarted).to.equal(true))
        cy.intercept('GET', '**/api/mayor*', { body: [] })
        cy.contains('.price-range-button', '1 Month').click()
        expectGraph(300)
        cy.wait('@lateMayor')
        expectGraph(300)
    })

    it('clears the year summary while reloading and replaces its statistics', () => {
        cy.intercept('GET', '**/api/item/price/STING/history/year*', { body: { ...yearHistory, prices: [{ avg: 600, min: 590, max: 610, volume: 6, time: '2026-08-01T00:00:00Z' }] } }).as('year')
        visitGraph('year')
        cy.contains('Statistics Summary').should('be.visible')
        expectGraph(600)
        const initialStats = [['Total Auctions:', '2'], ['Total Coins Transferred:', '1,200,000,000'], ['Total Sellers:', '2'], ['Total Buyers:', '2'], ['Items Sold:', '2'], ['BIN Count:', '2'], ['Total Bids:', '0'], ['Avg Sell Time:', '1 hours']]
        initialStats.forEach(([label, value]) => cy.contains('strong', label).parent().should('contain', value))
        cy.intercept('GET', '**/api/item/price/STING/history/year*', request => {
            const start = Number(new URL(request.url).searchParams.get('EndAfter')) * 1000
            request.reply({
                delay: 1500,
                body: {
                    ...yearHistory, totalAuctions: 9, totalCoinsTransferred: 900, totalSellers: 8, totalBuyers: 7,
                    totalItemsSold: 6, binCount: 5, totalBids: 4, averageSellTimeSeconds: 7200,
                    prices: [{ avg: 900, min: 890, max: 910, volume: 9, time: new Date(start + 86400000).toISOString() }]
                }
            })
        }).as('updatedYear')
        cy.contains('button', '1 Year Ago (7 days period)').click()
        cy.contains('Statistics Summary').should('not.exist')
        cy.wait('@updatedYear')
        expectGraph(900)
        const stats = [['Total Auctions:', '9'], ['Total Coins Transferred:', '900'], ['Total Sellers:', '8'], ['Total Buyers:', '7'], ['Items Sold:', '6'], ['BIN Count:', '5'], ['Total Bids:', '4'], ['Avg Sell Time:', '2 hours']]
        stats.forEach(([label, value]) => cy.contains('strong', label).parent().should('contain', value))
        cy.contains('.price-range-button', '1 Day').click()
        expectGraph(100)
        cy.contains('Statistics Summary').should('not.exist')
    })

    it('restores the chart after a failed year request', () => {
        cy.intercept('GET', '**/api/item/price/STING/history/year*', { statusCode: 500, body: { message: 'overflow' } }).as('failedYear')
        visitGraph('year')
        cy.contains('An unexpected server error occurred').should('be.visible')
        cy.contains('.price-range-button', '1 Day').click()
        expectGraph(100)
        cy.contains('An unexpected server error occurred').should('not.exist')
        cy.contains('Statistics Summary').should('not.exist')
    })
})
