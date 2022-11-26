import React, { useEffect, useRef, useState } from 'react'
import { Badge, Button, ListGroup } from 'react-bootstrap'
import InfiniteScroll from 'react-infinite-scroll-component'
import api from '../../api/ApiHelper'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { convertTagToName, numberWithThousandsSeperators } from '../../utils/Formatter'
import { useForceUpdate, useWasAlreadyLoggedIn } from '../../utils/Hooks'
import SubscribeButton from '../SubscribeButton/SubscribeButton'
import { ArrowUpward as ArrowUpIcon, Help as HelpIcon } from '@mui/icons-material'
import { CopyButton } from '../CopyButton/CopyButton'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from './PlayerDetailsList.module.css'
import Search from '../Search/Search'
import ItemFilter from '../ItemFilter/ItemFilter'
import { getHighestPriorityPremiumProduct, getPremiumType, PREMIUM_RANK } from '../../utils/PremiumTypeUtils'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import Tooltip from '../Tooltip/Tooltip'

interface Props {
    player: Player
    loadingDataFunction(uuid: string, page: number, filter: ItemFilter)
    type: 'auctions' | 'bids'
    auctions?: Auction[]
    accountInfo?: AccountInfo
    onAfterLogin?()
}

interface ListState {
    listElements: (Auction | BidForList)[]
    allElementsLoaded: boolean
    yOffset: number
    playerUUID: string
    type: 'auctions' | 'bids'
}

// Boolean if the component is mounted. Set to false in useEffect cleanup function
let mounted = true

// States, to remember the positions in the list, after coming back
let listStates: ListState[] = []

const FETCH_RESULT_SIZE = 10

