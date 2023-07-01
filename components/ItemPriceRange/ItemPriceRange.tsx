'use client'
import { useMatomo } from '@jonkoops/matomo-tracker-react'
import { useEffect, useState } from 'react'
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
    ALL = 'full'
}

interface Props {
    onRangeChange?(timespan: DateRange): void
    item: Item
    disabled?: boolean
    disableAllTime?: boolean
    setToDefaultRangeSwitch?: boolean
    dateRangesToDisplay: DateRange[]
}

export let DEFAULT_DATE_RANGE = DateRange.DAY

export function ItemPriceRange(props: Props) {
    const { trackEvent } = useMatomo()
    let pathname = usePathname()
    let router = useRouter()
    let searchParams = useSearchParams()
    let [selectedDateRange, _setSelectedDateRange] = useState(searchParams.get('range') || DEFAULT_DATE_RANGE)

    if (props.disableAllTime && selectedDateRange === DateRange.ALL) {
        setSelectedDateRange(DateRange.MONTH)
        if (props.onRangeChange) {
            props.onRangeChange(DateRange.MONTH)
        }
    }

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
            console.log('setting range to ' + range)
            let searchParams = new URLSearchParams(window.location.search)
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
                        className="price-range-button"
                        value={dateRange}
                        variant={getButtonVariant(dateRange)}
                        disabled={props.disabled || (props.disableAllTime && dateRange === DateRange.ALL)}
                        onChange={removeWrongFocus}
                        size="sm"
                        key={key}
                    >
                        {getButtonText(dateRange)}
                    </ToggleButton>
                )
            })}
        </ToggleButtonGroup>
    )
}
