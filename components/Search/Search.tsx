'use client'
import React, { ChangeEvent, useEffect, useRef, useState, type JSX } from 'react'
import api from '../../api/ApiHelper'
import { Form, InputGroup, ListGroup, Spinner } from 'react-bootstrap'
import { convertTagToName, getStyleForTier } from '../../utils/Formatter'
import NavBar from '../NavBar/NavBar'
import OptionsMenu from '../OptionsMenu/OptionsMenu'
import SearchIcon from '@mui/icons-material/SearchOutlined'
import WrongIcon from '@mui/icons-material/Dangerous'
import Refresh from '@mui/icons-material/Refresh'
import ClearIcon from '@mui/icons-material/Clear'
import { Item, Menu, useContextMenu, Separator } from 'react-contexify'
import { toast } from 'react-toastify'
import { isClientSideRendering } from '../../utils/SSRUtils'
import styles from './Search.module.css'
import { useForceUpdate, useIsMobile } from '../../utils/Hooks'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import PushPinIcon from '@mui/icons-material/PushPin'
import {
    addClickedSearchResultToPreviousSearches,
    addPreviousSearchResultsToDisplay,
    getFirstPreviousSearches,
    pinSearchResult,
    unpinSearchResult
} from '../../utils/PreviousSearchUtils'
import { ITEM_ICON_TYPE, getSetting, setSetting } from '../../utils/SettingsUtils'
import { isAnySearchInputInUse } from '../../utils/SearchFocusUtils'
import ClientOnly from '../ClientOnly/ClientOnly'

interface Props {
    selected?: Player | Item
    currentElement?: JSX.Element
    backgroundColor?: string
    backgroundColorSelected?: string
    searchFunction?(searchText: string)
    onSearchresultClick?(item: SearchResultItem)
    hideNavbar?: boolean
    placeholder?: string
    type?: 'player' | 'item'
    preventDisplayOfPreviousSearches?: boolean
    enableReset?: boolean
    onResetClick?()
    hideOptions?: boolean
    keyForPinnedItems?: string
}

const PLAYER_SEARCH_CONEXT_MENU_ID = 'player-search-context-menu'
const SEARCH_RESULT_CONTEXT_MENU_ID = 'search-result-context-menu'

