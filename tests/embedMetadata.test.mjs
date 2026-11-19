import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function loadModule(path, stubs = {}) {
    const source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX }
    }).outputText
    const context = { exports: {}, Date, Intl, Number, Object, Array, Map, Math, JSON, encodeURIComponent, require: name => (name in stubs ? stubs[name] : {}) }
    runInNewContext(source, context)
    return context.exports
}

const ssr = loadModule('../utils/SSRUtils.tsx')
const formatter = loadModule('../utils/Formatter.tsx', { './SSRUtils': ssr })
const embed = loadModule('../utils/EmbedUtils.ts', { './Formatter': formatter })

const NOW = Date.parse('2026-11-19T12:00:00Z')
const HOUR = 3_600_000
const plain = value => JSON.parse(JSON.stringify(value))

const auction = (name, highestBid, endOffsetMs, extra = {}) => ({
    uuid: name,
    item: { name, tag: name.toUpperCase() },
    startingBid: highestBid || 1000,
    highestBid,
    end: new Date(NOW + endOffsetMs),
    bin: true,
    ...extra
})

const flip = (name, pricePaid, soldFor, profit, finder, extra = {}) => ({
    item: { name, tag: name.toUpperCase() },
    pricePaid,
    soldFor,
    profit,
    finder,
    buyTime: new Date(NOW - 5 * HOUR),
    sellTime: new Date(NOW - 2 * HOUR),
    ...extra
})

const SNIPER = { value: '2', label: 'Sniper' }
const UNKNOWN = { value: '', label: 'Unknown' }

test('formatShortCoins keeps about three significant digits', () => {
    assert.equal(embed.formatShortCoins(820_000_000), '820M')
    assert.equal(embed.formatShortCoins(1_200_000_000), '1.2B')
    assert.equal(embed.formatShortCoins(1_175_000_000), '1.18B')
    assert.equal(embed.formatShortCoins(142_180_435), '142M')
    assert.equal(embed.formatShortCoins(14_250_000), '14.3M')
    assert.equal(embed.formatShortCoins(200_000), '200k')
    assert.equal(embed.formatShortCoins(999_950_000), '1B')
    assert.equal(embed.formatShortCoins(-15_000_001), '-15M')
})

test('formatShortCoins keeps small (bazaar) prices exact and survives missing values', () => {
    assert.equal(embed.formatShortCoins(1286.64), '1,286.6')
    assert.equal(embed.formatShortCoins(4330), '4,330')
    assert.equal(embed.formatShortCoins(0), '0')
    assert.equal(embed.formatShortCoins(undefined), '---')
    assert.equal(embed.formatShortCoins(NaN), '---')
    assert.equal(embed.formatSignedShortCoins(5_000_000), '+5M')
})

test('player description counts active and sold auctions of the loaded page', () => {
    const auctions = [
        auction('Hyperion', 0, 3 * HOUR, { startingBid: 900_000_000 }),
        auction('Mithril Belt', 496_504, -2 * HOUR),
        auction('Glacite Leggings', 20_000, -24 * HOUR),
        auction('Broken Piggy Bank', 0, -48 * HOUR, { startingBid: 840_000 })
    ]
    assert.equal(
        embed.getPlayerEmbedDescription('Ekwav', auctions, NOW),
        "Ekwav's Hypixel SkyBlock auctions: Active: 1 • Recently sold: 2 for 517k • Latest: Hyperion (900M)"
    )
})

test('player description falls back to the generic text without auctions', () => {
    assert.equal(embed.getPlayerEmbedDescription('Ekwav', [], NOW), 'Auctions and bids for Ekwav in Hypixel Skyblock.')
    assert.equal(embed.getPlayerEmbedDescription('Ekwav', undefined, NOW), 'Auctions and bids for Ekwav in Hypixel Skyblock.')
})

test('flip list description shows profit, count, best flip and top finder', () => {
    const flips = [
        flip('§dSmall Flip', 1_000_000, 1_500_000, 450_000, SNIPER),
        flip('Big Flip', 900_000_000, 1_100_000_000, 178_000_000, UNKNOWN),
        flip('Loss', 25_000_000, 10_000_000, -15_000_001, SNIPER)
    ]
    const description = embed.getFlipListEmbedDescription({ flips, totalProfit: 163_450_000 }, 'GoldTools')
    assert.equal(description, "GoldTools's tracked flips: Profit: +163M • Flips: 3 • Best: Big Flip (+178M)")
    assert.equal(flips[0].item.name, '§dSmall Flip', 'the input order and items are not mutated')
})

