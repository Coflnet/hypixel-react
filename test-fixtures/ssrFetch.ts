import { skyApiFixtures as data } from './skyApi'
import { forgeFlips } from './forge'
import { taskFixtures } from './tasks'

// Called only by the guarded Node instrumentation hook. Match exact public API
// request families used by the historical Cypress routes; an unknown fixture URL
// is an error, so these tests cannot quietly fall back to changing live data.
export function getSsrFixture(input: RequestInfo | URL, init?: RequestInit): Response | undefined {
    const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (!raw.startsWith('https://sky.coflnet.com/api/')) return undefined
    const url = new URL(raw)
    const method = init?.method || (input instanceof Request ? input.method : 'GET')
    if (method !== 'GET') return undefined

    const path = url.pathname.slice('/api/'.length)
    let body: unknown
    if (path === 'flip/stats/player/00000000000040008000000000000001') return Response.json({ message: 'Tracker unavailable' }, { status: 503 })
    else if (path === 'flip/stats/player/00000000000040008000000000000002') body = { flips: [], totalProfit: 0 }
    else if (path === 'flip/forge') body = forgeFlips
    else if (path === 'craft/profit') body = data.crafts
    else if (path === 'tasks') body = taskFixtures.list
    else if (path.startsWith('tasks/')) return getTaskFixture(path.slice('tasks/'.length))
    else if (path === 'items/bazaar/tags') body = data.bazaarTags
    else if (path === 'items') body = Object.values(data.items)
    // a real player (its name still comes from the live api) whose server-side auction load is rate limited
    else if (path === 'player/cd0cc8da7fc148c280893a94e591f991/auctions') {
        return new Response('API calls quota exceeded! maximum admitted 30 per 10s.', { status: 429, headers: { 'Retry-After': '1' } })
    } else if (path.startsWith('player/b876ec32e396476ba1158438d83c67d4/')) {
        const page = url.searchParams.get('page')
        if (path.endsWith('/auctions')) body = page === '0' ? data.playerAuctions : []
        else if (path.endsWith('/bids')) body = page === '0' ? data.playerBids : []
    } else if (path.startsWith('auction/')) {
        const id = path.slice('auction/'.length)
        if (id === '00000000000040008000000000000000') return Response.json({ message: 'Auction not found' }, { status: 404 })
        body = data.auctions[id as keyof typeof data.auctions]
    } else {
        const details = path.match(/^item\/([^/]+)\/details$/)
        const history = path.match(/^item\/price\/([^/]+)\/history\/(day|week|month|year)$/)
        if (details) body = data.items[details[1] as keyof typeof data.items]
        else if (history && history[1] in data.items) body = data.prices
        else if (/^bazaar\/(BOOSTER_COOKIE|ENCHANTMENT_SHARPNESS_6)\/history\/(hour|day|week)$/.test(path)) body = []
    }

    if (body !== undefined) return Response.json(body)
    const coveredItem = Object.keys(data.items).some(tag =>
        path.startsWith(`item/${tag}/`) || path.startsWith(`item/price/${tag}/`) || path.startsWith(`bazaar/${tag}/`)
    )
    if (coveredItem || /^(tasks(?:\/|$)|flip\/forge|craft\/profit|items(?:\/|$)|player\/b876ec32e396476ba1158438d83c67d4\/|auction\/)/.test(path)) {
        throw new Error(`Missing Cypress SSR fixture for ${url.pathname}${url.search}`)
    }
    return undefined
}

function getTaskFixture(path: string): Response {
    const [slug, part, ...rest] = path.split('/')
    if (rest.length > 0 || (part && part !== 'setups')) {
        throw new Error(`Missing Cypress SSR fixture for /api/tasks/${path}`)
    }
    const taskBody = taskFixtures.tasks[slug]
    if (!taskBody) return Response.json({ slug: 'task_not_found', message: 'No task' }, { status: 404 })
    if (!part) return Response.json(taskBody)
    const setups = taskFixtures.setups[slug]
    if (setups) return Response.json(setups)
    return Response.json({ slug: 'gear_setups_not_found', message: 'No setups' }, { status: 404 })
}
