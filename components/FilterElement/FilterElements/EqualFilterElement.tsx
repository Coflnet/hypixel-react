import React from 'react'
import { convertTagToName } from '../../../utils/Formatter'
import { Typeahead } from 'react-bootstrap-typeahead'

interface Props {
    onChange(n: string)
    options: FilterOptions
    defaultValue: any
}

export function EqualFilterElement(props: Props) {
    function _onChange(selected) {
        props.onChange(selected[0] || '')
    }

    function getSelectOptions(option) {
        // special case for PET_SKIN to avoid confusion
        if (option === 'PET_SKIN') {
            return 'Pet Skin (unapplied)'
        }

        return convertTagToName(option)
    }

    return (
        <Typeahead
            id={props.options.name}
            style={{ display: 'block' }}
            defaultSelected={[props.defaultValue]}
            onChange={_onChange}
            options={props.options?.options}
            labelKey={getSelectOptions}
            autoselect={false}
            selectHintOnEnter={true}
        ></Typeahead>
    )
}
