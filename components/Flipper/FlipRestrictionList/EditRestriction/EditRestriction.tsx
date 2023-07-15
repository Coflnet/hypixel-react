'use client'
import React, { useEffect, useState } from 'react'
import { Button } from 'react-bootstrap'
import ItemFilter from '../../../ItemFilter/ItemFilter'
import Tooltip from '../../../Tooltip/Tooltip'
import TagSelect from '../TagSelect/TagSelect'
import api from '../../../../api/ApiHelper'

interface Props {
    defaultRestriction: FlipRestriction
    onAdd(update: UpdateState)
    onOverride(update: UpdateState)
    onCancel()
}

export interface UpdateState {
    type: 'blacklist' | 'whitelist'
    tags?: string[]
    itemFilter?: ItemFilter
}

function EditRestriction(props: Props) {
    let [isFilterValid, setIsFilterValid] = useState(true)
    let [filters, setFilters] = useState<FilterOptions[]>([])
    let [updateState, setUpdateState] = useState<UpdateState>({
        ...props.defaultRestriction
    })

    useEffect(() => {
        loadFilters()
    }, [])

    function loadFilters(): Promise<FilterOptions[]> {
        return Promise.all([api.getFilters(props.defaultRestriction.item?.tag || '*'), api.flipFilters(props.defaultRestriction.item?.tag || '*')]).then(
            filters => {
                let result = [...(filters[0] || []), ...(filters[1] || [])]
                setFilters(result)
                return result
            }
        )
    }

    return (
        <div>
            <ItemFilter
                defaultFilter={props.defaultRestriction.itemFilter}
                filters={filters}
                forceOpen={true}
                onFilterChange={filter => {
                    setUpdateState({ ...updateState, itemFilter: filter })
                }}
                ignoreURL={true}
                autoSelect={false}
                disableLastUsedFilter={true}
                onIsValidChange={setIsFilterValid}
            />
            <TagSelect
                defaultTags={props.defaultRestriction.tags || []}
                onTagsChange={tags => {
                    setUpdateState({ ...updateState, tags: tags })
                }}
            />
            <span>
                <Tooltip
                    type="hover"
                    content={
                        <Button
                            variant="success"
                            onClick={() => {
                                props.onAdd(updateState)
                            }}
                            disabled={!isFilterValid}
                        >
                            Add filter(s)
                        </Button>
                    }
                    tooltipContent={
                        <span>
                            Adds all selected filter to the selected restriction(s). If a specific filter is already present, it is <b>not</b> overwritten.
                        </span>
                    }
                />
                <Tooltip
                    type="hover"
                    content={
                        <Button
                            variant="success"
                            onClick={() => {
                                props.onOverride(updateState)
                            }}
                            style={{ marginLeft: '20px' }}
                            disabled={!isFilterValid}
                        >
                            Override
                        </Button>
                    }
                    tooltipContent={<span>Overwrites the filter of all the selected restrictions to this.</span>}
                />
                <Button variant="danger" onClick={props.onCancel} style={{ marginLeft: '20px' }}>
                    Cancel
                </Button>
            </span>
        </div>
    )
}

export default EditRestriction
