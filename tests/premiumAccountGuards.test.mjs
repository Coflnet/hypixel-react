import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function loadModule(path, stubs = {}) {
    const source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX }
    }).outputText
    const context = { exports: {}, Date, Math, Array, Set, URLSearchParams, require: name => (name in stubs ? stubs[name] : {}) }
    runInNewContext(source, context)
    return context.exports
}

const types = loadModule('../components/Premium/PremiumPurchaseWizard/types.ts')
const wizardFlow = loadModule('../components/Premium/PremiumPurchaseWizard/wizardFlow.ts', { './types': types })
const upgrade = loadModule('../utils/PremiumUpgradeUtils.tsx', { '../components/Premium/PremiumPurchaseWizard/types': types })
const overlay = loadModule('../utils/BottomOverlay.ts')
const { PremiumTier } = types

const owner = { forFriends: false, hasPremium: true, isOwnerPurchase: true, currentTier: PremiumTier.PREMIUM }

// regression: an owner who chose "Extend" and then picked a higher tier still read "Extend Premium"
test('names the wizard after the tier chosen in it: extend the own tier, upgrade to a higher one', () => {
    assert.equal(wizardFlow.getPurchaseHeading({ ...owner, tier: PremiumTier.PREMIUM }), 'Extend Premium')
    assert.equal(wizardFlow.getPurchaseHeading({ ...owner, tier: PremiumTier.PREMIUM_PLUS }), 'Upgrade Premium')
    assert.equal(wizardFlow.getPurchaseHeading({ ...owner, tier: null }), 'Upgrade Premium')
    assert.equal(wizardFlow.getPurchaseHeading({ ...owner, hasPremium: false, tier: PremiumTier.PREMIUM }), 'Get Premium')
    assert.equal(wizardFlow.getPurchaseHeading({ ...owner, isOwnerPurchase: false, tier: PremiumTier.PREMIUM }), 'Get Premium')
    assert.equal(wizardFlow.getPurchaseHeading({ ...owner, forFriends: true, tier: PremiumTier.PREMIUM }), 'Get slots')
})

const renewing = { externalId: 'a', endsAt: null, productName: 'premium', renewsAt: '2099-02-01T00:00:00Z' }

// regression: "Extend with a subscription" started a second subscription of the same tier without a word about the first
test('finds the renewing subscription of the own tier that another one would be billed on top of', () => {
    assert.equal(upgrade.findRenewingSubscription([renewing], PremiumTier.PREMIUM), renewing)
    assert.equal(upgrade.findRenewingSubscription([renewing], PremiumTier.PREMIUM_PLUS), undefined)
    assert.equal(upgrade.findRenewingSubscription([{ ...renewing, endsAt: '2099-01-15T00:00:00Z' }], PremiumTier.PREMIUM), undefined)
    assert.equal(upgrade.findRenewingSubscription([{ ...renewing, productName: 'Premium 4 slots, 4 weeks', slotCount: 4 }], PremiumTier.PREMIUM), undefined)
    assert.equal(upgrade.findRenewingSubscription([renewing], null), undefined)
})

test('reads the tier of a subscription from its slug or its title', () => {
    assert.equal(upgrade.getTierOfSubscription({ productName: 'premium_plus' }), PremiumTier.PREMIUM_PLUS)
    assert.equal(upgrade.getTierOfSubscription({ productName: 'Premium+ 4 weeks' }), PremiumTier.PREMIUM_PLUS)
    assert.equal(upgrade.getTierOfSubscription({ productName: 'Premium, 4 weeks' }), PremiumTier.PREMIUM)
    assert.equal(upgrade.getTierOfSubscription({ productName: 'starter_premium' }), PremiumTier.STARTER)
    assert.equal(upgrade.getTierOfSubscription({ productName: '' }), null)
})

// regression: the cookie banner and the anchor ad covered the footer's contract cancellation link
test('measures how far the fixed bottom bars cover the window', () => {
    const viewport = 800
    assert.equal(overlay.getCoveredHeight([], viewport), 0)
    assert.equal(overlay.getCoveredHeight([{ top: 720, bottom: 800, height: 80 }], viewport), 80)
    // the taller of a cookie banner and an ad
    assert.equal(overlay.getCoveredHeight([{ top: 720, bottom: 800, height: 80 }, { top: 649.5, bottom: 800, height: 150.5 }], viewport), 151)
    // closed (no size) or not at the bottom edge
    assert.equal(overlay.getCoveredHeight([{ top: 800, bottom: 800, height: 0 }, { top: 0, bottom: 60, height: 60 }], viewport), 0)
})
