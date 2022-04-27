import { useMatomo } from '@datapunt/matomo-tracker-react'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import { ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import { getURLSearchParam } from '../../utils/Parser/URLParser'
import styles from './ItemPriceRange.module.css'

export enum DateRange {
    ACTIVE = 'active',
    DAY = 'day',
    MONTH = 'month',
    WEEK = 'week',
    ALL = 'full'
}

interface Props {
    onRangeChange?(timespan: DateRange): void
    item: Item
    disabled?: boolean
    disableAllTime?: boolean
    setToDefaultRangeSwitch?: boolean
}

export let DEFAULT_DATE_RANGE = DateRange.DAY

export function ItemPriceRange(props: Props) {
    const { trackEvent } = useMatomo()

    let router = useRouter()
    let [selectedDateRange, setSelectedDateRange] = useState(DEFAULT_DATE_RANGE)

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
        if (!router.isReady) {
            return
        }
        let setTo = selectedDateRange === DateRange.ACTIVE ? DateRange.ACTIVE : DEFAULT_DATE_RANGE
        onRangeChange(setTo)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.setToDefaultRangeSwitch])

    let getButtonVariant = (range: DateRange): string => {
        return range === selectedDateRange ? 'primary' : 'secondary'
    }

    let onRangeChange = (newRange: DateRange) => {
        router.query.range = newRange
        router.replace(router)

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
            <ToggleButton
                className="price-range-button"
                value={DateRange.ACTIVE}
                variant={getButtonVariant(DateRange.ACTIVE)}
                disabled={props.disabled || props.item.bazaar}
                onChange={removeWrongFocus}
                size="sm"
            >
                Active
            </ToggleButton>
            <ToggleButton
                className="price-range-button"
                value={DateRange.DAY}
                variant={getButtonVariant(DateRange.DAY)}
                disabled={props.disabled}
                onChange={removeWrongFocus}
                size="sm"
            >
                1 Day
            </ToggleButton>
            <ToggleButton
                className="price-range-button"
                value={DateRange.WEEK}
                variant={getButtonVariant(DateRange.WEEK)}
                disabled={props.disabled}
                onChange={removeWrongFocus}
                size="sm"
            >
                1 Week
            </ToggleButton>
            <ToggleButton
                className="price-range-button"
                value={DateRange.MONTH}
                variant={getButtonVariant(DateRange.MONTH)}
                disabled={props.disabled}
                onChange={removeWrongFocus}
                size="sm"
            >
                1 Month
            </ToggleButton>
            <ToggleButton
                className="price-range-button"
                value={DateRange.ALL}
                variant={getButtonVariant(DateRange.ALL)}
                disabled={props.disabled || props.disableAllTime}
                onChange={removeWrongFocus}
                size="sm"
            >
                All Time
            </ToggleButton>
        </ToggleButtonGroup>
    )
}
