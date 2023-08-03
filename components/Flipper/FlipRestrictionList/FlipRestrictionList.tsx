'use client'
import React, { useState } from 'react'
import { Badge, Button, Card, Form, Modal, ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import api from '../../../api/ApiHelper'
import { camelCaseToSentenceCase, getStyleForTier } from '../../../utils/Formatter'
import { getCleanRestrictionsForApi, getSettingsObject, RESTRICTIONS_SETTINGS_KEY, setSetting } from '../../../utils/SettingsUtils'
import Refresh from '@mui/icons-material/Refresh'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import DuplicateIcon from '@mui/icons-material/ControlPointDuplicate'
import SaveIcon from '@mui/icons-material/Save'
import RemoveIcon from '@mui/icons-material/Remove'
import ItemFilterPropertiesDisplay from '../../ItemFilter/ItemFilterPropertiesDisplay'
import styles from './FlipRestrictionList.module.css'
import EditRestriction, { UpdateState } from './EditRestriction/EditRestriction'
import NewRestriction from './NewRestriction/NewRestriction'
import { CUSTOM_EVENTS } from '../../../api/ApiTypes.d'
import Tooltip from '../../Tooltip/Tooltip'
import { toast } from 'react-toastify'
import Image from 'next/image'

interface Props {
    onRestrictionsChange(restrictions: FlipRestriction[], type: 'whitelist' | 'blacklist')
}

function FlipRestrictionList(props: Props) {
    let [isAddNewFlipperExtended, setIsNewFlipperExtended] = useState(false)
    let [restrictions, setRestrictions] = useState<FlipRestriction[]>(getInitialFlipRestrictions())
    let [restrictionInEditModeIndex, setRestrictionsInEditModeIndex] = useState<number[]>([])
    let [showClearListDialog, setShowClearListDialog] = useState(false)
    let [isRefreshingItemNames, setIsRefreshingItemNames] = useState(false)
    let [searchText, setSearchText] = useState('')
    let [sortByName, setSortByName] = useState(false)

    function getInitialFlipRestrictions() {
        let restrictions = getSettingsObject<FlipRestriction[]>(RESTRICTIONS_SETTINGS_KEY, [])
        restrictions.forEach(restriction => {
            if (restriction.item && restriction.item.tag) {
                restriction.item.iconUrl = api.getItemImageUrl(restriction.item)
            }
        })
        return restrictions
    }

    function addNewRestriction(newRestrictions: FlipRestriction[] = []) {
        let restrictionCopies = [...restrictions, ...newRestrictions]
        setRestrictions(restrictionCopies)
        setIsNewFlipperExtended(false)

        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.FLIP_SETTINGS_CHANGE))

        setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(restrictionCopies)))

        if (props.onRestrictionsChange) {
            props.onRestrictionsChange(getCleanRestrictionsForApi(restrictionCopies), 'blacklist')
            props.onRestrictionsChange(getCleanRestrictionsForApi(restrictionCopies), 'whitelist')
        }
    }

    function onNewRestrictionCancel() {
        setIsNewFlipperExtended(false)
    }

    function onEditRestrictionCancel() {
        let newRestrictions = [...restrictions]
        restrictionInEditModeIndex.forEach(index => {
            newRestrictions[index].isEdited = false
        })
        setRestrictions(newRestrictions)
        setRestrictionsInEditModeIndex([])
    }

    function addEditedFilter(updateState: UpdateState) {
        let newRestrictions = [...restrictions]
        restrictionInEditModeIndex.forEach(index => {
            let toUpdate = newRestrictions[index]
            Object.keys(updateState.itemFilter || {}).forEach(key => {
                if (toUpdate.itemFilter && updateState.itemFilter && toUpdate.itemFilter[key] === undefined) {
                    toUpdate.itemFilter[key] = updateState.itemFilter[key]
                }
            })
            if (updateState.tags) {
                toUpdate.tags = toUpdate.tags ? [...toUpdate.tags, ...updateState.tags] : updateState.tags
            }
            toUpdate.isEdited = false
        })

        setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(newRestrictions)))
        if (props.onRestrictionsChange) {
            props.onRestrictionsChange(getCleanRestrictionsForApi(newRestrictions), 'blacklist')
            props.onRestrictionsChange(getCleanRestrictionsForApi(newRestrictions), 'whitelist')
        }

        setRestrictionsInEditModeIndex([])
        setRestrictions(newRestrictions)
    }

    function overrideEditedFilter(updateState: UpdateState) {
        let newRestrictions = [...restrictions]
        restrictionInEditModeIndex.forEach(index => {
            newRestrictions[index].itemFilter = { ...updateState.itemFilter }
            newRestrictions[index].tags = updateState.tags
            newRestrictions[index].isEdited = false
        })

        setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(newRestrictions)))
        if (props.onRestrictionsChange) {
            props.onRestrictionsChange(getCleanRestrictionsForApi(newRestrictions), 'blacklist')
            props.onRestrictionsChange(getCleanRestrictionsForApi(newRestrictions), 'whitelist')
        }
        setRestrictionsInEditModeIndex([])
        setRestrictions(newRestrictions)
    }

    function removeRestrictionByIndex(index: number) {
        let newRestrictions = [...restrictions]
        let deletedRestriction = newRestrictions.splice(index, 1)

        setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(newRestrictions)))

        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.FLIP_SETTINGS_CHANGE))

        if (props.onRestrictionsChange) {
            props.onRestrictionsChange(getCleanRestrictionsForApi(newRestrictions), deletedRestriction[0].type)
        }
        setRestrictions(newRestrictions)
    }

    function createDuplicate(index: number) {
        let duplicate = { ...restrictions[index] }
        let newRestrictions = [...restrictions]
        newRestrictions.splice(index + 1, 0, duplicate)
        setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(newRestrictions)))
        if (props.onRestrictionsChange) {
            props.onRestrictionsChange(getCleanRestrictionsForApi(newRestrictions), 'whitelist')
            props.onRestrictionsChange(getCleanRestrictionsForApi(newRestrictions), 'blacklist')
        }
        setRestrictions(newRestrictions)
    }

    function removeItemOfRestriction(index: number) {
        let newRestrictions = [...restrictions]
        newRestrictions[index].item = undefined
        setRestrictions(newRestrictions)
    }

    function saveRestrictionEdit(index: number) {
        let newRestrictions = [...restrictions]
        let newIndexArray = [...restrictionInEditModeIndex]

        newRestrictions[index].isEdited = false
        let i = newIndexArray.indexOf(index)
        newIndexArray.splice(i, 1)

        setRestrictionsInEditModeIndex(newIndexArray)
        setRestrictions(newRestrictions)
        setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(restrictions)))
        if (props.onRestrictionsChange) {
            props.onRestrictionsChange(getCleanRestrictionsForApi(restrictions), 'blacklist')
            props.onRestrictionsChange(getCleanRestrictionsForApi(restrictions), 'whitelist')
        }
    }

    function editRestriction(index: number) {
        let newRestrictions = [...restrictions]
        let restrictionToEdit = newRestrictions[index]
        let newRestrictionsInEditMode = [...restrictionInEditModeIndex]

        newRestrictionsInEditMode.push(index)

        let restrictionsInEditMode: FlipRestriction[] = []
        newRestrictionsInEditMode.forEach(index => {
            restrictionsInEditMode.push(restrictions[index])
        })

        restrictionToEdit.isEdited = true
        setRestrictions(newRestrictions)
        setRestrictionsInEditModeIndex(newRestrictionsInEditMode)
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
    }

    const debounceSearchFunction = (function () {
        let timerId

        return searchText => {
            clearTimeout(timerId)
            timerId = setTimeout(() => {
                setSearchText(searchText)
            }, 1000)
        }
    })()

    function refreshItemNames() {
        let newRestrictions = [...restrictions]
        setIsRefreshingItemNames(true)
        let items: Item[] = []
        newRestrictions.forEach(restriction => {
            if (restriction.item && restriction.item.tag) {
                items.push(restriction.item)
            }
        })
        api.getItemNames(items)
            .then(itemNameMap => {
                newRestrictions.forEach(restriction => {
                    if (restriction.item && restriction.item.tag) {
                        restriction.item.name = itemNameMap[restriction.item.tag]
                    }
                })
                toast.success('Reloaded all item names')
                setIsRefreshingItemNames(false)
                setRestrictions(newRestrictions)
                setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(newRestrictions)))
                if (props.onRestrictionsChange) {
                    props.onRestrictionsChange(getCleanRestrictionsForApi(newRestrictions), 'blacklist')
                    props.onRestrictionsChange(getCleanRestrictionsForApi(newRestrictions), 'whitelist')
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

    let restrictionsToDisplay = [...restrictions]
    if (sortByName) {
        restrictionsToDisplay = restrictionsToDisplay.sort((a, b) => {
            if (!a.item) {
                return 1
            }
            if (!b.item) {
                return -1
            }
            return a.item.name?.localeCompare(b.item.name || '') || -1
        })
    }

    return (
        <>
            <div style={{ position: 'sticky', top: 0, backgroundColor: '#303030', padding: '10px 20px 0 20px', zIndex: 10 }}>
                {restrictionInEditModeIndex.length > 0 ? (
                    <EditRestriction
                        defaultRestriction={restrictions[restrictionInEditModeIndex[0]]}
                        onAdd={addEditedFilter}
                        onOverride={overrideEditedFilter}
                        onCancel={onEditRestrictionCancel}
                    />
                ) : isAddNewFlipperExtended ? (
                    <NewRestriction onCancel={onNewRestrictionCancel} onSaveRestrictions={addNewRestriction} />
                ) : (
                    <span>
                        <span style={{ cursor: 'pointer' }} onClick={() => setIsNewFlipperExtended(true)}>
                            {addIcon}
                            <span> Add new restriction</span>
                        </span>
                        <span style={{ float: 'right' }}>
                            <Button variant="info" style={{ marginRight: '10px', padding: '5px' }} onClick={refreshItemNames} disabled={isRefreshingItemNames}>
                                <Refresh /> Refresh item names
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => {
                                    setShowClearListDialog(true)
                                }}
                            >
                                <DeleteIcon /> Clear list
                            </Button>
                        </span>
                    </span>
                )}
                <hr />
            </div>
            <div style={{ display: 'flex' }}>
                <Form.Control className={styles.searchFilter} placeholder="Search..." onChange={e => debounceSearchFunction(e.target.value)} />
                <div className={styles.sortByNameContainer}>
                    <Form.Label style={{ width: '200px' }} htmlFor="sortByNameCheckbox">
                        Sort by name
                    </Form.Label>
                    <Form.Check id="sortByNameCheckbox" className={styles.sortByNameCheckbox} onChange={e => setSortByName(e.target.checked)} />
                </div>
            </div>
            <div className={styles.restrictionList}>
                {restrictionsToDisplay.map((restriction, index) => {
                    if (searchText) {
                        let isValid = false
                        let lowerCaseSearchText = searchText.toLowerCase()
                        if (restriction.item?.name && restriction.item?.name.toLowerCase().includes(lowerCaseSearchText)) {
                            isValid = true
                        }
                        if (restriction.itemFilter && !isValid) {
                            Object.keys(restriction.itemFilter).forEach(key => {
                                if (isValid) {
                                    return
                                }
                                if (
                                    restriction.itemFilter![key].toString().toLocaleLowerCase().includes(lowerCaseSearchText) ||
                                    camelCaseToSentenceCase(key).toLowerCase().includes(lowerCaseSearchText)
                                ) {
                                    isValid = true
                                }
                            })
                        }
                        if (restriction.tags && restriction.tags.findIndex(tag => tag.toLowerCase().includes(lowerCaseSearchText)) !== -1 && !isValid) {
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
                                            let newRestrictions = [...restrictions]
                                            newRestrictions[index].type = newValue
                                            setRestrictions(newRestrictions)
                                        }}
                                    >
                                        <ToggleButton
                                            id={'blacklistToggleButton-' + index}
                                            value={'blacklist'}
                                            variant={restriction.type === 'blacklist' ? 'primary' : 'secondary'}
                                            size="sm"
                                        >
                                            Blacklist
                                        </ToggleButton>
                                        <ToggleButton
                                            id={'whitelistToggleButton-' + index}
                                            value={'whitelist'}
                                            variant={restriction.type === 'whitelist' ? 'primary' : 'secondary'}
                                            size="sm"
                                        >
                                            Whitelist
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                ) : (
                                    <Badge style={{ marginRight: '10px' }} bg={restriction.type === 'blacklist' ? 'danger' : 'success'}>
                                        {restriction.type.toUpperCase()}
                                    </Badge>
                                )}
                                {restriction.item ? (
                                    <div className="ellipse" style={{ width: '-webkit-fill-available', float: 'left' }}>
                                        <Image
                                            crossOrigin="anonymous"
                                            src={restriction.item?.iconUrl || ''}
                                            height="24"
                                            width="24"
                                            alt=""
                                            style={{ marginRight: '5px' }}
                                            loading="lazy"
                                        />
                                        <span style={getStyleForTier(restriction.item?.tier)}>{restriction.item?.name}</span>
                                        {restriction.isEdited ? (
                                            <Tooltip
                                                type="hover"
                                                content={
                                                    <RemoveIcon
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => {
                                                            removeItemOfRestriction(index)
                                                        }}
                                                    />
                                                }
                                                tooltipContent={<p>Remove item</p>}
                                            />
                                        ) : null}
                                    </div>
                                ) : (
                                    <div className="ellipse" style={{ width: '-webkit-fill-available', float: 'left' }}></div>
                                )}
                                <div style={{ display: 'flex' }}>
                                    {restriction.isEdited ? (
                                        <div
                                            className={styles.cancelEditButton}
                                            onClick={() => {
                                                saveRestrictionEdit(index)
                                            }}
                                        >
                                            <Tooltip type="hover" content={<SaveIcon />} tooltipContent={<p>Save</p>} />
                                        </div>
                                    ) : (
                                        <div
                                            className={styles.editButton}
                                            onClick={() => {
                                                editRestriction(index)
                                            }}
                                        >
                                            <Tooltip type="hover" content={<EditIcon />} tooltipContent={<p>Edit restriction</p>} />
                                        </div>
                                    )}
                                    {restrictionInEditModeIndex.length === 0 ? (
                                        <>
                                            <div className={styles.removeFilter} onClick={() => createDuplicate(index)}>
                                                <Tooltip type="hover" content={<DuplicateIcon />} tooltipContent={<p>Create duplicate</p>} />
                                            </div>
                                            <div className={styles.removeFilter} onClick={() => removeRestrictionByIndex(index)}>
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
                                                      let newRestrictions = [...restrictions]
                                                      newRestrictions[index].itemFilter = { ...filter }
                                                      setRestrictions(newRestrictions)
                                                  }
                                                : undefined
                                        }
                                    />
                                ) : null}
                                {restriction.tags?.map(tag => (
                                    <Badge key={tag} bg="dark" style={{ marginRight: '5px' }}>
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
