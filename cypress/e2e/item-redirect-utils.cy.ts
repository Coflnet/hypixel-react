import { getCustomItemRedirectPath } from '../../utils/ItemRedirectUtils'

describe('Custom item ID redirects', () => {
    it('maps custom crab hat IDs to the base item and preserves filters', () => {
        expect(getCustomItemRedirectPath('PARTY_HAT_CRAB_YELLOW', { Sold: 'true', IsShiny: 'yes' })).to.equal(
            '/item/PARTY_HAT_CRAB?Sold=true&IsShiny=yes&CrabHatColor=yellow'
        )
    })

    it('supports other known Firmament hat IDs', () => {
        expect(getCustomItemRedirectPath('PARTY_HAT_CRAB_RED_ANIMATED', {})).to.equal('/item/PARTY_HAT_CRAB_ANIMATED?CrabHatColor=red')
        expect(getCustomItemRedirectPath('BALLOON_HAT_2024_AQUA', {})).to.equal('/item/BALLOON_HAT_2024?CrabHatColor=aqua')
        expect(getCustomItemRedirectPath('PARTY_HAT_SLOTH_COOL', {})).to.equal('/item/PARTY_HAT_SLOTH?PartyHatEmoji=cool')
        expect(getCustomItemRedirectPath('PARTY_HAT_CRAB_ANIMATED', {})).to.equal(null)
    })
})
