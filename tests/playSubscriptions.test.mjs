import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function loadModule(path, dependencies = {}) {
    const source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
    }).outputText
    const context = { exports: {}, require: name => dependencies[name] }
    runInNewContext(source, context)
    return context.exports
}

const types = loadModule('../components/Premium/PremiumPurchaseWizard/types.ts')
const { buildPlaySubscriptionIntent, getInitialPlayPlan, getPlayPurchaseMode, getPlayCheckoutError, getPlaySubscriptionResult, isPlayCheckoutExpired } = loadModule(
    '../utils/PlaySubscriptions.ts',
    {
        '../components/Premium/PremiumPurchaseWizard/types': types,
        './GeneratedApiResponseUtils': loadModule('../utils/GeneratedApiResponseUtils.ts')
    }
)

test('only the enabled Android app offers Play checkout, and the update URL shows the fallback', () => {
    assert.equal(getPlayPurchaseMode(false, false, false), 'web')
    assert.equal(getPlayPurchaseMode(false, true, false), 'web')
    assert.equal(getPlayPurchaseMode(false, true, true), 'web')
    assert.equal(getPlayPurchaseMode(true, false, false), 'web')
    assert.equal(getPlayPurchaseMode(true, true, false), 'play')
    assert.equal(getPlayPurchaseMode(true, true, true), 'update')
    assert.equal(getPlayPurchaseMode(true, false, true), 'update')
})

test('Play starts on a personal four-week plan and requires a new choice for Starter or slots links', () => {
    const { PremiumTier } = types
    assert.equal(getInitialPlayPlan(null, false), 'l_premium')
    assert.equal(getInitialPlayPlan(PremiumTier.PREMIUM, false), 'l_premium')
    assert.equal(getInitialPlayPlan(PremiumTier.PREMIUM_PLUS, false), 'l_prem_plus')
    assert.equal(getInitialPlayPlan(PremiumTier.STARTER, false), '')
    assert.equal(getInitialPlayPlan(PremiumTier.PREMIUM_PLUS, true), '')
})

test('Play checkout expires at the signed Unix second', () => {
    const expiresAt = 1795280000
    const boundary = 1795280000000
    assert.equal(isPlayCheckoutExpired(expiresAt, boundary - 1), false)
    assert.equal(isPlayCheckoutExpired(expiresAt, boundary), true)
    assert.equal(isPlayCheckoutExpired(expiresAt, boundary + 1), true)
    assert.equal(isPlayCheckoutExpired(undefined, boundary), true)
})

test('the signed Play checkout encodes each query value and the full browser fallback', () => {
    assert.equal(
        buildPlaySubscriptionIntent('l_prem_plus', {
            obfuscatedAccountId: 'buyer & #1',
            playProductId: 'plus&plan',
            basePlanId: 'p4w#1',
            accountLabel: 'Jörg & 雪+#',
            expiresAt: 1795280000,
            signature: 's_Ab-9'
        }),
        'intent://subscribe?productId=plus%26plan&basePlanId=p4w%231&userId=buyer%20%26%20%231&slug=l_prem_plus&label=J%C3%B6rg%20%26%20%E9%9B%AA%2B%23&exp=1795280000&sig=s_Ab-9' +
        '#Intent;scheme=skycofl;package=com.coflnet.sky;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;' +
        'S.browser_fallback_url=https%3A%2F%2Fsky.coflnet.com%2Fpremium%3FplayUpdate%3D1;end'
    )
})

test('Play start errors distinguish login, terms, active subscriptions, unavailable plans, and temporary failures', () => {
    assert.equal(getPlayCheckoutError(401).kind, 'signIn')
    assert.equal(getPlayCheckoutError(403).kind, 'signIn')
    assert.equal(getPlayCheckoutError(428).kind, 'terms')
    const active = { slug: 'active_subscription', message: 'You already have an active subscription in this plan’s line. The blocking subscription is billed by stripe.' }
    assert.equal(getPlayCheckoutError(400, active).message, active.message)
    assert.equal(getPlayCheckoutError(400, { slug: 'active_subscription' }).message, 'You already have an active subscription.')
    assert.match(getPlayCheckoutError(400, { slug: 'plan_unavailable' }).message, /plan is unavailable/)
    assert.match(getPlayCheckoutError(503, { message: 'private diagnostic' }).message, /try again later/)
    assert.match(getPlayCheckoutError().message, /try again later/)
})

test('Android result hashes preserve full subscription slugs and decode the error message once', () => {
    assert.equal(getPlaySubscriptionResult('#billing_success_l_premium', false).slug, 'l_premium')
    assert.equal(getPlaySubscriptionResult('#billing_success_l_prem_plus', false).slug, 'l_prem_plus')
    const failure = getPlaySubscriptionResult('#billing_error_l_prem_plus_Test_error%20%26%20%23', true)
    assert.equal(failure.slug, 'l_prem_plus')
    assert.equal(failure.error, 'Test_error & #')
    assert.equal(getPlaySubscriptionResult('#billing_success_ps_cc_1800', false), null)
    assert.equal(getPlaySubscriptionResult('#billing_error_ps_cc_1800_Problem', true), null)
    assert.equal(getPlaySubscriptionResult('#billing_success_l_premium-year', false), null)
})
