import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

// One full Cypress pass, preceded by a burn-in of the specs changed since a base commit: each changed
// spec must also pass BURN_IN_RUNS more times in fresh Cypress processes. New or edited tests are where
// flakes come from, so they are repeated; the rest of the suite runs once instead of three times.
//
//   node scripts/verify-cypress.mjs [--burn-in-base <git ref>] [extra cypress run args]
//
// The base can also come from BURN_IN_BASE (CI sets it), the repeat count from BURN_IN_RUNS.
// Without a base only the full pass runs.
// Never retry a failed test into a green build: every run has retries disabled.

const BURN_IN_RUNS = Number(process.env.BURN_IN_RUNS || 2)
const SPEC_PATTERN = /^cypress\/e2e\/.+\.cy\.[jt]sx?$/
const resultsDirectory = 'test-results/cypress'

const require = createRequire(import.meta.url)
const cypressCli = resolve(dirname(require.resolve('cypress/package.json')), require('cypress/package.json').bin.cypress)

function parseArguments(argv) {
    const index = argv.indexOf('--burn-in-base')
    if (index === -1) return { base: process.env.BURN_IN_BASE || '', cypressArgs: argv }
    return { base: argv[index + 1] || '', cypressArgs: [...argv.slice(0, index), ...argv.slice(index + 2)] }
}

function git(args) {
    const result = spawnSync('git', args, { encoding: 'utf8' })
    if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed: ${result.stderr || result.error || `exit code ${result.status}`}`)
    return result.stdout
}

// Specs added or modified between the base and HEAD. Deleted specs are left out, they cannot run.
function changedSpecs(base) {
    if (!base) return []
    git(['rev-parse', '--verify', '--quiet', `${base}^{commit}`])
    const files = git(['diff', '--name-only', '--diff-filter=d', base, 'HEAD', '--', 'cypress/e2e'])
    return files.split('\n').filter(file => SPEC_PATTERN.test(file))
}

function runCypress(name, cypressArgs) {
    console.log(`\nCypress ${name}`)
    const output = `${resultsDirectory}/${name}`
    const env = {
        ...process.env,
        TEST_RUNNER: 'true',
        CYPRESS_retries: '0',
        CYPRESS_screenshotsFolder: `${output}/screenshots`,
        CYPRESS_videosFolder: `${output}/videos`,
        CYPRESS_reporter: 'junit',
        CYPRESS_reporterOptions: JSON.stringify({ mochaFile: `${output}/results-[hash].xml` })
    }
    delete env.ELECTRON_RUN_AS_NODE
    const result = spawnSync(process.execPath, [cypressCli, 'run', ...cypressArgs], { env, stdio: 'inherit' })
    if (result.error) console.error(result.error)
    if (result.status !== 0) process.exit(result.status || 1)
}

function main() {
    const { base, cypressArgs } = parseArguments(process.argv.slice(2))
    const specs = changedSpecs(base)
    rmSync(resultsDirectory, { recursive: true, force: true })

    if (base) console.log(`Specs changed since ${base}: ${specs.length ? specs.join(', ') : 'none'}`)
    // The burn-in runs first, so a flaky new test fails the job before the whole suite has run.
    for (let run = 1; specs.length && run <= BURN_IN_RUNS; run++) {
        runCypress(`burn-in-${run}`, [...cypressArgs, '--spec', specs.join(',')])
    }
    runCypress('full', cypressArgs)
    console.log(`\nThe full Cypress pass passed${specs.length ? `, changed specs passed ${BURN_IN_RUNS + 1} times` : ''}.`)
}

main()
