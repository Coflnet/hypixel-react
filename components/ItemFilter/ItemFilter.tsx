'use client'
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable jsx-a11y/anchor-is-valid */
import { useEffect, useRef, useState } from 'react'
import { Badge, Button, Card, Form, Modal, Spinner } from 'react-bootstrap'
import { getItemFilterFromUrl } from '../../utils/Parser/URLParser'
import FilterElement from '../FilterElement/FilterElement'
import DeleteIcon from '@mui/icons-material/Delete'
import HelpIcon from '@mui/icons-material/Help'
import AddIcon from '@mui/icons-material/AddCircleOutline'
import { camelCaseToSentenceCase, convertTagToName } from '../../utils/Formatter'
import { FilterType, hasFlag } from '../FilterElement/FilterType'
import { Typeahead } from 'react-bootstrap-typeahead'
import styles from './ItemFilter.module.css'
import { btoaUnicode } from '../../utils/Base64Utils'
import { LAST_USED_FILTER } from '../../utils/SettingsUtils'
import ModAdvert from './ModAdvert'
import { isClientSideRendering } from '../../utils/SSRUtils'
import { usePathname, useRouter } from 'next/navigation'

interface Props {
    onFilterChange?(filter?: ItemFilter): void
    filters?: FilterOptions[]
    forceOpen?: boolean
    ignoreURL?: boolean
    autoSelect?: boolean
    defaultFilter?: ItemFilter
    disableLastUsedFilter?: boolean
    showModAdvert?: boolean
    onIsValidChange?(newIsValid: boolean)
}

const groupedFilter = [
    ['Enchantment', 'EnchantLvl'],
    ['SecondEnchantment', 'SecondEnchantLvl']
]

