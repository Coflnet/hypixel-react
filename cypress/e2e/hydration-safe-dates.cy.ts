import { formatDateAndTime } from '../../utils/DateFormatUtils'

describe('Hydration-safe date formatting', () => {
    const date = new Date(Date.UTC(2024, 0, 31, 23, 5, 9))

    it('uses a fixed format and time zone before mount', () => {
        expect(formatDateAndTime(date, false)).to.equal('2024-01-31 23:05:09 UTC')
    })

    it('does not depend on the current time', () => {
        cy.clock(Date.UTC(2030, 5, 1), ['Date'])
        const first = formatDateAndTime(date, false)
        cy.tick(10 * 24 * 60 * 60 * 1000).then(() => {
            expect(formatDateAndTime(date, false)).to.equal(first)
        })
    })

    it('does not use Intl before mount, as its output differs between Node and browsers', () => {
        cy.stub(Date.prototype, 'toLocaleDateString').throws(new Error('toLocaleDateString used before mount'))
        cy.stub(Date.prototype, 'toLocaleTimeString').throws(new Error('toLocaleTimeString used before mount'))
        expect(formatDateAndTime(date, false)).to.equal('2024-01-31 23:05:09 UTC')
    })

    it('uses the runtime locale after mount', () => {
        expect(formatDateAndTime(date, true)).to.equal(date.toLocaleDateString() + ' ' + date.toLocaleTimeString())
    })
})
