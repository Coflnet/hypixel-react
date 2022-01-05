import React, { ChangeEvent } from 'react';
import { Form } from 'react-bootstrap';

interface Props {
    key: string,
    onChange(n: string),
    isValid: boolean,
    defaultValue: any
}

export function RangeFilterElement(props: Props) {

    function _onChange(event: ChangeEvent<HTMLInputElement>) {
        props.onChange(event.target.value);
    }

    return (
        <Form.Control isInvalid={!props.isValid} key={props.key} className="select-filter" defaultValue={props.defaultValue} onChange={_onChange}></Form.Control>
    )
}