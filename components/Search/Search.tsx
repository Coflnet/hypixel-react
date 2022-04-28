import React, { ChangeEvent, useEffect, useRef, useState } from 'react'
import api from '../../api/ApiHelper'
import { Form, InputGroup, ListGroup, Spinner } from 'react-bootstrap'
import { convertTagToName } from '../../utils/Formatter'
import NavBar from '../NavBar/NavBar'
import OptionsMenu from '../OptionsMenu/OptionsMenu'
import { SearchOutlined as SearchIcon, Dangerous as WrongIcon, Refresh } from '@mui/icons-material'
import { Item, Menu, theme, useContextMenu } from 'react-contexify'
import { toast } from 'react-toastify'
import { isClientSideRendering } from '../../utils/SSRUtils'
import styles from './Search.module.css'
import { useRouter } from 'next/router'

interface Props {
    selected?: Player | Item
    currentElement?: JSX.Element
    backgroundColor?: string
    searchFunction?(searchText: string)
    onSearchresultClick?(item: SearchResultItem)
    hideNavbar?: boolean
    placeholder?: string
    type?: 'player' | 'item'
    preventDisplayOfPreviousSearches?: boolean
}

const PLAYER_SEARCH_CONEXT_MENU_ID = 'player-search-context-menu'
const SEARCH_RESULT_CONTEXT_MENU_ID = 'search-result-context-menu'
const PREVIOUS_SEARCHES_KEY = 'lastSearches'
const MAX_PREVIOUS_SEARCHES_TO_DISPLAY = 3
const MAX_PREVIOUS_SEARCHES_TO_STORE = 100

