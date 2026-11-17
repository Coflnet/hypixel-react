import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function loadModule(path, stubs = {}) {
    const source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
    }).outputText
    const context = { exports: {}, Date, Number, Object, Array, Set, Math, String, Intl, require: name => (name in stubs ? stubs[name] : {}) }
    runInNewContext(source, context)
    return context.exports
}

const types = loadModule('../components/Premium/PremiumPurchaseWizard/types.ts')
const pricing = loadModule('../utils/PricingUtils.tsx', { '../components/Premium/PremiumPurchaseWizard/types': types })
const checkout = loadModule('../utils/SubscriptionCheckout.ts', { '../components/Premium/PremiumPurchaseWizard/types': types, './PricingUtils': pricing })
const planPricing = loadModule('../components/PremiumLanding/content/planPricing.ts', {
    '../../Premium/PremiumPurchaseWizard/types': types,
    '../../../utils/PricingUtils': pricing,
    '../../../utils/SubscriptionCheckout': checkout
})
const { Duration, PremiumTier, PurchaseType } = types

/** browsers may put a narrow no-break space before AM/PM; the assertions compare plain spaces */
const plain = text => text.replace(/\s/g, ' ')

const blackFriday = {
    code: 'BF2026',
    name: 'Black Friday',
    amountType: 'percent',
    amount: 50,
    periodAmounts: { 4: 25, 13: 50, 52: 50 },
    duration: 'once',
    expiresAt: '2026-11-30T23:59:59Z',
    providers: ['stripe', 'paypal']
}

test('offers only the direct providers, card first, and nothing for a Lemon Squeezy only answer', () => {
    assert.deepEqual([...checkout.getDirectProviders([{ provider: 'paypal' }, { provider: 'Stripe', mode: 'managed' }, { provider: 'lemonsqueezy' }])], ['stripe', 'paypal'])
    assert.deepEqual([...checkout.getDirectProviders([{ provider: 'lemonsqueezy', mode: 'direct' }])], [])
    assert.deepEqual([...checkout.getDirectProviders(undefined)], [])
    assert.deepEqual([...checkout.getDirectProviders({ message: 'Not found' })], [])
})

test('maps billing periods to weeks', () => {
    assert.equal(checkout.getBillingWeeks(Duration.MONTHLY), 4)
    assert.equal(checkout.getBillingWeeks(Duration.QUARTER), 13)
    assert.equal(checkout.getBillingWeeks(Duration.YEARLY), 52)
    assert.equal(checkout.getWeeksOfSeconds(2419200), 4)
})

test('uses the amount of the billing period and falls back to the general amount', () => {
    assert.equal(checkout.getPeriodPercent(blackFriday, 4), 25)
    assert.equal(checkout.getPeriodPercent(blackFriday, 52), 50)
    assert.equal(checkout.getPeriodPercent({ ...blackFriday, periodAmounts: null }, 4), 50)
    assert.equal(checkout.getPeriodPercent({ ...blackFriday, periodAmounts: { 4: 0, 52: 50 } }, 4), 0)
    assert.equal(checkout.getPeriodPercent({ ...blackFriday, amountType: 'fixed' }, 4), 0)
    assert.equal(checkout.getPeriodPercent(null, 4), 0)
})

test('applies a percent rounded up to the cent for Lemon Squeezy', () => {
    assert.equal(checkout.applyPercent(29.69, 20), 23.76)
    assert.equal(checkout.applyPercent(96.69, 50), 48.35)
    assert.equal(checkout.applyPercent(9.69, 0), 9.69)
})

test('rounds ties half to even and half away from zero', () => {
    assert.equal(checkout.divideHalfEven(4834500, 1000), 4834 + 0)
    assert.equal(checkout.divideHalfEven(25, 10), 2)
    assert.equal(checkout.divideHalfEven(35, 10), 4)
    assert.equal(checkout.divideHalfEven(26, 10), 3)
    assert.equal(checkout.divideHalfEven(24, 10), 2)
    assert.equal(checkout.divideHalfAway(25, 10), 3)
    assert.equal(checkout.divideHalfAway(24, 10), 2)
    assert.equal(checkout.divideHalfAway(35, 10), 4)
})

test('charges a direct checkout the plan price plus the buyer country VAT, to the cent', () => {
    assert.equal(checkout.getDirectPrice(9.69, 0, 'DE'), 11.53)
    assert.equal(checkout.getDirectPrice(9.69, 0, 'de'), 11.53)
    assert.equal(checkout.getDirectPrice(9.69, 0, 'GB'), 11.63)
    assert.equal(checkout.getDirectPrice(9.69, 0, 'US'), 9.69)
})

