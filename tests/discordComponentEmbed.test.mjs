import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function loadModule(path, stubs = {}) {
    const source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX }
    }).outputText
    const context = { exports: {}, Date, Intl, Number, Object, Array, Map, Set, Math, JSON, URL, URLSearchParams, TextEncoder, encodeURIComponent, Promise, Error, require: name => (name in stubs ? stubs[name] : {}) }
    runInNewContext(source, context)
    return context.exports
}

const ssr = loadModule('../utils/SSRUtils.tsx')
const formatter = loadModule('../utils/Formatter.tsx', { './SSRUtils': ssr })
const embedUtils = loadModule('../utils/EmbedUtils.ts', { './Formatter': formatter })
const discord = loadModule('../utils/DiscordComponentEmbed.ts')
const pages = loadModule('../utils/DiscordPageEmbeds.ts', {
    './DiscordComponentEmbed': discord,
    './EmbedUtils': embedUtils,
    './Formatter': formatter,
    './SSRUtils': ssr
})
const link = loadModule('../utils/DiscordEmbedLink.ts', { './SSRUtils': ssr, './EmbedUtils': embedUtils })

const NOW = Date.parse('2026-11-19T12:00:00Z')
const HOUR = 3_600_000
const UUID = '384a029294fc445e863f2c42fe9709cb'
const SITE = 'https://sky.coflnet.com'
const plain = value => JSON.parse(JSON.stringify(value))

// [header text, buttons [label, url] , accent] of a built payload
function summarize(payload) {
    const children = payload.component.components
    const header = children[0]
    const row = children.find(child => child.type === 1)
    return {
        accent: payload.component.accent_color,
        text: header.type === 9 ? header.components[0].content : header.content,
        thumbnail: header.type === 9 ? header.accessory.media.url : undefined,
        buttons: row ? row.components.map(button => [button.label, button.url, button.emoji?.name]) : [],
        footer: children[children.length - 1].content
    }
}

const auction = (name, highestBid, endOffsetMs, extra = {}) => ({
    uuid: `${name.replace(/\W/g, '').toLowerCase()}-uuid`,
    item: { name, tag: name.toUpperCase().replace(/ /g, '_') },
    startingBid: highestBid || 1000,
    highestBid,
    end: new Date(NOW + endOffsetMs),
    bin: true,
    ...extra
})

const SNIPER = { value: '2', label: 'Sniper' }
const PREMIUM_PLUS = { value: '128', label: 'Premium+' }
const UNKNOWN = { value: '', label: 'Unknown' }

const flip = (name, pricePaid, soldFor, profit, finder, extra = {}) => ({
    item: { name, tag: name.replace(/§./g, '').toUpperCase().replace(/\W/g, ''), tier: 'LEGENDARY', iconUrl: `${SITE}/static/icon/HYPERION?x=1` },
    pricePaid,
    soldFor,
    profit,
    finder,
    uId: 0xabc,
    originAuction: 'origin1',
    soldAuction: 'sold1',
    buyTime: new Date(NOW - 5 * HOUR),
    sellTime: new Date(NOW - 2 * HOUR),
    ...extra
})

// ----- builder -----

test('container has the section with thumbnail, a divider, the button row and the footer', () => {
    const payload = plain(
        discord.buildComponentEmbed({
            title: 'Ekwav',
            url: `${SITE}/player/${UUID}`,
            lines: ['📈 Profit: **1M**', undefined, false, null, ''],
            thumbnailUrl: 'https://mc-heads.net/head/x/512',
            buttons: [{ label: 'Auctions', emoji: '📜', url: `${SITE}/player/${UUID}` }]
        })
    )
    assert.deepEqual(payload, {
        component: {
            type: 17,
            accent_color: 0x00bc8c,
            components: [
                {
                    type: 9,
                    components: [{ type: 10, content: `### [Ekwav](${SITE}/player/${UUID})\n📈 Profit: **1M**` }],
                    accessory: { type: 11, media: { url: 'https://mc-heads.net/head/x/512' } }
                },
                { type: 14, divider: true, spacing: 1 },
                { type: 1, components: [{ type: 2, style: 5, label: 'Auctions', url: `${SITE}/player/${UUID}`, emoji: { name: '📜' } }] },
                { type: 10, content: '-# SkyCofl • sky.coflnet.com' }
            ]
        }
    })
})

test('without a thumbnail the text is a plain text display, without buttons there is no action row', () => {
    const payload = plain(discord.buildComponentEmbed({ title: 'X', url: `${SITE}/x`, lines: [], thumbnailUrl: 'http://insecure/x.png' }))
    assert.deepEqual(
        payload.component.components.map(child => child.type),
        [10, 14, 10]
    )
})

