import { unwrapGeneratedApiArrayResponse } from '../../utils/GeneratedApiResponseUtils'

describe('Generated API response utilities', () => {
    it('returns successful array responses', () => {
        expect(unwrapGeneratedApiArrayResponse({ status: 200, data: [1, 2] }, 'fallback')).to.deep.equal([1, 2])
    })

    it('throws the backend message instead of allowing map errors', () => {
        expect(() =>
            unwrapGeneratedApiArrayResponse(
                {
                    status: 400,
                    data: { slug: 'item_not_found', message: 'could not find item', trace: 'trace-id' }
                },
                'fallback'
            )
        ).to.throw('could not find item')
    })
})
