import { compareItemCategory } from '../../utils/ItemCategoryUtils'

describe('Item category comparison', () => {
    it('excludes an item whose category differs from the selected filter (Gummy Worm Scatha Skin regression)', () => {
        // Regression: a blacklist entry filtered by "Item category: Cosmetic" did not block
        // the "Gummy Worm Scatha Skin" because that item is in PET_SKIN, not COSMETIC.
        expect(compareItemCategory('COSMETIC', 'PET_SKIN')).to.equal('excluded')
    })

    it('includes an item whose category matches the selected filter', () => {
        expect(compareItemCategory('PET_SKIN', 'PET_SKIN')).to.equal('included')
    })

    it('is case-insensitive when comparing categories', () => {
        expect(compareItemCategory('cosmetic', 'Cosmetic')).to.equal('included')
    })

    it('reports unknown when the item has no category', () => {
        expect(compareItemCategory('COSMETIC', null)).to.equal('unknown')
        expect(compareItemCategory('COSMETIC', undefined)).to.equal('unknown')
        expect(compareItemCategory('COSMETIC', '')).to.equal('unknown')
    })

    it('reports unknown when the item category is UNKNOWN, regardless of selection', () => {
        expect(compareItemCategory('COSMETIC', 'UNKNOWN')).to.equal('unknown')
        expect(compareItemCategory(undefined, 'unknown')).to.equal('unknown')
    })

    it('reports noSelection when no filter value has been chosen yet', () => {
        expect(compareItemCategory(undefined, 'PET_SKIN')).to.equal('noSelection')
        expect(compareItemCategory('', 'PET_SKIN')).to.equal('noSelection')
    })
})
