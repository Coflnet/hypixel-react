import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function loadModule(path) {
    const source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
    }).outputText
    const context = { exports: {}, Set, require: () => ({}) }
    runInNewContext(source, context)
    return context.exports
}

const { HoverPrefetchController } = loadModule('../hooks/useHoverPrefetch.ts')

function setup(extra = {}) {
    let now = 0
    let nextId = 1
    const pending = new Map()
    const timers = {
        setTimeout: (fn, ms) => {
            pending.set(nextId, { fn, at: now + ms })
            return nextId++
        },
        clearTimeout: id => pending.delete(id)
    }
    const advance = ms => {
        now += ms
        for (const [id, t] of [...pending]) {
            if (t.at <= now) {
                pending.delete(id)
                t.fn()
            }
        }
    }
    const calls = []
    const controller = new HoverPrefetchController(r => calls.push(r), 150, extra.set ?? new Set(), timers, extra.max ?? 500)
    return { controller, calls, advance }
}

test('prefetch fires after the delay', () => {
    const { controller, calls, advance } = setup()
    controller.enter('/a')
    advance(149)
    assert.deepEqual(calls, [])
    advance(1)
    assert.deepEqual(calls, ['/a'])
})

test('leaving earlier cancels the prefetch', () => {
    const { controller, calls, advance } = setup()
    controller.enter('/a')
    advance(100)
    controller.leave()
    advance(500)
    assert.deepEqual(calls, [])
})

test('only once per route, also across controllers sharing the set', () => {
    const set = new Set()
    const a = setup({ set })
    const b = setup({ set })
    a.controller.enter('/a')
    a.advance(200)
    a.controller.enter('/a')
    a.advance(200)
    b.controller.enter('/a')
    b.advance(200)
    b.controller.touch('/a')
    assert.deepEqual(a.calls, ['/a'])
    assert.deepEqual(b.calls, [])
})

test('touch prefetches immediately and cancels a pending hover', () => {
    const { controller, calls, advance } = setup()
    controller.enter('/a')
    controller.touch('/b')
    assert.deepEqual(calls, ['/b'])
    advance(500)
    assert.deepEqual(calls, ['/b'])
})

test('cancel (unmount) clears the timer and the set is capped', () => {
    const { controller, calls, advance } = setup({ max: 2 })
    controller.enter('/a')
    controller.cancel()
    advance(500)
    assert.deepEqual(calls, [])
    controller.touch('/1')
    controller.touch('/2')
    controller.touch('/3')
    controller.touch('/1')
    assert.deepEqual(calls, ['/1', '/2', '/3', '/1'])
})
