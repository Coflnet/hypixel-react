'use client'
import React, { useEffect, useState } from 'react'
import { Button, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import api from '../../../../api/ApiHelper'
import ItemFilter from '../../../ItemFilter/ItemFilter'
import TagSelect from '../TagSelect/TagSelect'
import styles from './NewRestriction.module.css'
import { MultiSearch } from '../../../Search/MultiSearch'

interface Props {
    onSaveRestrictions(restrictions: FlipRestriction[])
    onCancel()
}

interface RestrictionCreateState {
    selectedItems?: Item[]
    type: 'blacklist' | 'whitelist'
    itemFilter?: ItemFilter
    tags?: string[]
}

function NewRestriction(props: Props) {
    let [createState, setCreateState] = useState<RestrictionCreateState>({
        type: 'blacklist'
    })
    let [isFilterValid, setIsFilterValid] = useState(true)
    let [filters, setFilters] = useState<FilterOptions[]>([])

    useEffect(() => {
        loadFilters()
    }, [createState.selectedItems])

    function loadFilters(): Promise<FilterOptions[]> {
        if (!createState.selectedItems || createState.selectedItems?.length <= 1) {
            return Promise.all([
                api.getFilters(createState.selectedItems?.length === 1 ? createState.selectedItems[0].tag : '*'),
                api.flipFilters(createState.selectedItems?.length === 1 ? createState.selectedItems[0].tag : '*')
            ]).then(filters => {
                let result = [...(filters[0] || []), ...(filters[1] || [])]
                setFilters(result)
                return result
            })
        } else {
            let promises: Promise<FilterOptions[]>[] = []
            createState.selectedItems.forEach(item => {
                promises.push(api.getFilters(item.tag))
                promises.push(api.flipFilters(item.tag))
            })
            return Promise.all(promises).then(filters => {
                let groupedFilters: FilterOptions[][] = []
                for (let i = 0; i < filters.length; i += 2) {
                    groupedFilters.push([...filters[i], ...filters[i + 1]])
                }

                const intersect2 = (a: FilterOptions[], b: FilterOptions[]) => a.filter(x => b.some(y => y.name === x.name))
                const intersect = (arrOfArrays: FilterOptions[][]) =>
                    arrOfArrays[1] === undefined ? arrOfArrays[0] : intersect([intersect2(arrOfArrays[0], arrOfArrays[1]), ...arrOfArrays.slice(2)])

                var intersecting = intersect(groupedFilters)
                setFilters(intersecting)

                return intersecting
            })
        }
    }

    let getButtonVariant = (range: string): string => {
        return range === createState.type ? 'primary' : 'secondary'
    }

    return (
        <div>
            <ToggleButtonGroup
                style={{ maxWidth: '200px', marginBottom: '5px' }}
                type="radio"
                name="options"
                value={createState.type}
                onChange={newType => {
                    setCreateState({ ...createState, type: newType })
                }}
            >
                <ToggleButton id="newRestrictionWhitelistToggleButton" value={'blacklist'} variant={getButtonVariant('blacklist')} size="sm">
                    Blacklist
                </ToggleButton>
                <ToggleButton id="newRestrictionBlacklistToggleButton" value={'whitelist'} variant={getButtonVariant('whitelist')} size="sm">
                    Whitelist
                </ToggleButton>
            </ToggleButtonGroup>
            <div className={styles.newRestrictionSearchbar}>
                <MultiSearch
                    onChange={items => {
                        setCreateState({
                            ...createState,
                            selectedItems: items.map(item => {
                                return {
                                    tag: item.id,
                                    name: item.dataItem.name,
                                    iconUrl: item.dataItem.iconUrl
                                }
                            })
                        })
                    }}
                    searchFunction={api.itemSearch}
                />
            </div>
            <ItemFilter
                filters={filters}
                forceOpen={true}
                onFilterChange={filter => {
                    setCreateState({ ...createState, itemFilter: filter })
                }}
                ignoreURL={true}
                autoSelect={false}
                disableLastUsedFilter={true}
                onIsValidChange={setIsFilterValid}
            />
            <TagSelect
                defaultTags={createState.tags || []}
                onTagsChange={tags => {
                    setCreateState({ ...createState, tags: tags })
                }}
            />
            <span>
                <Button
                    variant="success"
                    onClick={() => {
                        props.onSaveRestrictions(
                            (createState.selectedItems || [null]).map(item => {
                                return {
                                    type: createState.type,
                                    itemFilter: createState.itemFilter,
                                    item: item,
                                    tags: createState.tags
                                }
                            })
                        )
                    }}
                    disabled={!isFilterValid}
                >
                    Save new restriction
                </Button>
                <Button variant="danger" onClick={props.onCancel} style={{ marginLeft: '5px' }}>
                    Cancel
                </Button>
            </span>
        </div>
    )
}

export default NewRestriction
