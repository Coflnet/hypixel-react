import { useMatomo } from '@datapunt/matomo-tracker-react';
import React, { useEffect, useState } from 'react';
import { ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import { useHistory } from "react-router-dom";
import './ItemPriceRange.css';

export enum DateRange {
    ACTIVE = "active",
    DAY = "day",
    MONTH = "month",
    WEEK = "week",
    ALL = "ALL"
}

export const DEFAULT_DATE_RANGE = DateRange.DAY;

interface Props {
    onRangeChange?(timespan: number): void,
    item?: Item,
    disabled?: boolean,
    disableAllTime?: boolean,
    setToDefaultRangeSwitch?: boolean
}

export let getTimeSpanFromDateRange = (range: DateRange): number => {
    let timespan: number = -1;
    let currDate: Date = new Date();
    switch (range) {
        case DateRange.ACTIVE:
            timespan = -1;
            break;
        case DateRange.DAY:
            timespan = currDate.setUTCDate(currDate.getUTCDate() - 1);
            break;
        case DateRange.WEEK:
            timespan = currDate.setUTCDate(currDate.getUTCDate() - 7);
            break;
        case DateRange.MONTH:
            timespan = currDate.setUTCMonth(currDate.getUTCMonth() - 1);
            break;
        case DateRange.ALL:
            timespan = new Date(0).getDate();
            break;
        default:
            throw new Error("TimeRange not supported '" + range + "'");
    }
    return timespan;
}

export function ItemPriceRange(props: Props) {

    const { trackEvent } = useMatomo()

    let history = useHistory();
    let [selectedDateRange, setSelectedDateRange] = useState(DEFAULT_DATE_RANGE);

    if (props.disableAllTime && selectedDateRange === DateRange.ALL) {
        setSelectedDateRange(DateRange.MONTH);
        if (props.onRangeChange) {
            props.onRangeChange(getTimeSpanFromDateRange(DateRange.MONTH));
        }
    }

    useEffect(() => {
        if (props.item !== undefined) {
            setSelectedDateRange(DEFAULT_DATE_RANGE);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.item])

    useEffect(() => {
        let setTo = selectedDateRange === DateRange.ACTIVE ? DateRange.ACTIVE : DEFAULT_DATE_RANGE;
        setSelectedDateRange(setTo);
        if (props.onRangeChange) {
            props.onRangeChange(getTimeSpanFromDateRange(setTo));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.setToDefaultRangeSwitch])

    let getButtonVariant = (range: DateRange): string => {
        return range === selectedDateRange ? "primary" : "secondary";
    }

    let onRangeChange = (newRange: DateRange) => {

        // Triggers the unapply of the ItemFilter
        history.push({
            pathname: history.location.pathname,
            search: history.location.search
        });

        setSelectedDateRange(newRange);
        if (props.onRangeChange) {
            props.onRangeChange(getTimeSpanFromDateRange(newRange));
        }
    }

    let onRangeChangeClick = (newRange) => {
        onRangeChange(newRange);
        trackEvent({
            category: 'changeItemPriceRange',
            action: newRange,
        })
    }

    /**
     * While using the "disabled" prop, the focus state of the ToggleButtons is not removed after changing to another button
     * Here are all wrong focuses cleard
     * @param e 
     */
    let removeWrongFocus = () => {
        setTimeout(() => {
            let elements = document.querySelectorAll(".price-range-button.btn-light.focus")
            while (elements.length > 0) {
                elements[0].classList.remove('focus');
                elements = document.querySelectorAll(".price-range-button.btn-light.focus")
            }
        }, 100);
    }

    return (
        <ToggleButtonGroup className="item-price-range" type="radio" name="options" value={selectedDateRange} onChange={onRangeChangeClick}>
            <ToggleButton className="price-range-button" value={DateRange.ACTIVE} variant={getButtonVariant(DateRange.ACTIVE)} disabled={props.disabled} onChange={removeWrongFocus} size="sm">Active</ToggleButton>
            <ToggleButton className="price-range-button" value={DateRange.DAY} variant={getButtonVariant(DateRange.DAY)} disabled={props.disabled} onChange={removeWrongFocus} size="sm">1 Day</ToggleButton>
            <ToggleButton className="price-range-button" value={DateRange.WEEK} variant={getButtonVariant(DateRange.WEEK)} disabled={props.disabled} onChange={removeWrongFocus} size="sm">1 Week</ToggleButton>
            <ToggleButton className="price-range-button" value={DateRange.MONTH} variant={getButtonVariant(DateRange.MONTH)} disabled={props.disabled} onChange={removeWrongFocus} size="sm">1 Month</ToggleButton>
            <ToggleButton className="price-range-button" value={DateRange.ALL} variant={getButtonVariant(DateRange.ALL)} disabled={props.disabled || props.disableAllTime} onChange={removeWrongFocus} size="sm">All Time</ToggleButton>
        </ToggleButtonGroup>
    )
}