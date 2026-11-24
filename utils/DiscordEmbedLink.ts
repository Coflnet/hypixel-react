import { CANONICAL_DOMAIN } from './SSRUtils'
import { formatFilterValue } from './EmbedUtils'

/*
 Where a page links its Discord component embed JSON. Discord only follows the link to the page's own host,
 a subdomain or its parent domain, so sibling hosts (skyblock.coflnet.com, sky-commands.coflnet.com) link their own host.
 The Host header is only trusted for our domains; anything else (a forged header) falls back to the canonical domain.
*/

export const DISCORD_EMBED_ROUTE = '/discord-embed'

const COFLNET_HOST = /^([a-z0-9-]+\.)*coflnet\.com$/
const LOCAL_HOST = /^(localhost|127\.0\.0\.1)(:\d{1,5})?$/

export function getDiscordEmbedOrigin(host: string | null | undefined, allowLocalhost: boolean): string {
    const normalized = host?.trim().toLowerCase()
    if (!normalized) {
        return CANONICAL_DOMAIN
    }
    if (COFLNET_HOST.test(normalized)) {
        return `https://${normalized}`
    }
    return allowLocalhost && LOCAL_HOST.test(normalized) ? `http://${normalized}` : CANONICAL_DOMAIN
}

/** The embed route of a page, e.g. ['player', uuid, 'flips'] → https://sky.coflnet.com/discord-embed/player/<uuid>/flips */
export function getDiscordEmbedHref(origin: string, segments: string[], search?: string): string {
    const path = segments.map(segment => encodeURIComponent(segment)).join('/')
    return `${origin}${DISCORD_EMBED_ROUTE}/${path}${search ? `?${search}` : ''}`
}

/** The query string of Next's searchParams object (repeated keys keep all values) */
export function toSearchString(searchParams?: Record<string, string | string[] | undefined> | null): string {
    const params = new URLSearchParams()
    Object.entries(searchParams || {}).forEach(([key, value]) => {
        const values = Array.isArray(value) ? value : [value]
        values.filter((entry): entry is string => typeof entry === 'string').forEach(entry => params.append(key, entry))
    })
    return params.toString()
}

// ----- embed route input -----

export type SearchParamsObject = Record<string, string | string[]>

const PLAYER_UUID = /^[0-9a-f]{32}$|^[0-9a-f-]{36}$/i
// flip uids are signed 64-bit numbers written with toString(16), so negative ones start with '-'
const FLIP_UID = /^-?[0-9a-f]{1,16}$/i
// real tags use letters, digits, _ : - (LOG_2:2, PET_ITEM_X-2); route params arrive percent-decoded, so no / ? # % may pass
const ITEM_TAG = /^[A-Za-z0-9_:;+.-]{1,100}$/
const ONLY_DOTS = /^\.+$/

export function isValidPlayerUuid(value: string): boolean {
    return PLAYER_UUID.test(value)
}

export function isValidFlipUid(value: string): boolean {
    return FLIP_UID.test(value)
}

export function isValidItemTag(value: string): boolean {
    return ITEM_TAG.test(value) && !ONLY_DOTS.test(value)
}

/** Like Next's page searchParams: a repeated key becomes an array */
export function searchParamsToObject(search: URLSearchParams): SearchParamsObject {
    const result: SearchParamsObject = {}
    search.forEach((value, key) => {
        const existing = result[key]
        if (existing === undefined) {
            result[key] = value
            return
        }
        result[key] = Array.isArray(existing) ? [...existing, value] : [existing, value]
    })
    return result
}

function toFilterParam(value: unknown): string | string[] {
    return typeof value === 'string' || Array.isArray(value) ? value : formatFilterValue(value)
}

/**
 * The item page params an embed is built from: the range and only the filter keys the item knows.
 * Tracking params (fbclid, utm_source) would otherwise reach the price service as filters and make it fail.
 */
export function getEmbedItemSearchParams(searchParams: SearchParamsObject, knownFilter: ItemFilter | null): SearchParamsObject {
    const range = searchParams.range
    const filterEntries = Object.entries(knownFilter || {}).map(([key, value]) => [key, toFilterParam(value)])
    return Object.fromEntries([...(isValidItemRange(range) ? [['range', range]] : []), ...filterEntries])
}

const ITEM_RANGES = ['active', 'hour', 'day', 'week', 'month', 'year', 'full']

/** The price ranges the item page knows; anything else falls back to its default and must not end up in a link */
export function isValidItemRange(range: unknown): range is string {
    return typeof range === 'string' && ITEM_RANGES.includes(range)
}