test('flip list top finder ignores the unknown finder', () => {
    const flips = [flip('A', 1_000_000, 3_000_000, 2_000_000, SNIPER), flip('B', 1_000_000, 9_000_000, 8_000_000, UNKNOWN)]
    assert.match(embed.getFlipListEmbedDescription({ flips, totalProfit: 10_000_000 }, 'X'), / • Top finder: Sniper$/)
})

test('flip list description falls back when there are no flips', () => {
    assert.equal(embed.getFlipListEmbedDescription({ flips: [], totalProfit: 0 }, 'Ekwav'), 'There were no flips found for Ekwav')
    assert.equal(embed.getFlipListEmbedDescription(null, 'Ekwav'), 'There were no flips found for Ekwav')
})

// Regression: the embed used profit / pricePaid * 98, although the tracked profit already includes the AH tax
test('flip profit percent is profit relative to the purchase price', () => {
    assert.equal(embed.getFlipProfitPercent({ profit: 50, pricePaid: 100 }), 50)
    assert.equal(embed.getFlipProfitPercent({ profit: 1_000_000, pricePaid: 1_000_000 }), 100)
    assert.equal(embed.getFlipProfitPercent({ profit: -15_000_001, pricePaid: 25_000_000 }), -60)
    assert.equal(embed.getFlipProfitPercent({ profit: 5, pricePaid: 0 }), undefined)
})

test('single flip description lists prices, profit, time held and the flipper', () => {
    const target = flip('§6Hyperion', 820_000_000, 900_000_000, 62_000_000, SNIPER)
    assert.equal(
        embed.getFlipEmbedDescription(target, 'Ekwav'),
        'Hyperion flip: Bought: 820M • Sold: 900M • Profit: +62M (+8%) • Held: 3h • Flipper: Ekwav'
    )
    const loss = flip('Plushie', 25_000_000, 10_000_000, -15_000_001, SNIPER, { buyTime: undefined })
    assert.equal(embed.getFlipEmbedDescription(loss, 'Ekwav'), 'Plushie flip: Bought: 25M • Sold: 10M • Loss: 15M (-60%) • Flipper: Ekwav')
})

test('auction house item description uses the volume weighted average', () => {
    const prices = [
        { min: 800_000_000, max: 800_000_000, avg: 800_000_000, volume: 1, time: '' },
        { min: 560_000_000, max: 1_300_000_000, avg: 1_000_000_000, volume: 3, time: '' }
    ]
    assert.equal(embed.getAuctionItemEmbedDescription(prices, 'day'), 'Avg: 950M • Sold: 4 • Last 24h')
    assert.equal(embed.getAuctionItemEmbedDescription([], 'day'), undefined)
})

test('bazaar item description uses the latest snapshot', () => {
    const snapshot = (buy, sell, time) => ({
        buyData: { price: buy, moving: 4_625_174 },
        sellData: { price: sell, moving: 25_684_798 },
        timestamp: new Date(time)
    })
    const prices = [snapshot(1289.5, 1260.5, '2026-11-19T14:35:00Z'), snapshot(1200, 1100, '2026-11-18T14:35:00Z')]
    assert.equal(embed.getBazaarItemEmbedDescription(prices), 'Buy: 1,289.5 • Sell: 1,260.5 • Weekly volume: 30.3M')
    assert.equal(embed.getBazaarItemEmbedDescription([]), undefined)
})

test('item filter text is a single line', () => {
    assert.equal(embed.getItemFilterEmbedText({ Rarity: 'LEGENDARY', Stars: '5' }), 'Filters: Rarity: LEGENDARY, Stars: 5')
    assert.equal(embed.getItemFilterEmbedText({}), undefined)
    assert.equal(embed.joinEmbedParts(['a', undefined, false, '', 'b']), 'a • b')
})

const auctionDetails = (auctionFields, bids, sellerName = 'Ekwav') => ({
    auction: { item: { name: '§5Foraging Exp Boost', tag: 'PET_ITEM', tier: 'EPIC' }, startingBid: 200_000, highestBid: 0, bin: true, ...auctionFields },
    auctioneer: { name: sellerName },
    bids
})

test('auction description of a sold BIN', () => {
    const details = auctionDetails({ highestBid: 200_000, end: new Date(NOW - 5 * 24 * HOUR) }, [{ amount: 200_000, bidder: { name: 'Buyer' } }])
    assert.equal(embed.getAuctionEmbedDescription(details, NOW), 'Foraging Exp Boost • Sold for 200k (BIN) • Ekwav → Buyer • Epic')
})

