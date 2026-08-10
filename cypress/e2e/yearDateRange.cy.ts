import {
    buildYearHistoryFilter,
    getLastCompletedMayor,
    getLastElectionRange,
    getMonthAYearAgo
} from '../../components/PriceGraph/AuctionHousePriceGraph/YearDateRangeUtils'

describe('Year history date ranges', () => {
    const mayorPeriods = [
        {
            start: '2026-07-19T15:15:00Z',
            end: '2026-07-24T19:15:00Z',
            winner: { name: 'Paul', votes: 10 },
            year: 502
        },
        {
            start: '07/14/2026 11:15:00 +00:00',
            end: '07/19/2026 15:15:00',
            winner: { name: 'Cole', votes: 10 },
            year: 501
        },
        {
            start: '2026-07-04T03:15:00Z',
            end: '2026-07-09T07:15:00Z',
            winner: { name: 'Diana', votes: 10 },
            year: 499
        }
    ]

    it('builds inclusive API filters without leaking UI-only values', () => {
        const itemFilter: ItemFilter = { Bin: 'true' }
        itemFilter._hide = true

        expect(
            buildYearHistoryFilter(itemFilter, {
                startDate: '2025-07-01',
                endDate: '2025-07-31'
            })
        ).to.deep.equal({
            Bin: 'true',
            EndAfter: String(Date.UTC(2025, 6, 1) / 1000),
            EndBefore: String(Date.UTC(2025, 6, 31, 23, 59, 59) / 1000)
        })
    })

    it('selects the requested calendar month from the previous year', () => {
        expect(getMonthAYearAgo(new Date('2026-07-21T12:00:00Z'))).to.deep.equal({
            startDate: '2025-07-01',
            endDate: '2025-07-31'
        })
    })

    it('finds the last completed mayor and the previous next-mayor election', () => {
        const now = new Date('2026-07-21T12:00:00Z')

        expect(getLastCompletedMayor(mayorPeriods, now)?.winner?.name).to.equal('Cole')
        expect(getLastElectionRange(mayorPeriods, 'Diana', now)).to.deep.equal({
            startDate: '2026-06-29',
            endDate: '2026-07-09'
        })
    })

    it('loads a premium custom range and sends its inclusive date bounds', () => {
        cy.clock(new Date('2026-07-22T12:00:00Z').getTime(), ['Date'])
        cy.intercept('GET', 'https://sky.coflnet.com/api/filter/options*', [{ name: 'Bin', options: ['true', 'false'], type: 256, description: null }])
        cy.intercept('GET', 'https://sky.coflnet.com/api/mayor*', mayorPeriods)
        cy.intercept('GET', 'https://api.hypixel.net/v2/resources/skyblock/election', {
            success: true,
            current: {
                candidates: [
                    { name: 'Diana', votes: 200 },
                    { name: 'Cole', votes: 100 }
                ]
            }
        })
        cy.intercept('GET', 'https://sky.coflnet.com/api/item/price/SKELETON_THE_FISH/history/year*', request => {
            const requestUrl = new URL(request.url)
            const isCustomRange = requestUrl.searchParams.has('EndAfter')
            const average = isCustomRange ? 300 : 150

            if (isCustomRange) {
                request.alias = 'customYearHistory'
            }

            request.reply({
                averageSellTimeSeconds: 3600,
                totalAuctionsSold: 2,
                totalListed: 2,
                totalSellers: 2,
                totalBuyers: 2,
                totalBids: 0,
                totalCoinsTransferred: average * 2,
                totalAuctions: 2,
                totalItemsSold: 2,
                binCount: 2,
                prices: [
                    { min: average - 10, max: average + 10, avg: average, volume: 2, time: '2025-07-10T12:00:00Z' },
                    { min: average - 10, max: average + 10, avg: average, volume: 2, time: '2025-07-11T12:00:00Z' }
                ],
                recentSamples: []
            })
        })

        cy.visit('/item/SKELETON_THE_FISH?range=year&Bin=true', {
            onBeforeLoad(window) {
                window.localStorage.clear()
                window.sessionStorage.setItem('googleId', 'cypress-premium-token')
            }
        })

        cy.contains('h6', 'Custom Date Range').should('be.visible')
        cy.contains('button', 'Last Mayor (Cole)').should('be.visible')
        cy.contains('button', 'Month a Year Ago').click()
        cy.wait('@customYearHistory').then(({ request }) => {
            const requestUrl = new URL(request.url)
            expect(request.headers).to.have.property('googletoken', 'cypress-premium-token')
            expect(requestUrl.searchParams.get('Bin')).to.equal('true')
            expect(requestUrl.searchParams.get('EndAfter')).to.equal(String(Date.UTC(2025, 6, 1) / 1000))
            expect(requestUrl.searchParams.get('EndBefore')).to.equal(String(Date.UTC(2025, 6, 31, 23, 59, 59) / 1000))
        })
        cy.contains('div', 'Avg Price:').should('contain.text', '300').and('contain.text', 'Coins')
        cy.contains('button', 'Last Time Diana Was Elected').should('be.visible')
        cy.contains('Loading year history data').should('not.exist')
    })
})