test('markdown in names is escaped, also in the title link text', () => {
    assert.equal(discord.escapeMarkdown('*_~`|[]\\<>'), '\\*\\_\\~\\`\\|\\[\\]\\\\\\<\\>')
    assert.equal(discord.escapeMarkdown('a\nb\tc'), 'a b c')
    assert.equal(discord.statLine('👤', 'Seller', 'Gold_Tools'), '👤 Seller: **Gold\\_Tools**')
    assert.equal(discord.statLine('👤', 'Seller', ''), undefined)
    assert.equal(discord.statLine('📦', 'Count', 0), '📦 Count: **0**')
    const text = summarize(plain(discord.buildComponentEmbed({ title: '[evil](https://x.y)', url: `${SITE}/a(b)`, lines: [] }))).text
    assert.equal(text, `### [\\[evil\\](https://x.y)](${SITE}/a%28b%29)`)
})

test('buttons: at most 5, valid https URLs only, no duplicates, labels capped at 80 chars', () => {
    const many = Array.from({ length: 7 }, (_, i) => ({ label: `B${i}`, url: `${SITE}/${i}` }))
    assert.equal(discord.getLinkButtons(many).length, 5)
    const filtered = plain(
        discord.getLinkButtons([
            { label: 'No url', url: undefined },
            { label: 'Http', url: 'http://sky.coflnet.com/x' },
            { label: 'Broken', url: 'not a url' },
            { label: 'Too long', url: `${SITE}/${'a'.repeat(512)}` },
            { label: '  ', url: `${SITE}/empty-label` },
            { label: 'x'.repeat(100), url: `${SITE}/ok` },
            { label: 'Duplicate', url: `${SITE}/ok` }
        ])
    )
    assert.equal(filtered.length, 1)
    assert.equal(filtered[0].label.length, 80)
    assert.equal(filtered[0].emoji, undefined)
})

test('accent colour follows the rarity, common and unknown tiers use the brand green', () => {
    assert.equal(discord.getTierAccentColor('LEGENDARY'), 0xffaa00)
    assert.equal(discord.getTierAccentColor('mythic'), 0xff55ff)
    assert.equal(discord.getTierAccentColor('COMMON'), discord.BRAND_ACCENT_COLOR)
    assert.equal(discord.getTierAccentColor(undefined), discord.BRAND_ACCENT_COLOR)
})

// ----- pages -----

test('player embed: head, auction stats and links to flips and auctions', () => {
    const auctions = [
        auction('Mithril Belt', 496_504, -2 * HOUR),
        auction('Hyperion', 0, 3 * HOUR, { startingBid: 900_000_000 }),
        auction('Glacite Leggings', 20_000, -24 * HOUR)
    ]
    const summary = summarize(plain(pages.getPlayerComponentEmbed({ uuid: UUID, name: 'Ekwav' }, auctions, NOW)))
    assert.equal(
        summary.text,
        [
            `### [Ekwav](${SITE}/player/${UUID})`,
            '🔖 Active auctions: **1**',
            '💰 Recently sold: **2 for 517k**',
            '🆕 Latest auction: **Mithril Belt** (497k)',
            '🏆 Top auction: **Hyperion** (900M)'
        ].join('\n')
    )
    assert.equal(summary.thumbnail, `https://mc-heads.net/head/${UUID}/512`)
    assert.deepEqual(summary.buttons, [
        ['Auctions', `${SITE}/player/${UUID}`, '📜'],
        ['Tracked flips', `${SITE}/player/${UUID}/flips`, '📈'],
        ['Latest auction', `${SITE}/auction/mithrilbelt-uuid`, '🆕'],
        ['Top auction', `${SITE}/auction/hyperion-uuid`, '🏆']
    ])
    assert.equal(summary.footer, '-# SkyCofl • sky.coflnet.com')
})

test('player embed without auctions has no auction lines or buttons', () => {
    const summary = summarize(plain(pages.getPlayerComponentEmbed({ uuid: UUID, name: 'Gold_Tools' }, [], NOW)))
    assert.equal(summary.text, `### [Gold\\_Tools](${SITE}/player/${UUID})\nNo recent auctions`)
    assert.deepEqual(
        summary.buttons.map(([label]) => label),
        ['Auctions', 'Tracked flips']
    )
})

test('flip list embed: profit, count, best flip and finders', () => {
    const flips = [
        flip('§dSmall Flip', 1_000_000, 1_500_000, 450_000, SNIPER, { uId: 1 }),
        flip('Big Flip', 900_000_000, 1_100_000_000, 178_000_000, PREMIUM_PLUS, { uId: 255 }),
        flip('Loss', 25_000_000, 10_000_000, -15_000_001, UNKNOWN, { uId: 3 })
    ]
    const summary = summarize(plain(pages.getFlipListComponentEmbed({ uuid: UUID, name: 'Ekwav' }, { flips, totalProfit: 163_450_000 })))
    assert.equal(
        summary.text,
        [
            `### [Ekwav's tracked flips](${SITE}/player/${UUID}/flips)`,
            '📈 Profit: **+163M**',
            '🔁 Flips: **3**',
            '🏆 Best flip: **Big Flip** (+178M)',
            '🔎 Finders: Premium+ +178M • Sniper +450k'
        ].join('\n')
    )
    assert.deepEqual(summary.buttons, [
        ['Best flip', `${SITE}/player/${UUID}/flips/ff`, '🏆'],
        ['Auctions', `${SITE}/player/${UUID}`, '📜']
    ])
})

