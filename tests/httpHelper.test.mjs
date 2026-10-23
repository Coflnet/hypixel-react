import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const source = ts.transpileModule(readFileSync(new URL('../api/HttpHelper.tsx', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText

function createHarness() {
    const pending = []
    const cached = []
    let messageId = 0
    let fetchCount = 0
    const context = {
        exports: {},
        fetch: () => {
            fetchCount++
            return new Promise((resolve, reject) => pending.push({ resolve, reject }))
        },
        require(name) {
            if (name.includes('CacheUtils')) return { default: { getFromCache: async () => null, setIntoCache: (...args) => cached.push(args) } }
            if (name.includes('PropertiesUtils')) return { getProperty: () => 'https://example.test' }
            if (name.includes('MessageIdUtils')) return { getNextMessageId: () => ++messageId }
            if (name.includes('Base64Utils')) return {
                btoaUnicode: value => Buffer.from(value).toString('base64'),
                atobUnicode: value => Buffer.from(value, 'base64').toString()
            }
            throw new Error(`Unexpected dependency: ${name}`)
        }
    }
    runInNewContext(source, context)
    const api = context.exports.initHttpHelper()
    function request(onReject) {
        const resolutions = []
        const rejections = []
        const complete = api.sendApiRequest({
            type: 'test', data: '',
            resolve: value => resolutions.push(value),
            reject: error => {
                rejections.push(error)
                onReject?.(error)
            }
        })
        return { resolutions, rejections, complete }
    }
    return { pending, cached, request, get fetchCount() { return fetchCount } }
}

function response(body, status = 200) {
    return new Response(body, { status, headers: { 'Content-Type': 'application/json', 'x-trace-id': 'test-trace' } })
}

for (const failure of ['HTTP 503', 'network failure']) {
    test(`duplicate callers share the ${failure} rejection and can retry`, async () => {
        const harness = createHarness()
        const first = harness.request()
        const second = harness.request()
        assert.equal(harness.fetchCount, 1)
        const networkError = new TypeError('Failed to fetch')
        if (failure === 'HTTP 503') harness.pending.shift().resolve(response('{"message":"maintenance","slug":"unavailable"}', 503))
        else harness.pending.shift().reject(networkError)
        await Promise.all([first.complete, second.complete])
        assert.deepEqual(first.resolutions, [])
        assert.deepEqual(second.resolutions, [])
        assert.equal(first.rejections.length, 1)
        assert.equal(second.rejections.length, 1)
        assert.equal(first.rejections[0], second.rejections[0])
        if (failure === 'HTTP 503') {
            assert.equal(first.rejections[0].status, 503)
            assert.equal(first.rejections[0].message, 'maintenance')
            assert.equal(first.rejections[0].traceId, 'test-trace')
        } else assert.equal(first.rejections[0], networkError)
        assert.equal(harness.cached.length, 0)

        const retry = harness.request()
        const duplicateRetry = harness.request()
        assert.equal(harness.fetchCount, 2)
        harness.pending.shift().resolve(response('{"value":42}'))
        await Promise.all([retry.complete, duplicateRetry.complete])
        assert.equal(retry.resolutions.length, 1)
        assert.equal(retry.resolutions[0].value, 42)
        assert.equal(duplicateRetry.resolutions[0], retry.resolutions[0])
        assert.deepEqual(retry.rejections, [])
        assert.deepEqual(duplicateRetry.rejections, [])
        assert.equal(harness.cached.length, 1)
        assert.equal(harness.cached[0][3], 60)
    })
}

test('empty responses settle all callers without caching and leave no stale request', async () => {
    const harness = createHarness()
    const first = harness.request()
    const second = harness.request()
    harness.pending.shift().resolve(response(''))
    await Promise.all([first.complete, second.complete])
    assert.deepEqual(first.resolutions, [undefined])
    assert.deepEqual(second.resolutions, [''])
    assert.equal(harness.cached.length, 0)
    const retry = harness.request()
    assert.equal(harness.fetchCount, 2)
    harness.pending.shift().resolve(response('false'))
    await retry.complete
    assert.deepEqual(retry.resolutions, [false])
    assert.equal(harness.cached.length, 1)
})

test('a retry started by a rejection callback is not cleared by completion of the failed request', async () => {
    const harness = createHarness()
    let retry
    const first = harness.request(() => { retry = harness.request() })
    harness.pending.shift().reject(new Error('offline'))
    await first.complete
    const duplicate = harness.request()
    assert.equal(harness.fetchCount, 2)
    harness.pending.shift().resolve(response('{"recovered":true}'))
    await Promise.all([retry.complete, duplicate.complete])
    assert.equal(retry.resolutions[0].recovered, true)
    assert.equal(duplicate.resolutions[0], retry.resolutions[0])
})
