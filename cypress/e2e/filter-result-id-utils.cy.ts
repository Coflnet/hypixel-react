import {
    describeFilter,
    getFilterResultTarget,
    getFilterResultTitle,
    getResultNavigationUrl,
    mergePickedFilter,
    pickSearchResult,
    rehydrateFilterResult,
    splitSearchResultId,
    toFilterSearchParams
} from '../../utils/Search/FilterResultId'

function toBase64(value: object): string {
    return Buffer.from(JSON.stringify(value), 'utf8').toString('base64')
}

describe('Filter result ids', () => {
    it('splits a plain tag without a filter', () => {
        expect(splitSearchResultId('HYPERION')).to.deep.equal({ tag: 'HYPERION', filter: null })
        expect(splitSearchResultId('HYPERION?')).to.deep.equal({ tag: 'HYPERION', filter: null })
    })

    it('reads a flat id into a filter with decoded values', () => {
        expect(splitSearchResultId('HYPERION?sharpness=7')).to.deep.equal({ tag: 'HYPERION', filter: { sharpness: '7' } })
        expect(splitSearchResultId('HYPERION?sharpness=%3E0&Reforge=Heroic&Name=a%20b')).to.deep.equal({
            tag: 'HYPERION',
            filter: { sharpness: '>0', Reforge: 'Heroic', Name: 'a b' }
        })
    })

    it('reads the legacy base64 itemFilter whose payload contains + and /', () => {
        // chosen so the base64 text contains both '+' and '/'
        const filter = { Enchantment: 'sharpness', EnchantLvl: '7', Note: '???>>>~~~' }
        const base64 = toBase64(filter)
        expect(base64).to.match(/\+/)
        expect(base64).to.match(/\//)
        // URLSearchParams would turn the raw '+' into a space and corrupt the payload
        expect(new URLSearchParams('itemFilter=' + base64).get('itemFilter')).to.not.equal(base64)

        expect(splitSearchResultId('ENCHANTED_BOOK?itemFilter=' + base64)).to.deep.equal({ tag: 'ENCHANTED_BOOK', filter })
        expect(splitSearchResultId('ENCHANTED_BOOK?itemFilter=' + encodeURIComponent(base64) + '&apply=true')).to.deep.equal({ tag: 'ENCHANTED_BOOK', filter })
    })

    it('escapes values in the flat search params', () => {
        const params = toFilterSearchParams({ sharpness: '>0', Name: 'a b' })
        expect(params.toString()).to.equal('sharpness=%3E0&Name=a+b')
        expect(params.get('sharpness')).to.equal('>0')
    })

    it('describes filters in human text', () => {
        expect(describeFilter({ sharpness: '7' })).to.equal('Sharpness 7')
        expect(describeFilter({ ultimate_wise: '5' })).to.equal('Ultimate Wise 5')
        expect(describeFilter({ sharpness: '>0' })).to.equal('Sharpness any')
        expect(describeFilter({ Recombobulated: 'true', Clean: 'yes' })).to.equal('Recombobulated, Clean')
        expect(describeFilter({ sharpness: '7', Reforge: 'Heroic' })).to.equal('Sharpness 7, Reforge Heroic')
    })

    it('parses a flat filter search result', () => {
        const parsed = getFilterResultTarget('HYPERION?sharpness=7')
        expect(parsed.route).to.equal('/item/HYPERION')
        expect(parsed.urlSearchParams.toString()).to.equal('sharpness=7')
        expect(parsed.description).to.equal('Sharpness 7')
    })

    it('converts a legacy base64 filter search result into flat params', () => {
        const parsed = getFilterResultTarget('ENCHANTED_BOOK?itemFilter=' + toBase64({ Enchantment: 'sharpness', EnchantLvl: '7', Note: '???>>>~~~' }))
        expect(parsed.route).to.equal('/item/ENCHANTED_BOOK')
        expect(parsed.urlSearchParams.get('Enchantment')).to.equal('sharpness')
        expect(parsed.urlSearchParams.get('Note')).to.equal('???>>>~~~')
        expect(parsed.urlSearchParams.has('itemFilter')).to.equal(false)
    })

    it('uses the item name alone as the row title of a filter result', () => {
        let result = { type: 'filter', description: 'Sharpness 7', dataItem: { name: 'Hyperion · Sharpness 7', iconUrl: '' } } as SearchResultItem
        expect(getFilterResultTitle(result)).to.equal('Hyperion')
        expect(getFilterResultTitle({ ...result, type: 'item', description: undefined })).to.equal('Hyperion · Sharpness 7')
    })
    function filterResult(id: string, name = 'x'): SearchResultItem {
        const target = getFilterResultTarget(id)
        return { id, type: 'filter', tier: '', dataItem: { name, iconUrl: '' }, ...target }
    }

    it('navigates to the flat url after the result went through JSON (localStorage)', () => {
        const stored = JSON.parse(JSON.stringify(filterResult('HYPERION?sharpness=7')))
        // URLSearchParams does not survive JSON, this is what broke Recent/pinned filter results
        expect(stored.urlSearchParams).to.deep.equal({})
        expect(getResultNavigationUrl(stored)).to.equal('/item/HYPERION?sharpness=7')
        const legacy = JSON.parse(JSON.stringify(filterResult('ENCHANTED_BOOK?itemFilter=' + toBase64({ Enchantment: 'sharpness', EnchantLvl: '7' }))))
        expect(getResultNavigationUrl(legacy)).to.equal('/item/ENCHANTED_BOOK?Enchantment=sharpness&EnchantLvl=7')
    })

    it('uses the route of non filter results and no trailing ? without params', () => {
        expect(getResultNavigationUrl({ id: 'HYPERION', type: 'item', route: '/item/HYPERION' })).to.equal('/item/HYPERION')
        expect(getResultNavigationUrl({ id: 'HYPERION?', type: 'filter', route: '' })).to.equal('/item/HYPERION')
    })

    it('rehydrates a stored filter result', () => {
        const stored = JSON.parse(JSON.stringify(filterResult('HYPERION?sharpness=7')))
        const result = rehydrateFilterResult(stored)
        expect(result.route).to.equal('/item/HYPERION')
        expect(result.urlSearchParams?.toString()).to.equal('sharpness=7')
        expect(result.description).to.equal('Sharpness 7')
    })

    it('picks the item and filter of a search result', () => {
        const plain = pickSearchResult({ id: 'HYPERION', type: 'item', route: '', tier: '', dataItem: { name: 'Hyperion', iconUrl: 'i' } })
        expect(plain).to.deep.equal({ item: { tag: 'HYPERION', name: 'Hyperion', iconUrl: 'i' }, filter: null })
        const picked = pickSearchResult(filterResult('HYPERION?sharpness=7', 'Hyperion · Sharpness 7'))
        expect(picked.item).to.deep.equal({ tag: 'HYPERION', name: 'Hyperion', iconUrl: '' })
        expect(picked.filter).to.deep.equal({ sharpness: '7' })
    })

    it('merges a picked filter over an existing one', () => {
        expect(mergePickedFilter({ sharpness: '3', Reforge: 'Heroic' }, { sharpness: '7' })).to.deep.equal({ sharpness: '7', Reforge: 'Heroic' })
        expect(mergePickedFilter({ Reforge: 'Heroic' }, null)).to.deep.equal({ Reforge: 'Heroic' })
        expect(mergePickedFilter(undefined, { sharpness: '7' })).to.deep.equal({ sharpness: '7' })
    })
})
