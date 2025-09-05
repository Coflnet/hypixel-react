'use client'
import React, { ChangeEvent, useEffect, useState, useMemo, useCallback } from 'react'
import { Form, ListGroup, Spinner } from 'react-bootstrap'
import Link from 'next/link'
import { hasHighEnoughPremium, PREMIUM_RANK } from '../../utils/PremiumTypeUtils'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import api from '../../api/ApiHelper'
import styles from './GenericFlipList.module.css'
import { useSortedAndFilteredItems } from '../../hooks/useSortedAndFilteredItems'

export interface FlipListProps<T> {
    items: T[]
    sortOptions: SortOption<T>[]
    renderFlipContentAction: (item: T) => React.ReactNode
    onFlipClick?: (item: T, event: React.MouseEvent) => void
    filterFunction?: (item: T, nameFilter: string | null | undefined, minimumProfit: number) => boolean
    getItemKeyAction: (item: T) => string
    censoredItemGenerator?: (item: T) => T
    premiumMessage?: string
    clickMessage?: string
    showColumns?: boolean
    customFilters?: React.ReactNode
    sortFunctionArgs?: any[]
    customItemWrapper?: (item: T, blur: boolean, key: string, content: React.ReactNode, flipCardClass: string) => React.ReactNode
    onAfterSignIn?: () => void
    customHeader?: (isLoggedIn: boolean) => React.ReactNode
    // Optional: provide a function that returns a href for a flip item.
    // If provided, non-blurred flips will be wrapped in a plain <a> so
    // the link exists in the HTML for users/search engines with JS disabled.
    getFlipLink?: (item: T) => string | null | undefined
    // When lists are large, render a small initial batch and load more as the
    // user scrolls to reduce DOM size and JS work. Defaults keep at least 3
    // items to preserve top-3 censoring for SSR.
    renderBatchSize?: number
    initialRenderCount?: number
}

export interface SortOption<T> {
    label: string
    value: string
    sortFunction(items: T[], ...args: any[]): T[]
}


let observer: MutationObserver

