import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const targetPath = resolve(process.cwd(), 'api/_generated/skyApi.ts')
const helperMarker = 'const parseGeneratedResponseBody = (body: string | null): any => {'
const helperBlock = `${helperMarker}\n  if (!body) {\n    return {}\n  }\n\n  try {\n    return JSON.parse(body)\n  } catch {\n    return body\n  }\n}\n`

const original = readFileSync(targetPath, 'utf8')

const withoutHelper = original.replace(
  /\nconst parseGeneratedResponseBody = \(body: string \| null\): any => \{[\s\S]*?\n\}\n/,
  '\n'
)

if (!withoutHelper.includes("} from './skyApi.schemas';")) {
  throw new Error('Could not find schema import boundary in generated skyApi.ts')
}

const withHelper = withoutHelper.replace(
  "} from './skyApi.schemas';\n",
  `} from './skyApi.schemas';\n\n\n${helperBlock}\n`
)

const replaced = withHelper.replaceAll('body ? JSON.parse(body) : {}', 'parseGeneratedResponseBody(body)')

if (!replaced.includes(helperMarker)) {
  throw new Error('Failed to inject parseGeneratedResponseBody into generated skyApi.ts')
}

if (!replaced.includes('parseGeneratedResponseBody(body)')) {
  throw new Error('Failed to replace generated JSON body parsing in skyApi.ts')
}

writeFileSync(targetPath, replaced)

console.log('Postprocessed api/_generated/skyApi.ts for safe JSON-or-text response parsing.')
