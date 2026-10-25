'use client'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import InfiniteScroll from 'react-infinite-scroll-component'
import api from '../../api/ApiHelper'
import { useActiveAuctionSubscription } from '../../hooks/useActiveAuctionSubscription'
import {
    ACTIVE_AUCTION_ORDERS,
    ACTIVE_AUCTION_PAGE_SIZE,
    ActiveAuctionOrder,
    ActiveAuctionQueryState,
    GROUPED_PER_TAG_LIMIT,
    QueryChip,
    applyResolvedQuery,
    chipsFromState,
    cleanFilters,
    createEmptyQueryState,
    findInsertIndex,
    getSubscriptionTags,
    hasAnyNarrowing,
    shouldSubscribeLive,
    removeChip,
    stateFromSearchParams,
    stateToRequestParams,
    stateToSearchString,
    stateToSubscriptionFilter
} from '../../utils/ActiveAuctionUtils'
import { convertTagToName, numberWithThousandsSeparators } from '../../utils/Formatter'
import { getLoadingElement } from '../../utils/LoadingUtils'
import ItemFilter from '../ItemFilter/ItemFilter'
import ActiveAuctionCard from './ActiveAuctionCard'
import styles from './ActiveAuctionExplorer.module.css'
import ResolvedQueryChips from './ResolvedQueryChips'

const SEARCH_DEBOUNCE_MS = 400
const SAFETY_REFRESH_MS = 30_000
const NOT_READY_RETRY_MS = 30_000
const GONE_REMOVE_DELAY_MS = 1500
const FLASH_DURATION_MS = 1500

interface LoadError {
    status?: number
    message: string
}