test('flip list embed without flips only links the player', () => {
    const summary = summarize(plain(pages.getFlipListComponentEmbed({ uuid: UUID, name: 'Ekwav' }, { flips: [], totalProfit: 0 })))
    assert.equal(summary.text, `### [Ekwav's tracked flips](${SITE}/player/${UUID}/flips)\nNo tracked flips found`)
    assert.deepEqual(
        summary.buttons.map(([label]) => label),
        ['Auctions']
    )
})

test('single flip embed: prices, profit, finder label Premium+, flipper and five buttons', () => {
    const target = flip('§6Hyperion', 820_000_000, 900_000_000, 62_000_000, PREMIUM_PLUS)
    const payload = plain(pages.getFlipComponentEmbed({ uuid: UUID, name: 'Ekwav' }, target))
    const summary = summarize(payload)
    assert.equal(
        summary.text,
        [
            `### [Hyperion flip](${SITE}/player/${UUID}/flips/abc)`,
            '💸 Bought: **820M** → Sold: **900M**',
            '📈 Profit: **+62M (+8%)**',
            '⌛ Held: **3h**',
            '🔎 Finder: **Premium+**',
            '👤 Flipper: **Ekwav**'
        ].join('\n')
    )
    assert.equal(summary.thumbnail, `${SITE}/static/icon/HYPERION`)
    assert.equal(summary.accent, 0xffaa00)
    assert.deepEqual(summary.buttons, [
        ['Item', `${SITE}/item/HYPERION`, '📊'],
        ['Bought auction', `${SITE}/auction/origin1`, '🛒'],
        ['Sold auction', `${SITE}/auction/sold1`, '💰'],
        ['Flipper', `${SITE}/player/${UUID}`, '👤'],
        ['All flips', `${SITE}/player/${UUID}/flips`, '📈']
    ])
})

test('single flip embed of a loss leaves out the unknown finder and missing auctions', () => {
    const loss = flip('Plushie', 25_000_000, 10_000_000, -15_000_001, UNKNOWN, { buyTime: undefined, soldAuction: undefined })
    const summary = summarize(plain(pages.getFlipComponentEmbed({ uuid: UUID, name: 'Ekwav' }, loss)))
    assert.match(summary.text, /\n📉 Loss: \*\*15M \(-60%\)\*\*\n👤 Flipper: \*\*Ekwav\*\*$/)
    assert.doesNotMatch(summary.text, /Finder|Held/)
    assert.deepEqual(
        summary.buttons.map(([label]) => label),
        ['Item', 'Bought auction', 'Flipper', 'All flips']
    )
})

const auctionDetails = (auctionFields, bids, auctioneer = { name: 'Ekwav', uuid: UUID }) => ({
    uuid: 'auction1',
    count: 1,
    auction: {
        uuid: 'auction1',
        item: { name: '§5Foraging Exp Boost', tag: 'PET_ITEM_FORAGING_SKILL_BOOST_EPIC', tier: 'EPIC', iconUrl: `${SITE}/static/icon/PET_ITEM` },
        startingBid: 200_000,
        highestBid: 0,
        bin: true,
        ...auctionFields
    },
    auctioneer,
    bids
})

test('auction embed of a sold BIN: price, type, seller, buyer, rarity and three buttons', () => {
    const details = auctionDetails({ highestBid: 200_000, end: new Date(NOW - 5 * 24 * HOUR) }, [{ amount: 200_000, bidder: { name: 'Buyer', uuid: 'buyeruuid' } }])
    const summary = summarize(plain(pages.getAuctionComponentEmbed(details, NOW)))
    assert.equal(
        summary.text,
        [
            `### [Foraging Exp Boost](${SITE}/auction/auction1)`,
            '💰 Sold for 200k (BIN)',
            '🔖 Type: **BIN**',
            '👤 Seller: **Ekwav**',
            '🛒 Buyer: **Buyer**',
            '✨ Rarity: **Epic**'
        ].join('\n')
    )
    assert.equal(summary.accent, 0xaa00aa)
    assert.deepEqual(summary.buttons, [
        ['Item price', `${SITE}/item/PET_ITEM_FORAGING_SKILL_BOOST_EPIC`, '📊'],
        ['Seller', `${SITE}/player/${UUID}`, '👤'],
        ['Buyer', `${SITE}/player/buyeruuid`, '🛒']
    ])
})

