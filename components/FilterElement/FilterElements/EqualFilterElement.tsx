'use client'
import React from 'react'
import { convertTagToName } from '../../../utils/Formatter'
import { Typeahead } from 'react-bootstrap-typeahead'

interface Props {
    onChange(n: string)
    options: FilterOptions
    defaultValue?: any
    isValid?: boolean
}

export function EqualFilterElement(props: Props) {
    function _onChange(selected) {
        props.onChange(selected[0] || '')
    }

    return (
        <Typeahead
            id={props.options.name}
            style={{ display: 'block' }}
            defaultSelected={props.defaultValue ? [props.defaultValue] : undefined}
            onChange={_onChange}
            options={props.options?.options}
            labelKey={option => {
                return convertTagToName(option as string)
            }}
            isInvalid={!props.isValid}
            selectHint={(shouldSelect, event) => {
                return event.key === 'Enter' || shouldSelect
            }}
        ></Typeahead>
    )
}