test('discounts to the net cent half to even before adding VAT', () => {
    // 96.69 * 50% = 48.345 -> 48.34 (even), gross 48.34 * 1.19 = 57.5246 -> 57.52
    assert.equal(checkout.getDirectPrice(96.69, 50, 'DE'), 57.52)
    assert.equal(checkout.getDirectPrice(96.69, 50, 'US'), 48.34)
    // 0.05 * 50% = 0.025 -> 0.02 (even), 0.15 * 50% = 0.075 -> 0.08 (even)
    assert.equal(checkout.getDirectPrice(0.05, 50, 'US'), 0.02)
    assert.equal(checkout.getDirectPrice(0.15, 50, 'US'), 0.08)
    // 9.69 * 50% = 4.845 -> 4.84 (even), 9.71 * 50% = 4.855 -> 4.86 (even)
    assert.equal(checkout.getDirectPrice(9.69, 50, 'US'), 4.84)
    assert.equal(checkout.getDirectPrice(9.71, 50, 'US'), 4.86)
    assert.equal(checkout.getDirectPrice(9.69, 0, 'US'), 9.69)
})

test('adds VAT rounded half away from zero', () => {
    // 0.50 * 1.19 = 0.595 -> 0.60 (a half-even rounding would give 0.60 too), 0.10 * 1.25 = 0.125 -> 0.13 (half-even would give 0.12)
    assert.equal(checkout.getDirectPrice(0.5, 0, 'DE'), 0.6)
    assert.equal(checkout.getDirectPrice(0.1, 0, 'HR'), 0.13)
})

test('knows the exact charge only for the EU, the UK and the US', () => {
    assert.equal(checkout.hasExactTax('DE'), true)
    assert.equal(checkout.hasExactTax('gb'), true)
    assert.equal(checkout.hasExactTax('us'), true)
    assert.equal(checkout.hasExactTax('BR'), false)
    assert.equal(checkout.hasExactTax('CH'), false)
    assert.equal(checkout.hasExactTax(undefined), false)
    assert.equal(checkout.isExactCharge(['stripe'], 'DE'), true)
    assert.equal(checkout.isExactCharge([], 'DE'), false)
    assert.equal(checkout.isExactCharge(['stripe'], 'BR'), false)
})

