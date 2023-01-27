import React, { useState } from 'react'
import { components, MultiValue } from 'react-select'
import Creatable from 'react-select/creatable'
import { CURRENTLY_USED_TAGS } from '../../../../utils/SettingsUtils'
import Tooltip from '../../../Tooltip/Tooltip'
import { Help as HelpIcon } from '@mui/icons-material'

interface Props {
    restriction: FlipRestriction
    onTagsChange(tags: string[])
}

const customSelectStyle = {
    option: provided => ({
        ...provided,
        color: 'black'
    })
}

const MultiValueContainer = props => {
    return (
        <components.MultiValueContainer {...props}>
            <Tooltip type={'hover'} content={<div {...props.innerProps}>{props.children}</div>} tooltipContent={<span>{props.data.label}</span>} />
        </components.MultiValueContainer>
    )
}

function TagSelect(props: Props) {
    let [tagOptions, setTagOptions] = useState(
        props.restriction.tags
            ? props.restriction.tags.slice().map(value => {
                  return { value, label: value }
              })
            : []
    )

    function onTagsChange(
        value: MultiValue<{
            value: string
            label: string
        }>
    ) {
        let newTags = value.map(option => option.value)
        let newTagOptions = [...value]
        setTagOptions(newTagOptions)
        props.onTagsChange(newTags)
    }

    function getAllUsedOptions(): MultiValue<{
        value: string
        label: string
    }> {
        let items = localStorage.getItem(CURRENTLY_USED_TAGS)
        if (!items) {
            return []
        }
        return JSON.parse(items).map(item => {
            return {
                value: item,
                label: item
            }
        })
    }

    return (
        <div>
            <div style={{ marginBottom: '20px' }}>
                <label htmlFor="finders">
                    Tags{' '}
                    <Tooltip
                        type="hover"
                        content={<HelpIcon style={{ color: '#007bff', cursor: 'pointer' }} />}
                        tooltipContent={
                            <span>
                                Tags are used for you to organize your restrictions and to make it easier to search for specific entries. Tags don't influence
                                what flips are shown.
                            </span>
                        }
                    />
                </label>
                <Creatable
                    isMulti
                    options={getAllUsedOptions()}
                    value={tagOptions}
                    styles={customSelectStyle}
                    closeMenuOnSelect={false}
                    components={{ MultiValueContainer }}
                    onChange={onTagsChange}
                />
            </div>
        </div>
    )
}

export default TagSelect