function Search(props: Props) {
    let router = useRouter()
    let [searchText, setSearchText] = useState('')
    let [results, setResults] = useState<SearchResultItem[]>([])
    let [isLoading, setIsLoading] = useState(false)
    let [noResultsFound, setNoResultsFound] = useState(false)
    let [isSmall, setIsSmall] = useState(true)
    const { show } = useContextMenu({
        id: PLAYER_SEARCH_CONEXT_MENU_ID
    })
    const showSearchItemContextMenu = useContextMenu({
        id: SEARCH_RESULT_CONTEXT_MENU_ID
    }).show

    let searchElement = useRef(null)

    useEffect(() => {
        if (isClientSideRendering()) {
            setIsSmall(isClientSideRendering() ? document.body.clientWidth < 1500 : false)
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
                searchFor === ((searchElement.current as HTMLDivElement).querySelector('#search-bar') as HTMLInputElement).value
            ) {
                let previousSearchesString = localStorage.getItem(PREVIOUS_SEARCHES_KEY)
                let previousSearches: SearchResultItem[] = previousSearchesString ? JSON.parse(previousSearchesString) : []
                let matches = 0
                if (!props.preventDisplayOfPreviousSearches) {
                    previousSearches.forEach(prevSearch => {
                        if (prevSearch.dataItem.name.indexOf(searchFor) !== -1 && matches < MAX_PREVIOUS_SEARCHES_TO_DISPLAY) {
                            prevSearch.isPreviousSearch = true
                            matches++

                            let alreadyFoundIndex = searchResults.findIndex(r => r.dataItem.name === prevSearch.dataItem.name)

                            if (alreadyFoundIndex !== -1) {
                                searchResults[alreadyFoundIndex].isPreviousSearch = true
                            } else {
                                searchResults.unshift(prevSearch)
                            }
                        }
                    })
                }

                setNoResultsFound(searchResults.length === 0)
                setResults(searchResults)
                setIsLoading(false)
            }
        })
    }

    let onSearchChange = (e: ChangeEvent) => {
        let newSearchText: string = (e.target as HTMLInputElement).value
        searchText = newSearchText
        setSearchText(newSearchText)

        if (newSearchText === '') {
            setResults([])
            setIsLoading(false)
            return
        }

        setNoResultsFound(false)
        search()
    }

    let onKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
        } else {
            return
        }
        if (!results || results.length === 0) {
            return
        }
        onItemClick(results[0])
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

        let previousSearchesString = localStorage.getItem(PREVIOUS_SEARCHES_KEY)
        let previousSearches: SearchResultItem[] = previousSearchesString ? JSON.parse(previousSearchesString) : []

        let alreadyFoundIndex = previousSearches.findIndex(r => r.dataItem.name === item.dataItem.name)
        if (alreadyFoundIndex === -1) {
            previousSearches.push(item)
            if (previousSearches.length > MAX_PREVIOUS_SEARCHES_TO_STORE) {
                previousSearches.shift()
            }
            localStorage.setItem(PREVIOUS_SEARCHES_KEY, JSON.stringify(previousSearches))
        }

        api.trackSearch(item.id, item.type)
        router.push({
            pathname: item.route,
            query: item.urlSearchParams
                ? {
                      itemFilter: item.urlSearchParams?.get('itemFilter'),
                      apply: item.urlSearchParams?.get('apply')
                  }
                : {}
        })
    }

    let noResultsFoundElement = (
        <ListGroup.Item key={-1} style={{ marginBottom: '10px' }}>
            <img className={styles.searchResultIcon} height={32} src="/Barrier.png" alt="" />
            No search results
        </ListGroup.Item>
    )

    let getSelectedElement = (): JSX.Element => {
        if (props.currentElement) {
            return (
                (
                    <h1 onContextMenu={e => handleSearchContextMenuForCurrentElement(e)} className={styles.current}>
                        {props.currentElement}
                    </h1>
                ) || <div />
            )
        }
        if (!props.selected) {
            return <div />
        }
        return (
            <h1 onContextMenu={e => handleSearchContextMenuForCurrentElement(e)} className={styles.current}>
                <img crossOrigin="anonymous" className="playerHeadIcon" src={props.selected.iconUrl} height="32" alt="" style={{ marginRight: '10px' }} />
                {props.selected.name || convertTagToName((props.selected as Item).tag)}
            </h1>
        )
    }

    let searchStyle: React.CSSProperties = {
        backgroundColor: props.backgroundColor,
        borderRadius: results.length > 0 ? '0px 10px 0 0' : '0px 10px 10px 0px',
        borderLeftWidth: 0,
        borderBottomColor: results.length > 0 ? '#444' : undefined
    }

    let searchIconStyle: React.CSSProperties = {
        width: isSmall ? 'auto' : '58px',
        borderRadius: results.length > 0 ? '10px 0 0 0' : '10px 0px 0px 10px',
        backgroundColor: props.backgroundColor || '#303030',
        borderBottomColor: results.length > 0 ? '#444' : undefined,
        padding: isSmall ? '0px' : undefined
    }

    function getListItemStyle(i: number): React.CSSProperties {
        return {
            backgroundColor: props.backgroundColor,
            borderRadius: i === results.length - 1 ? '0 0 10px 10px' : '',
            border: 0,
            borderTop: i === 0 ? '1px solid #444' : 0,
            borderTopWidth: i === 0 ? 0 : undefined
        }
    }

    function isMobile() {
        if (!isClientSideRendering()) {
            return false
        }
        let check = false
        // eslint-disable-next-line no-useless-escape
        ;(function (a) {
            if (
                /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(
                    a
                ) ||
                /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
                    a.substr(0, 4)
                )
            )
                check = true
        })(navigator.userAgent || navigator.vendor || (window as any).opera)
        return check
    }

    function checkNameChange(uuid: string) {
        api.triggerPlayerNameCheck(uuid).then(() => {
            toast.success('A name check for the player was triggered. This may take a few minutes.')
        })
    }

    function handleSearchContextMenuForCurrentElement(event) {
        if (props.selected && props.type === 'player') {
            event.preventDefault()
            show(event)
        }
    }

    function handleSearchContextMenuForSearchResult(event) {
        event.preventDefault()
        showSearchItemContextMenu(event)
    }

    let currentItemContextMenuElement = (
        <div>
            <Menu id={PLAYER_SEARCH_CONEXT_MENU_ID} theme={theme.dark}>
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
            <Menu id={SEARCH_RESULT_CONTEXT_MENU_ID} theme={theme.dark}>
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
                            autoFocus={!isMobile()}
                            style={searchStyle}
                            type="text"
                            placeholder={props.placeholder || 'Search player/item'}
                            id={'search-bar'}
                            className="searchBar"
                            value={searchText}
                            onChange={onSearchChange}
                            onKeyPress={(e: any) => {
                                onKeyPress(e)
                            }}
                            onContextMenu={handleSearchContextMenuForSearchResult}
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
                              className={result.isPreviousSearch ? styles.previousSearch : null}
                          >
                              {result.dataItem.iconUrl ? (
                                  <img
                                      className={`${styles.searchResultIcon} playerHeadIcon`}
                                      crossOrigin="anonymous"
                                      width={32}
                                      src={result.dataItem.iconUrl}
                                      alt=""
                                  />
                              ) : (
                                  <Spinner animation="border" role="status" variant="primary" />
                              )}
                              {result.dataItem.name}
                          </ListGroup.Item>
                      ))}
            </ListGroup>
            <div className={styles.bar} style={{ marginTop: '20px' }}>
                {getSelectedElement()}
                {isLoading ? '' : <OptionsMenu selected={props.selected} />}
            </div>
            {searchItemContextMenuElement}
            {currentItemContextMenuElement}
        </div>
    )
}

export default Search
