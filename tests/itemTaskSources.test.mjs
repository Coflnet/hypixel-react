import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function loadModule(path) {
    const source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
    }).outputText
    const context = { exports: {} }
    runInNewContext(source, context)
    return context.exports
}

const { getTaskSourcesForItem, buildItemTaskLinkMap } = loadModule('../utils/ItemTaskSources.ts')

function task(slug, coinsPerHour, drops) {
    return { slug, name: `Task ${slug}`, coinsPerHour, drops }
}

function drop(itemTag, ratePerHour, contributionPerHour) {
    return { itemTag, ratePerHour, contributionPerHour }
}

test('returns nothing without tasks or a matching drop', () => {
    assert.equal(getTaskSourcesForItem(null, 'A').length, 0)
    assert.equal(getTaskSourcesForItem([], 'A').length, 0)
    assert.equal(getTaskSourcesForItem([task('x', 1, [drop('B', 1, 1)])], 'A').length, 0)
})

test('ignores drops with a rate of zero', () => {
    assert.equal(getTaskSourcesForItem([task('x', 1, [drop('A', 0, 0)])], 'A').length, 0)
})

test('orders by contribution, then rate, regardless of input order', () => {
    const tasks = [
        task('low', 10, [drop('A', 5, 1)]),
        task('rate', 10, [drop('B', 1, 0), drop('A', 9, 1)]),
        task('top', 10, [drop('A', 1, 50)])
    ]
    assert.equal(getTaskSourcesForItem(tasks, 'A').map(s => s.slug).join(), 'top,rate,low')
})

test('limits the result and exposes rate and coins per hour', () => {
    const tasks = Array.from({ length: 8 }, (_, i) => task(`t${i}`, 100 + i, [drop('A', 2, i)]))
    const result = getTaskSourcesForItem(tasks, 'A')
    assert.equal(result.length, 5)
    assert.deepEqual({ ...result[0] }, { slug: 't7', name: 'Task t7', ratePerHour: 2, coinsPerHour: 107, contributionPerHour: 7 })
})

test('builds a map of ordered slug and name links per dropped item', () => {
    const tasks = [task('a', 10, [drop('X', 1, 1), drop('Z', 0, 0)]), task('b', 20, [drop('X', 1, 9)])]
    const map = buildItemTaskLinkMap(tasks)
    assert.equal(Object.keys(map).join(), 'X')
    assert.equal(JSON.stringify(map.X), JSON.stringify([{ slug: 'b', name: 'Task b' }, { slug: 'a', name: 'Task a' }]))
})
