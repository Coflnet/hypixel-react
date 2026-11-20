import { resolveDiscordEmbed } from './resolveEmbed'

// The Discord component embed JSON the pages link with <link rel="discord:component-embed"> (see DiscordEmbedLink)
export const dynamic = 'force-dynamic'

// Discord caches embeds itself; a shared cache keeps repeated crawls of a popular link off the backend
const SUCCESS_CACHE_CONTROL = 'public, max-age=300, s-maxage=300'

interface RouteContext {
    params: Promise<{ path: string[] }>
}

export async function GET(request: Request, context: RouteContext) {
    const { path } = await context.params
    const payload = await resolveOrNull(path, new URL(request.url).searchParams)
    if (!payload) {
        // nothing is cached for a failed or empty load, so the next crawl tries again
        return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } })
    }
    return new Response(JSON.stringify(payload), {
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': SUCCESS_CACHE_CONTROL }
    })
}

// loaders signal unknown players and items with notFound()/redirect(), which only pages handle
async function resolveOrNull(path: string[], search: URLSearchParams) {
    try {
        return await resolveDiscordEmbed(path, search)
    } catch (e) {
        console.error(`Error building the Discord embed of /${path.join('/')}. ${e instanceof Error ? e.message : JSON.stringify(e)}`)
        return null
    }
}
