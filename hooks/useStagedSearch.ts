'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ParsedSearchQuery, SearchRow, StageOutcome, composeSearchRows, parseSearchQuery } from '../utils/Search/SearchRows'
import type { SearchStage } from '../utils/Search/SearchStages'

/** show the previous item results (filtered by the new text) while the items request of an extended query is in flight */
const SHOW_PROVISIONAL_ITEM_RESULTS = true
const DEFAULT_DEBOUNCE_MS = 150

export type SearchPhase = 'IDLE' | 'DEBOUNCING' | 'RUNNING' | 'PRIMARY_SETTLED' | 'SETTLED'

interface RunState {
    id: number
    query: ParsedSearchQuery | null
    stages: SearchStage[]
    outcomes: StageOutcome[]
    debouncing: boolean
    patches: Record<string, Partial<SearchResultItem>>
}

interface EnterWaiter {
    runId: number
    resolve(item: SearchResultItem | undefined): void
}

export interface StagedSearchOptions {
    stages: SearchStage[]
    debounceMs?: number
    /** mixes e.g. previous searches into the results of stages marked with `decorate` */
    decorateItems?(items: SearchResultItem[], query: ParsedSearchQuery): SearchResultItem[]
    /** changing this value resets the search (text and results) */
    resetKey?: unknown
}

export interface StagedSearch {
    searchText: string
    results: SearchResultItem[]
    rows: SearchRow[]
    selectedIndex: number
    isSearching: boolean
    noResultsFound: boolean
    setSearchText(text: string): void
    moveSelection(delta: number): void
    setSelectedIndex(index: number): void
    /** resolves with the item to open: waits for the primary stages, if there is nothing for the full search */
    onEnter(): Promise<SearchResultItem | undefined>
    clearResults(): void
    showResults(items: SearchResultItem[]): void
    patchResult(id: string, patch: Partial<SearchResultItem>): void
    cancel(): void
}

const IDLE_RUN: RunState = { id: 0, query: null, stages: [], outcomes: [], debouncing: false, patches: {} }

function getPhase(run: RunState): SearchPhase {
    if (run.query === null) {
        return 'IDLE'
    }
    const primaryPending = run.outcomes.some(o => o.primary && o.status === 'pending')
    if (primaryPending) {
        return run.debouncing ? 'DEBOUNCING' : 'RUNNING'
    }
    return run.outcomes.some(o => o.status === 'pending') ? 'PRIMARY_SETTLED' : 'SETTLED'
}

function deriveView(run: RunState) {
    const patchIds = Object.keys(run.patches)
    const outcomes =
        patchIds.length === 0
            ? run.outcomes
            : run.outcomes.map(o => ({ ...o, results: o.results.map(r => (run.patches[r.id] ? { ...r, ...run.patches[r.id] } : r)) }))
    return composeSearchRows(outcomes)
}

function provisionalResults(previous: RunState, key: string, query: ParsedSearchQuery): SearchResultItem[] {
    if (!SHOW_PROVISIONAL_ITEM_RESULTS || previous.query === null || !query.normalized.startsWith(previous.query.normalized)) {
        return []
    }
    const outcome = previous.outcomes.find(o => o.key === key)
    if (!outcome || outcome.status !== 'done') {
        return []
    }
    return outcome.results.filter(r => r.type !== 'page' && r.dataItem.name.toLowerCase().includes(query.normalized))
}

