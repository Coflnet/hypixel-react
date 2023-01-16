import React, { useEffect, useState } from 'react'
import { Badge, Button, Card, Form, Modal, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import api from '../../../api/ApiHelper'
import { getStyleForTier } from '../../../utils/Formatter'
import { useForceUpdate } from '../../../utils/Hooks'
import { getSettingsObject, RESTRICTIONS_SETTINGS_KEY, setSetting } from '../../../utils/SettingsUtils'
import { Delete as DeleteIcon, Edit as EditIcon, Save as SaveIcon, ControlPointDuplicate as DuplicateIcon, Refresh } from '@mui/icons-material'
import ItemFilterPropertiesDisplay from '../../ItemFilter/ItemFilterPropertiesDisplay'
import styles from './FlipRestrictionList.module.css'
import EditRestriction from './EditRestriction/EditRestriction'
import NewRestriction from './NewRestriction/NewRestriction'
import { CUSTOM_EVENTS } from '../../../api/ApiTypes.d'
import Tooltip from '../../Tooltip/Tooltip'
import { toast } from 'react-toastify'

interface Props {
    onRestrictionsChange(restrictions: FlipRestriction[], type: 'whitelist' | 'blacklist')
}

function FlipRestrictionList(props: Props) {
    let [newRestriction, setNewRestriction] = useState<FlipRestriction>({ type: 'blacklist' })
    let [isAddNewFlipperExtended, setIsNewFlipperExtended] = useState(false)
    let [restrictions, setRestrictions] = useState<FlipRestriction[]>(getSettingsObject<FlipRestriction[]>(RESTRICTIONS_SETTINGS_KEY, []))
    let [filters, setFilters] = useState<FilterOptions[]>()
    let [restrictionInEditModeIndex, setRestrictionsInEditModeIndex] = useState<number[]>([])
    let [showClearListDialog, setShowClearListDialog] = useState(false)
    let [isRefreshingItemNames, setIsRefreshingItemNames] = useState(false)
    let [searchText, setSearchText] = useState('')

    let forceUpdate = useForceUpdate()

    useEffect(() => {
        loadFilters()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function loadFilters(restrictionsInEditMode: FlipRestriction[] = []): Promise<FilterOptions[]> {
        if (restrictionsInEditMode.length === 0) {
            return Promise.all([
                api.getFilters(newRestriction.item ? newRestriction.item.tag : '*'),
                api.flipFilters(newRestriction.item ? newRestriction.item.tag : '*')
            ]).then(filters => {
                let result = [...filters[0], ...filters[1]]
                setFilters(result)
                return result
            })
        } else {
            let promises: Promise<FilterOptions[]>[] = []
            restrictionsInEditMode.forEach(restriction => {
                promises.push(api.getFilters(restriction.item ? restriction.item.tag : '*'))
                promises.push(api.flipFilters(restriction.item ? restriction.item.tag : '*'))
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

    function onSearchResultClick(item: SearchResultItem) {
        if (item.type !== 'item') {
            return
        }
        newRestriction.item = item.dataItem as unknown as Item
        newRestriction.item.tag = item.id
        setNewRestriction(newRestriction)
        loadFilters()
        forceUpdate()
    }

    function onRestrictionChange(restriction: FlipRestriction) {
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
        loadFilters()
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
            restrictions[index].tags = newRestriction.tags ? [...newRestriction.tags] : []
            restrictions[index].isEdited = false
        })
        restrictionInEditModeIndex = []

        setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(restrictions)))
        if (props.onRestrictionsChange) {
            props.onRestrictionsChange(getCleanRestrictionsForApi(restrictions), 'blacklist')
            props.onRestrictionsChange(getCleanRestrictionsForApi(restrictions), 'whitelist')
        }

        loadFilters().then(() => {
            setRestrictionsInEditModeIndex(restrictionInEditModeIndex)
            setRestrictions(restrictions)
            forceUpdate()
        })
    }

    function overrideEditedFilter() {
        restrictionInEditModeIndex.forEach(index => {
            restrictions[index].itemFilter = { ...newRestriction.itemFilter }
            restrictions[index].tags = newRestriction.tags ? [...newRestriction.tags] : []
            restrictions[index].isEdited = false
        })

        restrictionInEditModeIndex = []

        setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(restrictions)))
        if (props.onRestrictionsChange) {
            props.onRestrictionsChange(getCleanRestrictionsForApi(restrictions), 'blacklist')
            props.onRestrictionsChange(getCleanRestrictionsForApi(restrictions), 'whitelist')
        }

        loadFilters().then(() => {
            setRestrictionsInEditModeIndex(restrictionInEditModeIndex)
            setRestrictions(restrictions)
            forceUpdate()
        })
    }

    function onEditRestrictionCancel() {
        restrictionInEditModeIndex.forEach(index => {
            restrictions[index].isEdited = false
        })

        loadFilters().then(() => {
            setRestrictionsInEditModeIndex([])
            setRestrictions(restrictions)
            forceUpdate()
        })
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
                item: restriction.item,
                tags: restriction.tags
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

        let restrictionsInEditMode: FlipRestriction[] = []
        restrictionInEditModeIndex.forEach(index => {
            restrictionsInEditMode.push(restrictions[index])
        })

        loadFilters(restrictionsInEditMode).then(() => {
            setRestrictionsInEditModeIndex(restrictionInEditModeIndex)
            setRestrictions(restrictions)
            setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(restrictions)))
            if (props.onRestrictionsChange) {
                props.onRestrictionsChange(getCleanRestrictionsForApi(restrictions), 'blacklist')
                props.onRestrictionsChange(getCleanRestrictionsForApi(restrictions), 'whitelist')
            }
            forceUpdate()
        })
    }

    function editRestriction(restriction: FlipRestriction, index: number) {
        if (restrictionInEditModeIndex.length === 0) {
            newRestriction.itemFilter = { ...restriction.itemFilter }
            if (restriction.tags) {
                newRestriction.tags = [...restriction.tags]
            }
            setNewRestriction(newRestriction)
        }

        restrictionInEditModeIndex.push(index)

        let restrictionsInEditMode: FlipRestriction[] = []
        restrictionInEditModeIndex.forEach(index => {
            restrictionsInEditMode.push(restrictions[index])
        })

        loadFilters(restrictionsInEditMode).then(() => {
            restriction.isEdited = true
            setRestrictions(restrictions)
            setRestrictionsInEditModeIndex(restrictionInEditModeIndex)
            forceUpdate()
        })
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

    function onClearListClick() {
        setShowClearListDialog(true)
    }

    function clearRestrictions() {
        restrictions = []
        setRestrictions([])
        setShowClearListDialog(false)

        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.FLIP_SETTINGS_CHANGE))

        setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(restrictions)))

        if (props.onRestrictionsChange) {
            props.onRestrictionsChange(getCleanRestrictionsForApi(restrictions), 'whitelist')
            props.onRestrictionsChange(getCleanRestrictionsForApi(restrictions), 'blacklist')
        }

        forceUpdate()
    }

    function refreshItemNames() {
        setIsRefreshingItemNames(true)
        let items: Item[] = []
        restrictions.forEach(restriction => {
            if (restriction.item && restriction.item.tag) {
                items.push(restriction.item)
            }
        })
        api.getItemNames(items)
            .then(itemNameMap => {
                restrictions.forEach(restriction => {
                    if (restriction.item && restriction.item.tag) {
                        restriction.item.name = itemNameMap[restriction.item.tag]
                    }
                })
                toast.success('Reloaded all item names')
                setIsRefreshingItemNames(false)
                setRestrictions(restrictions)
                setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(restrictions)))
                if (props.onRestrictionsChange) {
                    props.onRestrictionsChange(getCleanRestrictionsForApi(restrictions), 'blacklist')
                    props.onRestrictionsChange(getCleanRestrictionsForApi(restrictions), 'whitelist')
                }
            })
            .catch(() => {
                toast.error('Error reloaded item names')
            })
    }

    let clearListDialog = (
        <Modal
            show={showClearListDialog}
            onHide={() => {
                setShowClearListDialog(false)
            }}
        >
            <Modal.Header closeButton>
                <Modal.Title>Confirmation</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>Are you sure?</p>
                <p>
                    <b>This will delete all {restrictions?.length || 0} black-/whitelist entries.</b>
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button variant="danger" style={{ width: '45%' }} onClick={clearRestrictions}>
                        Clear <DeleteIcon />
                    </Button>
                    <Button
                        style={{ width: '45%' }}
                        onClick={() => {
                            setShowClearListDialog(false)
                        }}
                    >
                        Cancel
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
    )

    let addIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-plus-circle" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
        </svg>
    )

    return (
        <>
            <div style={{ position: 'sticky', top: 0, backgroundColor: '#303030', padding: '10px 20px 0 20px', zIndex: 10 }}>
                {restrictionInEditModeIndex.length > 0 ? (
                    <EditRestriction
                        addEditedFilter={addEditedFilter}
                        filters={filters}
                        newRestriction={newRestriction}
                        onRestrictionChange={onRestrictionChange}
                        onCancel={onEditRestrictionCancel}
                        onSearchResultClick={onSearchResultClick}
                        overrideEditedFilter={overrideEditedFilter}
                    />
                ) : isAddNewFlipperExtended ? (
                    <NewRestriction
                        filters={filters}
                        newRestriction={newRestriction}
                        onRestrictionChange={onRestrictionChange}
                        onCancel={onNewRestrictionCancel}
                        onRestrictionTypeChange={onRestrictionTypeChange}
                        onSearchResultClick={onSearchResultClick}
                        addNewRestriction={addNewRestriction}
                    />
                ) : (
                    <span>
                        <span style={{ cursor: 'pointer' }} onClick={() => setIsNewFlipperExtended(true)}>
                            {addIcon}
                            <span> Add new restriction</span>
                        </span>
                        <span style={{ float: 'right' }}>
                            <Button variant="info" style={{ marginRight: '10px' }} onClick={refreshItemNames} disabled={isRefreshingItemNames}>
                                <Refresh /> Refresh item names
                            </Button>
                            <Button variant="danger" onClick={onClearListClick}>
                                <DeleteIcon /> Clear list
                            </Button>
                        </span>
                    </span>
                )}
                <hr />
            </div>
            <Form.Control style={{ width: '49%', marginLeft: '20px' }} placeholder="Search..." onChange={e => setSearchText(e.target.value)} />
            <div className={styles.restrictionList}>
                {restrictions.map((restriction, index) => {
                    if (searchText) {
                        let isValid = false
                        if (restriction.item?.name && restriction.item?.name.toLowerCase().includes(searchText.toLowerCase())) {
                            isValid = true
                        }
                        if (restriction.tags && restriction.tags.findIndex(tag => tag.toLowerCase().includes(searchText.toLowerCase())) !== -1) {
                            isValid = true
                        }
                        if (!isValid) {
                            return null
                        }
                    }
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
                                <div style={{ display: 'flex' }}>
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
                                        <>
                                            <div className={styles.removeFilter} onClick={() => createDuplicate(restriction, index)}>
                                                <Tooltip type="hover" content={<DuplicateIcon />} tooltipContent={<p>Create duplicate</p>} />
                                            </div>
                                            <div className={styles.removeFilter} onClick={() => removeRestrictionByIndex(restriction, index)}>
                                                <Tooltip type="hover" content={<DeleteIcon color="error" />} tooltipContent={<p>Remove restriction</p>} />
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                            </Card.Header>
                            <Card.Body>
                                {restriction.itemFilter ? (
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
                                ) : null}
                                {restriction.tags?.map(tag => (
                                    <Badge key={tag} variant="dark" style={{ marginRight: '5px' }}>
                                        {tag}
                                    </Badge>
                                ))}
                            </Card.Body>
                        </Card>
                    )
                })}
            </div>
            {clearListDialog}
        </>
    )
}

export default React.memo(FlipRestrictionList)
