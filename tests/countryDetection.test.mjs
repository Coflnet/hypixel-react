import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const CLIENT_MODULE = '../api/_generated/skyApi'

/** a fresh copy of utils/CountryDetection.ts (its request is per module) with the generated client, timers and storage stubbed */
function loadDetection({ getApiPremiumCountry, ...globals }) {
    const source = ts.transpileModule(readFileSync(new URL('../utils/CountryDetection.ts', import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
    }).outputText
    const require = name => (name === CLIENT_MODULE ? { getApiPremiumCountry } : {})
    const context = { exports: {}, require, AbortController, clearTimeout, setTimeout, ...globals }
    runInNewContext(source, context)
    return context.exports
}

function respond(data, status = 200) {
    return Promise.resolve({ data, status, headers: new Headers() })
}

/** a request that never answers on its own, only rejects once its signal aborts (like a dropped connection) */
function hangingRequest({ signal }) {
    return new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))))
}

test('detects the country once per page load from SkyApi, upper case', async () => {
    let requests = 0
    const detection = loadDetection({ getApiPremiumCountry: () => (requests++, respond({ country: 'de' })) })
    assert.equal(await detection.detectVisitorCountryCode(), 'DE')
    assert.equal(await detection.detectVisitorCountryCode(), 'DE')
    assert.equal(requests, 1)
})

test('leaves the country unknown when the detection fails or answers without one', async () => {
    assert.equal(await loadDetection({ getApiPremiumCountry: () => Promise.reject(new Error('blocked')) }).detectVisitorCountryCode(), undefined)
    assert.equal(await loadDetection({ getApiPremiumCountry: () => respond({ country: null }) }).detectVisitorCountryCode(), undefined)
    assert.equal(await loadDetection({ getApiPremiumCountry: () => respond({}) }).detectVisitorCountryCode(), undefined)
    assert.equal(await loadDetection({ getApiPremiumCountry: () => respond({ country: 'DE' }, 500) }).detectVisitorCountryCode(), undefined)
})

// while SkyApi does not know the endpoint yet the country stays unknown; no third-party lookup is asked instead
test('leaves the country unknown when SkyApi answers 404', async () => {
    let fetched = false
    const detection = loadDetection({
        getApiPremiumCountry: () => respond('Not Found', 404),
        fetch: () => ((fetched = true), Promise.reject(new Error('no other request expected')))
    })
    assert.equal(await detection.detectVisitorCountryCode(), undefined)
    assert.equal(fetched, false)
})

// regression: a detection request that never answered kept the country select disabled and every checkout blocked
test('gives up on a detection that does not answer in time', async () => {
    const delays = []
    const detection = loadDetection({
        getApiPremiumCountry: hangingRequest,
        setTimeout: (callback, delay) => (delays.push(delay), setTimeout(callback, 0))
    })
    assert.equal(await detection.detectVisitorCountryCode(), undefined)
    assert.deepEqual(delays, [detection.DETECTION_TIMEOUT_MS])
})

// regression: the purchase and the referral country were stored on the device without consent
test('stores nothing and removes the country earlier versions stored', async () => {
    const removed = []
    const localStorage = { removeItem: key => removed.push(key), setItem: () => assert.fail('nothing may be stored') }
    await loadDetection({ getApiPremiumCountry: () => respond({ country: 'US' }), localStorage }).detectVisitorCountryCode()
    assert.deepEqual(removed, ['userCountryCode', 'referralRewardsCountry'])
})
