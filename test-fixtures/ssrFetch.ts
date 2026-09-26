import { skyApiFixtures as data } from './skyApi'
import { forgeFlips } from './forge'

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
    if (path === 'flip/forge') body = forgeFlips
    else if (path === 'craft/profit') body = data.crafts
    else if (path === 'items/bazaar/tags') body = data.bazaarTags
    else if (path === 'items') body = Object.values(data.items)
    else if (path.startsWith('player/b876ec32e396476ba1158438d83c67d4/')) {
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
    if (coveredItem || /^(flip\/forge|craft\/profit|items(?:\/|$)|player\/b876ec32e396476ba1158438d83c67d4\/|auction\/)/.test(path)) {
        throw new Error(`Missing Cypress SSR fixture for ${url.pathname}${url.search}`)
    }
    return undefined
}
