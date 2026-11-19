import { build } from 'esbuild'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Build time step (run by next.mjs before `next build`): writes data/generated/itemTaskSources.json,
 * the item tag to best money-making tasks map shown in the item page FAQ.
 * It lives outside scripts/ because the Dockerfile deletes that folder before building.
 * An unreachable task API only logs a warning and writes an empty map, it never fails the build.
 */
const root = resolve(import.meta.dirname, '..')
const outputPath = resolve(root, 'data/generated/itemTaskSources.json')
const bundlePath = resolve(root, 'node_modules/.cache/item-task-sources/generate.mjs')

async function generateMap() {
    await build({
        entryPoints: [resolve(root, 'utils/ItemTaskSourcesBuild.ts')],
        outfile: bundlePath,
        bundle: true,
        packages: 'external',
        platform: 'node',
        format: 'esm',
        logLevel: 'silent'
    })
    const module = await import(pathToFileURL(bundlePath).href)
    return module.generateItemTaskLinkMap()
}

function writeMap(map) {
    mkdirSync(dirname(outputPath), { recursive: true })
    writeFileSync(outputPath, JSON.stringify(map))
}

export async function generateItemTaskSources() {
    let map = null
    try {
        map = await generateMap()
    } catch (error) {
        console.warn('Could not generate the item task sources:', error)
    }
    if (!map) {
        console.warn('Task API unavailable at build time: item pages will not list task sources')
    }
    writeMap(map ?? {})
    console.log(`Item task sources: ${Object.keys(map ?? {}).length} items`)
}
