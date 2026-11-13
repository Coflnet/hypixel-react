import { getApiTasks, getApiTasksSlug, getApiTasksSlugSetups } from './_generated/skyApi'
import type { ErrorResponse, PublicAcquisition, PublicAcquisitionUpgrade, PublicCheapestBase, PublicDirectPurchase, PublicGearSpec, PublicGrindRequirement, PublicGearItem, PublicGearSetup, PublicModifierEffect, PublicTaskDrop, PublicTaskEstimate, PublicTaskRequirement, PublicTaskSetups, PublicTaskStep } from './_generated/skyApi.schemas'
import { getViewAuctionCommand } from '../utils/viewAuctionCommand'

/**
 * Server side loaders for the public money-making task estimates (`GET /api/tasks[/{slug}]`), built on the generated client.
 * Every call is cached for 10 minutes and never throws: callers decide between an empty state and an error.
 */

/** A drop that can be linked, i.e. has an item tag. */
export type PublicTaskItemDrop = PublicTaskDrop & { itemTag: string }

/** A requirement with its label set. */
export type PublicTaskLabeledRequirement = PublicTaskRequirement & { label: string }

/** A step with instruction text. */
export type PublicTaskTextStep = PublicTaskStep & { text: string }

/** A task after {@link normalizeTask}: the fields the pages render are always set and links are https only. */
export type PublicTask = PublicTaskEstimate & {
    name: string
    slug: string
    category: string
    wikiUrl?: string
    whereWikiUrl?: string
    steps: PublicTaskTextStep[]
    drops: PublicTaskItemDrop[]
    requirements: PublicTaskLabeledRequirement[]
    bestZones: NonNullable<PublicTaskEstimate['bestZones']>
}

export type PublicTaskResult = { status: 'ok'; task: PublicTask } | { status: 'notFound' } | { status: 'error' }

const REVALIDATE_SECONDS = 600
const TIMEOUT_MS = 8000

/** Error slug SkyApi returns for an unknown task; any other 404 (missing route, gateway) is an outage. */
const TASK_NOT_FOUND_SLUG = 'task_not_found'

function getRequestOptions(): RequestInit {
    return {
        headers: { Accept: 'application/json' },
        next: { revalidate: REVALIDATE_SECONDS },
        signal: AbortSignal.timeout(TIMEOUT_MS)
    }
}

/**
 * Loads all public task estimates, sorted by coins per hour descending.
 * @returns The tasks, or null when the endpoint is unreachable or returns an error
 */
export async function getPublicTasks(): Promise<PublicTask[] | null> {
    try {
        const res = await getApiTasks(getRequestOptions())
        if (res.status !== 200 || !Array.isArray(res.data)) {
            return null
        }
        return res.data
            .filter(hasSlug)
            .map(normalizeTask)
            .sort((a, b) => b.coinsPerHour - a.coinsPerHour)
    } catch (error) {
        console.error('Failed to load public tasks', error)
        return null
    }
}

/**
 * Loads one task estimate by slug.
 * @returns ok with the task, notFound for an unknown slug, error when the endpoint failed
 */
export async function getPublicTask(slug: string): Promise<PublicTaskResult> {
    try {
        // the generated url builder interpolates the slug as is
        const res = await getApiTasksSlug(encodeURIComponent(slug), getRequestOptions())
        if (res.status === 404) {
            return isTaskNotFound(res.data) ? { status: 'notFound' } : { status: 'error' }
        }
        if (res.status !== 200 || !hasSlug(res.data)) {
            return { status: 'error' }
        }
        return { status: 'ok', task: normalizeTask(res.data) }
    } catch (error) {
        console.error(`Failed to load public task ${slug}`, error)
        return { status: 'error' }
    }
}

/** The generated client hands back non-JSON bodies as text, so the body may be anything. */
function isTaskNotFound(body: unknown): boolean {
    return (body as ErrorResponse | undefined)?.slug === TASK_NOT_FOUND_SLUG
}

function hasSlug(task: unknown): task is PublicTaskEstimate & { slug: string } {
    const slug: unknown = (task as PublicTaskEstimate | undefined)?.slug
    return typeof slug === 'string' && slug.length > 0
}

