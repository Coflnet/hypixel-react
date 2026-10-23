'use client'
import { getFilterResultTitle, getResultNavigationUrl } from '../../utils/Search/FilterResultId'
import React, { ChangeEvent, useMemo, useRef, type JSX } from 'react'
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
import styles from './Search.module.css'
import { useForceUpdate, useIsMobile } from '../../utils/Hooks'
import { useStagedSearch } from '../../hooks/useStagedSearch'
import { useOutsideClick } from '../../hooks/useOutsideClick'
import { useIsSmallScreen } from '../../hooks/useIsSmallScreen'
import { usePrefetchSearchResult } from '../../hooks/usePrefetchSearchResult'
import { EMBEDDED_SEARCH_STAGES, GLOBAL_SEARCH_STAGES, createLegacyStage, createRecentStage } from '../../utils/Search/SearchStages'
import PageResultIcon from './PageResultIcon'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import PushPinIcon from '@mui/icons-material/PushPin'
import {
    addClickedSearchResultToPreviousSearches,
    getFirstPreviousSearches,
    markPreviousSearches,
    pinSearchResult,
    unpinSearchResult
} from '../../utils/PreviousSearchUtils'
import { ITEM_ICON_TYPE, getSetting, setSetting } from '../../utils/SettingsUtils'
import { isAnySearchInputInUse } from '../../utils/SearchFocusUtils'
import ClientOnly from '../ClientOnly/ClientOnly'
import FavoriteToggle from '../Favorites/FavoriteToggle'

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
    showFavoriteToggle?: boolean
}

const PLAYER_SEARCH_CONEXT_MENU_ID = 'player-search-context-menu'
const SEARCH_RESULT_CONTEXT_MENU_ID = 'search-result-context-menu'

