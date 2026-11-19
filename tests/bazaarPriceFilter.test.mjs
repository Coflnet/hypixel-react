import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function loadModule(path) {
    const source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
    }).outputText
    const context = { exports: {}, Math, Number }
    runInNewContext(source, context)
    return context.exports
}

const { filterBazaarPriceOutliers } = loadModule('../utils/BazaarPriceFilter.ts')

function side(price, min = 0, max = 0) {
    return { price, min, max, volume: 0, moving: 0 }
}

function point(day, buy, sell, extra = {}) {
    return {
        buyData: side(buy, extra.minBuy, extra.maxBuy),
        sellData: side(sell, extra.minSell, extra.maxSell),
        timestamp: new Date(Date.UTC(2026, 10, day))
    }
}

test('points without min/max are kept', () => {
    const result = filterBazaarPriceOutliers([point(1, 0.9, 0.3), point(2, 1, 0.4), point(3, 1.1, 0.3)])
    assert.equal(result.length, 3)
})

test('a point without sell keeps its buy and has no sell value', () => {
    const result = filterBazaarPriceOutliers([point(1, 0.9, 0.3), point(2, 0.5, 0, { maxBuy: 2 }), point(3, 1, 0.3)])
    assert.equal(result.length, 3)
    assert.equal(result[1].buyData.price, 0.5)
    assert.equal(result[1].sellData.price, 0)
})

test('a real outlier is dropped', () => {
    const result = filterBazaarPriceOutliers([point(1, 1, 1), point(2, 1, 1), point(3, 1, 1), point(4, 20, 1)])
    assert.equal(result.length, 3)
})

test('positive max beyond the band is clamped, missing min stays 0', () => {
    const result = filterBazaarPriceOutliers([point(1, 1, 1), point(2, 1, 1, { maxBuy: 100 }), point(3, 1, 1)])
    assert.equal(result[1].buyData.max, 8)
    assert.equal(result[1].buyData.min, 0)
})

test('HARD_STONE month example keeps at least 28 of 30 points', () => {
    const points = []
    for (let day = 1; day <= 30; day++) {
        // most days have no minBuy/minSell, some have no sell at all
        const noSell = day % 13 === 0
        points.push(point(day, 0.1 + (day % 5) * 0.2, noSell ? 0 : 0.3, { maxBuy: 4, maxSell: noSell ? 0 : 2 }))
    }
    assert.ok(filterBazaarPriceOutliers(points).length >= 28)
})

const { toCandle, isChartGap, gapSafe } = loadModule('../utils/BazaarChartValues.ts')

test('candle with open but missing min/max falls back to the body', () => {
    assert.deepEqual([...toCandle(2, 3, 0, undefined)], ['2.00', '3.00', '2.00', '3.00'])
    assert.deepEqual([...toCandle(3, 2, undefined, 0)], ['3.00', '2.00', '2.00', '3.00'])
})

test('candle with missing open is a full gap', () => {
    assert.deepEqual([...toCandle(0, 3, 1, 4)], ['-', '-', '-', '-'])
})

test('candle with missing close falls back to open and keeps real min/max', () => {
    assert.deepEqual([...toCandle(2, 0, 1, 4)], ['2.00', '2.00', '1.00', '4.00'])
})

test('tooltip formatter shows a gap instead of 0 Coins', () => {
    const format = gapSafe(v => `${v} Coins`)
    assert.equal(format('-'), '-')
    assert.equal(format('1.50'), '1.50 Coins')
    assert.equal(isChartGap('-'), true)
})