function hasText(step: PublicTaskStep): step is PublicTaskTextStep {
    return !!step.text
}

function hasLabel(requirement: PublicTaskRequirement): requirement is PublicTaskLabeledRequirement {
    return !!requirement?.label
}

function hasItemTag(drop: PublicTaskDrop): drop is PublicTaskItemDrop {
    return !!drop.itemTag
}

/** Only https links from the API may end up in an href. */
function toSafeHttpsUrl(url?: string | null): string | undefined {
    if (!url) {
        return undefined
    }
    try {
        return new URL(url).protocol === 'https:' ? url : undefined
    } catch {
        return undefined
    }
}

/** Guards against missing arrays/numbers and unsafe links so the render code does not have to. */
function normalizeTask(task: PublicTaskEstimate & { slug: string }): PublicTask {
    return {
        ...task,
        name: task.name || task.slug,
        wikiUrl: toSafeHttpsUrl(task.wikiUrl),
        whereWikiUrl: toSafeHttpsUrl(task.whereWikiUrl),
        category: task.category || 'Other',
        coinsPerHour: task.coinsPerHour ?? 0,
        communityTrackedHours: task.communityTrackedHours ?? 0,
        contributors: task.contributors ?? 0,
        currentDoers: task.currentDoers ?? 0,
        doersChange20m: task.doersChange20m ?? 0,
        steps: (task.steps ?? []).filter(hasText),
        drops: (task.drops ?? []).filter(hasItemTag),
        requirements: (task.requirements ?? []).filter(hasLabel),
        bestZones: task.bestZones ?? []
    }
}

/** A gear piece that can be linked, i.e. has an item tag. */
export type PublicGearTaggedItem = Omit<PublicGearItem, 'itemTag'> & { itemTag: string }

/** A setup after {@link normalizeSetups}: arrays are always set, sources are https only and items have tags. */
export type PublicTaskGearSetup = Omit<PublicGearSetup, 'items' | 'id' | 'name' | 'assumptions' | 'sources' | 'locked'> & {
    id: string
    name: string
    /** Locked setups never carry numbers, whatever the API sent. */
    locked: boolean
    assumptions: string[]
    sources: string[]
    items: PublicGearTaggedItem[]
}

export type PublicTaskGearSetups = Omit<PublicTaskSetups, 'baseline' | 'setups'> & {
    baseline?: PublicTaskGearSetup
    setups: PublicTaskGearSetup[]
}

/**
 * Loads the gear setups of a task: names for everyone, numbers for the free tiers (the rest is premium and loaded client side).
 * Never throws: null when the task has no setups (404) or on any failure, so the page just hides the section.
 */
export async function getPublicTaskSetups(slug: string): Promise<PublicTaskGearSetups | null> {
    try {
        const res = await getApiTasksSlugSetups(encodeURIComponent(slug), getRequestOptions())
        if (res.status !== 200) {
            return null
        }
        return normalizeSetups(res.data, { details: false })
    } catch (error) {
        console.error(`Failed to load gear setups of ${slug}`, error)
        return null
    }
}

function hasGearItemTag(item: PublicGearItem): item is PublicGearTaggedItem {
    return !!item?.itemTag
}

function hasHttpsSource(url: unknown): url is string {
    return typeof url === 'string' && !!toSafeHttpsUrl(url)
}

const ITEM_NUMBER_KEYS = ['buyPrice', 'resaleValue', 'stability', 'cv', 'trendPerWeek', 'p10', 'volumePerDay', 'modifiersMeasured', 'owned', 'priceLowerBound'] as const
const SETUP_NUMBER_KEYS = [
    'coinsPerHour', 'deltaCoinsPerHour', 'multiplier', 'buyCost', 'resaleValue', 'borrowCost', 'resaleRatio',
    'paybackHoursBorrow', 'paybackHoursFull', 'paybackTooLong', 'netGain10h', 'netGain50h', 'stability', 'priceIncomplete', 'noProfitGain',
    'basis', 'players', 'playersAtLeast', 'playersLabel', 'observations', 'observationsLabel', 'hours', 'commonP25', 'commonP75', 'priceLowerBound'
] as const

