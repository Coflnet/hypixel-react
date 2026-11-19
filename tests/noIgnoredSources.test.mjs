import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

// A source file matched by a .gitignore rule exists on the developer's disk, so the app builds locally,
// but it is never committed, so CI and the Docker build fail on the missing import.
// Example: the broad `data/` rule once swallowed components/PremiumLanding/data/.

const SOURCE_DIRECTORIES = ['app', 'components', 'utils', 'hooks', 'api', 'cypress', 'tests']
const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))

function git(args) {
    return spawnSync('git', args, { cwd: repositoryRoot, encoding: 'utf8' })
}

/** true when the app is the root of its own git work tree (not e.g. a copy inside another repository) */
function isOwnWorkTree() {
    const result = git(['rev-parse', '--show-toplevel'])
    if (result.error || result.status !== 0) return false
    return realpathSync(result.stdout.trim()) === realpathSync(repositoryRoot)
}

function listIgnoredSourceFiles() {
    const result = git(['ls-files', '--others', '--ignored', '--exclude-standard', '--', ...SOURCE_DIRECTORIES])
    assert.equal(result.status, 0, `git ls-files failed: ${result.stderr}`)
    return result.stdout.split('\n').filter(line => line.length > 0)
}

test('no source file is hidden by a .gitignore rule', t => {
    if (!isOwnWorkTree()) {
        t.skip('git or the app\'s own git work tree is not available')
        return
    }
    const ignored = listIgnoredSourceFiles()
    assert.deepEqual(
        ignored,
        [],
        `These source files are matched by a .gitignore rule, so they would never be committed and CI would fail ` +
            `on the missing files (check with \`git check-ignore -v <file>\`, then rename the folder or narrow the rule):\n` +
            ignored.map(file => `  ${file}`).join('\n')
    )
})