function Search(props: Props) {
    let router = useRouter()
    let [searchText, setSearchText] = useState('')
    let [results, setResults] = useState<SearchResultItem[]>([])
    let [isSearching, setIsSearching] = useState(false)
    let [noResultsFound, setNoResultsFound] = useState(false)
    let [isSmall, setIsSmall] = useState(true)
    let [selectedIndex, setSelectedIndex] = useState(0)
    const { show: showPlayerContextMenu } = useContextMenu({
        id: PLAYER_SEARCH_CONEXT_MENU_ID
    })
    const { show: showSearchItemContextMenu, hideAll: hideSearchItemContextMenu } = useContextMenu({
        id: SEARCH_RESULT_CONTEXT_MENU_ID
    })
    const isMobile = useIsMobile()

    // Generate unique ID for this search instance
    const searchId = useRef(`search-bar-${Math.random().toString(36).substr(2, 9)}`)

    // Use 'search-bar' for global search (when navbar is not hidden), unique ID for others
    const inputId = props.hideNavbar ? searchId.current : 'search-bar'

    let rememberEnterPressRef = useRef(false)

    let searchElement = useRef(null)
    let forceUpdate = useForceUpdate()

    useEffect(() => {
        if (isClientSideRendering()) {
            setIsSmall(isClientSideRendering() ? document.body.clientWidth < 1500 : false)
        }
        document.addEventListener('click', outsideClickHandler, true)
        return () => {
            document.removeEventListener('click', outsideClickHandler, true)
        }
    }, [])

    useEffect(() => {
        setSearchText('')
        setResults([])
    }, [props.selected])

    let search = () => {
        let searchFor = searchText
        let searchFunction = props.searchFunction || api.search
        searchFunction(searchFor).then(searchResults => {
            // has the searchtext changed?
            if (
                searchElement.current !== null &&
                searchFor === ((searchElement.current as HTMLDivElement).querySelector(`#${inputId}`) as HTMLInputElement).value
            ) {
                let searchResultsToShow = [...searchResults]
                if (!props.preventDisplayOfPreviousSearches) {
                    searchResultsToShow = addPreviousSearchResultsToDisplay(searchFor, searchResults, props.keyForPinnedItems)
                }

                setSelectedIndex(0)
                setNoResultsFound(searchResultsToShow.length === 0)
                setResults(searchResultsToShow)
                setIsSearching(false)

                if (rememberEnterPressRef.current) {
                    onItemClick(searchResultsToShow[0])
                    rememberEnterPressRef.current = false
                }
            }
        })
    }

    let onSearchChange = (e: ChangeEvent) => {
        let newSearchText: string = (e.target as HTMLInputElement).value
        searchText = newSearchText
        setSearchText(newSearchText)
        setIsSearching(true)

        if (newSearchText === '') {
            setResults([])
            setIsSearching(false)
            return
        }

        setNoResultsFound(false)
        search()
    }

    function outsideClickHandler(evt) {
        const flyoutEl = searchElement.current
        let targetEl = evt.target

        do {
            if (targetEl === flyoutEl) {
                return
            }
            targetEl = (targetEl as any).parentNode
        } while (targetEl)

        setResults([])
    }

    let onKeyPress = (e: KeyboardEvent) => {
        switch (e.key) {
            case 'Enter':
                e.preventDefault()
                if (isSearching) {
                    rememberEnterPressRef.current = true
                    return
                }
                if (!results || results.length === 0) {
                    return
                }
                onItemClick(results[selectedIndex])
                break
            case 'ArrowDown':
                if (selectedIndex < results.length - 1) {
                    setSelectedIndex(selectedIndex + 1)
                }
                break
            case 'ArrowUp':
                if (selectedIndex > 0) {
                    setSelectedIndex(selectedIndex - 1)
                }
                break
        }
    }

    let onItemClick = (item: SearchResultItem) => {
        if (props.onSearchresultClick) {
            props.onSearchresultClick(item)
            return
        }

        if (item.urlSearchParams && new URLSearchParams(window.location.search).toString() !== item.urlSearchParams.toString()) {
            setSearchText('')
            setResults([])
        }

        addClickedSearchResultToPreviousSearches(item, props.keyForPinnedItems)

        api.trackSearch(item.id, item.type)

        let searchParams = new URLSearchParams()
        let itemFilter = item.urlSearchParams?.get('itemFilter')
        let apply = item.urlSearchParams?.get('apply')
        if (itemFilter) {
            searchParams.set('itemFilter', itemFilter)
        }
        if (apply) {
            searchParams.set('apply', apply)
        }

        router.push(`${item.route}?${searchParams.toString()}`)
    }

    let noResultsFoundElement = (
        <ListGroup.Item
            key={-1}
            style={getListItemStyle(-1)}
            onContextMenu={e => {
                handleSearchContextMenuForCurrentElement(e)
            }}
        >
            <Image className={styles.searchResultIcon} height={32} width={32} src="/Barrier.png" alt="" />
            No search results
        </ListGroup.Item>
    )

    let getSelectedElement = (): JSX.Element => {
        if (props.currentElement) {
            return (
                <h1 onContextMenu={e => handleSearchContextMenuForCurrentElement(e)} className={styles.current}>
                    {props.currentElement}
                </h1>
            )
        }
        if (!props.selected) {
            return <div />
        }
        return (
            <h1 onContextMenu={e => handleSearchContextMenuForCurrentElement(e)} className={styles.current}>
                <ClientOnly>
                    <img
                        crossOrigin="anonymous"
                        className="playerHeadIcon"
                        src={props.type === 'player' ? props.selected.iconUrl : api.getItemImageUrl({ tag: (props.selected as Item).tag })}
                        height="32"
                        width="32"
                        alt=""
                        style={{ marginRight: '10px', cursor: 'pointer' }}
                        onClick={() => {
                            let type = getSetting(ITEM_ICON_TYPE, 'default')
                            if (type === 'default') {
                                setSetting(ITEM_ICON_TYPE, 'vanilla')
                            } else {
                                setSetting(ITEM_ICON_TYPE, 'default')
                            }
                            window.location.reload()
                        }}
                    />
                </ClientOnly>
                {props.selected.name || convertTagToName((props.selected as Item).tag)}
                {props.enableReset ? (
                    <ClearIcon onClick={props.onResetClick} style={{ cursor: 'pointer', color: 'red', marginLeft: '10px', fontWeight: 'bold' }} />
                ) : null}
            </h1>
        )
    }

    let searchStyle: React.CSSProperties = {
        backgroundColor: props.backgroundColor,
        borderRadius: results.length > 0 || noResultsFound ? '0px 10px 0 0' : '0px 10px 10px 0px',
        borderLeftWidth: 0,
        borderBottomColor: results.length > 0 || noResultsFound ? '#444' : undefined
    }

    let searchIconStyle: React.CSSProperties = {
        width: isSmall ? 'auto' : '58px',
        borderRadius: results.length > 0 || noResultsFound ? '10px 0 0 0' : '10px 0px 0px 10px',
        backgroundColor: props.backgroundColor || '#303030',
        borderBottomColor: results.length > 0 || noResultsFound ? '#444' : undefined,
        padding: isSmall ? '0px' : undefined
    }

    function getListItemStyle(i: number): React.CSSProperties {
        let style = {
            backgroundColor: i === selectedIndex ? props.backgroundColorSelected || '#444' : props.backgroundColor,
            borderRadius: i === results.length - 1 ? '0 0 10px 10px' : '',
            border: 0,
            borderTop: i === 0 ? '1px solid #444' : 0,
            borderTopWidth: i === 0 ? 0 : undefined,
            fontWeigth: 'normal',
            fontFamily: 'inherit'
        }
        if (results[i]) {
            let isDuplicate = results.findIndex((element, index) => element.dataItem.name === results[i].dataItem.name && index !== i) !== -1
            if (isDuplicate) {
                return {
                    ...getStyleForTier(results[i]?.tier),
                    ...style
                }
            }
        }
        return style
    }

    function checkNameChange(uuid: string) {
        api.triggerPlayerNameCheck(uuid).then(() => {
            toast.success('A name check for the player was triggered. This may take a few minutes.')
        })
    }

    function handleSearchContextMenuForCurrentElement(event) {
        if (props.selected && props.type === 'player') {
            event.preventDefault()
            showPlayerContextMenu({ event: event })
        }
    }

    function handleSearchContextMenuForSearchResult(event: React.MouseEvent<HTMLElement, MouseEvent>, searchResultItem: SearchResultItem) {
        event.preventDefault()
        showSearchItemContextMenu({ event: event, props: { item: searchResultItem } })
    }

    /**
     * Determines if this search component should prevent auto-focus
     * This prevents secondary search components from stealing focus from primary ones
     */
    function shouldPreventAutoFocus(): boolean {
        // If this is a secondary search (has hideNavbar or specific placeholder),
        // check if any other search inputs are in use
        const isSecondarySearch = props.hideNavbar || (props.placeholder && props.placeholder !== 'Search player/item')

        if (isSecondarySearch) {
            return isAnySearchInputInUse()
        }

        return false
    }

    let currentItemContextMenuElement = (
        <div>
            <Menu id={PLAYER_SEARCH_CONEXT_MENU_ID} theme={'dark'}>
                <Item
                    onClick={params => {
                        checkNameChange((props.selected as Player).uuid)
                    }}
                >
                    <Refresh style={{ marginRight: '5px' }} />
                    Trigger check if name has changed
                </Item>
            </Menu>
        </div>
    )

    let searchItemContextMenuElement = (
        <div>
            <Menu id={SEARCH_RESULT_CONTEXT_MENU_ID} theme={'dark'}>
                <Item
                    onClick={params => {
                        let item: SearchResultItem = params.props.item
                        pinSearchResult(item, props.keyForPinnedItems)
                        let index = results.findIndex(r => r.dataItem.name === item.dataItem.name)
                        if (index !== -1) {
                            let newResults = [...results]
                            newResults[index].pinned = true
                            newResults[index].isPreviousSearch = true
                            setResults(newResults)
                        }
                        hideSearchItemContextMenu()
                    }}
                    hidden={params => !!params.props.item.pinned}
                    closeOnClick
                >
                    <PushPinIcon />
                    Pin search result
                </Item>
                <Item
                    onClick={params => {
                        let item: SearchResultItem = params.props.item
                        unpinSearchResult(item, props.keyForPinnedItems)
                        let index = results.findIndex(r => r.dataItem.name === item.dataItem.name)
                        if (index !== -1) {
                            let newResults = [...results]
                            newResults[index].pinned = false
                            setResults(newResults)
                        }
                        hideSearchItemContextMenu()
                    }}
                    hidden={params => !params.props.item.pinned}
                    closeOnClick
                >
                    <PushPinIcon />
                    Unpin search result
                </Item>
                <Separator />
                <Item
                    onClick={() => {
                        api.sendFeedback('badSearchResults', {
                            searchText: searchText,
                            results: results
                        })
                    }}
                >
                    <WrongIcon style={{ color: 'red', marginRight: '5px' }} />I didn't find the thing I was looking for!
                </Item>
            </Menu>
        </div>
    )

    return (
        <div ref={searchElement} className={styles.search} style={isSmall ? { marginLeft: '-5px', marginRight: '-5px' } : {}}>
            <Form autoComplete="off">
                <Form.Group className={styles.searchFormGroup}>
                    {!isSmall && !props.hideNavbar ? <NavBar /> : ''}
                    <InputGroup id="search-input-group">
                        <InputGroup.Text style={searchIconStyle}>
                            {isSmall && !props.hideNavbar ? (
                                <div style={{ width: '56px' }}>
                                    <NavBar hamburgerIconStyle={{ marginRight: '0px', width: '56px' }} />
                                </div>
                            ) : (
                                <SearchIcon />
                            )}
                        </InputGroup.Text>
                        <Form.Control
                            key="search"
                            autoFocus={!isMobile && !shouldPreventAutoFocus()}
                            style={searchStyle}
                            type="text"
                            placeholder={props.placeholder || 'Search player/item'}
                            id={inputId}
                            className="searchBar"
                            value={searchText}
                            onChange={onSearchChange}
                            onKeyDown={(e: any) => {
                                onKeyPress(e)
                            }}
                            onClick={() => {
                                if (!props.preventDisplayOfPreviousSearches && !noResultsFound && results.length === 0 && !searchText) {
                                    let previousResuls = getFirstPreviousSearches(5, props.keyForPinnedItems)
                                    setResults(previousResuls)
                                }
                            }}
                        />
                    </InputGroup>
                </Form.Group>
            </Form>
            <ListGroup className={styles.searchResutList}>
                {noResultsFound
                    ? noResultsFoundElement
                    : results.map((result, i) => (
                          <ListGroup.Item
                              key={result.id}
                              action
                              onClick={(e: any) => {
                                  onItemClick(result)
                              }}
                              style={getListItemStyle(i)}
                              className={result.isPreviousSearch ? styles.previousSearch : undefined}
                              onContextMenu={event => {
                                  handleSearchContextMenuForSearchResult(event, result)
                              }}
                          >
                              {result.dataItem.iconUrl ? (
                                  <Image
                                      className={`${styles.searchResultIcon} playerHeadIcon`}
                                      crossOrigin="anonymous"
                                      width={32}
                                      height={32}
                                      src={
                                          result.dataItem._imageLoaded
                                              ? result.dataItem.iconUrl
                                              : 'data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mPMqAcAAVUA6UpAAT4AAAAASUVORK5CYII='
                                      }
                                      alt=""
                                      onLoad={() => {
                                          result.dataItem._imageLoaded = true
                                          setResults(results)
                                          forceUpdate()
                                      }}
                                  />
                              ) : (
                                  <Spinner animation="border" role="status" variant="primary" />
                              )}
                              {result.pinned ? <PushPinIcon style={{ marginRight: '5px' }} /> : null}
                              {result.dataItem.name}
                          </ListGroup.Item>
                      ))}
            </ListGroup>
            <div className={styles.bar} style={{ marginTop: '20px' }}>
                {getSelectedElement()}
                {!props.hideOptions ? <OptionsMenu selected={props.selected} /> : null}
            </div>
            {searchItemContextMenuElement}
            {currentItemContextMenuElement}
        </div>
    )
}

export default Search
