import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { getFallbackModAuthUrl, postFallbackModAuth } from '../api/modAuthFallback.ts'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })

test('fallback auth uses same-origin HTTPS path and encodes the connection ID', () => {
    assert.equal(getFallbackModAuthUrl('https://sky-commands.coflnet.com', 'a b&c/d'), '/api/mod/auth?newId=a+b%26c%2Fd')
    for (const origin of ['http://sky-commands.coflnet.com', 'https://sky-commands.coflnet.com.evil.test', 'https://sky-commands.coflnet.com:444', 'https://sky.coflnet.com', 'https://sky-mod.coflnet.com']) {
        assert.equal(getFallbackModAuthUrl(origin, 'id'), null)
    }
})

test('fallback POST retains GoogleToken and propagates fetch errors', async () => {
    const error = new Error('connection refused')
    globalThis.fetch = async (url, init) => {
        assert.equal(url, '/api/mod/auth?newId=a%26b')
        assert.equal(init.method, 'POST')
        assert.equal(init.headers.GoogleToken, 'google-token')
        throw error
    }
    await assert.rejects(postFallbackModAuth('https://sky-commands.coflnet.com', 'a&b', { headers: { GoogleToken: 'google-token' } }), error)
    assert.equal(postFallbackModAuth('https://untrusted.test', 'id', { headers: {} }), null)
})

test('fallback POST rejects failed HTTP responses', async () => {
    for (const status of [401, 429]) {
        globalThis.fetch = async () => ({ ok: false, status })
        await assert.rejects(postFallbackModAuth('https://sky-commands.coflnet.com', 'id', { headers: {} }), { message: `Mod authentication failed (${status})` })
    }
})

test('sky-commands fallback POST succeeds on its same-origin path', async () => {
    const response = { ok: true, status: 204 }
    globalThis.fetch = async (url, init) => {
        assert.equal(url, '/api/mod/auth?newId=connection%2Fid')
        assert.equal(init.method, 'POST')
        assert.equal(init.headers.GoogleToken, 'google-token')
        return response
    }
    assert.equal(await postFallbackModAuth('https://sky-commands.coflnet.com', 'connection/id', { headers: { GoogleToken: 'google-token' } }), response)
})
