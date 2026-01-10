'use client'
import { useMatomo } from '@jonkoops/matomo-tracker-react'
import { useEffect, useState, useRef } from 'react'
import { ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import { getURLSearchParam } from '../../utils/Parser/URLParser'
import styles from './ItemPriceRange.module.css'
import { isClientSideRendering } from '../../utils/SSRUtils'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export enum DateRange {
    ACTIVE = 'active',
    HOUR = 'hour',
    DAY = 'day',
    WEEK = 'week',
    MONTH = 'month',
    YEAR = 'year',
    ALL = 'full'
}

interface Props {
    onRangeChange?(timespan: DateRange): void
    item: Item
    disabled?: boolean
    disableAllTime?: boolean
    disableYear?: boolean
    setToDefaultRangeSwitch?: boolean
    dateRangesToDisplay: DateRange[]
}

export let DEFAULT_DATE_RANGE = DateRange.DAY

// Track URL updates to detect loops
const URL_UPDATE_WINDOW = 5000 // 5 seconds
const MAX_URL_UPDATES = 3 // Max updates in the window before we stop

export function ItemPriceRange(props: Props) {
    const { trackEvent } = useMatomo()
    let pathname = usePathname()
    let router = useRouter()
    let searchParams = useSearchParams()
    let [selectedDateRange, _setSelectedDateRange] = useState(searchParams.get('range') || DEFAULT_DATE_RANGE)
    let urlUpdateCountRef = useRef<number[]>([])

    useEffect(() => {
        if (props.disableAllTime && selectedDateRange === DateRange.ALL) {
            setSelectedDateRange(DateRange.MONTH)
            if (props.onRangeChange) {
                props.onRangeChange(DateRange.MONTH)
            }
        }
    }, [props.disableAllTime, selectedDateRange])

    useEffect(() => {
        if (props.disableYear && selectedDateRange === DateRange.YEAR) {
            setSelectedDateRange(DateRange.MONTH)
            if (props.onRangeChange) {
                props.onRangeChange(DateRange.MONTH)
            }
        }
    }, [props.disableYear, selectedDateRange])

    useEffect(() => {
        let range = getURLSearchParam('range')
        if (!range) {
            return
        }
        DEFAULT_DATE_RANGE = range as DateRange

        setTimeout(() => {
            setSelectedDateRange(range as DateRange)
            DEFAULT_DATE_RANGE = DateRange.DAY
        }, 500)
    }, [])

    useEffect(() => {
        if (props.item !== undefined) {
            setSelectedDateRange(DEFAULT_DATE_RANGE)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.item.tag])

    useEffect(() => {
        let setTo = selectedDateRange === DateRange.ACTIVE ? DateRange.ACTIVE : DEFAULT_DATE_RANGE
        onRangeChange(setTo)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.setToDefaultRangeSwitch])

    function setSelectedDateRange(range: string) {
        if (isClientSideRendering()) {
            let searchParams = new URLSearchParams(window.location.search)
            const currentRange = searchParams.get('range')
            
            // Skip if the range is already set to the same value
            if (currentRange === range) {
                _setSelectedDateRange(range)
                return
            }
            
            // Loop detection: track URL updates and stop if too many in a short window
            const now = Date.now()
            urlUpdateCountRef.current = urlUpdateCountRef.current.filter(t => now - t < URL_UPDATE_WINDOW)
            if (urlUpdateCountRef.current.length >= MAX_URL_UPDATES) {
                console.warn('ItemPriceRange: Too many URL updates detected, skipping to prevent loop')
                _setSelectedDateRange(range)
                return
            }
            urlUpdateCountRef.current.push(now)
            
            searchParams.set('range', range)
            router.replace(`${pathname}?${searchParams.toString()}`)
            _setSelectedDateRange(range)
        } else {
            console.error('Tried to update url query "range" during serverside rendering')
        }
    }

    let getButtonText = (range: DateRange): string => {
        switch (range) {
            case DateRange.ACTIVE:
                return 'Active'
            case DateRange.HOUR:
                return '1 Hour'
            case DateRange.DAY:
                return '1 Day'
            case DateRange.WEEK:
                return '1 Week'
            case DateRange.MONTH:
                return '1 Month'
            case DateRange.YEAR:
                return '1 Year'
            case DateRange.ALL:
                return 'All Time'
        }
    }

    let getButtonVariant = (range: DateRange): string => {
        return range === selectedDateRange ? 'primary' : 'secondary'
    }

    let onRangeChange = (newRange: DateRange) => {
        setSelectedDateRange(newRange)
        if (props.onRangeChange) {
            props.onRangeChange(newRange)
        }
    }

    let onRangeChangeClick = newRange => {
        onRangeChange(newRange)
        trackEvent({
            category: 'changeItemPriceRange',
            action: newRange
        })
    }

    /**
     * While using the "disabled" prop, the focus state of the ToggleButtons is not removed after changing to another button
     * Here are all wrong focuses cleard
     * @param e
     */
    let removeWrongFocus = () => {
        setTimeout(() => {
            let elements = document.querySelectorAll('.price-range-button.btn-light.focus')
            while (elements.length > 0) {
                elements[0].classList.remove('focus')
                elements = document.querySelectorAll('.price-range-button.btn-light.focus')
            }
        }, 100)
    }

    return (
        <ToggleButtonGroup className={styles.itemPriceRange} type="radio" name="options" value={selectedDateRange} onChange={onRangeChangeClick}>
            {Object.keys(DateRange).map(key => {
                let dateRange = DateRange[key]
                if (props.dateRangesToDisplay.indexOf(dateRange) === -1) {
                    return null
                }
                return (
                    <ToggleButton
                        id={key}
                        className={`price-range-button ${dateRange === DateRange.YEAR ? 'year-option-highlight' : ''}`}
                        value={dateRange}
                        variant={getButtonVariant(dateRange)}
                        disabled={
                            props.disabled || (props.disableAllTime && dateRange === DateRange.ALL) || (props.disableYear && dateRange === DateRange.YEAR)
                        }
                        onChange={removeWrongFocus}
                        size="sm"
                        key={key}
                        style={
                            dateRange === DateRange.YEAR
                                ? selectedDateRange === dateRange
                                    ? {
                                          background: '#0d6efd',
                                          border: '1px solid rgba(13,110,253,0.9)',
                                          color: 'white'
                                      }
                                    : {
                                          border: '1px solid rgba(224, 239, 50, 0.75)',
                                          color: '#111'
                                      }
                                : {}
                        }
                    >
                        {getButtonText(dateRange)}
                    </ToggleButton>
                )
            })}
        </ToggleButtonGroup>
    )
}
