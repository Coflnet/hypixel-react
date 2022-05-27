/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useRef, useState } from 'react'
import { Badge, Button, Card, Form, Modal, Spinner } from 'react-bootstrap'
import { getItemFilterFromUrl } from '../../utils/Parser/URLParser'
import FilterElement from '../FilterElement/FilterElement'
import { AddCircleOutline as AddIcon, Help as HelpIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { camelCaseToSentenceCase } from '../../utils/Formatter'
import { FilterType, hasFlag } from '../FilterElement/FilterType'
import { Typeahead } from 'react-bootstrap-typeahead'
import styles from './ItemFilter.module.css'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { btoaUnicode } from '../../utils/Base64Utils'
import { LAST_USED_FILTER } from '../../utils/SettingsUtils'

interface Props {
    onFilterChange?(filter?: ItemFilter): void
    filters?: FilterOptions[]
    forceOpen?: boolean
    ignoreURL?: boolean
}

const groupedFilter = [
    ['Enchantment', 'EnchantLvl'],
    ['SecondEnchantment', 'SecondEnchantLvl']
]

function ItemFilter(props: Props) {
    let [itemFilter, _setItemFilter] = useState<ItemFilter>({})
    let [expanded, setExpanded] = useState(props.forceOpen || false)
    let [selectedFilters, setSelectedFilters] = useState<string[]>([])
    let [showInfoDialog, setShowInfoDialog] = useState(false)

    let typeaheadRef = useRef(null)

    let router = useRouter()

    useEffect(() => {
        initFilter()
    }, [JSON.stringify(props.filters)])

    function initFilter() {
        itemFilter = getPrefillFilter(props.filters, props.ignoreURL)
        if (Object.keys(itemFilter).length > 0) {
            setExpanded(true)
            Object.keys(itemFilter).forEach(name => {
                enableFilter(name)
                getGroupedFilter(name).forEach(filter => enableFilter(filter))
            })
            setItemFilter(itemFilter)
            onFilterChange(itemFilter)
        }
    }

    function getGroupedFilter(filterName: string): string[] {
        let result: string[] = []

        let index = groupedFilter.findIndex(group => {
            let groupIndex = group.findIndex(element => {
                return filterName === element
            })
            return groupIndex !== -1
        })

        if (index !== -1) {
            let groupToEnable = groupedFilter[index]
            groupToEnable.forEach(filter => {
                if (filter !== filterName) {
                    result.push(filter)
                }
            })
        }

        return result
    }

    let enableFilter = (filterName: string) => {
        if (selectedFilters.some(n => n === filterName)) {
            return
        }

        selectedFilters = [...selectedFilters, filterName]
        setSelectedFilters(selectedFilters)

        if (itemFilter[filterName] === undefined) {
            itemFilter[filterName] = getDefaultValue(filterName)
        }

        updateURLQuery(itemFilter)
        setItemFilter(itemFilter)
    }

    let addFilter = ([selectedFilter]: FilterOptions[]) => {
        if (!selectedFilter) {
            return
        }

        if (typeaheadRef.current && (typeaheadRef.current as any).clear && (typeaheadRef.current as any).blur) {
            ;(typeaheadRef!.current as any).clear()
            ;(typeaheadRef!.current as any).blur()
        }

        enableFilter(selectedFilter.name)
        getGroupedFilter(selectedFilter.name).forEach(filter => enableFilter(filter))
    }

    let onFilterClose = () => {
        setSelectedFilters([])
        setExpanded(false)
        setItemFilter({})
    }

    function onFilterRemoveClick(filterName: string) {
        removeFilter(filterName)
        getGroupedFilter(filterName).forEach(filter => removeFilter(filter))
    }

    function removeFilter(filterName: string) {
        if (itemFilter) {
            delete itemFilter[filterName]
            setItemFilter(itemFilter)
            updateURLQuery(itemFilter)
            onFilterChange(itemFilter)
        }
        let newSelectedFilters = selectedFilters.filter(f => f !== filterName)
        selectedFilters = newSelectedFilters
        setSelectedFilters(newSelectedFilters)
    }

    let onEnable = () => {
        setExpanded(true)
        if (!itemFilter) {
            itemFilter = {}
            setItemFilter(itemFilter)
        }
        updateURLQuery(itemFilter)
    }

    let setItemFilter = (itemFilter: ItemFilter) => {
        _setItemFilter(itemFilter)
        updateURLQuery(itemFilter)
    }

    let updateURLQuery = (filter?: ItemFilter) => {
        if (props.ignoreURL) {
            return
        }

        let filterString = filter && JSON.stringify(filter) === '{}' ? undefined : btoaUnicode(JSON.stringify(filter))

        router.query.itemFilter = filterString || ''
        router.replace(router.asPath, undefined, { shallow: true })
    }

    function onFilterChange(filter: ItemFilter) {
        let valid = true
        Object.keys(filter).forEach(key => {
            if (!checkForValidGroupedFilter(key, filter)) {
                valid = false
                return
            }
        })

        if (!valid) {
            return
        }

        setItemFilter(filter!)
        localStorage.setItem(LAST_USED_FILTER, JSON.stringify(filter))
        if (props.onFilterChange) {
            props.onFilterChange(filter)
        }
    }

    function checkForValidGroupedFilter(filterName: string, filter: ItemFilter): boolean {
        let groupFilters = getGroupedFilter(filterName)

        let invalid = false
        groupFilters.forEach(name => {
            if (filter[name] === undefined || filter[name] === null) {
                invalid = true
            }
        })

        return !invalid
    }

    function onFilterElementChange(filter?: ItemFilter) {
        let newFilter = itemFilter
        var keys = Object.keys(filter as object)
        if (keys.length > 0) {
            var key = keys[0]
            newFilter![key] = filter![key]
        }

        if ((newFilter.EnchantLvl || newFilter.Enchantment) && !(newFilter.EnchantLvl && newFilter.Enchantment)) {
            return
        }

        onFilterChange(newFilter)
    }

    function getDefaultValue(filterName: string): string {
        let options = props.filters?.find(f => f.name === filterName)
        let defaultValue: any = ''
        if (options && options.options[0] !== null && options.options[0] !== undefined) {
            // dont set the first option for search-selects
            if (!(hasFlag(options.type, FilterType.EQUAL) && !hasFlag(options.type, FilterType.SIMPLE))) {
                defaultValue = options.options[0]
            }
        }
        return defaultValue
    }

    let filterList = selectedFilters.map(filterName => {
        let options = props.filters?.find(f => f.name === filterName)
        if (!options) {
            return null
        }

        let defaultValue = getDefaultValue(filterName)
        if (itemFilter[filterName]) {
            defaultValue = itemFilter[filterName]
        }
        return (
            <div key={filterName} className={styles.filterElement}>
                <FilterElement onFilterChange={onFilterElementChange} options={options} defaultValue={defaultValue} />
                <div className={styles.removeFilter} onClick={() => onFilterRemoveClick(filterName)}>
                    <DeleteIcon color="error" />
                </div>
            </div>
        )
    })

    let infoIconElement = (
        <div>
            <span
                style={{ cursor: 'pointer', position: 'absolute', top: '10px', right: '10px', color: '#007bff' }}
                onClick={() => {
                    setShowInfoDialog(true)
                }}
            >
                <HelpIcon />
            </span>
            {showInfoDialog ? (
                <Modal
                    show={showInfoDialog}
                    onHide={() => {
                        setShowInfoDialog(false)
                    }}
                >
                    <Modal.Header closeButton>
                        <h4>Item-Filter Information</h4>
                    </Modal.Header>
                    <Modal.Body>
                        <p>
                            You can add various filters depending on the item type. The graph and recent/active auctions will be updated to only include items
                            with the selected properties.
                        </p>
                        <hr />
                        <h4>
                            <Badge variant="danger">Caution</Badge>
                        </h4>
                        <p>
                            Some filter requests take quite some time to process. That's because we have to search through millions of auctions that potentially
                            match your filter. This can lead to no auctions being displayed at all because your browser thinks that our server is unavailable.
                            If that happens please let us know. We may implement scheduled filters where you will get an email or push notification when we
                            computed a result for your filter.
                        </p>
                        <p>
                            If you are missing a filter please ask for it on our{' '}
                            <a target="_blank" rel="noreferrer" href="https://discord.gg/wvKXfTgCfb">
                                Discord
                            </a>
                            .
                        </p>
                    </Modal.Body>
                </Modal>
            ) : (
                ''
            )}
        </div>
    )

    return (
        <div className={styles.itemFilter}>
            {!expanded ? (
                <div>
                    <a href="#" onClick={() => onEnable()}>
                        <AddIcon />
                        <span> Add Filter</span>
                    </a>
                </div>
            ) : (
                <Card>
                    <Card.Title style={{ margin: '10px' }}>
                        Filter
                        {infoIconElement}
                    </Card.Title>
                    <Card.Body>
                        <Form style={{ marginBottom: '5px' }}>
                            <Form.Group>
                                {props?.filters && props.filters?.length > 0 ? (
                                    <Typeahead
                                        id="add-filter-typeahead"
                                        autoFocus={Object.keys(getPrefillFilter(props.filters, props.ignoreURL)).length === 0}
                                        defaultOpen={Object.keys(getPrefillFilter(props.filters, props.ignoreURL)).length === 0}
                                        ref={typeaheadRef}
                                        placeholder="Add filter"
                                        className={styles.addFilterSelect}
                                        onChange={addFilter}
                                        options={props.filters}
                                        labelKey={filter => {
                                            return camelCaseToSentenceCase(filter.name)
                                        }}
                                    ></Typeahead>
                                ) : (
                                    <Spinner animation="border" role="status" variant="primary" />
                                )}
                            </Form.Group>
                            <div className={styles.filterContainer}>{filterList}</div>
                        </Form>
                        {props.forceOpen ? null : (
                            <div>
                                <Button variant="danger" onClick={() => onFilterClose()}>
                                    Close
                                </Button>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            )}
        </div>
    )
}
export default ItemFilter

export function getPrefillFilter(filterOptions: FilterOptions[], ignoreURL: boolean = false) {
    let itemFilter = !ignoreURL ? getItemFilterFromUrl() : {}
    if (Object.keys(itemFilter).length === 0) {
        itemFilter = getFilterFromLocalStorage(filterOptions) || {}
    }
    return itemFilter
}

/**
 * Gets the last used filter from the local storage and removes all properties not available in the allowed filters
 * @returns the filter or null if no last used filter is found
 */
function getFilterFromLocalStorage(filterOptions: FilterOptions[]): ItemFilter {
    let localStorageLastFilter = localStorage.getItem(LAST_USED_FILTER)
    if (localStorageLastFilter === null) {
        return null
    }
    let filter: ItemFilter = JSON.parse(localStorageLastFilter)
    Object.keys(filter).forEach(key => {
        if (filterOptions.findIndex(f => f.name === key) === -1) {
            delete filter[key]
        }
    })
    return filter
}
