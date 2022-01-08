import React, { ChangeEvent } from 'react';
import { Form } from 'react-bootstrap';

interface Props {
    defaultValue: string,
    onChange(n: boolean)
}

export function BooleanFilterElement(props: Props) {

    function _onChange(e: ChangeEvent<HTMLInputElement>) {
        props.onChange((e.target as any).value);
    }

    return (
        <span>
            <Form.Control defaultValue={props.defaultValue || "true"} as="select" onChange={_onChange}>
                <option key={"true"} value={"true"}>true</option>
                <option key={"false"} value={"false"}>false</option>
            </Form.Control>
        </span>
    )
}