function PlayerDetailsList(props: Props) {
    let forceUpdate = useForceUpdate()
    let router = useRouter()

    let [listElements, setListElements] = useState<(Auction | BidForList)[]>(props.auctions || [])
    let [allElementsLoaded, setAllElementsLoaded] = useState(props.auctions ? props.auctions.length < FETCH_RESULT_SIZE : false)
    let [filteredItem, setFilteredItem] = useState<Item>(null)
    let [filters, setFilters] = useState<FilterOptions[]>()
    let [itemFilter, setItemFilter] = useState<ItemFilter>()
    let [premiumRank, setPremiumRank] = useState<PremiumType>()
    let isLoadingElements = useRef(false)
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn()

    useEffect(() => {
        loadFilters()
    }, [])

    useEffect(() => {
        mounted = true
        router.events.on('routeChangeStart', onRouteChange)

        let listState = getListState()
        if (listState !== undefined) {
            setListElements(listState.listElements)
            setAllElementsLoaded(listState.allElementsLoaded)
            setTimeout(() => {
                if (!mounted) {
                    return
                }
                window.scrollTo({
                    left: 0,
                    top: listState!.yOffset,
                    behavior: 'auto'
                })
            }, 100)
        } else {
            loadNewElements(true)
        }

        return () => {
            mounted = false
            router.events.off('routeChangeStart', onRouteChange)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.player.uuid])

    useEffect(() => {
        if (!props.auctions) {
            loadNewElements()
        }
    }, [props.auctions])

    useEffect(() => {
        loadNewElements(true)
        loadFilters()
    }, [filteredItem])

    function onAfterLogin() {
        api.getPremiumProducts().then(products => {
            let highestPremium = getHighestPriorityPremiumProduct(products)
            if (highestPremium) {
                let highestPremiumType = getPremiumType(highestPremium)
                premiumRank = highestPremiumType
                setPremiumRank(highestPremiumType)
            }
            props.onAfterLogin()
        })
    }

    function loadFilters() {
        return Promise.all([api.getFilters(filteredItem ? filteredItem.tag : '*'), api.flipFilters(filteredItem ? filteredItem.tag : '*')]).then(filters => {
            let result = [...filters[0], ...filters[1]]
            setFilters(result)
        })
    }

    function showFilter(): boolean {
        return (props.accountInfo && props.accountInfo?.mcId === props.player.uuid) || (premiumRank && premiumRank.priority > PREMIUM_RANK.STARTER)
    }

    let onRouteChange = () => {
        let listState = getListState()
        if (listState) {
            listState.yOffset = window.pageYOffset
        }
    }

    let loadNewElements = (reset?: boolean): void => {
        if (isLoadingElements.current) {
            return
        }

        let filter = { ...itemFilter }
        if (filteredItem) {
            filter['tag'] = filteredItem.tag
        }

        isLoadingElements.current = true
        props
            .loadingDataFunction(props.player.uuid, reset ? 0 : Math.ceil(listElements.length / FETCH_RESULT_SIZE), filter)
            .then(newListElements => {
                isLoadingElements.current = false
                if (!mounted) {
                    return
                }

                if (newListElements.length === 0) {
                    allElementsLoaded = true
                    setAllElementsLoaded(true)
                }

                listElements = reset ? newListElements : listElements.concat(newListElements)

                newListElements.forEach(auction => {
                    auction.item.iconUrl = api.getItemImageUrl(auction.item)
                })
                setListElements(listElements)
                updateListState()

                if (listElements.length < FETCH_RESULT_SIZE && newListElements.length !== 0) {
                    loadNewElements()
                }
            })
            .catch(() => {
                setAllElementsLoaded(true)
            })
    }

    let getCoinImage = () => {
        return <img src="/Coin.png" height="35px" width="35px" alt="auction house logo" loading="lazy" />
    }

    let getItemImageElement = (listElement: Auction | BidForList) => {
        return listElement.item.iconUrl ? (
            <img
                crossOrigin="anonymous"
                className="auctionItemImage"
                src={listElement.item.iconUrl}
                style={{ marginRight: '10px' }}
                alt="item icon"
                height="48"
                onError={error => onImageLoadError(listElement, error)}
                loading="lazy"
            />
        ) : undefined
    }

    let onImageLoadError = (listElement: Auction | BidForList, data: any) => {
        api.getItemDetails(listElement.item.tag).then(item => {
            listElement.item.iconUrl = item.iconUrl
            setListElements(listElements)
            forceUpdate()
        })
    }

    let updateListState = () => {
        let listState = getListState()
        if (listState) {
            listState.allElementsLoaded = allElementsLoaded
            listState.listElements = listElements
        } else {
            listStates.push({
                type: props.type,
                listElements: listElements,
                playerUUID: props.player.uuid,
                yOffset: window.pageYOffset,
                allElementsLoaded: allElementsLoaded
            })
        }
    }

    let getListState = (): ListState | undefined => {
        return listStates.find(state => {
            return state.playerUUID === props.player.uuid && state.type === props.type
        })
    }

    let bottomElements = (
        <div className={styles.fixedBottom}>
            {props.type === 'auctions' ? (
                <>
                    <div className={styles.btnBottom}>
                        <SubscribeButton type="player" topic={props.player.uuid} />
                    </div>
                    <CopyButton
                        buttonVariant="primary"
                        buttonWrapperClass={styles.btnBottom}
                        copyValue={'/ah ' + props.player.name}
                        successMessage={
                            <p>
                                Copied ingame link <br /> <i>/ah {props.player.name}</i>
                            </p>
                        }
                    />
                    <div className={styles.btnBottom}>
                        <Button
                            aria-label="up button"
                            type="primary"
                            className={styles.upButton}
                            onClick={() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                        >
                            <ArrowUpIcon />
                        </Button>
                    </div>
                </>
            ) : null}
            {props.type === 'bids' ? (
                <>
                    <div className={styles.btnBottom}>
                        <SubscribeButton type="player" topic={props.player.uuid} />
                    </div>
                    <Button
                        type="primary"
                        className={styles.btnBottom}
                        onClick={() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                    >
                        <ArrowUpIcon />
                    </Button>
                </>
            ) : null}
        </div>
    )

    let list = listElements.map((listElement, i) => {
        return (
            <ListGroup.Item action className={styles.listGroupItem} key={'listItem-' + i}>
                <span key={listElement.uuid} className={`${styles.disableLinkStyle} ${styles.listItemLink}`}>
                    <Link href={`/auction/${listElement.uuid}`}>
                        <a className="disableLinkStyle">
                            <div>
                                <h4>
                                    {getItemImageElement(listElement)}
                                    {listElement.item.name || convertTagToName(listElement.item.tag)}
                                    {listElement.end.getTime() < Date.now() || (listElement.bin && listElement.highestBid > 0) ? (
                                        <Badge variant="danger" style={{ marginLeft: '10px' }}>
                                            Ended
                                        </Badge>
                                    ) : (
                                        <Badge variant="info" style={{ marginLeft: '10px' }}>
                                            Running
                                        </Badge>
                                    )}
                                    {listElement.bin ? (
                                        <Badge style={{ marginLeft: '5px' }} variant="success">
                                            BIN
                                        </Badge>
                                    ) : (
                                        ''
                                    )}
                                </h4>
                                <p>
                                    Highest Bid: {numberWithThousandsSeperators(listElement.highestBid)} {getCoinImage()}
                                </p>
                                {props.type === 'auctions' ? (
                                    <p>
                                        Starting Bid: {numberWithThousandsSeperators((listElement as Auction).startingBid)} {getCoinImage()}
                                    </p>
                                ) : (
                                    <p>
                                        Highest Own: {numberWithThousandsSeperators((listElement as BidForList).highestOwn)} {getCoinImage()}
                                    </p>
                                )}
                                <p>End of Auction: {listElement.end.toLocaleTimeString() + ' ' + listElement.end.toLocaleDateString()}</p>
                            </div>
                        </a>
                    </Link>
                </span>
            </ListGroup.Item>
        )
    })

    return (
        <div className={styles.playerDetailsList}>
            {!showFilter() ? (
                <p>
                    <Tooltip
                        content={
                            <span>
                                How to filter auctions/bids{' '}
                                <Link href="/premium">
                                    <HelpIcon style={{ color: '#007bff', cursor: 'pointer' }} />
                                </Link>
                            </span>
                        }
                        hoverPlacement="bottom"
                        type="hover"
                        tooltipContent={
                            <>
                                <p>Claim your account to filter your own auctions/bids.</p>
                                <p>If you have starter premium or above you are able to use the filter for any player.</p>
                            </>
                        }
                    />
                </p>
            ) : null}
            {showFilter() ? (
                <>
                    <div style={{ marginLeft: '40px', marginRight: '40px' }}>
                        <Search
                            selected={filteredItem}
                            type="item"
                            searchFunction={api.itemSearch}
                            onSearchresultClick={item => {
                                setFilteredItem({
                                    ...item.dataItem,
                                    tag: item.id
                                })
                            }}
                            hideNavbar={true}
                            placeholder="Search item"
                            enableReset={true}
                            onResetClick={() => setFilteredItem(null)}
                            hideOptions={true}
                        />
                    </div>
                    <ItemFilter
                        filters={filters}
                        onFilterChange={filter => {
                            itemFilter = filter
                            setItemFilter(filter)
                            setListElements([])
                            setAllElementsLoaded(false)
                            loadNewElements(true)
                        }}
                    />
                </>
            ) : null}
            {wasAlreadyLoggedIn ? (
                <div style={{ visibility: 'collapse' }}>
                    <GoogleSignIn onAfterLogin={onAfterLogin} />
                </div>
            ) : null}
            {listElements.length === 0 && allElementsLoaded ? (
                <div className={styles.noElementFound}>
                    <img src="/Barrier.png" height="24" alt="not found icon" style={{ float: 'left', marginRight: '5px' }} />
                    <p>No {props.type} found</p>
                </div>
            ) : (
                <InfiniteScroll
                    style={{ overflow: 'hidden' }}
                    dataLength={listElements.length}
                    next={() => {
                        loadNewElements()
                    }}
                    hasMore={!allElementsLoaded}
                    loader={
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <div>
                                <div>{getLoadingElement()}</div>
                                <Button
                                    onClick={() => {
                                        loadNewElements()
                                    }}
                                >
                                    Click here to manually load new data...
                                </Button>
                            </div>
                        </div>
                    }
                >
                    <ListGroup className={styles.list}>{list}</ListGroup>
                </InfiniteScroll>
            )}
            {bottomElements}
        </div>
    )
}

export default PlayerDetailsList
