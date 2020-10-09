import React, { useState } from 'react';
import { ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import './ItemPriceRange.css';

export enum DateRange {
    DAY = "day",
    MONTH = "month",
    WEEK = "week",
    ALL = "ALL"
}

export const DEFAULT_DATE_RANGE = DateRange.DAY;

interface Props {
    onRangeChange?(timespan: number): void
}

export let getTimeSpanFromDateRange = (range: DateRange): number => {
    let timespan: number = -1;
    let currDate: Date = new Date();
    switch (range) {
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

    let [selectedDateRange, setSelectedDateRange] = useState(DEFAULT_DATE_RANGE);

    let getButtonVariant = (range: DateRange): string => {
        return range === selectedDateRange ? "light" : "primary";
    }

    let onRangeChange = (newRange: DateRange) => {
        setSelectedDateRange(newRange);
        if (props.onRangeChange) {
            props.onRangeChange(getTimeSpanFromDateRange(newRange));
        }
    }

    return (
        <ToggleButtonGroup className="item-price-range" type="radio" name="options" value={selectedDateRange} onChange={onRangeChange}>
            <ToggleButton className="price-range-button" value={DateRange.DAY} variant={getButtonVariant(DateRange.DAY)} size="lg">1 Day</ToggleButton>
            <ToggleButton className="price-range-button" value={DateRange.MONTH} variant={getButtonVariant(DateRange.MONTH)} size="lg">1 Week</ToggleButton>
            <ToggleButton className="price-range-button" value={DateRange.WEEK} variant={getButtonVariant(DateRange.WEEK)} size="lg">1 Month</ToggleButton>
            <ToggleButton className="price-range-button" value={DateRange.ALL} variant={getButtonVariant(DateRange.ALL)} size="lg">All Time</ToggleButton>
        </ToggleButtonGroup>
    )
}