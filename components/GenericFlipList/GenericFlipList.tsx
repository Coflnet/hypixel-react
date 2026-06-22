'use client'
import React, { ChangeEvent, useEffect, useState, useMemo, useCallback } from 'react'
import { Form, ListGroup, Spinner } from 'react-bootstrap'
import Link from 'next/link'
import { hasHighEnoughPremium, PREMIUM_RANK } from '../../utils/PremiumTypeUtils'
import PremiumModal from '../PremiumModal/PremiumModal'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import api from '../../api/ApiHelper'
import styles from './GenericFlipList.module.css'
import { useSortedAndFilteredItems } from '../../hooks/useSortedAndFilteredItems'
import ListItemAdElement from '../ListItemAdElement/ListItemAdElement'
import { GENRIC_FLIP_LIST_COLUMNS, getSetting, LAST_PREMIUM_PRODUCTS, setSetting } from '../../utils/SettingsUtils'
import { parsePremiumProducts } from '../../utils/Parser/APIResponseParser'

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
    minimumPlaceholder?: string
    getFlipLink?: (item: T) => string | null | undefined
    renderBatchSize?: number
    initialRenderCount?: number
    emptyState?: React.ReactNode
}

export interface SortOption<T> {
    label: string
    value: string
    sortFunction(items: T[], ...args: any[]): T[]
}

let observer: MutationObserver

function getInitialPremiumState() {
    if (typeof window === 'undefined') {
        return { hasPremium: false, isKnown: false }
    }

    try {
        const token = sessionStorage.getItem('googleId') ?? localStorage.getItem('googleId')
        const lastPremiumProducts = localStorage.getItem(LAST_PREMIUM_PRODUCTS)
        if (lastPremiumProducts) {
            return {
                hasPremium: hasHighEnoughPremium(parsePremiumProducts(JSON.parse(lastPremiumProducts)), PREMIUM_RANK.STARTER),
                isKnown: true
            }
        }

        return { hasPremium: false, isKnown: !token }
    } catch {
        return { hasPremium: false, isKnown: true }
    }
}

