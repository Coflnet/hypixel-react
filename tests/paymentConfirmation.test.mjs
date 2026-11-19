import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function loadModule(path) {
    const source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
    }).outputText
    const context = { exports: {}, Date, Number, URLSearchParams, require: () => ({}) }
    runInNewContext(source, context)
    return context.exports
}

const confirmation = loadModule('../utils/PaymentConfirmation.ts')
const { getPurchaseReference, getPurchaseReturn, getServerNow, getServerReturnedAt, parseServerTime, getCreditKeys, isPurchaseConfirmed, getPollDelay, RECENT_CREDIT_MS } =
    confirmation

const MINUTE = 60 * 1000
// the PayPal subscription of the report: back on the page at 15:06:32 UTC, the period booked at 15:07:11
const RETURNED_AT = Date.UTC(2026, 10, 19, 15, 6, 32)
const iso = ms => new Date(ms).toISOString().replace('Z', '')
/** what Payments books for a paid subscription period: the plan's coins credited (`…-topup`) and spent on it */
const grant = (ms, reference = 'paypal-sale-1') => [
    { productId: 'l_premium', reference, amount: -1800, timeStamp: iso(ms) },
    { productId: 'l_premium', reference: `${reference}-topup`, amount: 1800, timeStamp: iso(ms) }
]
const topUp = (ms, productId = 's_cc_1800', reference = 'pi_1') => ({ productId, reference, amount: 1800, timeStamp: iso(ms) })
const firstLookup = (purchase = 'unknown') => ({ returnedAt: RETURNED_AT, baseline: null, purchase })

test('only PayPal appends an id: a subscription id before its token, an order id as token', () => {
    assert.equal(getPurchaseReference('?subscription_id=I-ABC&ba_token=BA-1&token=EC-1'), 'I-ABC')
    assert.equal(getPurchaseReference('?token=5O190127TN364715T&PayerID=X'), '5O190127TN364715T')
    assert.equal(getPurchaseReference('?returnedAt=1&subscription_id=%20'), null)
    // Stripe, Lemon Squeezy and CoinGate return to the bare success url
    assert.equal(getPurchaseReference(''), null)
    assert.equal(getPurchaseReturn('?subscription_id=I-ABC&ba_token=BA-1&token=EC-1'), 'paypalSubscription')
    assert.equal(getPurchaseReturn('?ba_token=BA-1&token=EC-1'), 'paypalSubscription', 'a subscription return without subscription_id is not an order')
    assert.equal(getPurchaseReturn('?token=5O190127TN364715T&PayerID=X'), 'paypalOrder')
    assert.equal(getPurchaseReturn('?returnedAt=1'), 'unknown')
})

test("the server's time comes from the Date header, the device's without a readable one", () => {
    assert.equal(getServerNow('Thu, 19 Nov 2026 15:06:33 GMT', 1), Date.UTC(2026, 10, 19, 15, 6, 33))
    assert.equal(getServerNow(null, 42), 42)
    assert.equal(getServerNow('not a date', 42), 42)
})

test('the return time is the page load on the server clock, or the url time of a reload', () => {
    const fast = 10 * MINUTE
    // loaded at 15:06:32 server time on a device 10 minutes fast, answered a second later
    assert.equal(getServerReturnedAt(null, RETURNED_AT + fast, RETURNED_AT + 1000, RETURNED_AT + fast + 1000), RETURNED_AT)
    assert.equal(getServerReturnedAt(String(RETURNED_AT), 1, RETURNED_AT + 30 * MINUTE, 1), RETURNED_AT)
    assert.equal(getServerReturnedAt('soon', RETURNED_AT, RETURNED_AT + 1000, RETURNED_AT + 1000), RETURNED_AT)
    assert.equal(getServerReturnedAt('-5', RETURNED_AT, RETURNED_AT + 1000, RETURNED_AT + 1000), RETURNED_AT)
    // never after the server's now
    assert.equal(getServerReturnedAt(String(RETURNED_AT + MINUTE), 1, RETURNED_AT, 1), RETURNED_AT)
})

test('server timestamps without a zone are UTC', () => {
    assert.equal(parseServerTime('2026-11-19T15:07:11'), Date.UTC(2026, 10, 19, 15, 7, 11))
    assert.equal(parseServerTime('2026-11-19T15:07:11.5Z'), Date.UTC(2026, 10, 19, 15, 7, 11, 500))
    assert.equal(parseServerTime('2026-11-19T16:07:11+01:00'), Date.UTC(2026, 10, 19, 15, 7, 11))
    assert.ok(Number.isNaN(parseServerTime(undefined)))
})