/** Strings, numbers, booleans and null: nothing that could carry nested unknown data into the page payload. */
function isPrimitive(value: unknown): boolean {
    return value !== undefined && (value === null || typeof value !== 'object') && typeof value !== 'function'
}

function prim<T>(value: T): T {
    return isPrimitive(value) ? value : (undefined as T)
}

function pick<T extends object, K extends keyof T>(source: T, keys: readonly K[]): Pick<T, K> {
    const result = {} as Pick<T, K>
    keys.forEach(key => {
        if (isPrimitive(source[key])) {
            result[key] = source[key]
        }
    })
    return result
}

/** Only known fields are copied, numbers only for unlocked setups, so nothing else ends up in the page payload. */
function normalizeItem(item: PublicGearTaggedItem, locked: boolean): PublicGearTaggedItem {
    const names = pick(item, ['slot', 'itemTag', 'itemName', 'reason', 'tradeable'] as const)
    if (locked) {
        return { ...names, tradeable: item.tradeable !== false }
    }
    return { ...names, tradeable: item.tradeable !== false, ...pick(item, ITEM_NUMBER_KEYS), spec: normalizeSpec(item.spec), ...normalizeAcquisition(item.acquisition) }
}

const NUMBER_RECORD = 'number'
const STRING_RECORD = 'string'

/** A plain object whose values all have the given type, everything else is dropped. */
function typedRecord<T>(value: unknown, type: typeof NUMBER_RECORD | typeof STRING_RECORD): Record<string, T> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return undefined
    }
    const entries = Object.entries(value).filter(([, v]) => typeof v === type || (type === STRING_RECORD && v === null))
    return Object.fromEntries(entries) as Record<string, T>
}

function normalizeSpec(spec?: PublicGearSpec | null): PublicGearSpec | undefined {
    if (!spec || typeof spec !== 'object') {
        return undefined
    }
    return {
        ...pick(spec, ['rarity', 'reforge', 'stars', 'hotPotatoCount', 'recombobulated', 'itemType', 'petLevel', 'heldItem'] as const),
        enchants: typedRecord<number>(spec.enchants, NUMBER_RECORD),
        gems: typedRecord<string>(spec.gems, STRING_RECORD),
        parts: typedRecord<string>(spec.parts, STRING_RECORD),
        counters: typedRecord<number>(spec.counters, NUMBER_RECORD),
        applied: typedRecord<number>(spec.applied, NUMBER_RECORD),
        stats: typedRecord<number>(spec.stats, NUMBER_RECORD)
    }
}

function normalizeObjects<T extends object, R>(value: T[] | null | undefined, map: (item: T) => R): R[] {
    return arrayOrEmpty(value).filter(v => !!v && typeof v === 'object').map(map)
}

function normalizeUpgrade(u: PublicAcquisitionUpgrade): PublicAcquisitionUpgrade {
    return { ...pick(u, ['kind', 'name', 'fromLevel', 'toLevel', 'itemTag'] as const), amount: prim(u.amount), cost: prim(u.cost), priced: prim(u.priced) }
}

function normalizeGrind(g: PublicGrindRequirement): PublicGrindRequirement {
    return { ...pick(g, ['kind', 'name'] as const), have: prim(g.have), need: prim(g.need), deficit: prim(g.deficit) }
}

function normalizeDirect(direct?: PublicDirectPurchase | null): PublicDirectPurchase | undefined {
    if (!direct || typeof direct !== 'object') {
        return undefined
    }
    return { price: prim(direct.price), auctionUuid: prim(direct.auctionUuid), command: getViewAuctionCommand(direct.command) }
}

function normalizeBase(base?: PublicCheapestBase | null): PublicCheapestBase | undefined {
    if (!base || typeof base !== 'object') {
        return undefined
    }
    return {
        auctionUuid: prim(base.auctionUuid),
        command: getViewAuctionCommand(base.command),
        basePrice: prim(base.basePrice),
        total: prim(base.total),
        incomplete: prim(base.incomplete),
        upgrades: normalizeObjects(base.upgrades, normalizeUpgrade),
        grindRequired: normalizeObjects(base.grindRequired, normalizeGrind)
    }
}

