import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const require = createRequire(import.meta.url)
const cypressCli = resolve(dirname(require.resolve('cypress/package.json')), require('cypress/package.json').bin.cypress)
const resultsDirectory = 'test-results/cypress'
rmSync(resultsDirectory, { recursive: true, force: true })

// Each fresh Cypress process must pass. Never retry a failed test into a green build.
for (let run = 1; run <= 3; run++) {
    console.log(`\nCypress stability run ${run}/3`)
    const env = {
        ...process.env,
        TEST_RUNNER: 'true',
        CYPRESS_retries: '0',
        CYPRESS_screenshotsFolder: `${resultsDirectory}/run-${run}/screenshots`,
        CYPRESS_videosFolder: `${resultsDirectory}/run-${run}/videos`,
        CYPRESS_reporter: 'junit',
        CYPRESS_reporterOptions: JSON.stringify({ mochaFile: `${resultsDirectory}/run-${run}/results-[hash].xml` })
    }
    delete env.ELECTRON_RUN_AS_NODE
    const result = spawnSync(process.execPath, [cypressCli, 'run', ...process.argv.slice(2)], { env, stdio: 'inherit' })
    if (result.error) console.error(result.error)
    if (result.status !== 0) process.exit(result.status || 1)
}
console.log('\nAll three Cypress stability runs passed.')
