import React from 'react';
import DatePicker from "react-datepicker";

interface Props {
    selected: Date,
    onChange(n: number)
}

export function DateFilterElement(props: Props) {

    function _onChange(date: Date) {
        date = date || new Date();
        props.onChange(Math.round(date.getTime() / 1000));
    }

    return (
        <span>
            <DatePicker className="date-filter form-control" selected={props.selected} onChange={_onChange} popperClassName="date-picker-popper" />
        </span>
    )
}