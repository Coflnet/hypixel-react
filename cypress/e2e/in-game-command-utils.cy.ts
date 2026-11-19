import { renderToStaticMarkup } from 'react-dom/server'
import { getInGameToastMessage } from '../../utils/InGameToastMessage'

const copied = 'copied-message'

function text(node: any): string {
    return typeof node === 'string' ? node : renderToStaticMarkup(node)
}

describe('In game command utilities', () => {
    it('reports a command that ran in game', () => {
        const html = text(getInGameToastMessage('/viewauction abc', { executed: true, receivers: 1, fallback: null }, copied))
        expect(html).to.contain('Ran')
        expect(html).to.contain('<i>/viewauction abc</i>')
    })

    it('reports a queued bazaar search when there is no booster cookie', () => {
        const html = text(getInGameToastMessage('/bz Enchanted Coal', { executed: true, receivers: 1, fallback: 'no_cookie_pending_search' }, copied))
        expect(html).to.contain('Queued')
        expect(html).to.contain('<i>Enchanted Coal</i>')
        expect(html).to.contain('no booster cookie')
    })

    it('falls back to the copied message without a result', () => {
        expect(getInGameToastMessage('/bz x', null, copied)).to.equal(copied)
    })

    it('falls back to the copied message when nothing was executed', () => {
        expect(getInGameToastMessage('/bz x', { executed: false, receivers: 0, fallback: 'not_connected' }, copied)).to.equal(copied)
    })
})
