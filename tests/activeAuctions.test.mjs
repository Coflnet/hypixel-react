import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function loadModule(path, stubs = {}) {
    const source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX }
    }).outputText
    const context = { exports: {}, URLSearchParams, Date, Number, Object, Array, Set, require: name => (name in stubs ? stubs[name] : {}) }
    runInNewContext(source, context)
    return context.exports
}

const utils = loadModule('../utils/ActiveAuctionUtils.ts')
const parser = loadModule('../utils/Parser/APIResponseParser.tsx')

const auction = (uuid, price, end, extra = {}) => ({ uuid, tag: 'T', startingBid: price, highestBidAmount: 0, end: new Date(end), ...extra })

test('parseActiveAuctionPreview normalises the contract shape', () => {
    const parsed = parser.parseActiveAuctionPreview({
        uuid: 'u1',
        tag: 'HYPERION',
        itemName: 'Hyperion',
        tier: 'LEGENDARY',
        bin: true,
        startingBid: 5,
        highestBidAmount: 0,
        end: '2030-01-01T00:00:00Z',
        count: 1,
        auctioneerId: 'a1',
        highlights: { Sharpness: '7' },
        playerName: 'Steve'
    })
    assert.equal(parsed.end.toISOString(), '2030-01-01T00:00:00.000Z')
    assert.equal(parsed.bin, true)
    assert.deepEqual({ ...parsed.highlights }, { Sharpness: '7' })
    assert.equal(parsed.playerName, 'Steve')
})

test('parseActiveAuctionPreview parses start and treats dates without Z as UTC', () => {
    const parsed = parser.parseActiveAuctionPreview({ uuid: 'u', tag: 'X', start: '2030-01-01T00:00:00', end: '2030-01-01T01:00:00' })
    assert.equal(parsed.start.toISOString(), '2030-01-01T00:00:00.000Z')
    assert.equal(parsed.end.toISOString(), '2030-01-01T01:00:00.000Z')
})

test('parseActiveAuctionQueryResult reads resolvedTags', () => {
    assert.deepEqual(Array.from(parser.parseActiveAuctionQueryResult({ resolvedTags: ['A'] }).resolvedTags), ['A'])
    assert.equal(parser.parseActiveAuctionQueryResult({}).resolvedTags.length, 0)
})

test('subscription tags are capped to 8 by tagCounts and * needs a real filter', () => {
    const tags = 'ABCDEFGHIJ'.split('')
    const counts = Object.fromEntries(tags.map((t, i) => [t, i]))
    assert.deepEqual(Array.from(utils.getSubscriptionTags(tags, counts)), ['J', 'I', 'H', 'G', 'F', 'E', 'D', 'C'])
    const empty = utils.createEmptyQueryState()
    assert.equal(utils.shouldSubscribeLive({ ...empty, armorSet: 'X' }, []), false)
    assert.equal(utils.shouldSubscribeLive({ ...empty, itemNameContains: 'x' }, []), true)
    assert.equal(utils.shouldSubscribeLive(empty, ['A']), true)
    const f = utils.stateToSubscriptionFilter({ ...empty, armorSet: 'X', categories: ['H'], tags: ['A'], q: 'q', itemNameContains: 'n', filters: { Sharpness: '7' } })
    assert.deepEqual({ ...f }, { Sharpness: '7', itemNameContains: 'n' })
})

test('NEWEST insertion uses start', () => {
    const l = [auction('b', 1, 9000, { start: new Date(2000) }), auction('a', 1, 1000, { start: new Date(1000) })]
    assert.equal(utils.findInsertIndex(l, auction('n', 1, 500, { start: new Date(3000) }), 'NEWEST', true), 0)
    assert.equal(utils.findInsertIndex(l, auction('n', 1, 99999, { start: new Date(1500) }), 'NEWEST', true), 1)
})

test('parseActiveAuctionPreview tolerates missing optional fields', () => {
    const parsed = parser.parseActiveAuctionPreview({ uuid: 'u', tag: 'X', end: '2030-01-01T00:00:00Z' })
    assert.deepEqual({ ...parsed.highlights }, {})
    assert.equal(parsed.count, 1)
    assert.equal(parsed.startingBid, 0)
})

test('parseActiveAuctionQueryResult handles an empty response', () => {
    const r = parser.parseActiveAuctionQueryResult({})
    assert.equal(r.items.length, 0)
    assert.equal(r.totalCount, 0)
})

