'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Button } from 'react-bootstrap'
import ItemFilter from '../../../ItemFilter/ItemFilter'
import Tooltip from '../../../Tooltip/Tooltip'
import TagSelect from '../TagSelect/TagSelect'
import api from '../../../../api/ApiHelper'
import styles from './EditRestriction.module.css'
import ApiSearchField from '../../../Search/ApiSearchField'
import { mergePickedFilter, pickSearchResult } from '../../../../utils/Search/FilterResultId'

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

    // a picked filter result is applied through a remount of the ItemFilter once the filter options of the picked item are loaded
    let applyPickedFilter = useRef(false)
    let [filterKey, setFilterKey] = useState(0)
    let filterItemTag = updateState.selectedItem?.tag || props.defaultRestriction.item?.tag || '*'

    useEffect(() => {
        loadFilters()
    }, [filterItemTag])

    function loadFilters(): Promise<FilterOptions[]> {
        return Promise.all([api.getFilters(filterItemTag), api.flipFilters(filterItemTag)]).then(
            filters => {
                let result = [...(filters[0] || []), ...(filters[1] || [])]
                setFilters(result)
                remountFilterForPickedFilter()
                return result
            }
        )
    }

    function remountFilterForPickedFilter() {
        if (applyPickedFilter.current) {
            applyPickedFilter.current = false
            setFilterKey(key => key + 1)
        }
    }

    return (
        <div>
            <ApiSearchField
                multiple
                className={styles.multiSearch}
                onChange={items => {
                    let picked = items[0] ? pickSearchResult(items[0]) : null
                    if (picked?.filter) {
                        if (picked.item.tag === filterItemTag) {
                            // the filter options do not reload for the same item
                            setFilterKey(key => key + 1)
                        } else {
                            applyPickedFilter.current = true
                        }
                    }
                    setUpdateState({
                        ...updateState,
                        selectedItem:
                            picked ? picked.item : undefined,
                        itemFilter: mergePickedFilter(updateState.itemFilter, picked?.filter ?? null)
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
                key={filterKey}
                defaultFilter={updateState.itemFilter}
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
