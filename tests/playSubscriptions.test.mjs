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

test('only Play mode honours the update URL and only that URL allows the web override', () => {
    for (const update of [false, true]) {
        for (const web of [false, true]) assert.equal(getPlayPurchaseMode(false, update, web), 'web')
    }
    assert.equal(getPlayPurchaseMode(true, false, false), 'play')
    assert.equal(getPlayPurchaseMode(true, false, true), 'play')
    assert.equal(getPlayPurchaseMode(true, true, false), 'update')
    assert.equal(getPlayPurchaseMode(true, true, true), 'web')
})

test('Play starts on a personal four-week plan and requires a new choice for Starter or slots links', () => {
    const { PremiumTier } = types
    assert.equal(getInitialPlayPlan(null, false), 'l_premium')
    assert.equal(getInitialPlayPlan(PremiumTier.PREMIUM, false), 'l_premium')
    assert.equal(getInitialPlayPlan(PremiumTier.PREMIUM_PLUS, false), 'l_prem_plus')
    assert.equal(getInitialPlayPlan(PremiumTier.STARTER, false), '')
    assert.equal(getInitialPlayPlan(PremiumTier.PREMIUM_PLUS, true), '')
})

test('Play checkout expires nine minutes after receipt on the monotonic clock', () => {
    const receivedAt = 12_345
    const boundary = receivedAt + 540_000
    assert.equal(isPlayCheckoutExpired(receivedAt, receivedAt), false)
    assert.equal(isPlayCheckoutExpired(receivedAt, boundary - 1), false)
    assert.equal(isPlayCheckoutExpired(receivedAt, boundary), true)
    assert.equal(isPlayCheckoutExpired(receivedAt, boundary + 1), true)
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
    for (const [slug, provider] of [['stripe', 'Stripe'], ['paypal', 'PayPal'], ['lemonsqueezy', 'Lemon Squeezy'], ['googleplay', 'Google Play']]) {
        const active = { slug: 'active_subscription', message: `The blocking subscription is billed by ${slug}.` }
        assert.equal(getPlayCheckoutError(400, active).message, `You already have an active subscription billed by ${provider}.`)
    }
    assert.equal(getPlayCheckoutError(400, { slug: 'active_subscription', message: 'The blocking subscription is billed by private_slug.' }).message, 'You already have an active subscription.')
    assert.equal(getPlayCheckoutError(400, { slug: 'active_subscription' }).message, 'You already have an active subscription.')
    assert.match(getPlayCheckoutError(400, { slug: 'plan_unavailable' }).message, /plan is unavailable/)
    assert.match(getPlayCheckoutError(503, { message: 'private diagnostic' }).message, /try again later/)
    assert.match(getPlayCheckoutError().message, /try again later/)
})

test('Android result hashes preserve full subscription slugs and map known failures to fixed copy', () => {
    assert.equal(getPlaySubscriptionResult('#billing_success_l_premium', false).slug, 'l_premium')
    assert.equal(getPlaySubscriptionResult('#billing_success_l_prem_plus', false).slug, 'l_prem_plus')
    const error = value => getPlaySubscriptionResult(`#billing_error_l_prem_plus_${value}`, true)
    const cancelled = error('Purchase%20canceled%20by%20user')
    assert.equal(cancelled.slug, 'l_prem_plus')
    assert.equal(cancelled.error, 'The purchase was cancelled.')
    assert.match(error('Item%20already%20owned').error, /already be active/)
    assert.match(error('This%20subscription%20belongs%20to%20a%20different%20SkyCofl%20account').error, /another SkyCofl account/)
    assert.match(error('Subscription%20confirmation%20will%20be%20retried').error, /payment is processing/)
    assert.match(error('Could%20not%20securely%20save%20the%20subscription%20for%20confirmation').error, /payment is processing/)
    const generic = 'Google Play reported a checkout problem. Check your purchases in Google Play before trying again.'
    assert.equal(error('Arbitrary_text%20%26%20%23').error, generic)
    assert.equal(error('%E0%A4%A').error, generic)
    assert.equal(error('Purchase%2520canceled%2520by%2520user').error, generic)
    assert.equal(getPlaySubscriptionResult('#billing_success_ps_cc_1800', false), null)
    assert.equal(getPlaySubscriptionResult('#billing_error_ps_cc_1800_Problem', true), null)
    assert.equal(getPlaySubscriptionResult('#billing_success_l_premium-year', false), null)
})