test('url params round trip and keep unknown keys as filters', () => {
    const state = utils.stateFromSearchParams('tags=A,B&armorSet=FINAL_DESTINATION&orderBy=ENDING_SOON&perTagLimit=5&Sharpness=7&q=fd')
    assert.deepEqual([...state.tags], ['A', 'B'])
    assert.equal(state.armorSet, 'FINAL_DESTINATION')
    assert.equal(state.orderBy, 'ENDING_SOON')
    assert.equal(state.perTagLimit, 5)
    assert.deepEqual({ ...state.filters }, { Sharpness: '7' })
    const params = utils.stateToParams(state)
    assert.equal(params.tags, 'A,B')
    assert.equal(params.Sharpness, '7')
    assert.deepEqual({ ...utils.stateFromSearchParams(utils.stateToSearchString(state)).filters }, { Sharpness: '7' })
})

test('defaults are omitted from the url and invalid order falls back', () => {
    assert.equal(utils.stateToSearchString(utils.createEmptyQueryState()), '')
    assert.equal(utils.stateFromSearchParams('orderBy=NOPE').orderBy, 'LOWEST_PRICE')
})

test('request params never resend the free text', () => {
    const state = { ...utils.stateFromSearchParams('q=fd&tags=A'), }
    const req = utils.stateToRequestParams(state, 2)
    assert.equal(req.q, undefined)
    assert.equal(req.page, 2)
    assert.equal(req.tags, 'A')
    assert.equal(req.orderBy, 'LOWEST_PRICE')
})

test('chips are derived from a resolved query and can be removed', () => {
    const base = utils.createEmptyQueryState()
    const state = utils.applyResolvedQuery(
        base,
        { tags: ['A'], armorSet: 'FINAL_DESTINATION', filters: { Sharpness: '7' }, itemNameContains: 'x', description: '' },
        'fd'
    )
    const chips = utils.chipsFromState(state)
    assert.deepEqual(Array.from(chips.map(c => c.kind)), ['tag', 'armorSet', 'filter', 'name'])
    const without = utils.removeChip(state, chips[2])
    assert.deepEqual({ ...without.filters }, {})
    assert.equal(utils.removeChip(state, chips[1]).armorSet, null)
    assert.equal(state.filters.Sharpness, '7', 'original state must not be mutated')
})

test('an unresolvable text falls back to a name search', () => {
    const state = utils.applyResolvedQuery(utils.createEmptyQueryState(), { tags: [], armorSet: null, filters: {}, itemNameContains: null, description: '' }, 'weird')
    assert.equal(state.itemNameContains, 'weird')
})

test('live subscription needs at least one narrowing', () => {
    assert.equal(utils.hasAnyNarrowing(utils.createEmptyQueryState()), false)
    assert.equal(utils.hasAnyNarrowing({ ...utils.createEmptyQueryState(), tags: ['A'] }), true)
})

test('findInsertIndex sorts by price ascending and descending', () => {
    const list = [auction('a', 10, 1000), auction('b', 20, 2000), auction('c', 30, 3000)]
    assert.equal(utils.findInsertIndex(list, auction('n', 15, 1), 'LOWEST_PRICE', false), 1)
    assert.equal(utils.findInsertIndex(list, auction('n', 5, 1), 'LOWEST_PRICE', true), 0)
    const desc = [auction('c', 30, 3000), auction('b', 20, 2000), auction('a', 10, 1000)]
    assert.equal(utils.findInsertIndex(desc, auction('n', 25, 1), 'HIGHEST_PRICE', true), 1)
})

test('findInsertIndex returns -1 behind the loaded window when more pages exist', () => {
    const list = [auction('a', 10, 1000), auction('b', 20, 2000)]
    assert.equal(utils.findInsertIndex(list, auction('n', 99, 1), 'LOWEST_PRICE', true), -1)
    assert.equal(utils.findInsertIndex(list, auction('n', 99, 1), 'LOWEST_PRICE', false), 2)
})

test('findInsertIndex orders by end time and newest', () => {
    const list = [auction('a', 1, 1000), auction('b', 1, 2000)]
    assert.equal(utils.findInsertIndex(list, auction('n', 1, 1500), 'ENDING_SOON', true), 1)
    const newest = [auction('b', 1, 2000), auction('a', 1, 1000)]
    assert.equal(utils.findInsertIndex(newest, auction('n', 1, 3000), 'NEWEST', true), 0)
})

test('displayed price prefers the highest bid', () => {
    assert.equal(utils.getAuctionPrice({ highestBidAmount: 50, startingBid: 10 }), 50)
    assert.equal(utils.getAuctionPrice({ highestBidAmount: 0, startingBid: 10 }), 10)
})

test('formatTimeLeft', () => {
    const now = 1_000_000
    assert.equal(utils.formatTimeLeft(new Date(now - 1), now), 'ended')
    assert.equal(utils.formatTimeLeft(new Date(now + 90_000), now), '1m 30s')
    assert.equal(utils.formatTimeLeft(new Date(now + 2 * 86400_000 + 3 * 3600_000), now), '2d 3h')
})