export function GenericFlipList<T>({
    items,
    sortOptions,
    renderFlipContentAction,
    onFlipClick,
    filterFunction,
    getItemKeyAction,
    censoredItemGenerator,
    premiumMessage = "The top 3 flips can only be seen with starter premium or better",
    clickMessage = "Click on a flip for further details",
    showColumns = false,
    customFilters,
    sortFunctionArgs = [],
    customItemWrapper,
    onAfterSignIn,
    customHeader,
    getFlipLink
    ,
    renderBatchSize = 42,
    initialRenderCount = 42
}: FlipListProps<T>) {
    const [nameFilter, setNameFilter] = useState<string | null>()
    const [minimumProfit, setMinimumProfit] = useState<number>(0)
    const [orderBy, setOrderBy] = useState<SortOption<T>>(sortOptions[0])
    const [hasPremium, setHasPremium] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [showTechSavvyMessage, setShowTechSavvyMessage] = useState(false)
    const [columns, setColumns] = useState<number>()

    const { processedItems, isProcessing } = useSortedAndFilteredItems(
        items,
        orderBy,
        nameFilter,
        minimumProfit,
        filterFunction,
        sortFunctionArgs
    )

    // Batch rendering state to limit DOM nodes for very large lists
    const safeInitial = Math.max(3, initialRenderCount || 0)
    const [renderedCount, setRenderedCount] = useState<number>(safeInitial)
    const batchSize = Math.max(1, renderBatchSize || 50)
    const sentinelRef = React.useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        // reset the blur observer, when something changed
        setTimeout(setBlurObserver, 100)
        if (showColumns) {
            setColumns(getDefaultColumns())
        }
        // Reset rendered count when the processed items change (new search/sort)
        setRenderedCount(Math.max(3, safeInitial))
    }, [])

    // Observe the sentinel to incrementally render more items when the user
    // scrolls near the end of the currently rendered batch.
    useEffect(() => {
        if (!sentinelRef.current) return
        const el = sentinelRef.current
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setRenderedCount(prev => Math.min(processedItems.length, prev + batchSize))
                }
            })
        })
        observer.observe(el)
        return () => observer.disconnect()
    }, [sentinelRef.current, processedItems.length, batchSize])

    function setBlurObserver() {
        if (observer) {
            observer.disconnect()
        }
        observer = new MutationObserver(function () {
            setShowTechSavvyMessage(true)
        })

        var targets = document.getElementsByClassName('blur')
        for (var i = 0; i < targets.length; i++) {
            var config = {
                attributes: true,
                childList: true,
                characterData: true,
                attributeFilter: ['style']
            }
            observer.observe(targets[i], config)
        }
    }

    function getDefaultColumns() {
        const screenWidth = window.innerWidth

        if (screenWidth >= 1424) {
            return 3
        } else if (screenWidth >= 768) {
            return 2
        } else {
            return 1
        }
    }

    function onAfterLogin() {
        setIsLoggedIn(true)
        api.refreshLoadPremiumProducts(products => {
            setHasPremium(hasHighEnoughPremium(products, PREMIUM_RANK.STARTER))
        })

        // Call the custom onAfterSignIn if provided
        if (onAfterSignIn) {
            onAfterSignIn()
        }
    }

    const onNameFilterChange = useCallback((e: any) => {
        setNameFilter(e.target.value)
    }, [])

    const onMinimumProfitChange = useCallback((e: any) => {
        setMinimumProfit(e.target.value)
    }, [])

    const updateOrderBy = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
        if (!isProcessing) {
            let selectedIndex = event.target.options.selectedIndex
            let value = event.target.options[selectedIndex].getAttribute('value')!
            let sortOption = sortOptions.find(option => option.value === value)
            if (sortOption) {
                setOrderBy(sortOption)
            }
        }
    }, [isProcessing, sortOptions])

    const handleColumnChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
        if (!isProcessing) {
            const value = parseInt(event.target.value, 10)
            setColumns(value)
        }
    }, [isProcessing])

    const blurStyle: React.CSSProperties = {
        WebkitFilter: 'blur(5px)',
        msFilter: 'blur(5px)',
        filter: 'blur(5px)',
        pointerEvents: 'none'
    }

    function getListElement(item: T, blur: boolean) {
        // Build the inner content (blur messages + actual content)
        const inner = (
            <>
                {blur ? (
                    <p style={{ position: 'absolute', top: '25%', left: '25%', width: '50%', fontSize: 'large', fontWeight: 'bold', textAlign: 'center' }}>
                        {premiumMessage}
                    </p>
                ) : null}
                {showTechSavvyMessage && blur ? (
                    <p
                        style={{
                            position: 'absolute',
                            top: '25%',
                            left: '25%',
                            width: '50%',
                            fontSize: 'large',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            backgroundColor: 'gray'
                        }}
                    >
                        You seem like a tech savvy person, contribute to the project to get premium for free. :)
                    </p>
                ) : null}
                <div className={blur ? 'blur' : ''} style={blur ? blurStyle : {}}>
                    {renderFlipContentAction(item)}
                </div>
            </>
        )

        // If a link generator was provided and this isn't a blurred (censored) item,
        // wrap the inner content in a plain anchor so it exists in the static HTML.
        let wrappedInner: React.ReactNode = inner
        if (!blur && typeof getFlipLink === 'function') {
            const href = getFlipLink(item)
            if (href) {
                const handleAnchorClick = (e: React.MouseEvent) => {
                    // If there's an onFlipClick handler, call it and prevent default
                    // so client-side navigation/behavior can occur. If not, allow
                    // the anchor to work normally (useful when JS is disabled).
                    if (onFlipClick) {
                        e.preventDefault()
                        onFlipClick(item, e)
                    }
                }

                wrappedInner = (
                    <a href={href} onClick={handleAnchorClick} style={{ color: 'inherit', textDecoration: 'none', display: 'block', height: '100%' }}>
                        {inner}
                    </a>
                )
            }
        }

        return (
            <ListGroup.Item
                key={getItemKeyAction(item)}
                action={!blur}
                onClick={e => {
                    if (onFlipClick && !blur) {
                        onFlipClick(item, e)
                    }
                }}
                style={{ height: '100%', padding: '15px' }}
            >
                {wrappedInner}
            </ListGroup.Item>
        )
    }

    // Memoized displayed items
    const list = useMemo(() => {
        if (isProcessing) {
            return []
        }

        let shown = 0
        // Only render up to renderedCount to reduce DOM size
        const toRender = processedItems.slice(0, renderedCount)
        const list = toRender.map(item => {
            const defaultContent = getListElement(item, false)

            if (!hasPremium && ++shown <= 3) {
                const censoredItem = censoredItemGenerator ? censoredItemGenerator(item) : item
                const censoredContent = getListElement(censoredItem, true)

                if (customItemWrapper) {
                    return customItemWrapper(censoredItem, true, getItemKeyAction(item), censoredContent, styles.flipCard)
                }

                return (
                    <div className={`${styles.flipCard} ${styles.preventSelect}`} key={getItemKeyAction(item)}>
                        {censoredContent}
                    </div>
                )
            } else {
                if (customItemWrapper) {
                    return customItemWrapper(item, false, getItemKeyAction(item), defaultContent, styles.flipCard)
                }

                return (
                    <div className={styles.flipCard} key={getItemKeyAction(item)}>
                        {defaultContent}
                    </div>
                )
            }
        })

        return list
    }, [processedItems, hasPremium, isProcessing, censoredItemGenerator, customItemWrapper, renderedCount])

    const flipListClass = showColumns && columns ? `${styles.flipList} ${styles[`columns-${columns}`]}` : styles.flipList
    return (
        <div className={styles.genericFlipList}>
            {customHeader && customHeader(isLoggedIn)}
            <div>
                <GoogleSignIn onAfterLogin={onAfterLogin} />
                {!isLoggedIn ? <hr /> : ''}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Form.Control
                    className={styles.filterInput}
                    placeholder="Item name..."
                    onChange={onNameFilterChange}
                />
                <Form.Select
                    className={styles.filterInput}
                    defaultValue={orderBy.value}
                    onChange={updateOrderBy}
                >
                    {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Form.Select>
                <Form.Control
                    className={styles.filterInput}
                    placeholder="Minimum Profit"
                    onChange={onMinimumProfitChange}
                />
                {showColumns && (
                    <Form.Select
                        className={styles.filterInput}
                        value={columns}
                        onChange={handleColumnChange}
                    >
                        <option value={1}>1 Column</option>
                        <option value={2}>2 Columns</option>
                        <option value={3}>3 Columns</option>
                        <option value={4}>4 Columns</option>
                        <option value={5}>5 Columns</option>
                    </Form.Select>
                )}
                {customFilters}
            </div>
            <hr />
            {hasPremium ? null : (
                <p>
                    Click <Link href="/linkvertise">here</Link> to get Starter Premium for free to see the top flips
                </p>
            )}
            <p>{clickMessage}</p>
            <div className={flipListClass}>
                {isProcessing ? (
                    <div className={styles.loadingContainer} style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: '200px',
                        flexDirection: 'column',
                        gap: '16px'
                    }}>
                        <Spinner animation="border" role="status" variant="primary" />
                        <span>Processing items...</span>
                    </div>
                ) : (
                    <>
                        {(() => {
                            const visibleList = list.slice()
                            if (renderedCount < processedItems.length) {
                                const insertIndex = Math.max(0, visibleList.length - 6)
                                visibleList.splice(insertIndex, 0, <div key="sentinel" ref={sentinelRef as any} style={{ height: 1 }} />)
                            }
                            return <ListGroup className={styles.list}>{visibleList}</ListGroup>
                        })()}
                    </>
                )}
            </div>
        </div>
    )
}