test('auction embed of a running auction names the top bidder, an unsold one has no buyer', () => {
    const running = auctionDetails({ bin: false, highestBid: 1_500_000, end: new Date(NOW + 2 * HOUR) }, [{ amount: 1_500_000, bidder: { name: 'Top', uuid: 'top' } }])
    const runningSummary = summarize(plain(pages.getAuctionComponentEmbed(running, NOW)))
    assert.match(runningSummary.text, /💰 Highest bid: 1\.5M \(1 bid\)\n🔖 Type: \*\*Auction\*\*/)
    assert.match(runningSummary.text, /🛒 Top bidder: \*\*Top\*\*/)

    const unsold = auctionDetails({ end: new Date(NOW - HOUR) }, [], { name: '', uuid: '' })
    const unsoldSummary = summarize(plain(pages.getAuctionComponentEmbed(unsold, NOW)))
    assert.doesNotMatch(unsoldSummary.text, /Seller|Buyer|bidder/)
    assert.deepEqual(
        unsoldSummary.buttons.map(([label]) => label),
        ['Item price']
    )
})

test('auction item embed: average of the range, sales, filters and auction links', () => {
    const prices = [
        { min: 800_000_000, max: 800_000_000, avg: 800_000_000, volume: 1, time: '' },
        { min: 560_000_000, max: 1_300_000_000, avg: 1_000_000_000, volume: 3, time: '' }
    ]
    const item = { tag: 'HYPERION', name: 'Hyperion', iconUrl: `${SITE}/static/icon/HYPERION`, tier: 'LEGENDARY', isBazaar: false, prices, range: 'day', filter: { Stars: '5' } }
    const summary = summarize(plain(pages.getItemComponentEmbed(item)))
    assert.equal(
        summary.text,
        [`### [Hyperion](${SITE}/item/HYPERION)`, '📊 Average price (Last 24h): **950M**', '🔁 Sales: **4**', '🔍 Filters: Stars `5`'].join('\n')
    )
    assert.deepEqual(summary.buttons, [
        ['Price history', `${SITE}/item/HYPERION`, '📈'],
        ['Active auctions', `${SITE}/item/HYPERION?range=active`, '🔖'],
        ['Archived auctions', `${SITE}/item/HYPERION/archive`, '📚']
    ])
})

test('bazaar item embed: buy, sell and weekly volume; no price lines without data', () => {
    const snapshot = {
        buyData: { price: 1289.5, moving: 4_625_174 },
        sellData: { price: 1260.5, moving: 25_684_798 },
        timestamp: new Date('2026-11-19T14:35:00Z')
    }
    const bazaar = { tag: 'ENCHANTED_DIAMOND', name: 'Enchanted Diamond', isBazaar: true, prices: [snapshot], iconUrl: `${SITE}/static/icon/ENCHANTED_DIAMOND` }
    const summary = summarize(plain(pages.getItemComponentEmbed(bazaar)))
    assert.equal(
        summary.text,
        [`### [Enchanted Diamond](${SITE}/item/ENCHANTED_DIAMOND)`, '🟢 Buy: **1,289.5**', '🔴 Sell: **1,260.5**', '📦 Weekly volume: **30.3M**'].join('\n')
    )
    assert.deepEqual(
        summary.buttons.map(([label]) => label),
        ['Price history', 'Bazaar flips']
    )
    assert.equal(summarize(plain(pages.getItemComponentEmbed({ ...bazaar, prices: [] }))).text, `### [Enchanted Diamond](${SITE}/item/ENCHANTED_DIAMOND)`)
})

test('archive embed: item, filters and the encoded filter link', () => {
    const summary = summarize(
        plain(pages.getArchiveComponentEmbed({ tag: 'HYPERION', name: 'Hyperion', filter: { Rarity: 'LEGENDARY' }, filterParam: 'eyJ+a/b=' }))
    )
    assert.equal(summary.text, `### [Hyperion archived auctions](${SITE}/item/HYPERION/archive?filter=eyJ%2Ba%2Fb%3D)\n🔍 Filters: Rarity \`LEGENDARY\``)
    assert.deepEqual(
        summary.buttons.map(([label]) => label),
        ['Price history', 'Active auctions']
    )
})

// ----- byte budget -----

const bytes = payload => new TextEncoder().encode(JSON.stringify(payload)).length
const hasLoneSurrogate = text => /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(text)

