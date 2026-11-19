import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function loadModule(path, stubs = {}) {
    const source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
    }).outputText
    const context = { exports: {}, String, Object, Array, require: name => (name in stubs ? stubs[name] : {}) }
    runInNewContext(source, context)
    return context.exports
}

const types = loadModule('../components/Premium/PremiumPurchaseWizard/types.ts')
const { PREMIUM_TYPES } = loadModule('../utils/PremiumTypeUtils.tsx')
const options = loadModule('../utils/PremiumDurationOptions.ts', { '../components/Premium/PremiumPurchaseWizard/types': types })
const { Duration, PremiumTier } = types

const typeOf = productId => PREMIUM_TYPES.find(type => type.productId === productId)
const labelOf = (productId, duration) => options.findOptionOfDuration(typeOf(productId), duration)?.label

// the coins option each tier sells for every wizard duration; undefined: the tier has none
const TABLE = {
    starter_premium: { [Duration.HOUR]: undefined, [Duration.DAY]: '1 day', [Duration.WEEK]: '1 week', [Duration.MONTHLY]: '4 weeks', [Duration.QUARTER]: '6 months', [Duration.YEARLY]: '12 months' },
    premium: { [Duration.HOUR]: undefined, [Duration.DAY]: undefined, [Duration.WEEK]: undefined, [Duration.MONTHLY]: '1 month', [Duration.QUARTER]: '3 month', [Duration.YEARLY]: '1 year' },
    premium_plus: {
        [Duration.HOUR]: '1 hour', [Duration.DAY]: '1 day', [Duration.WEEK]: '1 week', [Duration.MONTHLY]: '4 weeks (2250/week)', [Duration.QUARTER]: '11 weeks (1964/w)', [Duration.YEARLY]: '1 year'
    }
}

test('matches every duration to the option of the tier by its label', () => {
    for (const [productId, row] of Object.entries(TABLE)) {
        for (const [duration, label] of Object.entries(row)) {
            assert.equal(labelOf(productId, duration), label, `${productId} ${duration}`)
        }
    }
})

test('never matches by the raw value: the quarter of Premium+ is 11 weeks, not 3 weeks', () => {
    assert.equal(options.findMatchingPremiumOption(typeOf('premium_plus'), Duration.QUARTER).label, '11 weeks (1964/w)')
})

test('falls back to the first option of a tier that has none of the duration', () => {
    assert.equal(options.findMatchingPremiumOption(typeOf('premium'), Duration.HOUR).label, '1 month')
    assert.equal(options.findMatchingPremiumOption(typeOf('premium'), null).label, '1 month')
})

const upgradeLabel = (tier, duration) => {
    const next = { [PremiumTier.STARTER]: 'premium', [PremiumTier.PREMIUM]: 'premium_plus' }[tier]
    return options.findUpgradeOption(tier, typeOf(next), duration)?.label
}

test('advertises the next tier option of the same duration across tiers', () => {
    assert.equal(upgradeLabel(PremiumTier.PREMIUM, Duration.QUARTER), '11 weeks (1964/w)')
    assert.equal(upgradeLabel(PremiumTier.PREMIUM, Duration.MONTHLY), '4 weeks (2250/week)')
    assert.equal(upgradeLabel(PremiumTier.PREMIUM, Duration.YEARLY), '1 year')
    assert.equal(upgradeLabel(PremiumTier.STARTER, Duration.MONTHLY), '1 month')
    assert.equal(upgradeLabel(PremiumTier.STARTER, Duration.YEARLY), '1 year')
})

test('advertises nothing where the next tier has no such length', () => {
    assert.equal(upgradeLabel(PremiumTier.STARTER, Duration.QUARTER), undefined, "Starter's half year has no Premium counterpart")
    assert.equal(upgradeLabel(PremiumTier.STARTER, Duration.DAY), undefined)
    assert.equal(upgradeLabel(PremiumTier.STARTER, Duration.WEEK), undefined)
    assert.equal(options.findUpgradeOption(PremiumTier.PREMIUM_PLUS, undefined, Duration.YEARLY), undefined)
})