export function useStagedSearch(options: StagedSearchOptions): StagedSearch {
    const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS
    const [searchText, setSearchTextState] = useState('')
    const [run, setRun] = useState<RunState>(IDLE_RUN)
    const [selectedIndex, setSelectedIndexState] = useState(0)

    const runRef = useRef<RunState>(IDLE_RUN)
    const textRef = useRef('')
    const selectedRef = useRef(0)
    const requestIdRef = useRef(0)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const controllerRef = useRef<AbortController | null>(null)
    const waiterRef = useRef<EnterWaiter | null>(null)
    const optionsRef = useRef(options)
    optionsRef.current = options

    const commit = useCallback((next: RunState) => {
        runRef.current = next
        setRun(next)
    }, [])

    const selectIndex = useCallback((index: number) => {
        selectedRef.current = index
        setSelectedIndexState(index)
    }, [])

    const releaseWaiter = useCallback((item?: SearchResultItem) => {
        const waiter = waiterRef.current
        waiterRef.current = null
        waiter?.resolve(item)
    }, [])

    // abort in-flight work and drop everything that belongs to the current run
    const cancelCurrent = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current)
            timerRef.current = null
        }
        controllerRef.current?.abort()
        controllerRef.current = null
        releaseWaiter(undefined)
    }, [releaseWaiter])

    const checkWaiter = useCallback(() => {
        const waiter = waiterRef.current
        const current = runRef.current
        if (!waiter || waiter.runId !== current.id) {
            return
        }
        const phase = getPhase(current)
        if (phase === 'DEBOUNCING' || phase === 'RUNNING') {
            return
        }
        const view = deriveView(current)
        if (view.results.length > 0) {
            releaseWaiter(view.results[0])
        } else if (phase === 'SETTLED') {
            releaseWaiter(undefined)
        }
    }, [releaseWaiter])

    const settle = useCallback(
        (id: number, stage: SearchStage, status: 'done' | 'error', results: SearchResultItem[]) => {
            const current = runRef.current
            if (current.id !== id || current.query === null) {
                return
            }
            let finalResults = status === 'done' ? results : []
            if (status === 'done' && stage.decorate && optionsRef.current.decorateItems) {
                finalResults = optionsRef.current.decorateItems(results, current.query)
            }
            const outcomes = current.outcomes.map(o => (o.key === stage.key ? { ...o, status, results: finalResults } : o))
            commit({ ...current, outcomes })
            if (stage.awaitForEnter) {
                selectIndex(0)
            }
            checkWaiter()
        },
        [checkWaiter, commit, selectIndex]
    )

    const startRun = useCallback(
        (id: number) => {
            const current = runRef.current
            if (current.id !== id || current.query === null) {
                return
            }
            if (timerRef.current) {
                clearTimeout(timerRef.current)
                timerRef.current = null
            }
            const query = current.query
            const controller = new AbortController()
            controllerRef.current = controller
            commit({ ...current, debouncing: false })
            current.stages.forEach(stage => {
                const outcome = current.outcomes.find(o => o.key === stage.key)
                if (!outcome || outcome.status !== 'pending') {
                    return
                }
                let promise: Promise<SearchResultItem[]>
                try {
                    promise = Promise.resolve(stage.run(query, controller.signal))
                } catch (e) {
                    promise = Promise.reject(e)
                }
                promise.then(
                    results => settle(id, stage, 'done', results ?? []),
                    () => settle(id, stage, 'error', [])
                )
            })
        },
        [commit, settle]
    )

    const beginRun = useCallback(
        (text: string, immediate: boolean) => {
            cancelCurrent()
            const query = parseSearchQuery(text)
            const previous = runRef.current
            const stages = optionsRef.current.stages.filter(s => s.appliesTo(query))
            const outcomes: StageOutcome[] = stages.map(stage => {
                let peeked = stage.peek?.(query)
                if (peeked && stage.decorate && optionsRef.current.decorateItems) {
                    peeked = optionsRef.current.decorateItems(peeked, query)
                }
                return {
                    key: stage.key,
                    primary: stage.awaitForEnter,
                    fixedSection: stage.fixedSection ? stage.section : undefined,
                    status: peeked ? 'done' : 'pending',
                    results: peeked ?? (stage.fixedSection ? provisionalResults(previous, stage.key, query) : [])
                }
            })
            const id = ++requestIdRef.current
            const anyPending = outcomes.some(o => o.status === 'pending')
            commit({ id, query, stages, outcomes, debouncing: anyPending, patches: {} })
            selectIndex(0)
            if (anyPending) {
                if (immediate) {
                    startRun(id)
                } else {
                    timerRef.current = setTimeout(() => {
                        timerRef.current = null
                        startRun(id)
                    }, debounceMs)
                }
            }
        },
        [cancelCurrent, commit, debounceMs, selectIndex, startRun]
    )

    const reset = useCallback(() => {
        cancelCurrent()
        requestIdRef.current++
        textRef.current = ''
        setSearchTextState('')
        commit({ ...IDLE_RUN, id: requestIdRef.current })
        selectIndex(0)
    }, [cancelCurrent, commit, selectIndex])

    const setSearchText = useCallback(
        (text: string) => {
            textRef.current = text
            setSearchTextState(text)
            if (text.trim() === '') {
                cancelCurrent()
                commit({ ...IDLE_RUN, id: ++requestIdRef.current })
                selectIndex(0)
                return
            }
            beginRun(text, false)
        },
        [beginRun, cancelCurrent, commit, selectIndex]
    )

    const onEnter = useCallback((): Promise<SearchResultItem | undefined> => {
        const text = textRef.current
        if (text.trim() === '') {
            return Promise.resolve(deriveView(runRef.current).results[selectedRef.current])
        }
        const current = runRef.current
        const phase = getPhase(current)
        const view = deriveView(current)
        if ((phase === 'PRIMARY_SETTLED' || phase === 'SETTLED') && view.results.length > 0) {
            return Promise.resolve(view.results[Math.min(selectedRef.current, view.results.length - 1)])
        }

        releaseWaiter(undefined)
        let runId = current.id
        if (phase === 'IDLE' || phase === 'SETTLED') {
            beginRun(text, true)
            runId = runRef.current.id
        } else if (current.debouncing) {
            startRun(current.id)
        }
        return new Promise(resolve => {
            waiterRef.current = { runId, resolve }
            checkWaiter()
        })
    }, [beginRun, checkWaiter, releaseWaiter, startRun])

    const moveSelection = useCallback(
        (delta: number) => {
            const count = deriveView(runRef.current).results.length
            if (count === 0) {
                return
            }
            selectIndex(Math.max(0, Math.min(count - 1, selectedRef.current + delta)))
        },
        [selectIndex]
    )

    const clearResults = useCallback(() => {
        cancelCurrent()
        commit({ ...IDLE_RUN, id: ++requestIdRef.current })
        selectIndex(0)
    }, [cancelCurrent, commit, selectIndex])

    const showResults = useCallback(
        (items: SearchResultItem[]) => {
            cancelCurrent()
            const outcome: StageOutcome = { key: 'static', primary: true, fixedSection: 'Items', status: 'done', results: items }
            commit({ ...IDLE_RUN, id: ++requestIdRef.current, outcomes: [outcome] })
            selectIndex(0)
        },
        [cancelCurrent, commit, selectIndex]
    )

    const patchResult = useCallback(
        (id: string, patch: Partial<SearchResultItem>) => {
            const current = runRef.current
            commit({ ...current, patches: { ...current.patches, [id]: { ...current.patches[id], ...patch } } })
        },
        [commit]
    )

    const isFirstResetKey = useRef(true)
    useEffect(() => {
        if (isFirstResetKey.current) {
            isFirstResetKey.current = false
            return
        }
        reset()
    }, [options.resetKey])

    useEffect(() => {
        return () => cancelCurrent()
    }, [cancelCurrent])

    const view = useMemo(() => deriveView(run), [run])
    const phase = getPhase(run)
    const hasFailure = run.outcomes.some(o => o.status === 'error')

    return {
        searchText,
        results: view.results,
        rows: view.rows,
        selectedIndex,
        isSearching: phase !== 'IDLE' && phase !== 'SETTLED',
        noResultsFound: phase === 'SETTLED' && view.results.length === 0 && !hasFailure,
        setSearchText,
        moveSelection,
        setSelectedIndex: selectIndex,
        onEnter,
        clearResults,
        showResults,
        patchResult,
        cancel: cancelCurrent
    }
}
