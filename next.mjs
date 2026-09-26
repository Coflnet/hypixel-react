import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const command = process.argv[2]
if (process.env.TEST_RUNNER === 'true' && (command === 'build' || command === 'start')) {
    process.env.CYPRESS_SSR_FIXTURES = '1'
    if (command === 'build') {
        const check = spawnSync(process.execPath, [fileURLToPath(new URL('./scripts/check-ssr-fixtures.mjs', import.meta.url))], {
            stdio: 'inherit', env: process.env
        })
        if (check.error) throw check.error
        if (check.status !== 0) process.exit(check.status || 1)
    }
}

const require = createRequire(import.meta.url)
process.argv[1] = require.resolve('next/dist/bin/next')
require('next/dist/bin/next')