test('the payload stays within the 3,000 byte limit of Discord, cut on code points', () => {
    const lines = Array.from({ length: 200 }, (_, i) => `📈 line ${i} 𝓍𝓍𝓍 **bold** "quoted"`)
    const buttons = Array.from({ length: 5 }, (_, i) => ({ label: `Button ${i}`, emoji: '📈', url: `${SITE}/${i}` }))
    const payload = plain(discord.buildComponentEmbed({ title: 'Long', url: `${SITE}/x`, lines, buttons, thumbnailUrl: `${SITE}/icon` }))
    assert.ok(bytes(payload) <= discord.PAYLOAD_BYTE_BUDGET, `${bytes(payload)} bytes`)
    assert.ok(discord.PAYLOAD_BYTE_BUDGET < discord.MAX_PAYLOAD_BYTES)
    const summary = summarize(payload)
    assert.ok(summary.text.startsWith(`### [Long](${SITE}/x)\n📈 line 0`))
    assert.ok(summary.text.endsWith('…'))
    assert.equal(hasLoneSurrogate(summary.text), false)
    assert.equal(summary.buttons.length, 5, 'the text is cut before buttons are dropped')
    assert.ok(bytes(payload) > discord.PAYLOAD_BYTE_BUDGET - 10, 'the cut uses the budget, not far less')
    assert.equal(summary.footer, '-# SkyCofl • sky.coflnet.com')
})

test('buttons are dropped from the end only when even the heading would not fit', () => {
    const longUrl = i => `${SITE}/${i}/${'a'.repeat(490)}`
    const buttons = Array.from({ length: 5 }, (_, i) => ({ label: 'x'.repeat(80), url: longUrl(i) }))
    const payload = plain(discord.buildComponentEmbed({ title: 'T', url: `${SITE}/t`, lines: ['y'.repeat(2000)], buttons }))
    assert.ok(bytes(payload) <= discord.PAYLOAD_BYTE_BUDGET, `${bytes(payload)} bytes`)
    const summary = summarize(payload)
    assert.ok(summary.buttons.length < 5)
    assert.deepEqual(
        summary.buttons.map(([, url]) => url),
        buttons.slice(0, summary.buttons.length).map(button => button.url)
    )
})

test('cutToJsonBytes counts JSON escapes and multi-byte characters', () => {
    assert.equal(discord.cutToJsonBytes('abc', 3), 'abc')
    assert.equal(discord.cutToJsonBytes('"""', 5), '"…', 'a quote costs 2 bytes, the ellipsis 3')
    assert.equal(discord.cutToJsonBytes('📈📈', 7), '📈…')
})

test('optional lines (the filter) are dropped before the text is cut', () => {
    const lines = Array.from({ length: 40 }, (_, i) => `line ${i} ${'x'.repeat(40)}`)
    const content = { title: 'T', url: `${SITE}/t`, lines, optionalLines: [`🔍 Filters: ${'y'.repeat(1000)}`] }
    const text = summarize(plain(discord.buildComponentEmbed(content))).text
    assert.doesNotMatch(text, /Filters/)
    assert.ok(text.endsWith(`line 39 ${'x'.repeat(40)}`), 'every required line is kept')
    const short = summarize(plain(discord.buildComponentEmbed({ ...content, lines: ['a'] }))).text
    assert.match(short, /\n🔍 Filters: y+$/, 'it is shown when it fits')
})

test('truncateCodePoints never splits a surrogate pair', () => {
    assert.equal(discord.truncateCodePoints('📈📉📊', 2), '📈…')
    assert.equal(discord.truncateCodePoints('abc', 3), 'abc')
    assert.equal(discord.getLinkButtons([{ label: '📈'.repeat(100), url: `${SITE}/a` }])[0].label, `${'📈'.repeat(79)}…`)
})

test('button emoji names lose the U+FE0F variation selector, page embeds use single code point emojis', () => {
    const selector = String.fromCodePoint(0xfe0f)
    const [button] = plain(discord.getLinkButtons([{ label: 'Tags', emoji: `🏷${selector}`, url: `${SITE}/a` }]))
    assert.deepEqual(button.emoji, { name: '🏷' })
    const payloads = [
        pages.getPlayerComponentEmbed({ uuid: UUID, name: 'Ekwav' }, [auction('Hyperion', 0, HOUR, { startingBid: 9 })], NOW),
        pages.getFlipComponentEmbed({ uuid: UUID, name: 'Ekwav' }, flip('Hyperion', 1, 2, 1, PREMIUM_PLUS)),
        pages.getAuctionComponentEmbed(auctionDetails({ end: new Date(NOW + HOUR) }, []), NOW),
        pages.getItemComponentEmbed({ tag: 'HYPERION', name: 'Hyperion', isBazaar: false, prices: [] }),
        pages.getArchiveComponentEmbed({ tag: 'HYPERION', name: 'Hyperion' })
    ]
    payloads.forEach(payload => assert.ok(!JSON.stringify(payload).includes(selector)))
})

// ----- filters -----

test('filter line: values as inline code, without URLs and backticks, keys escaped', () => {
    const filter = { Rarity: 'LEGENDARY', Reforge: 'see https://evil.example/x', ultimate_wise: '5`` `', Stars: '' }
    const text = summarize(plain(pages.getItemComponentEmbed({ tag: 'HYPERION', name: 'Hyperion', isBazaar: false, prices: [], filter }))).text
    assert.equal(text, `### [Hyperion](${SITE}/item/HYPERION)\n🔍 Filters: Rarity \`LEGENDARY\`, ultimate\\_wise \`5\``)
})

