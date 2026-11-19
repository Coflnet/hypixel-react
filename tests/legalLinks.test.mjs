import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function loadModule(path) {
    const source = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
    }).outputText
    const context = { exports: {}, require: () => ({}) }
    runInNewContext(source, context)
    return context.exports
}

const legal = loadModule('../utils/LegalLinks.ts')

// regression: sky.coflnet.com did not link to the legally required contract cancellation page (§ 312k BGB)
test('links the contract cancellation page in German for German browsers and in English otherwise', () => {
    assert.equal(legal.getLegalLocaleOf('de-DE'), 'de')
    assert.equal(legal.getLegalLocaleOf('DE'), 'de')
    assert.equal(legal.getLegalLocaleOf('en-US'), 'en')
    assert.equal(legal.getLegalLocaleOf(undefined), 'en')
    assert.equal(legal.getCancelContractUrl('en'), 'https://coflnet.com/cancel-contract')
    assert.equal(legal.getCancelContractUrl('de'), 'https://coflnet.com/de/cancel-contract')
    assert.equal(legal.getCancelContractLabel('en'), 'Cancel contracts here')
    assert.equal(legal.getCancelContractLabel('de'), 'Verträge hier kündigen')
})
