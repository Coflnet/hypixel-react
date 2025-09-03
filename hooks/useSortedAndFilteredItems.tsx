import { useState, useEffect, useRef, useCallback } from 'react'

export interface SortOption<T> {
    label: string
    value: string
    sortFunction(items: T[], ...args: any[]): T[]
}

// Utility function to process items in chunks to avoid blocking the main thread
async function processInChunks<T>(
    items: T[],
    processor: (item: T) => boolean,
    chunkSize: number = 100
): Promise<T[]> {
    const result: T[] = []

    for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize)
        const chunkResult = chunk.filter(processor)
        result.push(...chunkResult)

        if (i + chunkSize < items.length) {
            await new Promise(resolve => setTimeout(resolve, 0))
        }
    }

    return result
}

// Custom hook for sorting and filtering items
export function useSortedAndFilteredItems<T>(
    items: T[],
    orderBy: SortOption<T> | null,
    nameFilter: string | null | undefined,
    minimumProfit: number,
    filterFunction?: (item: T, nameFilter: string | null | undefined, minimumProfit: number) => boolean,
    sortFunctionArgs: any[] = [],
    debounceMs: number = 300
) {
    const [processedItems, setProcessedItems] = useState<T[]>(items)
    const [isProcessing, setIsProcessing] = useState(false)
    const [debouncedNameFilter, setDebouncedNameFilter] = useState(nameFilter)
    const [debouncedMinimumProfit, setDebouncedMinimumProfit] = useState(minimumProfit)

    const processingIdRef = useRef(0)
    const abortControllerRef = useRef<AbortController | null>(null)

    // Debounce the name filter
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedNameFilter(nameFilter)
        }, debounceMs)

        return () => clearTimeout(timer)
    }, [nameFilter, debounceMs])

    // Debounce the minimum profit filter
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedMinimumProfit(minimumProfit)
        }, debounceMs)

        return () => clearTimeout(timer)
    }, [minimumProfit, debounceMs])

    const processItems = useCallback(async (
        currentItems: T[],
        currentOrderBy: SortOption<T> | null,
        currentNameFilter: string | null | undefined,
        currentMinimumProfit: number,
        currentFilterFunction?: (item: T, nameFilter: string | null | undefined, minimumProfit: number) => boolean,
        currentSortFunctionArgs: any[] = []
    ) => {
        const processingId = ++processingIdRef.current

        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        const abortController = new AbortController()
        abortControllerRef.current = abortController

        try {
            setIsProcessing(true)

            if (currentItems.length === 0) {
                if (processingId === processingIdRef.current && !abortController.signal.aborted) {
                    setProcessedItems([])
                }
                return
            }

            await new Promise(resolve => setTimeout(resolve, 0))

            if (processingId !== processingIdRef.current || abortController.signal.aborted) {
                return
            }

            let sortedItems = [...currentItems]
            if (currentOrderBy) {
                if (currentItems.length > 1000) {
                    await new Promise(resolve => setTimeout(resolve, 0))
                }

                if (processingId !== processingIdRef.current || abortController.signal.aborted) {
                    return
                }

                sortedItems = currentOrderBy.sortFunction([...currentItems], ...currentSortFunctionArgs)
            }

            if (processingId !== processingIdRef.current || abortController.signal.aborted) {
                return
            }

            let filteredItems: T[]

            if (!currentFilterFunction) {
                filteredItems = sortedItems
            } else {
                const optimizedFilter = (item: T) => {
                    return currentFilterFunction(item, currentNameFilter, currentMinimumProfit)
                }

                if (sortedItems.length > 500) {
                    filteredItems = await processInChunks(sortedItems, optimizedFilter, 100)
                } else {
                    filteredItems = sortedItems.filter(optimizedFilter)
                }
            }

            if (processingId === processingIdRef.current && !abortController.signal.aborted) {
                setProcessedItems(filteredItems)
            }

        } catch (error) {
            if (!abortController.signal.aborted) {
                console.error('Error during processing:', error)
                if (processingId === processingIdRef.current) {
                    setProcessedItems([...currentItems])
                }
            }
        } finally {
            if (processingId === processingIdRef.current) {
                setIsProcessing(false)
            }
        }
    }, [])

    useEffect(() => {
        processItems(
            items,
            orderBy,
            debouncedNameFilter,
            debouncedMinimumProfit,
            filterFunction,
            sortFunctionArgs
        )
    }, [items, orderBy, debouncedNameFilter, debouncedMinimumProfit, filterFunction, processItems])

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [])

    return { processedItems, isProcessing }
}
