import { StageOutcome, composeSearchRows, parseSearchQuery } from '../../utils/Search/SearchRows'
import { isEditableTarget } from '../../utils/Search/EditableTarget'

function result(id: string, type: string, extra: Partial<SearchResultItem> = {}): SearchResultItem {
    return { id, type, route: '/' + id, tier: '', dataItem: { name: id, iconUrl: '' }, ...extra }
}

function outcome(key: string, results: SearchResultItem[], extra: Partial<StageOutcome> = {}): StageOutcome {
    return { key, primary: false, status: 'done', results, ...extra }
}

const pages = outcome('pages', [], { primary: true })
const items = (results: SearchResultItem[], status: StageOutcome['status'] = 'done') =>
    outcome('items', results, { primary: true, fixedSection: 'Items', status })
const full = (results: SearchResultItem[], status: StageOutcome['status'] = 'done') => outcome('full', results, { status })

describe('Search row composition', () => {
    it('shows no headers for a single bucket', () => {
        const { rows, results } = composeSearchRows([pages, items([result('A', 'item'), result('B', 'item')]), full([])])
        expect(results.map(r => r.id)).to.deep.equal(['A', 'B'])
        expect(rows.every(r => r.kind === 'result')).to.equal(true)
    })

    it('orders exact pages, items, other pages and players with continuous indexes', () => {
        const exactPage = result('page:/bazaar', 'page', { exact: true })
        const otherPage = result('page:/premiumBazaar', 'page', { exact: false })
        const { rows, results } = composeSearchRows([
            outcome('pages', [otherPage, exactPage], { primary: true }),
            items([result('ITEM', 'item')]),
            full([result('p1', 'player'), result('ITEM2', 'auction')])
        ])
        expect(rows.map(r => (r.kind === 'header' ? 'H:' + r.label : 'R:' + r.index + ':' + r.result.id))).to.deep.equal([
            'H:Pages',
            'R:0:page:/bazaar',
            'H:Items',
            'R:1:ITEM',
            'R:2:ITEM2',
            'H:Pages',
            'R:3:page:/premiumBazaar',
            'H:Players',
            'R:4:p1'
        ])
        expect(results).to.have.length(5)
    })

    it('puts a non exact page below the items', () => {
        const { results } = composeSearchRows([outcome('pages', [result('page:/bazaar', 'page', { exact: false })], { primary: true }), items([result('A', 'item')])])
        expect(results.map(r => r.id)).to.deep.equal(['A', 'page:/bazaar'])
    })

    it('is independent of the arrival order', () => {
        const a = composeSearchRows([pages, items([result('A', 'item')]), full([result('p', 'player')])])
        const b = composeSearchRows([full([result('p', 'player')]), items([result('A', 'item')]), pages])
        expect(b.results.map(r => r.id)).to.deep.equal(a.results.map(r => r.id))
    })

    it('shows the pending players header only when other rows exist', () => {
        const withItems = composeSearchRows([pages, items([result('A', 'item')]), full([], 'pending')])
        const last = withItems.rows[withItems.rows.length - 1]
        expect(last).to.deep.equal({ kind: 'header', label: 'Players', pending: true })
        expect(withItems.rows[0]).to.deep.equal({ kind: 'header', label: 'Items' })

        const empty = composeSearchRows([pages, items([]), full([], 'pending')])
        expect(empty.rows).to.deep.equal([])
    })

    it('drops duplicates and prefers the items stage', () => {
        const { results, rows } = composeSearchRows([items([result('X', 'player')]), full([result('X', 'player'), result('Y', 'player')])])
        expect(results.map(r => r.id)).to.deep.equal(['X', 'Y'])
        expect(rows.filter(r => r.kind === 'header').map(r => (r.kind === 'header' ? r.label : ''))).to.deep.equal(['Items', 'Players'])
    })
})

describe('Search row composition limits and recents', () => {
    const recent = (results: SearchResultItem[]) => outcome('recent', results, { primary: true, fixedSection: 'Recent' })
    const label = (r: ReturnType<typeof composeSearchRows>['rows'][number]) => (r.kind === 'header' ? 'H:' + r.label : 'R:' + r.index + ':' + r.result.id)

    it('caps the items at 6 and fills up with full search extras only until then', () => {
        const itemList = ['A', 'B', 'C', 'D', 'E'].map(id => result(id, 'item'))
        const extras = ['X1', 'X2', 'X3'].map(id => result(id, 'auction'))
        const { results } = composeSearchRows([pages, items(itemList), full([result('p', 'player'), ...extras])])
        expect(results.map(r => r.id)).to.deep.equal(['A', 'B', 'C', 'D', 'E', 'X1', 'p'])
    })

    it('does not cap the players', () => {
        const players = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'].map(id => result(id, 'player'))
        expect(composeSearchRows([pages, items([result('A', 'item')]), full(players)]).results).to.have.length(8)
    })

    it('shows recent searches in their own section first and lets them win deduplication', () => {
        const { rows } = composeSearchRows([
            pages,
            items([result('HYPERION', 'item'), result('VALKYRIE', 'item')]),
            full([result('p', 'player')]),
            recent([result('Hyperion-player', 'player'), result('HYPERION', 'item', { isPreviousSearch: true })])
        ])
        expect(rows.map(label)).to.deep.equal([
            'H:Recent',
            'R:0:Hyperion-player',
            'R:1:HYPERION',
            'H:Items',
            'R:2:VALKYRIE',
            'H:Players',
            'R:3:p'
        ])
    })

    it('puts recent above exact pages', () => {
        const { rows } = composeSearchRows([
            outcome('pages', [result('page:/bazaar', 'page', { exact: true })], { primary: true }),
            recent([result('r', 'player')])
        ])
        expect(rows.map(label)).to.deep.equal(['H:Recent', 'R:0:r', 'H:Pages', 'R:1:page:/bazaar'])
    })
})

describe('Search query parsing', () => {
    it('detects the player and item prefixes', () => {
        const player = parseSearchQuery('player technoblade')
        expect(player).to.deep.equal({ raw: 'player technoblade', text: 'technoblade', normalized: 'technoblade', only: 'player' })
        const item = parseSearchQuery('item  Hyperion ')
        expect(item).to.deep.equal({ raw: 'item  Hyperion', text: 'Hyperion', normalized: 'hyperion', only: 'item' })
    })

    it('does not treat a lone keyword as prefix', () => {
        expect(parseSearchQuery('player').only).to.equal(undefined)
        expect(parseSearchQuery('Aspect  of the d').normalized).to.equal('aspect of the d')
    })
})

describe('Editable target detection', () => {
    it('recognizes text fields', () => {
        const input = document.createElement('input')
        const area = document.createElement('textarea')
        const div = document.createElement('div')
        const editable = document.createElement('div')
        editable.contentEditable = 'true'
        document.body.append(editable)
        expect(isEditableTarget(input)).to.equal(true)
        expect(isEditableTarget(area)).to.equal(true)
        expect(isEditableTarget(div)).to.equal(false)
        expect(isEditableTarget(editable)).to.equal(true)
        expect(isEditableTarget(null)).to.equal(false)
        editable.remove()
    })
})
