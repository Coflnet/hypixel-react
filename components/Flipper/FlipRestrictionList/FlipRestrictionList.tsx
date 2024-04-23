'use client'
import React, { useEffect, useRef, useState } from 'react'
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
import NewRestriction, { RestrictionCreateState } from './NewRestriction/NewRestriction'
import { CUSTOM_EVENTS } from '../../../api/ApiTypes.d'
import Tooltip from '../../Tooltip/Tooltip'
import { toast } from 'react-toastify'
import Image from 'next/image'
import AutoSizer from 'react-virtualized-auto-sizer'
import { VariableSizeGrid as Grid } from 'react-window'
import { v4 as generateUUID } from 'uuid'
import ApiSearchField from '../../Search/ApiSearchField'

interface Props {
    onRestrictionsChange(restrictions: FlipRestriction[], type: 'whitelist' | 'blacklist'): void
    prefillRestriction?: RestrictionCreateState
}

function FlipRestrictionList(props: Props) {
    let [isAddNewFlipperExtended, setIsNewFlipperExtended] = useState(props.prefillRestriction !== undefined)
    let [restrictions, setRestrictions] = useState<FlipRestriction[]>(getInitialFlipRestrictions())
    let [restrictionInEditModeIndex, setRestrictionsInEditModeIndex] = useState<number[]>([])
    let [showDeleteRestrictionsDialog, setShowDeleteRestrictionsDialog] = useState(false)
    let [isRefreshingItemNames, setIsRefreshingItemNames] = useState(false)
    let [searchText, setSearchText] = useState('')
    let [sortByName, setSortByName] = useState(false)
    let [isSSR, setIsSSR] = useState(true)
    let searchFieldRef = useRef<HTMLInputElement>(null)
    let listRef = useRef(null)

    useEffect(() => {
        function onControlF(event: KeyboardEvent) {
            if (event.ctrlKey && event.key === 'f' && searchFieldRef.current) {
                event.preventDefault()
                searchFieldRef.current.focus()
            }
        }

        window.addEventListener('keydown', onControlF)

        setIsSSR(false)

        return () => {
            window.removeEventListener('keydown', onControlF)
        }
    }, [])

    function getInitialFlipRestrictions() {
        let restrictions = getSettingsObject<FlipRestriction[]>(RESTRICTIONS_SETTINGS_KEY, [])
        restrictions.forEach(restriction => {
            if (restriction.item && restriction.item.tag) {
                restriction.item.iconUrl = api.getItemImageUrl(restriction.item)
            }
            restriction.itemKey = generateUUID()
        })
        return restrictions
    }

    function addNewRestriction(newRestrictions: FlipRestriction[] = []) {
        let restrictionCopies = [...restrictions]

        // Placing the new restrictions at the positions they will be after a reload
        // => first whitelist entries, then blacklist entries. From oldest to newest
        newRestrictions.forEach(newRestriction => {
            newRestriction.itemKey = generateUUID()
            if (newRestriction.type === 'blacklist') {
                restrictionCopies.push(newRestriction)
                return
            }
            if (newRestriction.type === 'whitelist') {
                let firstBlacklist = restrictionCopies.findIndex(element => element.type === 'blacklist')
                if (firstBlacklist === -1) {
                    restrictionCopies.push(newRestriction)
                } else {
                    restrictionCopies.splice(firstBlacklist, 0, newRestriction)
                }
            }
        })

        setRestrictions(restrictionCopies)
        setIsNewFlipperExtended(false)

        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.FLIP_SETTINGS_CHANGE))

        setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(restrictionCopies)))

        if (props.onRestrictionsChange) {
            props.onRestrictionsChange(getCleanRestrictionsForApi(restrictionCopies), 'blacklist')
            props.onRestrictionsChange(getCleanRestrictionsForApi(restrictionCopies), 'whitelist')
        }

        toast.success('New restriction added')
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
        toast.success('Restriction updated')
        recalculateListHeight()
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
        toast.success('Restriction(s) updated')
        recalculateListHeight()
    }

    function removeRestrictionByIndex(restrictions: FlipRestriction[], index: number) {
        let newRestrictions = [...restrictions]
        let deletedRestriction = newRestrictions.splice(index, 1)

        setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(newRestrictions)))

        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.FLIP_SETTINGS_CHANGE))

        if (props.onRestrictionsChange) {
            props.onRestrictionsChange(getCleanRestrictionsForApi(newRestrictions), deletedRestriction[0].type)
        }
        setRestrictions(newRestrictions)
        toast.success('Restriction removed')
        recalculateListHeight()
    }

    function createDuplicate(restrictions: FlipRestriction[], index: number) {
        let duplicate = { ...restrictions[index] }
        let newRestrictions = [...restrictions]
        newRestrictions.splice(index + 1, 0, duplicate)

        setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(newRestrictions)))
        if (props.onRestrictionsChange) {
            props.onRestrictionsChange(getCleanRestrictionsForApi(newRestrictions), 'whitelist')
            props.onRestrictionsChange(getCleanRestrictionsForApi(newRestrictions), 'blacklist')
        }
        setRestrictions(newRestrictions)
        recalculateListHeight()
    }

    function removeItemOfRestriction(restrictions: FlipRestriction[], index: number) {
        let newRestrictions = [...restrictions]
        newRestrictions[index].item = undefined
        setRestrictions(newRestrictions)
        recalculateListHeight()
    }

    function saveRestrictionEdit(restrictions: FlipRestriction[], index: number) {
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
        recalculateListHeight()
    }

    function editRestriction(restrictions: FlipRestriction[], index: number) {
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
        let newRestrictions = getRestrictionsFilteredBySearch(restrictions, true)
        setRestrictions(newRestrictions)
        setShowDeleteRestrictionsDialog(false)

        document.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.FLIP_SETTINGS_CHANGE))

        setSetting(RESTRICTIONS_SETTINGS_KEY, JSON.stringify(getCleanRestrictionsForApi(newRestrictions)))

        if (props.onRestrictionsChange) {
            props.onRestrictionsChange(getCleanRestrictionsForApi(newRestrictions), 'whitelist')
            props.onRestrictionsChange(getCleanRestrictionsForApi(newRestrictions), 'blacklist')
        }
    }

    const debounceSearchFunction = (function () {
        let timerId

        return searchText => {
            clearTimeout(timerId)
            timerId = setTimeout(() => {
                setSearchText(searchText)
                recalculateListHeight()
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

    function recalculateListHeight() {
        ;(listRef.current as any).resetAfterRowIndex(0, false)
    }

    function getRestrictionsFilteredBySearch(restrictions: FlipRestriction[], invert = false) {
        return restrictions.filter(restriction => {
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
            if (invert) {
                return !isValid
            }
            return isValid
        })
    }

    let clearListDialog = (
        <Modal
            show={showDeleteRestrictionsDialog}
            onHide={() => {
                setShowDeleteRestrictionsDialog(false)
            }}
        >
            <Modal.Header closeButton>
                <Modal.Title>Confirmation</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>Are you sure?</p>
                <p>
                    <b>This will delete all {getRestrictionsFilteredBySearch(restrictions)?.length || 0} black-/whitelist entries.</b>
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button variant="danger" style={{ width: '45%' }} onClick={clearRestrictions}>
                        Clear <DeleteIcon />
                    </Button>
                    <Button
                        style={{ width: '45%' }}
                        onClick={() => {
                            setShowDeleteRestrictionsDialog(false)
                        }}
                    >
                        Cancel
                    </Button>
                </div>
            </Modal.Body>
        </Modal>
    )

    let windowWidth = isSSR ? 1920 : window.innerWidth

    let addIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-plus-circle" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
        </svg>
    )

    let restrictionsToDisplay = [...restrictions]

    // remembering the original place for every restriction so it can correctly be mutated after a potential sorting
    restrictionsToDisplay.forEach((restriction, i) => {
        restriction.originalIndex = i
    })

    if (searchText) {
        restrictionsToDisplay = getRestrictionsFilteredBySearch(restrictionsToDisplay)
    }

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
            <div className={styles.restrictionListContainer}>
                <div
                    style={{
                        backgroundColor: '#303030',
                        padding: '10px 20px 0 20px',
                        zIndex: 10,
                        flexShrink: 0,
                        width: '100%',
                        top: 0
                    }}
                >
                    {restrictionInEditModeIndex.length > 0 ? (
                        <EditRestriction
                            defaultRestriction={restrictions[restrictionInEditModeIndex[0]]}
                            onAdd={addEditedFilter}
                            onOverride={overrideEditedFilter}
                            onCancel={onEditRestrictionCancel}
                        />
                    ) : isAddNewFlipperExtended ? (
                        <NewRestriction
                            onCancel={onNewRestrictionCancel}
                            onSaveRestrictions={addNewRestriction}
                            prefillRestriction={props.prefillRestriction}
                        />
                    ) : (
                        <div className={styles.refreshAndDeleteButtonContainer}>
                            <div style={{ cursor: 'pointer', marginBottom: '5px', flex: 1 }} onClick={() => setIsNewFlipperExtended(true)}>
                                {addIcon}
                                <span> Add new restriction</span>
                            </div>
                            <Button variant="info" style={{ marginRight: '10px' }} onClick={refreshItemNames} disabled={isRefreshingItemNames}>
                                <Refresh /> Refresh item names
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => {
                                    setShowDeleteRestrictionsDialog(true)
                                }}
                            >
                                <DeleteIcon /> Delete restrictions
                            </Button>
                        </div>
                    )}
                    <hr />
                    <div className={styles.searchBarContainer}>
                        <Form.Control
                            ref={searchFieldRef}
                            className={styles.searchFilter}
                            placeholder="Search..."
                            onChange={e => debounceSearchFunction(e.target.value)}
                        />
                        <div className={styles.sortByNameContainer}>
                            <Form.Label style={{ width: '200px' }} htmlFor="sortByNameCheckbox">
                                Sort by name
                            </Form.Label>
                            <Form.Check
                                id="sortByNameCheckbox"
                                inline
                                onChange={e => {
                                    setSortByName(e.target.checked)
                                    onEditRestrictionCancel()
                                    recalculateListHeight()
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div className={styles.restrictionList}>
                    {!isSSR ? (
                        <AutoSizer>
                            {({ height, width }) => (
                                <Grid
                                    ref={listRef}
                                    itemKey={({ columnIndex, rowIndex, data }) => {
                                        let r = restrictionsToDisplay[rowIndex * 2 + columnIndex]
                                        if (!r) {
                                            return null
                                        }
                                        return r.itemKey
                                    }}
                                    columnCount={windowWidth < 1024 ? 1 : 2}
                                    columnWidth={() => (windowWidth < 1024 ? width : width / 2)}
                                    height={height}
                                    rowCount={windowWidth < 1024 ? restrictionsToDisplay.length : Math.ceil(restrictionsToDisplay.length / 2)}
                                    rowHeight={index => {
                                        function getCellHeight(index) {
                                            let defaultHeight = 81.5
                                            let margin = 16
                                            let restriction = restrictionsToDisplay[index]
                                            if (!restriction) {
                                                return 0
                                            }
                                            let tags = restriction.tags && restriction.tags.length > 0 ? 24 : 0
                                            let filterCount = 0
                                            if (restriction.itemFilter) {
                                                filterCount = Object.keys(restriction.itemFilter).length
                                            }
                                            return defaultHeight + margin + tags + filterCount * 40
                                        }
                                        return Math.max(getCellHeight(index * 2), getCellHeight(index * 2 + 1))
                                    }}
                                    width={width}
                                    style={{ overflowX: 'hidden' }}
                                >
                                    {({ columnIndex, rowIndex, style }) => {
                                        let restriction = restrictionsToDisplay[rowIndex * 2 + columnIndex]
                                        if (!restriction) {
                                            return null
                                        }
                                        return (
                                            <div className={styles.restrictionContainer} style={style}>
                                                <Card className={`${styles.restriction} ${restriction.isEdited ? styles.restrictionMarkedAsEdit : ''}`}>
                                                    <Card.Header style={{ padding: '10px', display: 'flex', justifyContent: 'space-between' }}>
                                                        {restriction.isEdited ? (
                                                            <ToggleButtonGroup
                                                                style={{ maxWidth: '200px', marginBottom: '5px' }}
                                                                type="radio"
                                                                name="options"
                                                                value={restriction.type}
                                                                onChange={newValue => {
                                                                    let newRestrictions = [...restrictions]
                                                                    newRestrictions[restriction.originalIndex!].type = newValue
                                                                    setRestrictions(newRestrictions)
                                                                }}
                                                            >
                                                                <ToggleButton
                                                                    id={'blacklistToggleButton-' + restriction.originalIndex!}
                                                                    value={'blacklist'}
                                                                    variant={restriction.type === 'blacklist' ? 'primary' : 'secondary'}
                                                                    size="sm"
                                                                >
                                                                    Blacklist
                                                                </ToggleButton>
                                                                <ToggleButton
                                                                    id={'whitelistToggleButton-' + restriction.originalIndex!}
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
                                                        <div style={{ width: '-webkit-fill-available', float: 'left' }}>
                                                            {restriction.isEdited ? (
                                                                <ApiSearchField
                                                                    multiple={false}
                                                                    className={styles.multiSearch}
                                                                    onChange={items => {
                                                                        console.log(items)
                                                                        let newItem: Item | undefined =
                                                                            items && items.length > 0
                                                                                ? {
                                                                                      tag: items[0].id,
                                                                                      name: items[0].dataItem.name,
                                                                                      iconUrl: items[0].dataItem.iconUrl
                                                                                  }
                                                                                : undefined
                                                                        let newRestrictions = [...restrictions]
                                                                        newRestrictions[restriction.originalIndex!].item = newItem
                                                                        setRestrictions(newRestrictions)
                                                                        recalculateListHeight()
                                                                    }}
                                                                    searchFunction={api.itemSearch}
                                                                    defaultSelected={
                                                                        restriction.item
                                                                            ? [
                                                                                  {
                                                                                      dataItem: {
                                                                                          iconUrl: restriction.item.iconUrl || '',
                                                                                          name: restriction.item.name || '-'
                                                                                      },
                                                                                      id: restriction.item.tag || '',
                                                                                      label: restriction.item.name || '-'
                                                                                  } as unknown as SearchResultItem
                                                                              ]
                                                                            : undefined
                                                                    }
                                                                />
                                                            ) : (
                                                                restriction.item && (
                                                                    <>
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
                                                                    </>
                                                                )
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex' }}>
                                                            {restriction.isEdited ? (
                                                                <div
                                                                    className={styles.cancelEditButton}
                                                                    onClick={() => {
                                                                        saveRestrictionEdit(restrictions, restriction.originalIndex!)
                                                                    }}
                                                                >
                                                                    <Tooltip type="hover" content={<SaveIcon />} tooltipContent={<p>Save</p>} />
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    className={styles.editButton}
                                                                    onClick={() => {
                                                                        editRestriction(restrictions, restriction.originalIndex!)
                                                                    }}
                                                                >
                                                                    <Tooltip type="hover" content={<EditIcon />} tooltipContent={<p>Edit restriction</p>} />
                                                                </div>
                                                            )}
                                                            {restrictionInEditModeIndex.length === 0 ? (
                                                                <>
                                                                    <div
                                                                        className={styles.removeFilter}
                                                                        onClick={() => createDuplicate(restrictions, restriction.originalIndex!)}
                                                                    >
                                                                        <Tooltip
                                                                            type="hover"
                                                                            content={<DuplicateIcon />}
                                                                            tooltipContent={<p>Create duplicate</p>}
                                                                        />
                                                                    </div>
                                                                    <div
                                                                        className={styles.removeFilter}
                                                                        onClick={() => removeRestrictionByIndex(restrictions, restriction.originalIndex!)}
                                                                    >
                                                                        <Tooltip
                                                                            type="hover"
                                                                            content={<DeleteIcon color="error" />}
                                                                            tooltipContent={<p>Remove restriction</p>}
                                                                        />
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
                                                                        ? () => {
                                                                              recalculateListHeight()
                                                                          }
                                                                        : undefined
                                                                }
                                                            />
                                                        ) : null}
                                                        <div className="ellipse">
                                                            {restriction.tags?.map(tag => (
                                                                <Badge key={tag} bg="dark" style={{ marginRight: '5px' }}>
                                                                    {tag}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </Card.Body>
                                                </Card>
                                            </div>
                                        )
                                    }}
                                </Grid>
                            )}
                        </AutoSizer>
                    ) : null}
                </div>
            </div>
            {clearListDialog}
        </>
    )
}

export default React.memo(FlipRestrictionList)