test('a grant booked after the return confirms the purchase (PayPal: 40 s later)', () => {
    assert.equal(isPurchaseConfirmed(grant(RETURNED_AT + 39000), firstLookup('paypalSubscription')), true)
})

test('a credit booked shortly before the return still counts (a webhook beating the redirect), an older one does not', () => {
    assert.equal(isPurchaseConfirmed([topUp(RETURNED_AT - 30000)], firstLookup()), true)
    assert.equal(RECENT_CREDIT_MS, 2 * MINUTE)
    assert.equal(isPurchaseConfirmed([topUp(RETURNED_AT - RECENT_CREDIT_MS - 1000)], firstLookup()), false)
})

test('regression: a device clock 10 minutes fast still confirms a credit booked before the first lookup', () => {
    const fast = 10 * MINUTE
    const loadedAt = RETURNED_AT + fast
    const returnedAt = getServerReturnedAt(null, loadedAt, getServerNow('Thu, 19 Nov 2026 15:06:33 GMT', 0), loadedAt + 1000)
    const transactions = [topUp(RETURNED_AT - 30000)]
    assert.equal(isPurchaseConfirmed(transactions, { returnedAt, baseline: null, purchase: 'unknown' }), true)
})

test('regression: a payment of an earlier checkout more than two minutes ago does not confirm a crypto top-up', () => {
    const premiumBefore = grant(RETURNED_AT - 4 * MINUTE, 'stripe-invoice-in_1')
    assert.equal(isPurchaseConfirmed(premiumBefore, firstLookup()), false)
})

test('regression: credits that are not payments never confirm it', () => {
    for (const productId of ['revert', 'compensation', 'transfer', 'advent-reward', 'verify_mc', 'referal_bonus', 'config-sell', 'some-future-reward']) {
        const credit = { productId, reference: 'other', amount: 100, timeStamp: iso(RETURNED_AT + 1000) }
        assert.equal(isPurchaseConfirmed([credit], firstLookup()), false, productId)
        assert.equal(isPurchaseConfirmed([credit], { ...firstLookup(), baseline: [] }), false, productId)
    }
})

test('every provider product counts as a payment', () => {
    for (const productId of ['s_cc_1800', 'p_cc_1800', 'l_cc_1800', 'c_cc_1800', 'ps_cc_1800', 'l_premium', 'l_prem_plus-slots-4']) {
        assert.equal(isPurchaseConfirmed([topUp(RETURNED_AT + 1000, productId)], firstLookup()), true, productId)
    }
})

test('regression: a PayPal return is only confirmed by a PayPal credit', () => {
    const otherPayments = [topUp(RETURNED_AT + 1000, 'c_cc_1800', 'coingate:1'), ...grant(RETURNED_AT + 1000, 'stripe-invoice-in_1')]
    assert.equal(isPurchaseConfirmed(otherPayments, firstLookup('paypalSubscription')), false)
    assert.equal(isPurchaseConfirmed(otherPayments, firstLookup('paypalOrder')), false)
    assert.equal(isPurchaseConfirmed(grant(RETURNED_AT + 1000), firstLookup('paypalSubscription')), true)
    assert.equal(isPurchaseConfirmed([topUp(RETURNED_AT + 1000, 'p_cc_1800', '8XY12345')], firstLookup('paypalOrder')), true)
    // a PayPal subscription's grant is not a PayPal order
    assert.equal(isPurchaseConfirmed(grant(RETURNED_AT + 1000), firstLookup('paypalOrder')), false)
})

test('later lookups accept only a credit missing from the first one, whatever any clock says', () => {
    const old = topUp(Date.UTC(2026, 9, 1), 'l_cc_1800', 'old')
    const recentBefore = topUp(RETURNED_AT - 30000, 's_cc_1800', 'pi_before')
    const baseline = getCreditKeys([old, recentBefore, ...grant(Date.UTC(2026, 9, 1), 'old-sale')])
    assert.equal(baseline.length, 3)
    const later = { returnedAt: RETURNED_AT, baseline, purchase: 'unknown' }
    assert.equal(isPurchaseConfirmed([recentBefore, old], later), false)
    assert.equal(isPurchaseConfirmed([...grant(RETURNED_AT - 10 * MINUTE, 'paypal-sale-new'), old], later), true)
})

test('polling backs off from 3 s to 10 s after a minute and 30 s after five minutes', () => {
    assert.equal(getPollDelay(0), 3000)
    assert.equal(getPollDelay(59999), 3000)
    assert.equal(getPollDelay(60000), 10000)
    assert.equal(getPollDelay(5 * 60000 - 1), 10000)
    assert.equal(getPollDelay(5 * 60000), 30000)
})