function ItemFilter(props: Props) {
    let router = useRouter()
    let pathname = usePathname()
    let [itemFilter, _setItemFilter] = useState<ItemFilter>({})
    let [expanded, setExpanded] = useState(props.forceOpen || false)
    let [selectedFilters, setSelectedFilters] = useState<string[]>([])
    let [showInfoDialog, setShowInfoDialog] = useState(false)
    let [invalidFilters, _setInvalidFilters] = useState(new Set<string>())

    let typeaheadRef = useRef(null)

    useEffect(() => {
        if (props.filters && props.filters.length > 0) {
            initFilter()
        }
    }, [JSON.stringify(props.filters)])

    function initFilter() {
        if (props.ignoreURL && !props.defaultFilter) {
            return
        }
        itemFilter = props.defaultFilter
            ? JSON.parse(JSON.stringify(props.defaultFilter))
            : getPrefillFilter(props.filters, props.ignoreURL, props.disableLastUsedFilter)
        if (Object.keys(itemFilter).length > 0) {
            setExpanded(true)
            Object.keys(itemFilter).forEach(name => {
                if (!props.filters?.find(f => f.name === name)) {
                    delete itemFilter[name]
                    return
                }
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

    function setUrlFilterString(itemFilterString: string) {
        if (isClientSideRendering()) {
            let searchParams = new URLSearchParams(window.location.search)
            searchParams.set('itemFilter', itemFilterString)
            router.replace(`${pathname}?${searchParams.toString()}`)
            window.history.replaceState(null, '', `${pathname}?${searchParams.toString()}`)
        } else {
            console.error('Tried to update url query "itemFilter" during serverside rendering')
        }
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
        onFilterChange({})
    }

    function onFilterRemoveClick(filterName: string) {
        if (invalidFilters.has(filterName)) {
            let newInvalidFilters = new Set(invalidFilters)
            newInvalidFilters.delete(filterName)
            setInvalidFilters(newInvalidFilters)
        }
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
        _setItemFilter({ ...itemFilter })
        updateURLQuery(itemFilter)
    }

    let updateURLQuery = (filter?: ItemFilter) => {
        if (props.ignoreURL) {
            return
        }

        let filterString = filter && JSON.stringify(filter) === '{}' ? undefined : btoaUnicode(JSON.stringify(filter))
        setUrlFilterString(filterString || '')
    }

    function onFilterChange(filter: ItemFilter) {
        let filterCopy = { ...filter }

        let valid = true
        Object.keys(filterCopy).forEach(key => {
            if (!checkForValidGroupedFilter(key, filterCopy)) {
                valid = false
                return
            }
        })

        if (!valid) {
            return
        }

        setItemFilter(filterCopy!)
        if (!props.disableLastUsedFilter) {
            localStorage.setItem(LAST_USED_FILTER, JSON.stringify(filterCopy))
        }
        if (props.onFilterChange) {
            Object.keys(filterCopy).forEach(key => {
                if (filterCopy[key] === '' || filterCopy[key] === null) {
                    delete filterCopy[key]
                }
            })
            props.onFilterChange(filterCopy)
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

    function onIsValidChange(filterName: string, newIsValid: boolean) {
        let newInvalidFilters = new Set(invalidFilters)
        if (newIsValid) {
            newInvalidFilters.delete(filterName)
        } else {
            newInvalidFilters.add(filterName)
        }
        setInvalidFilters(newInvalidFilters)
    }

    function setInvalidFilters(newInvalidFilters: Set<string>) {
        if (props.onIsValidChange) {
            props.onIsValidChange(newInvalidFilters.size === 0)
        }
        _setInvalidFilters(newInvalidFilters)
    }

    function getDefaultValue(filterName: string): string {
        let options = props.filters?.find(f => f.name === filterName)
        let defaultValue: any = ''
        if (options && options.options[0] !== null && options.options[0] !== undefined) {
            // dont set the first option for search-selects
            if ((hasFlag(options.type, FilterType.EQUAL) && hasFlag(options.type, FilterType.SIMPLE)) || hasFlag(options.type, FilterType.BOOLEAN)) {
                defaultValue = options.options[0]
                if (options.name === 'Everything') {
                    defaultValue = 'true'
                }
            }
        }
        if (filterName === 'Color') {
            defaultValue = '#000000'
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
                <FilterElement
                    onFilterChange={onFilterElementChange}
                    options={options}
                    defaultValue={defaultValue}
                    onIsValidChange={newValue => onIsValidChange(filterName, newValue)}
                />
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
                        <h4>Item Filter Information</h4>
                    </Modal.Header>
                    <Modal.Body>
                        <p>
                            You can add various filters depending on the item type. The graph and recent/active auctions will be updated to only include items
                            with the selected properties.
                        </p>
                        <hr />
                        <h4>
                            <Badge bg="danger">Caution</Badge>
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
                        {props.showModAdvert ? <ModAdvert /> : null}
                        <Form style={{ marginBottom: '5px' }}>
                            <Form.Group>
                                {props?.filters && props.filters?.length > 0 ? (
                                    <Typeahead
                                        id="add-filter-typeahead"
                                        autoFocus={
                                            props.autoSelect === undefined
                                                ? Object.keys(getPrefillFilter(props.filters, props.ignoreURL, props.disableLastUsedFilter)).length === 0
                                                : props.autoSelect
                                        }
                                        defaultOpen={
                                            props.autoSelect === undefined
                                                ? Object.keys(getPrefillFilter(props.filters, props.ignoreURL, props.disableLastUsedFilter)).length === 0
                                                : props.autoSelect
                                        }
                                        ref={typeaheadRef}
                                        placeholder="Add filter"
                                        className={styles.addFilterSelect}
                                        onChange={addFilter}
                                        options={props.filters}
                                        labelKey={filter => {
                                            let name = (filter as Record<string, any>).name
                                            if (name[0].toLowerCase() === name[0]) {
                                                return convertTagToName(name)
                                            }
                                            return camelCaseToSentenceCase(name)
                                        }}
                                        filterBy={(option, props) => {
                                            let searchString = props.text.replace(/\s/g, '').toLowerCase()
                                            let name = (props.labelKey as Function)(option).toLowerCase()
                                            let initials = name.match(/\b\w/g).join('')
                                            let description = (option as any).description ? (option as any).description.replace(/\s/g, '').toLowerCase() : ''

                                            return (
                                                name.replace(/\s/g, '').includes(searchString) ||
                                                initials.includes(searchString) ||
                                                description.includes(searchString)
                                            )
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

export function getPrefillFilter(filterOptions: FilterOptions[] = [], ignoreURL: boolean = false, disableLastUsedFilter: boolean = false) {
    let itemFilter = !ignoreURL ? getItemFilterFromUrl() : {}
    if (Object.keys(itemFilter).length === 0 && !disableLastUsedFilter) {
        itemFilter = getFilterFromLocalStorage(filterOptions) || {}
    }
    return itemFilter
}

/**
 * Gets the last used filter from the local storage and removes all properties not available in the allowed filters
 * @returns the filter or null if no last used filter is found
 */
function getFilterFromLocalStorage(filterOptions: FilterOptions[] = []): ItemFilter | null {
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
