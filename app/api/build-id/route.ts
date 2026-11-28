import { readFile } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

let cachedBuildId: string | undefined

async function readBuildId(): Promise<string> {
    if (cachedBuildId) return cachedBuildId
    const file = path.join(process.cwd(), process.env.NEXT_DIST_DIR || '.next', 'BUILD_ID')
    cachedBuildId = (await readFile(file, 'utf8')).trim()
    return cachedBuildId
}

// Lets a tab running an older build find out that a newer one is deployed (see isNewerBuildDeployed).
export async function GET() {
    try {
        return new Response(await readBuildId(), {
            headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' }
        })
    } catch {
        return new Response('Build id unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } })
    }
}