export function GenericFlipList<T>({
    items,
    sortOptions,
    renderFlipContentAction,
    onFlipClick,
    filterFunction,
    getItemKeyAction,
    censoredItemGenerator,
    premiumMessage = 'The top 3 flips can only be seen with starter premium or better',
    clickMessage = 'Click on a flip for further details',
    showColumns = false,
    customFilters,
    sortFunctionArgs = [],
    customItemWrapper,
    onAfterSignIn,
    customHeader,
    getFlipLink,
    renderBatchSize = 42,
    initialRenderCount = 42,
    minimumPlaceholder,
    emptyState
}: FlipListProps<T>) {
    const [nameFilter, setNameFilter] = useState<string | null>()
    const [minimumProfit, setMinimumProfit] = useState<number>(0)
    const [orderBy, setOrderBy] = useState<SortOption<T>>(sortOptions[0])
    const [premiumState, setPremiumState] = useState(getInitialPremiumState)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [showTechSavvyMessage, setShowTechSavvyMessage] = useState(false)
    const [columns, _setColumns] = useState<number>()
    const [showPremiumModal, setShowPremiumModal] = useState(false)
    const [listElementSizes, setListElementSizes] = useState<{ width: number; height: number }>()
    const listRef = React.useRef<HTMLDivElement | null>(null)
    const hasPremium = premiumState.hasPremium
    const shouldShowAds = premiumState.isKnown && !premiumState.hasPremium

    const { processedItems, isProcessing } = useSortedAndFilteredItems(items, orderBy, nameFilter, minimumProfit, filterFunction, sortFunctionArgs)

    // Batch rendering state to limit DOM nodes for very large lists
    const safeInitial = Math.max(3, initialRenderCount || 0)
    const [renderedCount, setRenderedCount] = useState<number>(safeInitial)
    const batchSize = Math.max(1, renderBatchSize || 50)
    const sentinelRef = React.useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        setTimeout(setBlurObserver, 100)
        if (showColumns) {
            let columns = parseInt(getSetting(GENRIC_FLIP_LIST_COLUMNS, getDefaultColumns().toString()))
            setColumns(isNaN(columns) ? getDefaultColumns() : columns.valueOf())
        }
        setRenderedCount(Math.max(3, safeInitial))
    }, [])

    function setColumns(value: number) {
        _setColumns(value)
        setSetting(GENRIC_FLIP_LIST_COLUMNS, value)
    }

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

    useEffect(() => {
        if (listRef.current && listRef.current.children) {
            let height = listRef.current.children[0]?.clientHeight - 15 || 0
            let width = listRef.current.children[0]?.clientWidth - 15 || 0
            setListElementSizes({ width: width, height: height })
        }
    }, [listRef.current, columns, showColumns])

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

    function loadPremiumState() {
        setIsLoggedIn(true)
        api.refreshLoadPremiumProducts(
            products => {
                setPremiumState({ hasPremium: hasHighEnoughPremium(products, PREMIUM_RANK.STARTER), isKnown: true })
            },
            () => setPremiumState({ hasPremium: false, isKnown: true })
        )
    }

    useEffect(() => {
        if (typeof window === 'undefined') {
            return
        }

        const token = sessionStorage.getItem('googleId') ?? localStorage.getItem('googleId')
        if (token) {
            loadPremiumState()
        } else {
            setPremiumState({ hasPremium: false, isKnown: true })
        }
    }, [])

    function onAfterLogin() {
        loadPremiumState()

        if (onAfterSignIn) {
            onAfterSignIn()
        }
    }

    function getAdSizes() {
        let sizes: [number, number][] = [[300, 250], [336, 280], [320, 100], [970, 90], [728, 90], [970, 250]]
        if (listElementSizes) {
            // Filter ad sizes to not exceed list element width
            // Height can be up to 20% higher than list elements
            sizes = sizes.filter(size =>
                size[0] <= listElementSizes.width &&
                size[1] <= listElementSizes.height * 1.5
            )
        }
        return sizes;
    }

    const onNameFilterChange = useCallback((e: any) => {
        setNameFilter(e.target.value)
    }, [])

    const onMinimumProfitChange = useCallback((e: any) => {
        setMinimumProfit(e.target.value)
    }, [])

    const updateOrderBy = useCallback(
        (event: ChangeEvent<HTMLSelectElement>) => {
            if (!isProcessing) {
                let selectedIndex = event.target.options.selectedIndex
                let value = event.target.options[selectedIndex].getAttribute('value')!
                let sortOption = sortOptions.find(option => option.value === value)
                if (sortOption) {
                    setOrderBy(sortOption)
                }
            }
        },
        [isProcessing, sortOptions]
    )

    const handleColumnChange = useCallback(
        (event: ChangeEvent<HTMLSelectElement>) => {
            if (!isProcessing) {
                const value = parseInt(event.target.value, 10)
                setColumns(value)
            }
        },
        [isProcessing]
    )

    const blurStyle: React.CSSProperties = {
        WebkitFilter: 'blur(5px)',
        msFilter: 'blur(5px)',
        filter: 'blur(5px)',
        pointerEvents: 'none'
    }

    function getListElement(item: T, blur: boolean) {
        const inner = (
            <>
                {blur ? (
                    <p
                        style={{
                            position: 'absolute',
                            top: '25%',
                            left: '25%',
                            width: '50%',
                            fontSize: 'large',
                            fontWeight: 'bold',
                            textAlign: 'center'
                        }}
                    >
                        {(() => {
                            const text = premiumMessage || ''
                            const match = text.match(/starter premium/i)
                            if (match && typeof match.index === 'number') {
                                const idx = match.index
                                const before = text.slice(0, idx)
                                const target = text.slice(idx, idx + match[0].length)
                                const after = text.slice(idx + match[0].length)
                                return (
                                    <>
                                        {before}
                                        <span
                                            role="button"
                                            tabIndex={0}
                                            aria-label="Get Starter Premium"
                                            onKeyDown={(e: React.KeyboardEvent) => {
                                                if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                                                    setShowPremiumModal(true)
                                                }
                                            }}
                                            onClick={() => setShowPremiumModal(true)}
                                            style={{ color: '#0d6efd', textDecoration: 'underline', cursor: 'pointer' }}
                                        >
                                            {target}
                                        </span>
                                        {after}
                                    </>
                                )
                            }

                            // Fallback: render message and allow click to open modal, but don't style anything
                            return (
                                <span onClick={() => setShowPremiumModal(true)} style={{ cursor: 'pointer' }}>
                                    {text}
                                </span>
                            )
                        })()}
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

        let wrappedInner: React.ReactNode = inner
        if (!blur && typeof getFlipLink === 'function') {
            const href = getFlipLink(item)
            if (href) {
                const handleAnchorClick = (e: React.MouseEvent) => {
                    e.preventDefault()
                    if (onFlipClick) {
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

    const list = useMemo(() => {
        if (isProcessing) {
            return []
        }

        let shown = 0
        // Only render up to renderedCount to reduce DOM size
        const toRender = processedItems.slice(0, renderedCount)
        const list: React.ReactNode[] = []
        toRender.forEach((item, i) => {

            if (shouldShowAds && ((list.length + 1) % 12 === 0 || i === 1)) {
                let ad: React.ReactNode = null;
                if (listElementSizes) {
                    ad = <div className={styles.flipCard} key={getItemKeyAction(item) + '-ad'} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <ListItemAdElement key={getItemKeyAction(item) + '-ad'} slotId={`flip-list-ad-${getItemKeyAction(item)}`} sizes={getAdSizes()} />
                    </div>
                } else {
                    ad = <div className={styles.flipCard} key={getItemKeyAction(item)}>
                        {getListElement(item, true)}
                    </div>
                }
                list.push(ad)
            }

            const defaultContent = getListElement(item, false)

            if (!hasPremium && ++shown <= 2) {
                const censoredItem = censoredItemGenerator ? censoredItemGenerator(item) : item
                const censoredContent = getListElement(censoredItem, true)

                if (customItemWrapper) {
                    list.push(customItemWrapper(censoredItem, true, getItemKeyAction(item), censoredContent, styles.flipCard));
                    return;
                }

                list.push(
                    <div className={`${styles.flipCard} ${styles.preventSelect}`} key={getItemKeyAction(item)}>
                        {censoredContent}
                    </div>
                )
                return;
            } else {
                if (customItemWrapper) {
                    list.push(customItemWrapper(item, false, getItemKeyAction(item), defaultContent, styles.flipCard));
                    return;
                }

                list.push(
                    <div className={styles.flipCard} key={getItemKeyAction(item)}>
                        {defaultContent}
                    </div>
                )
                return;
            }
        })

        return list
    }, [processedItems, hasPremium, shouldShowAds, isProcessing, censoredItemGenerator, customItemWrapper, renderedCount, listElementSizes])

    const flipListClass = showColumns && columns ? `${styles.flipList} ${styles[`columns-${columns}`]}` : styles.flipList
    return (
        <div className={styles.genericFlipList}>
            {customHeader && customHeader(isLoggedIn)}
            <div>
                <GoogleSignIn onAfterLogin={onAfterLogin} />
                {!isLoggedIn ? <hr /> : ''}
            </div>
            <div className={styles.filterControls}>
                <Form.Control className={styles.filterInput} placeholder="Item name..." onChange={onNameFilterChange} />
                <Form.Select className={styles.filterInput} defaultValue={orderBy.value} onChange={updateOrderBy}>
                    {sortOptions.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </Form.Select>
                <Form.Control className={styles.filterInput} placeholder={minimumPlaceholder ?? "Minimum Profit"} onChange={onMinimumProfitChange} />
                {showColumns && (
                    <Form.Select className={styles.filterInput} value={columns} onChange={handleColumnChange}>
                        <option value={1}>1 Column</option>
                        <option value={2}>2 Columns</option>
                        <option value={3}>3 Columns</option>
                        <option value={4}>4 Columns</option>
                        <option value={5}>5 Columns</option>
                    </Form.Select>
                )}
                {customFilters ? <div className={styles.customFilters}>{customFilters}</div> : null}
            </div>
            <hr />
            {/* Premium modal trigger moved to the blurred message so users and crawlers still see the message in-place */}
            <PremiumModal show={showPremiumModal} onHide={() => setShowPremiumModal(false)} />
            {processedItems.length > 0 ? <p>{clickMessage}</p> : null}
            <div className={flipListClass}>
                {isProcessing ? (
                    <div
                        className={styles.loadingContainer}
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: '200px',
                            flexDirection: 'column',
                            gap: '16px'
                        }}
                    >
                        <Spinner animation="border" role="status" variant="primary" />
                        <span>Processing items...</span>
                    </div>
                ) : processedItems.length === 0 ? (
                    <div className={styles.emptyStateContainer}>
                        {emptyState ?? (
                            <p className={styles.emptyStateText}>No flips found right now. Try adjusting your filters and check again shortly.</p>
                        )}
                    </div>
                ) : (
                    <>
                        {(() => {
                            const visibleList = list.slice()
                            if (renderedCount < processedItems.length) {
                                const insertIndex = Math.max(0, visibleList.length - 6)
                                visibleList.splice(insertIndex, 0, <div key="sentinel" ref={sentinelRef as any} style={{ height: 1 }} />)
                            }
                            return <ListGroup ref={listRef} className={styles.list}>{visibleList}</ListGroup>
                        })()}
                    </>
                )}
            </div>
            <Link href="/flips">
                <p style={{ textAlign: 'center', marginTop: '20px' }}>See all hypixel skyblock flips</p>
            </Link>
        </div>
    )
}
