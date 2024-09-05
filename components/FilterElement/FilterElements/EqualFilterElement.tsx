'use client'
import React from 'react'
import { convertTagToName } from '../../../utils/Formatter'
import { Menu, MenuItem, Typeahead, withItem } from 'react-bootstrap-typeahead'
import { Option } from 'react-bootstrap-typeahead/types/types'
import api from '../../../api/ApiHelper'

const Item = withItem(MenuItem)

interface Props {
    onChange(n: string)
    options: FilterOptions
    defaultValue?: any
    isValid?: boolean
    showIcon?: boolean
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
            renderMenu={(results, menuProps) => (
                <Menu {...menuProps}>
                    {results.map((result, index) => {
                        if (result['paginationOption']) {
                            return (
                                <MenuItem option={result} position={index}>
                                    More results...
                                </MenuItem>
                            )
                        }
                        return (
                            <Item option={result} position={index}>
                                {typeof result === 'string' ? convertTagToName(result as string) : (result as Option)['label']}
                                {props.showIcon && result !== 'None' && result !== 'Any' && (
                                    <div style={{ float: 'right' }}>
                                        <img src={api.getItemImageUrl({ tag: result as string })} style={{ width: '24px', height: '24px' }}></img>
                                    </div>
                                )}
                            </Item>
                        )
                    })}
                </Menu>
            )}
        ></Typeahead>
    )
}
