import { itemFilterFromEntries } from '../../utils/Parser/ItemFilterParams'

describe('Item filter params', () => {
    it('ignores the legacy apply param', () => {
        expect(itemFilterFromEntries(Object.entries({ apply: 'true' }))).to.deep.equal({})
    })

    it('keeps filters and drops non filter params', () => {
        expect(itemFilterFromEntries(Object.entries({ sharpness: '7', apply: 'true', range: 'day', refId: 'a', conId: 'b' }))).to.deep.equal({ sharpness: '7' })
    })
})