export default function ActiveAuctionExplorer() {
    const [query, setQuery] = useState<ActiveAuctionQueryState>(createEmptyQueryState())
    const [initialized, setInitialized] = useState(false)
    const [inputText, setInputText] = useState('')
    const [items, setItems] = useState<ActiveAuctionPreview[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [tagCounts, setTagCounts] = useState<{ [tag: string]: number }>({})
    const [resolvedTags, setResolvedTags] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [hasMore, setHasMore] = useState(false)
    const [error, setError] = useState<LoadError | null>(null)
    const [pendingNew, setPendingNew] = useState(0)
    const [loadToken, setLoadToken] = useState(0)
    const [filterOptions, setFilterOptions] = useState<FilterOptions[]>([])
    const [filterKey, setFilterKey] = useState(0)
    const [resolveDescription, setResolveDescription] = useState('')
    const [resolveFailed, setResolveFailed] = useState(false)
    const [flashing, setFlashing] = useState<{ [uuid: string]: boolean }>({})
    const [goneUuids, setGoneUuids] = useState<{ [uuid: string]: boolean }>({})

    const itemsRef = useRef<ActiveAuctionPreview[]>([])
    const queryRef = useRef(query)
    queryRef.current = query
    const hasMoreRef = useRef(false)
    const pageRef = useRef(0)
    const requestIdRef = useRef(0)
    const resolveIdRef = useRef(0)
    const isLoadingMoreRef = useRef(false)
    const pendingUuidsRef = useRef<Set<string>>(new Set())
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

    const setItemsBoth = useCallback((next: ActiveAuctionPreview[]) => {
        itemsRef.current = next
        setItems(next)
    }, [])

    const requestKey = useMemo(() => JSON.stringify(stateToRequestParams(query, 0)), [query])

    // read the shareable URL once; a bare free text is resolved, explicit params are used as given
    useEffect(() => {
        const fromUrl = stateFromSearchParams(window.location.search)
        setInputText(fromUrl.q)
        if (fromUrl.q && !hasAnyNarrowing(fromUrl)) {
            const id = ++resolveIdRef.current
            api.resolveActiveQuery(fromUrl.q)
                .then(resolved => {
                    if (id !== resolveIdRef.current) return
                    setResolveDescription(resolved.description)
                    setQuery(applyResolvedQuery(fromUrl, resolved, fromUrl.q))
                    setFilterKey(k => k + 1)
                    setInitialized(true)
                })
                .catch(() => {
                    setResolveFailed(true)
                    setQuery(applyResolvedQuery(fromUrl, { tags: [], armorSet: null, filters: {}, itemNameContains: null, description: '' }, fromUrl.q))
                    setInitialized(true)
                })
        } else {
            setQuery(fromUrl)
            setInitialized(true)
        }
        Promise.all([api.getFilters('*'), api.flipFilters('*')])
            .then(filters => setFilterOptions([...(filters[0] || []), ...(filters[1] || [])]))
            .catch(() => {})
        const timers = timersRef.current
        return () => {
            timers.forEach(clearTimeout)
        }
    }, [])

    // mirror the explicit state into the URL
    useEffect(() => {
        if (!initialized) return
        const search = stateToSearchString(query)
        window.history.replaceState(window.history.state, '', window.location.pathname + (search ? '?' + search : ''))
    }, [query, initialized])

    const loadPage = useCallback(
        (page: number, reset: boolean, silent: boolean = false) => {
            const requestId = ++requestIdRef.current
            if (!silent) {
                setIsLoading(true)
            }
            if (reset && !silent) {
                setError(null)
            }
            isLoadingMoreRef.current = true
            return api
                .searchActiveAuctions(stateToRequestParams(queryRef.current, page))
                .then(result => {
                    if (requestId !== requestIdRef.current) return
                    const merged = reset
                        ? result.items
                        : [...itemsRef.current, ...result.items.filter(n => !itemsRef.current.some(o => o.uuid === n.uuid))]
                    setItemsBoth(merged)
                    pageRef.current = page
                    setTotalCount(result.totalCount)
                    setTagCounts(result.tagCounts)
                    setResolvedTags(result.resolvedTags)
                    hasMoreRef.current = result.items.length >= ACTIVE_AUCTION_PAGE_SIZE
                    setHasMore(hasMoreRef.current)
                    setError(null)
                    if (reset) {
                        pendingUuidsRef.current.clear()
                        setPendingNew(0)
                    }
                    setLoadToken(t => t + 1)
                })
                .catch(e => {
                    if (requestId !== requestIdRef.current) return
                    if (silent) return
                    if (reset) setItemsBoth([])
                    setHasMore(false)
                    setError({ status: e?.status, message: e?.message || 'Request failed' })
                })
                .finally(() => {
                    if (requestId === requestIdRef.current) {
                        setIsLoading(false)
                        isLoadingMoreRef.current = false
                    }
                })
        },
        [setItemsBoth]
    )

    // (re)load from the start whenever the request changes
    useEffect(() => {
        if (!initialized) return
        loadPage(0, true)
    }, [requestKey, initialized, loadPage])

    // 503 "not ready": the backend is still building its snapshot
    useEffect(() => {
        if (error?.status !== 503) return
        const timer = setTimeout(() => loadPage(0, true), NOT_READY_RETRY_MS)
        return () => clearTimeout(timer)
    }, [error, loadPage])

    // safety net in case a push was missed, only while the user has not scrolled into later pages
    useEffect(() => {
        if (!initialized) return
        const interval = setInterval(() => {
            if (pageRef.current === 0 && !isLoadingMoreRef.current && document.visibilityState !== 'hidden') {
                loadPage(0, true, true)
            }
        }, SAFETY_REFRESH_MS)
        return () => clearInterval(interval)
    }, [initialized, loadPage])

    // debounced free text search -> resolve -> explicit chips
    useEffect(() => {
        if (!initialized) return
        const text = inputText.trim()
        if (text === queryRef.current.q.trim()) return
        const timer = setTimeout(() => {
            if (!text) {
                setQuery(q => ({ ...q, q: '' }))
                setResolveDescription('')
                return
            }
            const id = ++resolveIdRef.current
            api.resolveActiveQuery(text)
                .then(resolved => {
                    if (id !== resolveIdRef.current) return
                    setResolveFailed(false)
                    setResolveDescription(resolved.description)
                    setQuery(q => applyResolvedQuery(q, resolved, text))
                    setFilterKey(k => k + 1)
                })
                .catch(() => {
                    if (id !== resolveIdRef.current) return
                    setResolveFailed(true)
                    setResolveDescription('')
                    setQuery(q => applyResolvedQuery(q, { tags: [], armorSet: null, filters: {}, itemNameContains: null, description: '' }, text))
                    setFilterKey(k => k + 1)
                })
        }, SEARCH_DEBOUNCE_MS)
        return () => clearTimeout(timer)
    }, [inputText, initialized])

    function markFlash(uuid: string) {
        setFlashing(f => ({ ...f, [uuid]: true }))
        timersRef.current.push(
            setTimeout(() => {
                setFlashing(f => {
                    const next = { ...f }
                    delete next[uuid]
                    return next
                })
            }, FLASH_DURATION_MS)
        )
    }

    const onLiveAuction = useCallback(
        (auction: ActiveAuctionPreview) => {
            const current = itemsRef.current
            const existingIndex = current.findIndex(i => i.uuid === auction.uuid)
            if (existingIndex >= 0) {
                const next = [...current]
                next[existingIndex] = { ...current[existingIndex], ...auction }
                setItemsBoth(next)
                markFlash(auction.uuid)
                return
            }
            if (pendingUuidsRef.current.has(auction.uuid)) return

            const grouped = queryRef.current.perTagLimit > 0
            const scope = grouped ? current.filter(i => i.tag === auction.tag) : current
            const scopeHasMore = grouped ? scope.length >= queryRef.current.perTagLimit : hasMoreRef.current
            const scopeIndex = grouped && scope.length === 0 ? -1 : findInsertIndex(scope, auction, queryRef.current.orderBy, scopeHasMore)
            if (scopeIndex < 0) {
                pendingUuidsRef.current.add(auction.uuid)
                setPendingNew(pendingUuidsRef.current.size)
                return
            }
            let globalIndex = scopeIndex
            if (grouped) {
                globalIndex = scopeIndex < scope.length ? current.indexOf(scope[scopeIndex]) : current.indexOf(scope[scope.length - 1]) + 1
            }
            const next = [...current]
            next.splice(globalIndex, 0, auction)
            setItemsBoth(next)
            setTotalCount(c => c + 1)
            markFlash(auction.uuid)
        },
        [setItemsBoth]
    )

    const onLiveGone = useCallback(
        (gone: { uuid: string; reason: string }) => {
            if (pendingUuidsRef.current.delete(gone.uuid)) {
                setPendingNew(pendingUuidsRef.current.size)
            }
            if (!itemsRef.current.some(i => i.uuid === gone.uuid)) return
            setGoneUuids(g => ({ ...g, [gone.uuid]: true }))
            timersRef.current.push(
                setTimeout(() => {
                    setItemsBoth(itemsRef.current.filter(i => i.uuid !== gone.uuid))
                    setTotalCount(c => Math.max(0, c - 1))
                    setGoneUuids(g => {
                        const next = { ...g }
                        delete next[gone.uuid]
                        return next
                    })
                }, GONE_REMOVE_DELAY_MS)
            )
        },
        [setItemsBoth]
    )

    useActiveAuctionSubscription({
        tags: getSubscriptionTags(resolvedTags, tagCounts),
        filter: stateToSubscriptionFilter(query),
        getKnownUuids: () => itemsRef.current.map(i => i.uuid),
        onAuction: onLiveAuction,
        onGone: onLiveGone,
        loadToken,
        // a subscription without any narrowing would stream the whole auction house
        enabled: initialized && !error && shouldSubscribeLive(query, resolvedTags)
    })

    function updateQuery(update: Partial<ActiveAuctionQueryState>) {
        setQuery(q => ({ ...q, ...update }))
    }

    function onChipRemove(chip: QueryChip) {
        const next = removeChip(queryRef.current, chip)
        setQuery(next)
        // the typed text stays in the box, except when its name chip is removed
        setInputText(next.q)
        if (chip.kind === 'name') {
            setResolveDescription('')
        }
        if (chip.kind === 'filter') {
            setFilterKey(k => k + 1)
        }
    }

    function clearAll() {
        setQuery(q => ({ ...createEmptyQueryState(), orderBy: q.orderBy, perTagLimit: q.perTagLimit }))
        setInputText('')
        setResolveDescription('')
        setFilterKey(k => k + 1)
    }

    function showNew() {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        loadPage(0, true)
    }

    const chips = chipsFromState(query, convertTagToName, set => resolveDescription || `${convertTagToName(set)} set`)
    const grouped = query.perTagLimit > 0

    const groups = useMemo(() => {
        if (!grouped) return []
        const byTag = new Map<string, ActiveAuctionPreview[]>()
        items.forEach(item => {
            const list = byTag.get(item.tag) || []
            list.push(item)
            byTag.set(item.tag, list)
        })
        return Array.from(byTag.entries())
    }, [items, grouped])

    function renderCard(item: ActiveAuctionPreview) {
        return <ActiveAuctionCard key={item.uuid} auction={item} flash={!!flashing[item.uuid]} gone={!!goneUuids[item.uuid]} />
    }

    function renderError() {
        if (!error) return null
        if (error.status === 503) {
            return (
                <div className={styles.notice} role="status">
                    Loading live auction data, retry in 30s.
                    <Button size="sm" variant="secondary" onClick={() => loadPage(0, true)}>
                        Retry now
                    </Button>
                </div>
            )
        }
        return (
            <div className={`${styles.notice} ${styles.noticeError}`} role="alert">
                Could not load auctions{error.status ? ` (HTTP ${error.status})` : ''}: {error.message}
                <Button size="sm" variant="secondary" onClick={() => loadPage(0, true)}>
                    Retry
                </Button>
            </div>
        )
    }

    return (
        <div className={styles.explorer}>
            <div className={styles.stickyBar}>
                <Form.Control
                    type="search"
                    className={styles.searchInput}
                    placeholder="Search all active auctions, e.g. final destination 7 sharpness"
                    aria-label="Search active auctions"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                />
                <div className={styles.controls}>
                    <Form.Select
                        aria-label="Sort"
                        value={query.orderBy}
                        onChange={e => updateQuery({ orderBy: e.target.value as ActiveAuctionOrder })}
                        className={styles.sortSelect}
                    >
                        {ACTIVE_AUCTION_ORDERS.map(o => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </Form.Select>
                    <Form.Check
                        type="switch"
                        id="active-auction-group"
                        label="Group by item"
                        checked={grouped}
                        onChange={e => updateQuery({ perTagLimit: e.target.checked ? GROUPED_PER_TAG_LIMIT : 0 })}
                    />
                </div>
                <ResolvedQueryChips chips={chips} description={query.armorSet ? '' : resolveDescription} onRemove={onChipRemove} onClear={clearAll} />
                {resolveFailed ? <div className={styles.hint}>Could not interpret the search, searching item names instead.</div> : null}
            </div>

            {filterOptions.length > 0 ? (
                <div className={styles.filterWrapper}>
                    <ItemFilter
                        key={filterKey}
                        filters={filterOptions}
                        ignoreURL
                        disableLastUsedFilter
                        defaultFilter={query.filters}
                        onFilterChange={f => updateQuery({ filters: cleanFilters(f) })}
                    />
                </div>
            ) : null}

            <div className={styles.summary}>
                {!error ? <span>{numberWithThousandsSeparators(totalCount)} active auctions</span> : null}
                {pendingNew > 0 ? (
                    <Button size="sm" variant="success" onClick={showNew}>
                        {pendingNew} new auction{pendingNew === 1 ? '' : 's'} - show
                    </Button>
                ) : null}
            </div>

            {renderError()}

            {isLoading && items.length === 0 && !error ? getLoadingElement() : null}
            {!isLoading && !error && items.length === 0 ? <p className={styles.empty}>No active auctions match this search.</p> : null}

            {items.length > 0 ? (
                <InfiniteScroll
                    style={{ overflow: 'visible' }}
                    dataLength={items.length}
                    next={() => !isLoadingMoreRef.current && loadPage(pageRef.current + 1, false)}
                    hasMore={hasMore}
                    loader={<div>{getLoadingElement()}</div>}
                >
                    {grouped
                        ? groups.map(([tag, list]) => (
                              <section key={tag} className={styles.group}>
                                  <h2 className={styles.groupHeader}>
                                      <Image
                                          crossOrigin="anonymous"
                                          className="playerHeadIcon"
                                          src={api.getItemImageUrl({ tag })}
                                          height={32}
                                          width={32}
                                          alt=""
                                          loading="lazy"
                                      />
                                      <span>{convertTagToName(tag)}</span>
                                      <span className={styles.groupCount}>{numberWithThousandsSeparators(tagCounts[tag] ?? list.length)}</span>
                                  </h2>
                                  <div className={styles.grid}>{list.map(renderCard)}</div>
                              </section>
                          ))
                        : <div className={styles.grid}>{items.map(renderCard)}</div>}
                </InfiniteScroll>
            ) : null}
        </div>
    )
}