test('every country with an exact charge has a VAT rate or is the US', () => {
    for (const code of Object.keys(pricing.VAT_RATES)) assert.ok(typeof pricing.VAT_RATES[code] === 'number')
    for (const code of ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB'])
        assert.ok(pricing.VAT_RATES[code] > 0, code)
})

test('says (+VAT) unless tax is in the price or a direct checkout adds none', () => {
    assert.equal(checkout.showsVatSuffix('DE', true), false)
    assert.equal(checkout.showsVatSuffix('DE', false), false)
    assert.equal(checkout.showsVatSuffix('US', true), false)
    assert.equal(checkout.showsVatSuffix('US', false), true)
    assert.equal(checkout.showsVatSuffix('BR', false), false)
    assert.equal(checkout.showsVatSuffix('XX', false), true)
    assert.equal(checkout.showsVatSuffix(undefined, false), true)
})

test('keeps the promotion only for providers it is valid for', () => {
    assert.equal(checkout.getPromotionFor(blackFriday, ['stripe']), blackFriday)
    assert.equal(checkout.getPromotionFor(blackFriday, []), null)
    assert.equal(checkout.getPromotionFor({ ...blackFriday, providers: ['paypal'] }, ['stripe']), null)
    assert.equal(checkout.getPromotionFor(null, ['stripe']), null)
})

test('sends the promotion code only to its providers and leaves Lemon Squeezy requests as before', () => {
    const paypalOnly = { ...blackFriday, providers: ['paypal'] }
    assert.equal(checkout.getDiscountCodeFor('BF2026', paypalOnly, 'stripe'), undefined)
    assert.equal(checkout.getDiscountCodeFor('BF2026', paypalOnly, 'paypal'), 'BF2026')
    assert.equal(checkout.getDiscountCodeFor('SAVE20', paypalOnly, 'stripe'), 'SAVE20')
    const legacy = checkout.getCheckoutParams({ provider: 'lemonsqueezy', country: 'DE', creatorCode: 'friend', discountCode: 'SAVE20' })
    assert.deepEqual({ ...legacy }, { assignSlots: undefined, creatorCode: 'friend', discountcode: 'SAVE20' })
    const card = checkout.getCheckoutParams({ provider: 'stripe', country: 'DE', discountCode: 'BF2026', promotion: blackFriday, assignSlots: true })
    assert.deepEqual({ ...card }, { assignSlots: true, creatorCode: undefined, discountcode: 'BF2026', provider: 'stripe', country: 'DE' })
})

test('reads the checkout link in either spelling', () => {
    assert.equal(checkout.getCheckoutLink({ directLink: 'https://a' }), 'https://a')
    assert.equal(checkout.getCheckoutLink({ dirctLink: 'https://b' }), 'https://b')
    assert.equal(checkout.getCheckoutLink({}), null)
})

test('ignores promotions that have not started or have ended', () => {
    const now = new Date('2026-11-20T00:00:00Z')
    assert.equal(checkout.isPromotionRunning(blackFriday, now), true)
    assert.equal(checkout.isPromotionRunning({ ...blackFriday, expiresAt: '2026-11-19T00:00:00Z' }, now), false)
    assert.equal(checkout.isPromotionRunning({ ...blackFriday, startsAt: '2026-11-27T00:00:00Z' }, now), false)
    assert.equal(checkout.isPromotionRunning({ ...blackFriday, code: null }, now), false)
})

test('describes the promotion with its end date and the first payment it covers', () => {
    const describe = (promotion, weeks) => plain(checkout.describePromotion(promotion, weeks, 'UTC'))
    assert.equal(describe(blackFriday), 'Black Friday: up to 50% off your first payment. Offer ends November 30, 11:59 PM UTC.')
    assert.equal(describe(blackFriday, 52), 'Black Friday: 50% off your first payment (the first year). Offer ends November 30, 11:59 PM UTC.')
    assert.equal(describe(blackFriday, 4), 'Black Friday: 25% off your first payment (the first 4 weeks). Offer ends November 30, 11:59 PM UTC.')
    assert.equal(describe({ ...blackFriday, duration: 'forever', expiresAt: null }, 13), 'Black Friday: 50% off every payment.')
})

// regression: "50% off every payment, until November 30" read as if the discount stopped on renewals after that date
test('names the end date as the end of the offer, not of an every-payment discount', () => {
    assert.equal(plain(checkout.describePromotion({ ...blackFriday, duration: 'forever' }, 52, 'UTC')), 'Black Friday: 50% off every payment. Offer ends November 30, 11:59 PM UTC.')
})

// regression: the end was formatted in UTC, so a German visitor read "November 30" for an offer that runs into December 1
test('formats the end of the offer in the viewer time zone, with the time unless it ends at local midnight', () => {
    assert.equal(plain(checkout.describePromotionEnd('2026-11-30T23:59:59Z', 'Europe/Berlin')), 'Offer ends December 1, 12:59 AM GMT+1.')
    assert.equal(plain(checkout.describePromotionEnd('2026-11-30T23:59:59Z', 'America/New_York')), 'Offer ends November 30, 6:59 PM EST.')
    // midnight local is the end of the day before
    assert.equal(checkout.describePromotionEnd('2026-11-30T23:00:00Z', 'Europe/Berlin'), 'Offer runs through November 30.')
    assert.equal(checkout.describePromotionEnd('2026-12-01T00:00:00Z', 'UTC'), 'Offer runs through November 30.')
    assert.equal(plain(checkout.describePromotionEnd('2026-12-01T00:00:00Z', 'Europe/Berlin')), 'Offer ends December 1, 1:00 AM GMT+1.')
    assert.equal(checkout.describePromotionEnd(null), null)
    assert.equal(checkout.describePromotionEnd('not a date'), null)
})

// regression: fixed amounts are cents in the payment backend and were shown as "2500 off"
test('shows fixed amounts in euros', () => {
    assert.equal(checkout.describeFixedAmount(2500), '€25.00 off')
    assert.equal(
        plain(checkout.describePromotion({ ...blackFriday, amountType: 'fixed', amount: 500 }, 4, 'UTC')),
        'Black Friday: €5.00 off your first payment (the first 4 weeks). Offer ends November 30, 11:59 PM UTC.'
    )
})

// regression: the slot checkout said "Includes estimated tax" although a direct checkout's price is the exact charge
test('says "Includes VAT" only for an exact charge and estimates otherwise', () => {
    assert.equal(checkout.getTaxLabel('DE', true), 'Includes VAT')
    assert.equal(checkout.getTaxLabel('de', true), 'Includes VAT')
    assert.equal(checkout.getTaxLabel('DE', false), 'Includes estimated tax')
    assert.equal(checkout.getTaxLabel('US', true), 'No tax added')
    assert.equal(checkout.getTaxLabel('US', false), 'Tax calculated at checkout')
    assert.equal(checkout.getTaxLabel('BR', false), 'Includes estimated tax')
    assert.equal(checkout.getTaxLabel('XX', false), 'Tax calculated at checkout')
    assert.equal(checkout.getTaxLabel(undefined, false), 'Plus VAT where applicable')
})

// regression: an unknown country was priced as the US, without any VAT note
test('notes VAT that is not in the price, and is open about it while the country is unknown', () => {
    assert.equal(checkout.getVatNote('DE', false), '')
    assert.equal(checkout.getVatNote('US', false), '(+VAT)')
    assert.equal(checkout.getVatNote('US', true), '')
    assert.equal(checkout.getVatNote(undefined, false), 'plus VAT where applicable')
    assert.equal(checkout.getVatNote(null, true), 'plus VAT where applicable')
})

// regression: 4-week subscriptions were priced "per month" and a 13-week plan per month as a third of it
test('labels and spreads subscription prices over 4-week periods', () => {
    assert.equal(checkout.getPerPeriodLabel(4), 'per 4 weeks')
    assert.equal(checkout.getEveryPeriodLabel(52), 'every 52 weeks')
    assert.equal(checkout.getPerFourWeeks(96.69, 52), 96.69 / 13)
    assert.equal(checkout.getPerFourWeeks(27.69, 13), 27.69 / 3.25)
    assert.equal(checkout.getPerFourWeeks(9.69, 4), 9.69)
    // 52 weeks for 96.69 instead of 13 x 9.69 = 125.97
    assert.equal(checkout.getSavingsPercent(9.69, 96.69, 52), 23)
    assert.equal(checkout.getSavingsPercent(35.69, 354.2, 52), 23)
    assert.equal(checkout.getSavingsPercent(9.69, 9.69, 4), 0)
    assert.equal(checkout.getSavingsPercent(9.69, 200, 52), 0)
})

// regression: without a provider the backend accepts local codes (the promotion) that the Lemon Squeezy checkout then rejects
test('checks codes for the first direct provider, for Lemon Squeezy once it is the only checkout, and not before the providers are known', () => {
    assert.equal(checkout.getCodeProvider(['stripe', 'paypal'], false), 'stripe')
    assert.equal(checkout.getCodeProvider(['paypal'], true), 'paypal')
    assert.equal(checkout.getCodeProvider([], false), 'lemonsqueezy')
    assert.equal(checkout.getCodeProvider([], true), undefined)
})

// regression: an open page kept showing and sending the promotion after it ended
test('finds the next start or end of a promotion', () => {
    const now = new Date('2026-11-20T00:00:00Z')
    assert.equal(checkout.getNextPromotionChange(blackFriday, now), new Date('2026-11-30T23:59:59Z').getTime())
    assert.equal(checkout.getNextPromotionChange({ ...blackFriday, startsAt: '2026-11-27T00:00:00Z' }, now), new Date('2026-11-27T00:00:00Z').getTime())
    assert.equal(checkout.getNextPromotionChange({ ...blackFriday, expiresAt: '2026-11-19T00:00:00Z' }, now), null)
    assert.equal(checkout.getNextPromotionChange({ ...blackFriday, expiresAt: null }, now), null)
    assert.equal(checkout.getNextPromotionChange(null, now), null)
})

// regression: the plan cards said "per month" for 4-week billing and showed Premium+ as its yearly price over 12 months
test('prices the plan cards per 4 weeks (Starter per 52 weeks) and says when VAT is not included', () => {
    const plus = planPricing.getPlanPrice(PremiumTier.PREMIUM_PLUS, 'US')
    assert.equal(plus.amount, '€27.25')
    assert.equal(plus.unit, '+ VAT per 4 weeks')
    assert.match(plus.note, /every 52 weeks at €354\.20, or €35\.69 every 4 weeks/)
    assert.equal(planPricing.getPlanPrice(PremiumTier.PREMIUM, 'DE').amount, '€11.53')
    assert.equal(planPricing.getPlanPrice(PremiumTier.PREMIUM, 'DE').unit, 'per 4 weeks')
    assert.equal(planPricing.getPlanPrice(PremiumTier.STARTER, 'DE').unit, 'per 52 weeks')
    for (const tier of Object.values(PremiumTier)) {
        const price = planPricing.getPlanPrice(tier, 'DE')
        assert.doesNotMatch(`${price.unit} ${price.note}`, /month/i, tier)
    }
})

// regression: an unknown country was priced as the US
test('prices the plan cards before VAT while the country is unknown', () => {
    const premium = planPricing.getPlanPrice(PremiumTier.PREMIUM, undefined)
    assert.equal(premium.amount, '€9.69')
    assert.equal(premium.unit, 'per 4 weeks, plus VAT where applicable')
})

test('names subscription billing periods in weeks, never as a month', () => {
    const labels = types.getDurationOptions(PremiumTier.PREMIUM, PurchaseType.SUBSCRIPTION).map(option => `${option.label} ${option.desc}`)
    assert.deepEqual([...types.getDurationOptions(PremiumTier.PREMIUM, PurchaseType.SUBSCRIPTION).map(option => option.label)], ['4 weeks', 'Quarterly', 'Yearly'])
    for (const label of labels) assert.doesNotMatch(label, /month/i)
    assert.match(labels[1], /13 weeks/)
    assert.match(labels[2], /52 weeks/)
})