// Regression: `${value}` threw "Cannot convert object to primitive value" for a filter value like {"toString": 1}
test('filter values that are objects with a toString key do not throw', () => {
    const filter = JSON.parse('{"Rarity":{"toString":1},"Stars":["5"]}')
    assert.equal(embedUtils.getItemFilterEmbedText(filter), 'Filters: Rarity: {"toString":1}, Stars: ["5"]')
    const text = summarize(plain(pages.getArchiveComponentEmbed({ tag: 'X', name: 'X', filter }))).text
    assert.match(text, /🔍 Filters: Rarity `\{"toString":1\}`, Stars `\["5"\]`$/)
    assert.equal(embedUtils.formatFilterValue(null), 'null')
})

test('only filter keys the item has options for are kept (no fbclid or utm params)', () => {
    const filter = { Rarity: 'EPIC', fbclid: 'IwAR123', utm_source: 'discord', ultimate_wise: '5' }
    assert.deepEqual(plain(embedUtils.pickKnownFilterKeys(filter, ['Rarity', 'ultimate_wise', 'Stars'])), { Rarity: 'EPIC', ultimate_wise: '5' })
    assert.equal(embedUtils.pickKnownFilterKeys({ fbclid: 'x' }, ['Rarity']), null)
    assert.equal(embedUtils.pickKnownFilterKeys(null, ['Rarity']), null)
})

test('long filter values are cut on code points', () => {
    const [[, value]] = embedUtils.getDisplayFilterEntries({ ItemNameContains: '📈'.repeat(60) })
    assert.equal(Array.from(value).length, 40)
    assert.equal(hasLoneSurrogate(value), false)
})

// ----- embed link -----

test('the embed link stays on our own host; forged or unknown hosts fall back to the canonical domain', () => {
    assert.equal(link.getDiscordEmbedOrigin('skyblock.coflnet.com', false), 'https://skyblock.coflnet.com')
    assert.equal(link.getDiscordEmbedOrigin('SKY.coflnet.com', false), 'https://sky.coflnet.com')
    assert.equal(link.getDiscordEmbedOrigin('evil.example', false), SITE)
    assert.equal(link.getDiscordEmbedOrigin('coflnet.com.evil.example', false), SITE)
    assert.equal(link.getDiscordEmbedOrigin('evilcoflnet.com', false), SITE)
    assert.equal(link.getDiscordEmbedOrigin('sky.coflnet.com:8080', false), SITE)
    assert.equal(link.getDiscordEmbedOrigin('sky.coflnet.com/x@evil.example', false), SITE)
    assert.equal(link.getDiscordEmbedOrigin(undefined, false), SITE)
    assert.equal(link.getDiscordEmbedOrigin('localhost:3123', false), SITE, 'no localhost in production')
    assert.equal(link.getDiscordEmbedOrigin('localhost:3123', true), 'http://localhost:3123')
})

test('the embed href mirrors the page path with encoded segments and the query', () => {
    assert.equal(link.getDiscordEmbedHref(SITE, ['player', UUID, 'flips', 'abc']), `${SITE}/discord-embed/player/${UUID}/flips/abc`)
    assert.equal(link.getDiscordEmbedHref(SITE, ['item', 'PET;4/x'], 'range=week'), `${SITE}/discord-embed/item/PET%3B4%2Fx?range=week`)
    assert.equal(link.toSearchString({ range: 'week', Stars: ['4', '5'], empty: undefined }), 'range=week&Stars=4&Stars=5')
    assert.equal(link.toSearchString(undefined), '')
})

test('archive canonical URL encodes the tag', () => {
    assert.equal(ssr.getArchiveCanonicalUrl('PET;4/x'), `${SITE}/item/PET%3B4%2Fx/archive`)
})

// ----- player load error -----

function loadPlayerData(api) {
    return loadModule('../app/player/[uuid]/playerData.ts', {
        'next/navigation': { notFound: () => assert.fail('notFound') },
        react: { cache: fn => fn },
        '../../../api/ApiHelper': { initAPI: () => api },
        '../../../utils/GeneratedApiResponseUtils': { isDefinitePlayerMiss: () => false },
        '../../../utils/Parser/APIResponseParser': { parseAuction: value => value },
        '../../../utils/DiscordPageEmbeds': pages
    })
}

// Regression: a failed auction request was swallowed and the embed claimed "No recent auctions"
test('player embed is left out when the auctions could not be loaded', async () => {
    const failing = loadPlayerData({ getPlayerName: async () => 'Ekwav', getAuctions: async () => Promise.reject(new Error('timeout')) })
    assert.equal(await failing.getPlayerPageEmbed(UUID), null)
    const working = loadPlayerData({ getPlayerName: async () => 'Ekwav', getAuctions: async () => [] })
    assert.match(summarize(plain(await working.getPlayerPageEmbed(UUID))).text, /No recent auctions$/)
})

