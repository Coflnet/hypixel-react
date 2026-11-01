import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { readdirSync, readFileSync, rmSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'

// One full Cypress pass, preceded by a burn-in of the specs changed since a base commit (or importing a
// changed support module): each must also pass BURN_IN_RUNS more times in fresh Cypress processes.
// New or edited tests are where flakes come from, so they are repeated; the rest runs once.
//
//   node scripts/verify-cypress.mjs [--burn-in-base <git ref>] [extra cypress run args]
//
// The base can also come from BURN_IN_BASE (CI sets it), the repeat count from BURN_IN_RUNS.
// Without a base only the full pass runs.
// Never retry a failed test into a green build: every run has retries disabled.

const BURN_IN_RUNS = burnInRuns()
const SPEC_DIRECTORY = 'cypress/e2e'
const SPEC_PATTERN = /\.cy\.[jt]sx?$/
const SUPPORT_PATTERN = /^cypress\/support\/.+\.[jt]sx?$/
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

function burnInRuns() {
    const runs = Number(process.env.BURN_IN_RUNS || 2)
    if (Number.isInteger(runs) && runs >= 0) return runs
    throw new Error(`BURN_IN_RUNS must be a whole number, got "${process.env.BURN_IN_RUNS}"`)
}

function allSpecs() {
    return readdirSync(SPEC_DIRECTORY, { recursive: true })
        .map(file => join(SPEC_DIRECTORY, file))
        .filter(file => SPEC_PATTERN.test(file))
}

// e2e.ts runs before every spec; burning in the whole suite for it would undo the savings.
function specsImportingSupport(supportFiles) {
    const modules = supportFiles.map(file => `support/${basename(file).replace(/\.[jt]sx?$/, '')}'`)
    if (!modules.length) return []
    return allSpecs().filter(spec => modules.some(module => readFileSync(spec, 'utf8').includes(module)))
}

// Specs added or modified between the base and HEAD, plus specs importing a changed support module.
// Deleted files are left out, they cannot run.
function changedSpecs(base) {
    if (!base) return []
    git(['rev-parse', '--verify', '--quiet', `${base}^{commit}`])
    const files = git(['diff', '--name-only', '--diff-filter=d', base, 'HEAD', '--', 'cypress']).split('\n')
    const specs = files.filter(file => file.startsWith(`${SPEC_DIRECTORY}/`) && SPEC_PATTERN.test(file))
    const importers = specsImportingSupport(files.filter(file => SUPPORT_PATTERN.test(file)))
    return [...new Set([...specs, ...importers])].sort()
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
