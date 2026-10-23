'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Button, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import api from '../../../../api/ApiHelper'
import ItemFilter from '../../../ItemFilter/ItemFilter'
import TagSelect from '../TagSelect/TagSelect'
import styles from './NewRestriction.module.css'
import ApiSearchField from '../../../Search/ApiSearchField'
import { mergePickedFilter, pickSearchResult } from '../../../../utils/Search/FilterResultId'
import { CopyButton } from '../../../CopyButton/CopyButton'

interface Props {
    onSaveRestrictions(restrictions: FlipRestriction[]): void
    onCancel(): void
    prefillRestriction?: RestrictionCreateState
}

export interface RestrictionCreateState {
    selectedItems?: Item[]
    type: 'blacklist' | 'whitelist'
    itemFilter?: ItemFilter
    tags?: string[]
}

function NewRestriction(props: Props) {
    const [createState, setCreateState] = useState<RestrictionCreateState>({
        type: props.prefillRestriction ? props.prefillRestriction.type : 'blacklist',
        itemFilter: props.prefillRestriction ? props.prefillRestriction.itemFilter : undefined,
        selectedItems: props.prefillRestriction ? props.prefillRestriction.selectedItems : undefined
    })
    const [isFilterValid, setIsFilterValid] = useState(true)
    // a picked filter result is applied through a remount of the ItemFilter once the filter options of the picked item are loaded
    const applyPickedFilter = useRef(false)
    const [filterKey, setFilterKey] = useState(0)
    const [filters, setFilters] = useState<FilterOptions[]>([])
    const [showFillLastUsedItems] = useState(sessionStorage.getItem('lastUsedItemsForNewRestrictions') !== null)

    useEffect(() => {
        loadFilters()
    }, [createState.selectedItems])

    function loadFilters(): Promise<FilterOptions[]> {
        if (!createState.selectedItems || createState.selectedItems?.length <= 1) {
            return Promise.all([
                api.getFilters(createState.selectedItems?.length === 1 ? createState.selectedItems[0].tag : '*'),
                api.flipFilters(createState.selectedItems?.length === 1 ? createState.selectedItems[0].tag : '*')
            ]).then(filters => {
                const result = [...(filters[0] || []), ...(filters[1] || [])]
                setFilters(result)
                remountFilterForPickedFilter()
                return result
            })
        } else {
            const promises: Promise<FilterOptions[]>[] = []
            createState.selectedItems.forEach(item => {
                promises.push(api.getFilters(item.tag))
                promises.push(api.flipFilters(item.tag))
            })
            return Promise.all(promises).then(filters => {
                const groupedFilters: FilterOptions[][] = []
                for (let i = 0; i < filters.length; i += 2) {
                    groupedFilters.push([...filters[i], ...filters[i + 1]])
                }

                const intersect2 = (a: FilterOptions[], b: FilterOptions[]) => a.filter(x => b.some(y => y.name === x.name))
                const intersect = (arrOfArrays: FilterOptions[][]) =>
                    arrOfArrays[1] === undefined ? arrOfArrays[0] : intersect([intersect2(arrOfArrays[0], arrOfArrays[1]), ...arrOfArrays.slice(2)])

                const intersecting = intersect(groupedFilters)
                setFilters(intersecting)
                remountFilterForPickedFilter()

                return intersecting
            })
        }
    }

    function remountFilterForPickedFilter() {
        if (applyPickedFilter.current) {
            applyPickedFilter.current = false
            setFilterKey(key => key + 1)
        }
    }

    function fillLastUsedItems() {
        const lastUsedItems = JSON.parse(sessionStorage.getItem('lastUsedItemsForNewRestrictions') || '[]')
        setCreateState({ ...createState, selectedItems: lastUsedItems })
    }

    const getButtonVariant = (range: string): string => {
        return range === createState.type ? 'primary' : 'secondary'
    }

    function getEmptyLabel() {
        if (!createState.selectedItems || createState.selectedItems.length === 0) {
            return 'No matching filter found.'
        }
        if (createState.selectedItems && createState.selectedItems.length === 1) {
            return 'No matching filter found. Maybe the filter you are looking is not available for your selected item?'
        }
        return 'No matching filter found. Maybe the filter you are looking is not available for all your selected items?'
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
            <div className={styles.newRestrictionSearchbarContainer}>
                <ApiSearchField
                    multiple
                    className={styles.multiSearch}
                    onChange={items => {
                        let mergedFilter = { ...createState.itemFilter }
                        let hasPickedFilter = false
                        const selectedItems = items.map(item => {
                            const picked = pickSearchResult(item)
                            if (picked.filter) {
                                hasPickedFilter = true
                                mergedFilter = mergePickedFilter(mergedFilter, picked.filter)!
                            }
                            return picked.item
                        })
                        applyPickedFilter.current = hasPickedFilter
                        setCreateState({
                            ...createState,
                            selectedItems,
                            itemFilter: hasPickedFilter ? mergedFilter : createState.itemFilter
                        })
                    }}
                    searchFunction={api.itemSearch}
                    selected={createState.selectedItems?.map(item => {
                        return {
                            dataItem: {
                                name: item.name,
                                iconUrl: item.iconUrl
                            },
                            label: item.name,
                            id: item.tag
                        } as unknown as SearchResultItem
                    })}
                />
                {showFillLastUsedItems && <Button onClick={fillLastUsedItems}>Last used Items</Button>}
            </div>
            <ItemFilter
                key={filterKey}
                filters={filters}
                forceOpen={true}
                onFilterChange={filter => {
                    setCreateState({ ...createState, itemFilter: filter })
                }}
                defaultFilter={createState.itemFilter}
                emptyLabel={getEmptyLabel()}
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
            <span style={{ display: 'grid', gridTemplateColumns: 'max(20%,100px) max(10%,80px) auto max(20%,100px)', gap: 10 }}>
                <Button
                    variant="success"
                    onClick={() => {
                        sessionStorage.setItem('lastUsedItemsForNewRestrictions', JSON.stringify(createState.selectedItems))
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
                <Button variant="danger" onClick={props.onCancel}>
                    Cancel
                </Button>
                <div />
                <div className={styles.copyButtonContainer}>
                    <CopyButton
                        copyValue={window.location.href.split('?')[0] + '?prefillRestriction=' + JSON.stringify(createState)}
                        successMessage={<span>Copied Restriction Link</span>}
                    />
                </div>
            </span>
        </div>
    )
}

export default NewRestriction
