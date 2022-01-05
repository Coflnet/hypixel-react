import { useMatomo } from '@datapunt/matomo-tracker-react';
import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { toast } from 'react-toastify';
import DatePicker from "react-datepicker";

interface Props {
    key: string,
    selected: Date,
    onChange(n: number)
}

export function DateFilterElement(props: Props) {

    function _onChange(date: Date) {
        props.onChange(date.getTime() / 1000);
    }

    return (
        <span>
            <DatePicker key={props.key} className="date-filter form-control" selected={props.selected} onChange={_onChange} popperClassName="date-picker-popper" />
        </span>
    )
}