function Search(props: Props) {
    const router = useRouter()
    const isSmall = useIsSmallScreen()
    const stages = useMemo(() => {
        const base = props.searchFunction ? [createLegacyStage(props.searchFunction)] : props.onSearchresultClick ? EMBEDDED_SEARCH_STAGES : GLOBAL_SEARCH_STAGES
        return props.preventDisplayOfPreviousSearches ? base : [createRecentStage(props.keyForPinnedItems), ...base]
    }, [props.searchFunction, props.onSearchresultClick, props.preventDisplayOfPreviousSearches, props.keyForPinnedItems])
    const search = useStagedSearch({
        stages,
        resetKey: props.selected,
        decorateItems: props.preventDisplayOfPreviousSearches
            ? undefined
            : items => markPreviousSearches(items, props.keyForPinnedItems)
    })
    const prefetchResult = usePrefetchSearchResult(search.results[search.selectedIndex])
    const { searchText, results, rows, selectedIndex, noResultsFound } = search
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

    const searchElement = useRef<HTMLDivElement>(null)
    const forceUpdate = useForceUpdate()

    useOutsideClick(searchElement, search.clearResults)

    const onSearchChange = (e: ChangeEvent) => {
        search.setSearchText((e.target as HTMLInputElement).value)
    }

    const onKeyPress = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'Enter':
                e.preventDefault()
                search.onEnter().then(item => {
                    if (item) {
                        onItemClick(item)
                    }
                })
                break
            case 'ArrowDown':
                search.moveSelection(1)
                break
            case 'ArrowUp':
                search.moveSelection(-1)
                break
        }
    }

    const onItemClick = (item: SearchResultItem) => {
        if (props.onSearchresultClick) {
            props.onSearchresultClick(item)
            return
        }

        if (item.type === 'page') {
            // pages are neither tracked nor remembered as previous searches
            search.setSearchText('')
            router.push(item.route)
            return
        }

        const targetUrl = getResultNavigationUrl(item)
        const targetQuery = targetUrl.split('?')[1] ?? ''
        if (item.type === 'filter' && new URLSearchParams(window.location.search).toString() !== targetQuery) {
            search.setSearchText('')
        }

        addClickedSearchResultToPreviousSearches(item, props.keyForPinnedItems)

        api.trackSearch(item.id, item.type)

        router.push(targetUrl)
    }

    const noResultsFoundElement = (
        <ListGroup.Item
            key={-1}
            style={getListItemStyle(-1, true)}
            onContextMenu={e => {
                handleSearchContextMenuForCurrentElement(e)
            }}
        >
            <Image className={styles.searchResultIcon} height={32} width={32} src="/Barrier.png" alt="" />
            <span>No results here </span>
            <a
                href={`https://skysearch.app/search?q=${encodeURIComponent(searchText)}`}
                style={{ cursor: 'pointer', color: '#0d6efd', marginTop: '6px' }}
            >
                Search for {searchText} on Skysearch
            </a>
        </ListGroup.Item>
    )

    const getSelectedElement = (): JSX.Element => {
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
                            const type = getSetting(ITEM_ICON_TYPE, 'default')
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
                {props.showFavoriteToggle && props.type === 'item' && props.selected ? (
                    <FavoriteToggle
                        item={props.selected as Item}
                        className={styles.favoriteToggle}
                        size="small"
                    />
                ) : null}
                {props.enableReset ? (
                    <ClearIcon onClick={props.onResetClick} style={{ cursor: 'pointer', color: 'red', marginLeft: '10px', fontWeight: 'bold' }} />
                ) : null}
            </h1>
        )
    }

    const searchStyle: React.CSSProperties = {
        backgroundColor: props.backgroundColor,
        borderRadius: results.length > 0 || noResultsFound ? '0px 10px 0 0' : '0px 10px 10px 0px',
        borderLeftWidth: 0,
        borderBottomColor: results.length > 0 || noResultsFound ? '#444' : undefined
    }

    const searchIconStyle: React.CSSProperties = {
        width: isSmall ? 'auto' : '58px',
        borderRadius: results.length > 0 || noResultsFound ? '10px 0 0 0' : '10px 0px 0px 10px',
        backgroundColor: props.backgroundColor || '#303030',
        borderBottomColor: results.length > 0 || noResultsFound ? '#444' : undefined,
        padding: isSmall ? '0px' : undefined
    }

    function getListItemStyle(i: number, isLastRow: boolean): React.CSSProperties {
        const style = {
            backgroundColor: i === selectedIndex ? props.backgroundColorSelected || '#444' : props.backgroundColor,
            borderRadius: isLastRow ? '0 0 10px 10px' : '',
            border: 0,
            borderTop: i === 0 ? '1px solid #444' : 0,
            borderTopWidth: i === 0 ? 0 : undefined,
            fontWeigth: 'normal',
            fontFamily: 'inherit'
        }
        if (results[i]) {
            const isDuplicate = results.findIndex((element, index) => element.dataItem.name === results[i].dataItem.name && index !== i) !== -1
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

    const currentItemContextMenuElement = (
        <div>
            <Menu id={PLAYER_SEARCH_CONEXT_MENU_ID} theme={'dark'}>
                <Item
                    onClick={() => {
                        checkNameChange((props.selected as Player).uuid)
                    }}
                >
                    <Refresh style={{ marginRight: '5px' }} />
                    Trigger check if name has changed
                </Item>
            </Menu>
        </div>
    )

    const searchItemContextMenuElement = (
        <div>
            <Menu id={SEARCH_RESULT_CONTEXT_MENU_ID} theme={'dark'}>
                <Item
                    onClick={params => {
                        const item: SearchResultItem = params.props.item
                        pinSearchResult(item, props.keyForPinnedItems)
                        search.patchResult(item.id, { pinned: true, isPreviousSearch: true })
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
                        const item: SearchResultItem = params.props.item
                        unpinSearchResult(item, props.keyForPinnedItems)
                        search.patchResult(item.id, { pinned: false })
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
                            onKeyDown={onKeyPress}
                            onClick={() => {
                                if (!props.preventDisplayOfPreviousSearches && !noResultsFound && results.length === 0 && !searchText) {
                                    search.showResults(getFirstPreviousSearches(5, props.keyForPinnedItems))
                                }
                            }}
                        />
                    </InputGroup>
                </Form.Group>
            </Form>
            <ListGroup className={styles.searchResutList}>
                {noResultsFound
                    ? noResultsFoundElement
                    : rows.map((row, rowIndex) => {
                          if (row.kind === 'header') {
                              return (
                                  <ListGroup.Item
                                      as="div"
                                      key={`header-${rowIndex}-${row.label}`}
                                      className={styles.sectionHeader}
                                      style={{ backgroundColor: props.backgroundColor }}
                                  >
                                      {row.label}
                                      {row.pending ? <Spinner animation="border" size="sm" role="status" variant="primary" /> : null}
                                  </ListGroup.Item>
                              )
                          }
                          const result = row.result
                          const isPage = result.type === 'page'
                          return (
                              <ListGroup.Item
                                  key={result.id}
                                  action
                                  onClick={() => {
                                      onItemClick(result)
                                  }}
                                  onMouseEnter={() => prefetchResult(result)}
                                  style={getListItemStyle(row.index, rowIndex === rows.length - 1)}
                                  className={result.isPreviousSearch ? styles.previousSearch : undefined}
                                  onContextMenu={event => {
                                      if (!isPage) {
                                          handleSearchContextMenuForSearchResult(event, result)
                                      }
                                  }}
                              >
                                  {isPage ? (
                                      <PageResultIcon iconKey={result.iconKey} />
                                  ) : result.dataItem.iconUrl ? (
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
                                              forceUpdate()
                                          }}
                                      />
                                  ) : (
                                      <Spinner animation="border" role="status" variant="primary" />
                                  )}
                                  {result.pinned ? <PushPinIcon style={{ marginRight: '5px' }} /> : null}
                                  {getFilterResultTitle(result)}
                                  {(isPage || result.type === 'filter') && result.description ? <span className={styles.pageDescription}>{result.description}</span> : null}
                              </ListGroup.Item>
                          )
                      })}
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