// ----- embed route input -----

// what Next passes the route for /discord-embed/item/<segment>: percent-decoded once
const INJECTION_SEGMENTS = [
    '../../api/item/HYPERION/details?x=', // ..%2F..%2Fapi%2Fitem%2FHYPERION%2Fdetails%3Fx%3D
    '..', // %2E%2E
    '.',
    'HYPERION?x=1', // %3F
    'HYPERION#x', // %23
    '%2E%2E%2Fapi', // %252E%252E%252Fapi (double encoded)
    'HYPERION/details',
    'HYPER ION',
    ''
]

test('item tags: real tags pass, decoded traversal, query and fragment characters do not', () => {
    const realTags = ['HYPERION', 'LOG_2:2', 'PET_ITEM_FORAGING_SKILL_BOOST_EPIC', 'STAINED_GLASS:10', 'RUNE_BLOOD_2', 'PET_ENDER_DRAGON;4', 'A-2', 'X.Y+Z']
    realTags.forEach(tag => assert.ok(link.isValidItemTag(tag), tag))
    INJECTION_SEGMENTS.forEach(segment => assert.equal(link.isValidItemTag(segment), false, segment))
    assert.equal(link.isValidItemTag('A'.repeat(101)), false)
})

test('player uuids and flip uids are validated', () => {
    assert.ok(link.isValidPlayerUuid(UUID))
    assert.ok(link.isValidPlayerUuid('384a0292-94fc-445e-863f-2c42fe9709cb'))
    assert.equal(link.isValidPlayerUuid('Ekwav'), false)
    assert.equal(link.isValidPlayerUuid(`${UUID}?x=1`), false)
    assert.ok(link.isValidFlipUid('abc123'))
    // regression: negative uids (toString(16) of a signed long) got no component embed
    assert.ok(link.isValidFlipUid('-1d2840a54bc36b00'))
    assert.equal(link.isValidFlipUid('-'), false)
    assert.equal(link.isValidFlipUid('--1d28'), false)
    assert.equal(link.isValidFlipUid('1d28-00'), false)
    assert.equal(link.isValidFlipUid('1'.repeat(17)), false)
    assert.equal(link.isValidFlipUid('../x'), false)
})

function loadResolver() {
    const calls = []
    const loader = name => async (...args) => {
        calls.push([name, ...args.map(plain)])
        return { component: name }
    }
    const resolver = loadModule('../app/discord-embed/[...path]/resolveEmbed.ts', {
        '../../../utils/DiscordEmbedLink': link,
        '../../player/[uuid]/playerData': { getPlayerPageEmbed: loader('player') },
        '../../player/[uuid]/flips/flipData': { getFlipListPageEmbed: loader('flips'), getFlipPageEmbed: loader('flip') },
        '../../auction/[auctionUUID]/auctionData': {
            getAuctionPageEmbed: loader('auction'),
            isValidAuctionIdFormat: id => /^[0-9a-f]{17}$|^[0-9a-f]{32}$/i.test(id)
        },
        '../../item/[tag]/itemData': { getItemPageEmbed: loader('item') },
        '../../item/[tag]/archive/archiveData': { getArchivePageEmbed: loader('archive') }
    })
    return { resolve: (path, search = '') => resolver.resolveDiscordEmbed(path, new URLSearchParams(search)), calls }
}

// Regression: /discord-embed/item/..%2F..%2Fapi%2Fitem%2FHYPERION%2Fdetails%3Fx%3D made the backend request ../../api/item/HYPERION/details?x=
test('the embed route runs no loader for injected segments', async () => {
    const { resolve, calls } = loadResolver()
    for (const segment of INJECTION_SEGMENTS) {
        assert.equal(await resolve(['item', segment]), null, segment)
        assert.equal(await resolve(['item', segment, 'archive']), null, segment)
        assert.equal(await resolve(['player', segment]), null, segment)
        assert.equal(await resolve(['player', UUID, 'flips', segment]), null, segment)
        assert.equal(await resolve(['auction', segment]), null, segment)
    }
    assert.equal(await resolve(['player', UUID, 'auctions']), null)
    assert.equal(await resolve(['item', 'HYPERION', 'archive', 'x']), null)
    assert.equal(await resolve(['foo', 'bar']), null)
    assert.deepEqual(calls, [])
})

test('the embed route maps page paths to their loaders, repeated query keys stay arrays', async () => {
    const { resolve, calls } = loadResolver()
    await resolve(['player', UUID])
    await resolve(['player', UUID, 'flips'])
    await resolve(['player', UUID, 'flips', 'abc'])
    await resolve(['player', UUID, 'flips', '-1d2840a54bc36b00'])
    await resolve(['auction', '924c0480753e41aab'])
    await resolve(['item', 'LOG_2:2'], 'range=week&Stars=4&Stars=5')
    await resolve(['item', 'HYPERION', 'archive'], 'filter=eyJ9')
    assert.deepEqual(calls, [
        ['player', UUID],
        ['flips', UUID],
        ['flip', UUID, 'abc'],
        ['flip', UUID, '-1d2840a54bc36b00'],
        ['auction', '924c0480753e41aab'],
        ['item', 'LOG_2:2', { range: 'week', Stars: ['4', '5'] }],
        ['archive', 'HYPERION', 'eyJ9']
    ])
})

