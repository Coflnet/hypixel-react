import React, { useEffect, useState } from 'react'
import { Badge, Card, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import api from '../../../api/ApiHelper'
import { getStyleForTier } from '../../../utils/Formatter'
import { useForceUpdate } from '../../../utils/Hooks'
import { getSettingsObject, RESTRICTIONS_SETTINGS_KEY, setSetting } from '../../../utils/SettingsUtils'
import { Delete as DeleteIcon, Edit as EditIcon, Save as SaveIcon, ControlPointDuplicate as DuplicateIcon } from '@mui/icons-material'
import ItemFilterPropertiesDisplay from '../../ItemFilter/ItemFilterPropertiesDisplay'
import styles from './FlipRestrictionList.module.css'
import EditRestriction from './EditRestriction/EditRestriction'
import NewRestriction from './NewRestriction/NewRestriction'
import { CUSTOM_EVENTS } from '../../../api/ApiTypes.d'
import Tooltip from '../../Tooltip/Tooltip'

interface Props {
    onRestrictionsChange(restrictions: FlipRestriction[], type: 'whitelist' | 'blacklist')
}

function FlipRestrictionList(props: Props) {
    let [newRestriction, setNewRestriction] = useState<FlipRestriction>({ type: 'blacklist' })
    let [isAddNewFlipperExtended, setIsNewFlipperExtended] = useState(false)
    let [restrictions, setRestrictions] = useState<FlipRestriction[]>(getSettingsObject<FlipRestriction[]>(RESTRICTIONS_SETTINGS_KEY, []))
    let [filters, setFilters] = useState<FilterOptions[]>()
    let [restrictionInEditModeIndex, setRestrictionsInEditModeIndex] = useState<number[]>([])

    let forceUpdate = useForceUpdate()

    useEffect(() => {
        loadFilters()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function loadFilters() {
        Promise.all([
            api.getFilters(newRestriction.item ? newRestriction.item.tag : '*'),
            api.flipFilters(newRestriction.item ? newRestriction.item.tag : '*')
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
        restriction.itemFilter = { ...filter }
        setNewRestriction(restriction)
    }

    function addNewRestriction() {
        restrictions.push(newRestriction)

        let restriction: FlipRestriction = { type: 'blacklist' }
        setNewRestriction(restriction)
        setIsNewFlipperExtended(false)

        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.FLIP_SETTINGS_CHANGE))

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

    function onRestrictionTypeChange(value: 'blacklist' | 'whitelist') {
        let restriction = newRestriction
        restriction.type = value
        setNewRestriction(restriction)
        forceUpdate()
    }

    function addEditedFilter() {
        restrictionInEditModeIndex.forEach(index => {
            Object.keys(newRestriction.itemFilter).forEach(key => {
                if (restrictions[index].itemFilter[key] === undefined) {
                    restrictions[index].itemFilter[key] = newRestriction.itemFilter[key]
                }
            })
            restrictions[index].isEdited = false
        })
        restrictionInEditModeIndex = []

        setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(restrictions)))
        if (props.onRestrictionsChange) {
            props.onRestrictionsChange(getCleanRestrictionsForApi(restrictions), 'blacklist')
            props.onRestrictionsChange(getCleanRestrictionsForApi(restrictions), 'whitelist')
        }

        setRestrictionsInEditModeIndex(restrictionInEditModeIndex)
        setRestrictions(restrictions)
        forceUpdate()
    }

    function overrideEditedFilter() {
        restrictionInEditModeIndex.forEach(index => {
            restrictions[index].itemFilter = { ...newRestriction.itemFilter }
            restrictions[index].isEdited = false
        })

        restrictionInEditModeIndex = []

        setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(restrictions)))
        if (props.onRestrictionsChange) {
            props.onRestrictionsChange(getCleanRestrictionsForApi(restrictions), 'blacklist')
            props.onRestrictionsChange(getCleanRestrictionsForApi(restrictions), 'whitelist')
        }

        setRestrictionsInEditModeIndex(restrictionInEditModeIndex)
        setRestrictions(restrictions)
        forceUpdate()
    }

    function removeRestrictionByIndex(restriction: FlipRestriction, index: number) {
        restrictions.splice(index, 1)
        setRestrictions(restrictions)

        setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(restrictions)))

        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.FLIP_SETTINGS_CHANGE))

        if (props.onRestrictionsChange) {
            props.onRestrictionsChange(getCleanRestrictionsForApi(restrictions), restriction.type)
        }

        setRestrictions(restrictions)
        forceUpdate()
    }

    function createDuplicate(restriction: FlipRestriction, index: number) {
        let duplicate = { ...restriction }
        restrictions.splice(index + 1, 0, duplicate)
        setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(restrictions)))
        if (props.onRestrictionsChange) {
            props.onRestrictionsChange(getCleanRestrictionsForApi(restrictions), 'whitelist')
            props.onRestrictionsChange(getCleanRestrictionsForApi(restrictions), 'blacklist')
        }
        setRestrictions(restrictions)
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

    function saveRestrictionEdit(restriction: FlipRestriction, index: number) {
        restriction.isEdited = false
        let i = restrictionInEditModeIndex.indexOf(index)
        restrictionInEditModeIndex.splice(i, 1)
        setRestrictionsInEditModeIndex(restrictionInEditModeIndex)
        setRestrictions(restrictions)
        forceUpdate()
    }

    function editRestriction(restriction: FlipRestriction, index: number) {
        if (restrictionInEditModeIndex.length === 0) {
            newRestriction.itemFilter = { ...restriction.itemFilter }
            setNewRestriction(newRestriction)
        }

        Promise.all([api.getFilters(restriction.item ? restriction.item.tag : '*'), api.flipFilters(restriction.item ? restriction.item.tag : '*')]).then(
            res => {
                let newFilters = [...res[0], ...res[1]]

                if (restrictionInEditModeIndex.length === 0) {
                    setFilters(filters)
                } else {
                    // as there is already a restriction selected for edit
                    // we have to remove filters that dont match with the newly selected restriction
                    var intersectingNames = filters.map(f => f.name).filter(x => newFilters.map(f => f.name).includes(x))
                    setFilters(filters.filter(f => intersectingNames.includes(f.name)))
                }

                restriction.isEdited = true
                restrictionInEditModeIndex.push(index)
                setRestrictionsInEditModeIndex(restrictionInEditModeIndex)
                forceUpdate()
            }
        )
    }

    function changeRestrictionType(restriction: FlipRestriction, type: 'whitelist' | 'blacklist') {
        restriction.type = type
        setRestrictions(restrictions)
        setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(restrictions)))
        if (props.onRestrictionsChange) {
            props.onRestrictionsChange(getCleanRestrictionsForApi(restrictions), type)
        }
        forceUpdate()
    }

    let addIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-plus-circle" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
        </svg>
    )

    return (
        <>
            <div style={{ position: 'sticky', top: 0, backgroundColor: '#303030', padding: '10px 20px 0  20px', zIndex: 10 }}>
                {restrictionInEditModeIndex.length > 0 ? (
                    <EditRestriction
                        addEditedFilter={addEditedFilter}
                        filters={filters}
                        newRestriction={newRestriction}
                        onFilterChange={onFilterChange}
                        onNewRestrictionCancel={onNewRestrictionCancel}
                        onSearchResultClick={onSearchResultClick}
                        overrideEditedFilter={overrideEditedFilter}
                    />
                ) : isAddNewFlipperExtended ? (
                    <NewRestriction
                        filters={filters}
                        newRestriction={newRestriction}
                        onFilterChange={onFilterChange}
                        onNewRestrictionCancel={onNewRestrictionCancel}
                        onRestrictionTypeChange={onRestrictionTypeChange}
                        onSearchResultClick={onSearchResultClick}
                        addNewRestriction={addNewRestriction}
                    />
                ) : (
                    <span style={{ cursor: 'pointer' }} onClick={() => setIsNewFlipperExtended(true)}>
                        {addIcon}
                        <span> Add new restriction</span>
                    </span>
                )}
                <hr />
            </div>
            <div className={styles.restrictionList}>
                {restrictions.map((restriction, index) => {
                    return (
                        <Card className={`${styles.restriction} ${restriction.isEdited ? styles.restrictionMarkedAsEdit : null}`}>
                            <Card.Header style={{ padding: '10px', display: 'flex', justifyContent: 'space-between' }}>
                                {restriction.isEdited ? (
                                    <ToggleButtonGroup
                                        style={{ maxWidth: '200px', marginBottom: '5px' }}
                                        type="radio"
                                        name="options"
                                        value={restriction.type}
                                        onChange={newValue => {
                                            changeRestrictionType(restriction, newValue)
                                        }}
                                    >
                                        <ToggleButton value={'blacklist'} variant={restriction.type === 'blacklist' ? 'primary' : 'secondary'} size="sm">
                                            Blacklist
                                        </ToggleButton>
                                        <ToggleButton value={'whitelist'} variant={restriction.type === 'whitelist' ? 'primary' : 'secondary'} size="sm">
                                            Whitelist
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                ) : (
                                    <Badge style={{ marginRight: '10px' }} variant={restriction.type === 'blacklist' ? 'danger' : 'success'}>
                                        {restriction.type.toUpperCase()}
                                    </Badge>
                                )}
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
                                    <div className="ellipse" style={{ width: '-webkit-fill-available', float: 'left' }}></div>
                                )}
                                {restriction.isEdited ? (
                                    <div
                                        className={styles.cancelEditButton}
                                        onClick={() => {
                                            saveRestrictionEdit(restriction, index)
                                        }}
                                    >
                                        <Tooltip type="hover" content={<SaveIcon />} tooltipContent={<p>Save</p>} />
                                    </div>
                                ) : (
                                    <div
                                        className={styles.editButton}
                                        onClick={() => {
                                            editRestriction(restriction, index)
                                        }}
                                    >
                                        <Tooltip type="hover" content={<EditIcon />} tooltipContent={<p>Edit restriction</p>} />
                                    </div>
                                )}
                                {restrictionInEditModeIndex.length === 0 ? (
                                    <div style={{ display: 'flex' }}>
                                        <div className={styles.removeFilter} onClick={() => createDuplicate(restriction, index)}>
                                            <Tooltip type="hover" content={<DuplicateIcon />} tooltipContent={<p>Create duplicate</p>} />
                                        </div>
                                        <div className={styles.removeFilter} onClick={() => removeRestrictionByIndex(restriction, index)}>
                                            <Tooltip type="hover" content={<DeleteIcon color="error" />} tooltipContent={<p>Remove restriction</p>} />
                                        </div>
                                    </div>
                                ) : null}
                            </Card.Header>
                            {restriction.itemFilter ? (
                                <Card.Body>
                                    <ItemFilterPropertiesDisplay
                                        filter={restriction.itemFilter}
                                        onAfterEdit={
                                            restriction.isEdited
                                                ? filter => {
                                                      restriction.itemFilter = { ...filter }
                                                      setRestrictions(restrictions)
                                                      setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(restrictions)))

                                                      if (props.onRestrictionsChange) {
                                                          props.onRestrictionsChange(getCleanRestrictionsForApi(restrictions), newRestriction.type)
                                                      }

                                                      forceUpdate()
                                                  }
                                                : null
                                        }
                                    />
                                </Card.Body>
                            ) : null}
                        </Card>
                    )
                })}
            </div>
        </>
    )
}

export default FlipRestrictionList
