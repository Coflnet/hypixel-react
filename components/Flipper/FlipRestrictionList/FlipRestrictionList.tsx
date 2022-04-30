import React, { useEffect, useState } from 'react'
import { Button, Badge, Card, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import api from '../../../api/ApiHelper'
import { getStyleForTier } from '../../../utils/Formatter'
import { useForceUpdate } from '../../../utils/Hooks'
import { getSettingsObject, RESTRICTIONS_SETTINGS_KEY, setSetting } from '../../../utils/SettingsUtils'
import ItemFilter from '../../ItemFilter/ItemFilter'
import Search from '../../Search/Search'
import { Delete as DeleteIcon } from '@mui/icons-material'
import ItemFilterPropertiesDisplay from '../../ItemFilter/ItemFilterPropertiesDisplay'
import styles from './FlipRestrictionList.module.css'
import priceRangeStyles from '../../ItemPriceRange/ItemPriceRange.module.css'

interface Props {
    onRestrictionsChange(restrictions: FlipRestriction[], type: 'whitelist' | 'blacklist')
}

function FlipRestrictionList(props: Props) {
    let [newRestriction, setNewRestriction] = useState<FlipRestriction>({ type: 'blacklist' })
    let [isAddNewFlipperExtended, setIsNewFlipperExtended] = useState(false)
    let [restrictions, setRestrictions] = useState<FlipRestriction[]>(getSettingsObject<FlipRestriction[]>(RESTRICTIONS_SETTINGS_KEY, []))
    let [filters, setFilters] = useState<FilterOptions[]>()

    let forceUpdate = useForceUpdate()

    useEffect(() => {
        loadFilters()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function loadFilters() {
        Promise.all([
            api.filterFor({ tag: newRestriction.item ? newRestriction.item.tag : '*' }),
            api.flipFilters({ tag: newRestriction.item ? newRestriction.item.tag : '*' })
        ]).then(filters => {
            setFilters([...filters[0], ...filters[1]])
        })
    }

    function onSearchResultClick(item: SearchResultItem) {
        if (item.type !== 'item') {
            return
        }
        newRestriction.item = item.dataItem as Item
        newRestriction.item.tag = item.id
        setNewRestriction(newRestriction)
        loadFilters()
        forceUpdate()
    }

    function onFilterChange(filter: ItemFilter) {
        let restriction = newRestriction
        restriction.itemFilter = filter
        setNewRestriction(restriction)
    }

    function addNewRestriction() {
        restrictions.push(newRestriction)

        let restriction: FlipRestriction = { type: 'blacklist' }
        setNewRestriction(restriction)
        setIsNewFlipperExtended(false)

        setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(restrictions)))

        if (props.onRestrictionsChange) {
            props.onRestrictionsChange(getCleanRestrictionsForApi(restrictions), newRestriction.type)
        }

        forceUpdate()
    }

    function onNewRestrictionCancel() {
        let restriction: FlipRestriction = { type: 'blacklist' }
        setNewRestriction(restriction)
        setIsNewFlipperExtended(false)
    }

    function onRestrictionTypeChange(value) {
        let restriction = newRestriction
        restriction.type = value
        setNewRestriction(restriction)
        forceUpdate()
    }

    let getButtonVariant = (range: string): string => {
        return range === newRestriction.type ? 'primary' : 'secondary'
    }

    function getNewRestrictionElement() {
        return (
            <div>
                <ToggleButtonGroup
                    style={{ maxWidth: '200px' }}
                    className={priceRangeStyles.itemPriceRange}
                    type="radio"
                    name="options"
                    value={newRestriction.type}
                    onChange={onRestrictionTypeChange}
                >
                    <ToggleButton value={'blacklist'} variant={getButtonVariant('blacklist')} size="sm">
                        Blacklist
                    </ToggleButton>
                    <ToggleButton value={'whitelist'} variant={getButtonVariant('whitelist')} size="sm">
                        Whitelist
                    </ToggleButton>
                </ToggleButtonGroup>
                <Search
                    selected={newRestriction.item}
                    type="item"
                    backgroundColor="#404040"
                    searchFunction={api.itemSearch}
                    onSearchresultClick={onSearchResultClick}
                    hideNavbar={true}
                    placeholder="Search item"
                    preventDisplayOfPreviousSearches={true}
                />
                <ItemFilter filters={filters} forceOpen={true} onFilterChange={onFilterChange} ignoreURL={true} />
                <span>
                    <Button variant="success" onClick={addNewRestriction}>
                        Save new restriction
                    </Button>
                    <Button variant="danger" onClick={onNewRestrictionCancel} style={{ marginLeft: '5px' }}>
                        Cancel
                    </Button>
                </span>
            </div>
        )
    }

    function removeRestrictionByIndex(restriction: FlipRestriction, index: number) {
        restrictions.splice(index, 1)
        setRestrictions(restrictions)

        setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(restrictions)))

        if (props.onRestrictionsChange) {
            props.onRestrictionsChange(getCleanRestrictionsForApi(restrictions), restriction.type)
        }

        forceUpdate()
    }

    /**
     * Removes private properties starting with a _ from the restrictions, because the backend cant handle these.
     * These also have to be saved into the localStorage because they could get sent to the api from there
     * @param restrictions The restrictions
     * @returns A new array containing restrictions without private properties
     */
    function getCleanRestrictionsForApi(restrictions: FlipRestriction[]) {
        return restrictions.map(restriction => {
            let newRestriction = {
                type: restriction.type,
                item: restriction.item
            } as FlipRestriction

            if (restriction.itemFilter) {
                newRestriction.itemFilter = {}
                Object.keys(restriction.itemFilter).forEach(key => {
                    if (!key.startsWith('_')) {
                        newRestriction.itemFilter![key] = restriction.itemFilter![key]
                    }
                })
            }
            return newRestriction
        })
    }

    let addIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-plus-circle" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
        </svg>
    )

    return (
        <div>
            {isAddNewFlipperExtended ? (
                getNewRestrictionElement()
            ) : (
                <span style={{ cursor: 'pointer' }} onClick={() => setIsNewFlipperExtended(true)}>
                    {addIcon}
                    <span> Add new restriction</span>
                </span>
            )}
            <hr />
            <div className={styles.restrictionList}>
                {restrictions.map((restriction, index) => {
                    return (
                        <Card key={index} className={styles.restriction}>
                            <Card.Header style={{ padding: '10px', display: 'flex', justifyContent: 'space-between' }}>
                                <Badge style={{ marginRight: '10px' }} variant={restriction.type === 'blacklist' ? 'danger' : 'success'}>
                                    {restriction.type.toUpperCase()}
                                </Badge>
                                {restriction.item ? (
                                    <div className="ellipse" style={{ width: '-webkit-fill-available', float: 'left' }}>
                                        <img
                                            crossOrigin="anonymous"
                                            src={restriction.item?.iconUrl}
                                            height="24"
                                            alt=""
                                            style={{ marginRight: '5px' }}
                                            loading="lazy"
                                        />
                                        <span style={getStyleForTier(restriction.item?.tier)}>{restriction.item?.name}</span>
                                    </div>
                                ) : (
                                    ''
                                )}
                                <div className={styles.removeFilter} onClick={() => removeRestrictionByIndex(restriction, index)}>
                                    <DeleteIcon color="error" />
                                </div>
                            </Card.Header>
                            {restriction.itemFilter ? (
                                <Card.Body>
                                    <ItemFilterPropertiesDisplay filter={restriction.itemFilter} />
                                </Card.Body>
                            ) : (
                                ''
                            )}
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}

export default FlipRestrictionList