test('auction description of a running auction with bids and of an unsold BIN', () => {
    const running = auctionDetails({ bin: false, highestBid: 1_500_000, end: new Date(NOW + 2 * HOUR) }, [
        { amount: 1_500_000, bidder: { name: 'Top' } },
        { amount: 1_000_000, bidder: { name: 'Other' } }
    ])
    assert.equal(embed.getAuctionEmbedDescription(running, NOW), 'Foraging Exp Boost • Highest bid: 1.5M (2 bids) • Ekwav → Top • Epic')
    const unsold = auctionDetails({ end: new Date(NOW - HOUR), item: { name: 'Belt', tier: 'VERY_SPECIAL' } }, [], '')
    assert.equal(embed.getAuctionEmbedDescription(unsold, NOW), 'Belt • Unsold BIN: 200k • Very Special')
})

test('getHeadMetadata defaults to the 512px logo with its real size and a summary card', () => {
    const metadata = plain(ssr.getHeadMetadata('Title', 'Description', undefined, ['kw'], 'Embed title', 'https://sky.coflnet.com/x'))
    assert.deepEqual(metadata.openGraph, {
        title: 'Embed title',
        description: 'Description',
        siteName: 'SkyCofl',
        images: [{ url: 'https://sky.coflnet.com/logo512.png', alt: 'SkyCofl logo', width: 512, height: 512 }],
        url: 'https://sky.coflnet.com/x',
        type: 'website'
    })
    assert.equal(metadata.twitter.card, 'summary')
    assert.equal(metadata.twitter.title, 'Embed title')
    assert.deepEqual(metadata.twitter.images, metadata.openGraph.images)
    assert.equal(metadata.alternates.canonical, 'https://sky.coflnet.com/x')
})

test('getHeadMetadata claims no size for unknown images but always sets an alt', () => {
    const metadata = plain(ssr.getHeadMetadata('T', 'D', 'https://sky.coflnet.com/static/icon/HYPERION', [], 'Hyperion | SkyBlock Price'))
    assert.deepEqual(metadata.openGraph.images, [{ url: 'https://sky.coflnet.com/static/icon/HYPERION', alt: 'Hyperion | SkyBlock Price' }])
    assert.equal(metadata.openGraph.url, undefined)
    const legacy = plain(ssr.getHeadMetadata('T', 'D', 'https://sky.coflnet.com/logo192.png'))
    assert.deepEqual(legacy.openGraph.images[0], { url: 'https://sky.coflnet.com/logo192.png', alt: 'SkyCofl logo', width: 192, height: 192 })
})

test('getHeadMetadata passes sizes, card, type and username through', () => {
    const metadata = plain(
        ssr.getHeadMetadata('T', 'D', 'https://mc-heads.net/head/u/512', 'https://sky.coflnet.com/player/u', 'Ekwav | SkyBlock Auctions', undefined, {
            imageWidth: 512,
            imageHeight: 544,
            imageAlt: "Ekwav's Minecraft head",
            card: 'summary_large_image',
            type: 'profile',
            username: 'Ekwav'
        })
    )
    assert.deepEqual(metadata.openGraph.images[0], { url: 'https://mc-heads.net/head/u/512', alt: "Ekwav's Minecraft head", width: 512, height: 544 })
    assert.equal(metadata.openGraph.type, 'profile')
    assert.equal(metadata.openGraph.username, 'Ekwav')
    assert.equal(metadata.openGraph.url, 'https://sky.coflnet.com/player/u', 'a canonical passed as 4th argument still counts')
    assert.equal(metadata.twitter.card, 'summary_large_image')
})

test('getHeadMetadata falls back to the default description when it is empty', () => {
    const metadata = ssr.getHeadMetadata('T', '')
    assert.equal(metadata.description, ssr.DEFAULT_DESCRIPTION)
    assert.equal(metadata.openGraph.description, ssr.DEFAULT_DESCRIPTION)
})

test('player embed options describe the 512x544 head render', () => {
    assert.equal(embed.getPlayerHeadRenderUrl('abc'), 'https://mc-heads.net/head/abc/512')
    assert.deepEqual(plain(embed.getPlayerEmbedOptions('Ekwav')), {
        imageWidth: 512,
        imageHeight: 544,
        imageAlt: "Ekwav's Minecraft head",
        type: 'profile',
        username: 'Ekwav'
    })
})

// Regression: the archive page passed "?filter=..." to getCanonicalUrl, which adds its own "?" (canonical and og:url had "??")
test('archive canonical URL has a single, encoded filter query', () => {
    assert.equal(ssr.getArchiveCanonicalUrl('HYPERION', 'eyJ+a/b='), 'https://sky.coflnet.com/item/HYPERION/archive?filter=eyJ%2Ba%2Fb%3D')
    assert.equal(ssr.getArchiveCanonicalUrl('HYPERION'), 'https://sky.coflnet.com/item/HYPERION/archive')
})
