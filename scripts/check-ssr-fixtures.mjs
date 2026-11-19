import assert from 'node:assert/strict'
import { build } from 'esbuild'

// Bundle the production instrumentation hook so the same guard and matcher are
// exercised directly, without starting Next or making a live API request.
const result = await build({ entryPoints: ['instrumentation.ts'], bundle: true, platform: 'node', format: 'esm', write: false })
const { register } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`)
const originalFetch = globalThis.fetch
process.env.NEXT_RUNTIME = 'nodejs'
delete process.env.API_ENDPOINT
delete process.env.CYPRESS_SSR_FIXTURES
process.env.TEST_RUNNER = 'true'
await register()
assert.equal(globalThis.fetch, originalFetch, 'unset fixture flag must leave fetch unchanged')

process.env.CYPRESS_SSR_FIXTURES = '1'
process.env.TEST_RUNNER = 'false'
await assert.rejects(register(), /require TEST_RUNNER=true/)
assert.equal(globalThis.fetch, originalFetch, 'invalid mode must leave fetch unchanged')

process.env.TEST_RUNNER = 'true'
await register()
assert.equal((await (await fetch('https://sky.coflnet.com/api/craft/profit')).json()).length, 5)
assert.equal((await (await fetch('https://sky.coflnet.com/api/flip/forge')).json()).length, 4)
assert.throws(() => fetch('https://sky.coflnet.com/api/item/STING/unlisted'), /Missing Cypress SSR fixture/)
assert.equal((await fetch('https://sky.coflnet.com/api/item/STING/details')).status, 200)
assert.equal((await (await fetch('https://sky.coflnet.com/api/item/BOOSTER_COOKIE/details')).json()).flags, 17)
assert.equal((await (await fetch('https://sky.coflnet.com/api/item/ENCHANTMENT_SHARPNESS_6/details')).json()).flags, 1)
assert.deepEqual(await (await fetch('https://sky.coflnet.com/api/bazaar/BOOSTER_COOKIE/history/day')).json(), [])
console.log('Cypress SSR fixture guards passed')
