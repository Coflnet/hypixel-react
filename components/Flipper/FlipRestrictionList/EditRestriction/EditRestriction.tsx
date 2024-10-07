'use client'
import React, { useEffect, useState } from 'react'
import { Button } from 'react-bootstrap'
import ItemFilter from '../../../ItemFilter/ItemFilter'
import Tooltip from '../../../Tooltip/Tooltip'
import TagSelect from '../TagSelect/TagSelect'
import api from '../../../../api/ApiHelper'
import styles from './EditRestriction.module.css'
import ApiSearchField from '../../../Search/ApiSearchField'

interface Props {
    defaultRestriction: FlipRestriction
    onAdd(update: UpdateState)
    onOverride(update: UpdateState)
    onCancel()
}

export interface UpdateState {
    type: 'blacklist' | 'whitelist'
    selectedItem?: Item
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
            <ApiSearchField
                multiple
                className={styles.multiSearch}
                onChange={items => {
                    setUpdateState({
                        ...updateState,
                        selectedItem: items[0]
                            ? {
                                  tag: items[0].id,
                                  name: items[0].dataItem.name,
                                  iconUrl: items[0].dataItem.iconUrl
                              }
                            : undefined
                    })
                }}
                searchFunction={api.itemSearch}
                selected={
                    updateState.selectedItem
                        ? [
                              {
                                  dataItem: {
                                      name: updateState.selectedItem.name,
                                      iconUrl: updateState.selectedItem.iconUrl
                                  },
                                  label: updateState.selectedItem.name,
                                  id: updateState.selectedItem.tag
                              } as unknown as SearchResultItem
                          ]
                        : undefined
                }
            />
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <Tooltip
                    type="hover"
                    content={
                        <Button
                            variant="success"
                            onClick={() => {
                                props.onAdd(updateState)
                            }}
                            disabled={!isFilterValid || !!updateState.selectedItem}
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
            </div>
        </div>
    )
}

export default EditRestriction