/** A strict whitelist at every level. Buy commands are only kept when they are a plain `/viewauction <uuid>`, they get copied and sent to the game. */
function normalizeAcquisition(acquisition?: PublicAcquisition | null): { acquisition?: PublicAcquisition } {
    if (!acquisition || typeof acquisition !== 'object') {
        return {}
    }
    return {
        acquisition: {
            ...pick(acquisition, ['cost', 'costSource', 'directUnavailableReason', 'baseUnavailableReason'] as const),
            direct: normalizeDirect(acquisition.direct),
            cheapestBase: normalizeBase(acquisition.cheapestBase)
        }
    }
}

function arrayOrEmpty<T>(value?: T[] | null): T[] {
    return Array.isArray(value) ? value : []
}

function normalizeEffects(effects?: PublicModifierEffect[] | null): PublicModifierEffect[] {
    return arrayOrEmpty(effects).filter(e => !!e && Array.isArray(e.changes) && e.changes.length > 0 && typeof e.percentChange === 'number')
}

function normalizeSetup(setup: PublicGearSetup, fallbackId: string, details: boolean): PublicTaskGearSetup | null {
    const items = (Array.isArray(setup?.items) ? setup.items : []).filter(hasGearItemTag)
    if (items.length === 0 && !(setup?.locked === true && setup.tier === 'endgame' && setup.requiredTier === 'premium_plus')) {
        return null
    }
    // a setup counts as locked unless the API says otherwise
    const locked = setup.locked !== false
    return {
        ...pick(setup, ['tier', 'status', 'confidence', 'unlocksTask', 'requiredTier'] as const),
        ...(locked ? {} : pick(setup, SETUP_NUMBER_KEYS)),
        ...(locked || !details ? {} : { statMedians: typedRecord<number>(setup.statMedians, NUMBER_RECORD) }),
        id: setup.id || setup.tier || fallbackId,
        name: setup.name || setup.tier || fallbackId,
        locked,
        assumptions: (Array.isArray(setup.assumptions) ? setup.assumptions : []).filter(a => typeof a === 'string' && !!a),
        sources: (Array.isArray(setup.sources) ? setup.sources : []).filter(hasHttpsSource),
        items: items.map(item => normalizeItem(item, locked))
    }
}

/**
 * Guards against missing arrays, items without a tag and non-https sources; empty setups are dropped except the explicit locked endgame placeholder.
 * Only known fields survive and locked setups lose their numbers even if the API sent them.
 * Premium details (`statMedians`, `modifierEffects`) are only kept with `details: true`, the public path never carries them.
 * @returns null when nothing is left to show
 */
export function normalizeSetups(data: unknown, options: { details?: boolean } = {}): PublicTaskGearSetups | null {
    const details = options.details === true
    const raw = data as PublicTaskSetups | null | undefined
    if (!raw || typeof raw !== 'object') {
        return null
    }
    const baseline = raw.baseline ? normalizeSetup(raw.baseline, 'baseline', details) : null
    const setups = (Array.isArray(raw.setups) ? raw.setups : []).map((s, i) => normalizeSetup(s, `setup-${i}`, details)).filter((s): s is PublicTaskGearSetup => !!s)
    if (!baseline && setups.length === 0) {
        return null
    }
    const locked = [baseline, ...setups].some(s => !!s?.locked)
    return {
        ...pick(raw, ['slug', 'taskName', 'profileName', 'category', 'measuredAt'] as const),
        locked,
        modifierEffects: locked || !details ? undefined : normalizeEffects(raw.modifierEffects),
        // without a baseline the rates are the free community average
        baselineCoinsPerHour: !baseline || !baseline.locked ? raw.baselineCoinsPerHour : undefined,
        comparisonCoinsPerHour: !baseline || !baseline.locked ? raw.comparisonCoinsPerHour : undefined,
        baseline: baseline ?? undefined,
        setups
    }
}