test('embed item params keep the range and only known filter keys', () => {
    const params = { range: 'week', fbclid: 'IwAR1', utm_source: 'discord', Rarity: 'LEGENDARY', refId: 'x' }
    assert.deepEqual(plain(link.getEmbedItemSearchParams(params, { Rarity: 'LEGENDARY', Stars: ['4', '5'], Pet: { a: 1 } })), {
        range: 'week',
        Rarity: 'LEGENDARY',
        Stars: ['4', '5'],
        Pet: '{"a":1}'
    })
    assert.deepEqual(plain(link.getEmbedItemSearchParams({ range: ['a', 'b'], fbclid: 'x' }, null)), {})
    assert.deepEqual(plain(link.getEmbedItemSearchParams({ range: '../../x' }, null)), {})
    assert.deepEqual(plain(link.searchParamsToObject(new URLSearchParams('a=1&b=2&a=3&a=4'))), { a: ['1', '3', '4'], b: '2' })
})

test('the item embed heading links the page with its range and known filter', () => {
    const item = { tag: 'HYPERION', name: 'Hyperion', isBazaar: false, prices: [], search: 'range=week&Rarity=LEGENDARY' }
    assert.equal(summarize(plain(pages.getItemComponentEmbed(item))).text, `### [Hyperion](${SITE}/item/HYPERION?range=week&Rarity=LEGENDARY)`)
})

// ----- item embed data -----

function loadItemData({ pricesFail }) {
    const priceRequests = []
    const api = {
        getItemDetails: async tag => ({ tag, name: 'Hyperion', tier: 'LEGENDARY', flags: 0, iconUrl: `${SITE}/static/icon/HYPERION` }),
        getItemPrices: async (tag, range, filter) => {
            priceRequests.push([range, plain(filter)])
            if (pricesFail) {
                throw new Error("filter 'fbclid' is not known")
            }
            return [{ min: 1, max: 1, avg: 1_000_000_000, volume: 2, time: '' }]
        },
        getItemImageUrl: item => `${SITE}/static/icon/${item.tag}`
    }
    const module = loadModule('../app/item/[tag]/itemData.ts', {
        'next/navigation': { redirect: () => assert.fail('redirect') },
        react: { cache: fn => fn },
        'next/dist/client/components/redirect-error': { isRedirectError: () => false },
        '../../../utils/Formatter': formatter,
        '../../../api/ApiHelper': { default: api, initAPI: () => api },
        '../../../utils/Base64Utils': { atobUnicode: value => value },
        '../../../components/FilterElement/FilterType': { hasFlag: () => false },
        '../../../utils/ItemsCache': { getCachedItemInfo: async () => ({ isBazaar: false, name: 'Hyperion' }) },
        '../../../utils/Parser/URLParser': { normalizeItemFilter: filter => filter },
        '../../../utils/Parser/ItemFilterParams': loadModule('../utils/Parser/ItemFilterParams.ts'),
        '../../../utils/Search/FilterResultId': {},
        '../../../utils/ItemRedirectUtils': { getCustomItemRedirectPath: () => null },
        '../../../utils/DiscordPageEmbeds': pages,
        '../../../utils/KnownItemFilter': {
            getItemFilterOptions: async () => [{ name: 'Rarity' }],
            getKnownItemFilter: async (tag, filter) => embedUtils.pickKnownFilterKeys(filter, ['Rarity'])
        },
        '../../../utils/DiscordEmbedLink': link
    })
    return { module, priceRequests }
}

// Regression: a failed price request (e.g. "filter 'fbclid' is not known") was served and cached as an embed without prices
test('item embed: none when the prices fail, tracking params never reach the price request', async () => {
    const failing = loadItemData({ pricesFail: true })
    assert.equal(await failing.module.getItemPageEmbed('HYPERION', { range: 'week' }), null)

    const working = loadItemData({ pricesFail: false })
    const payload = plain(await working.module.getItemPageEmbed('HYPERION', { range: 'week', fbclid: 'IwAR1', Rarity: 'LEGENDARY' }))
    assert.deepEqual(working.priceRequests, [['week', { Rarity: 'LEGENDARY' }]])
    const text = summarize(payload).text
    const heading = `### [Hyperion](${SITE}/item/HYPERION?range=week&Rarity=LEGENDARY)`
    assert.ok(text.startsWith(`${heading}\n📊 Average price (Last 7 days): **1B**`), text)
    assert.match(text, /🔍 Filters: Rarity `LEGENDARY`$/)
})
