'use client'
import ArrowUpIcon from '@mui/icons-material/ArrowUpward'
import HelpIcon from '@mui/icons-material/Help'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Badge, Button, ListGroup } from 'react-bootstrap'
import InfiniteScroll from 'react-infinite-scroll-component'
import api from '../../api/ApiHelper'
import { convertTagToName, getMinecraftColorCodedElement, getStyleForTier } from '../../utils/Formatter'
import { useWasAlreadyLoggedIn } from '../../utils/Hooks'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { getHighestPriorityPremiumProduct, getPremiumType, PREMIUM_RANK } from '../../utils/PremiumTypeUtils'
import { CopyButton } from '../CopyButton/CopyButton'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import ItemFilter from '../ItemFilter/ItemFilter'
import { Number } from '../Number/Number'
import Search from '../Search/Search'
import SubscribeButton from '../SubscribeButton/SubscribeButton'
import Tooltip from '../Tooltip/Tooltip'
import styles from './PlayerDetailsList.module.css'
import { usePathname } from 'next/navigation'

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
    let pathname = usePathname()
    let [listElements, setListElements] = useState<(Auction | BidForList)[]>(props.auctions || [])
    let [allElementsLoaded, setAllElementsLoaded] = useState(props.auctions ? props.auctions.length < FETCH_RESULT_SIZE : false)
    let [filteredItem, _setFilteredItem] = useState<Item>()
    let [filters, setFilters] = useState<FilterOptions[]>()
    let [itemFilter, setItemFilter] = useState<ItemFilter>()
    let [premiumRank, setPremiumRank] = useState<PremiumType>()
    let isLoadingElements = useRef(false)
    let wasAlreadyLoggedIn = useWasAlreadyLoggedIn()

    useEffect(() => {
        updateListState()
        loadFilters()
    }, [])

    useEffect(() => {
        console.log(pathname)
        onRouteChange()
    }, [pathname])

    useEffect(() => {
        mounted = true

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
        }

        return () => {
            mounted = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.player.uuid])

    useEffect(() => {
        if (!props.auctions) {
            loadNewElements()
        }
    }, [props.auctions])

    function onAfterLogin() {
        api.refreshLoadPremiumProducts(products => {
            let highestPremium = getHighestPriorityPremiumProduct(products)
            if (highestPremium) {
                let highestPremiumType = getPremiumType(highestPremium)
                premiumRank = highestPremiumType
                setPremiumRank(highestPremiumType)
            }
            if (props.onAfterLogin) {
                props.onAfterLogin()
            }
        })
    }

    function setFilteredItem(item?: Item) {
        _setFilteredItem(item)
        setListElements([])
        setAllElementsLoaded(false)
        loadNewElements(true)
        loadFilters()
    }

    function loadFilters() {
        return api.getFilters(filteredItem ? filteredItem.tag : '*').then(filters => {
            setFilters(filters)
        })
    }

    function showFilter(): boolean {
        return ((props.accountInfo && props.accountInfo?.mcId === props.player.uuid) ||
            (premiumRank && premiumRank.priority >= PREMIUM_RANK.STARTER)) as boolean
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
        return <Image src="/Coin.png" height={35} width={35} alt="auction house logo" loading="lazy" />
    }

    let getItemImageElement = (listElement: Auction | BidForList) => {
        return listElement.item.iconUrl ? (
            <Image
                crossOrigin="anonymous"
                className="auctionItemImage"
                src={listElement.item.iconUrl}
                style={{ marginRight: '10px' }}
                alt="item icon"
                height="48"
                width="48"
                loading="lazy"
            />
        ) : undefined
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
                            variant="primary"
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
                        variant="primary"
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
                    <Link href={`/auction/${listElement.uuid}`} className="disableLinkStyle">
                        <div>
                            <h4 style={{ ...getStyleForTier(listElement.item.tag) }}>
                                {getItemImageElement(listElement)}
                                {getMinecraftColorCodedElement(listElement.item.name || convertTagToName(listElement.item.tag))}
                                {listElement.end.getTime() < Date.now() || (listElement.bin && listElement.highestBid > 0) ? (
                                    <Badge bg="danger" style={{ marginLeft: '10px' }}>
                                        Ended
                                    </Badge>
                                ) : (
                                    <Badge bg="info" style={{ marginLeft: '10px' }}>
                                        Running
                                    </Badge>
                                )}
                                {listElement.bin ? (
                                    <Badge bg="success" style={{ marginLeft: '5px' }}>
                                        BIN
                                    </Badge>
                                ) : (
                                    ''
                                )}
                            </h4>
                            <p>
                                Highest Bid: <Number number={listElement.highestBid} /> {getCoinImage()}
                            </p>
                            {props.type === 'auctions' ? (
                                <p>
                                    Starting Bid: <Number number={(listElement as Auction).startingBid} /> {getCoinImage()}
                                </p>
                            ) : (
                                <p>
                                    Highest Own: <Number number={(listElement as BidForList).highestOwn} /> {getCoinImage()}
                                </p>
                            )}
                            <p>End of Auction: {listElement.end.toLocaleTimeString() + ' ' + listElement.end.toLocaleDateString()}</p>
                        </div>
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
            ) : (
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
                            onResetClick={() => setFilteredItem(undefined)}
                            hideOptions={true}
                            preventDisplayOfPreviousSearches={true}
                        />
                    </div>
                    <ItemFilter
                        filters={filters}
                        onFilterChange={filter => {
                            itemFilter = { ...filter }
                            setItemFilter(itemFilter)
                            setListElements([])
                            setAllElementsLoaded(false)
                            loadNewElements(true)
                        }}
                    />
                </>
            )}
            {wasAlreadyLoggedIn ? (
                <div style={{ visibility: 'collapse', height: 0 }}>
                    <GoogleSignIn onAfterLogin={onAfterLogin} />
                </div>
            ) : null}
            {listElements.length === 0 && allElementsLoaded ? (
                <div className={styles.noElementFound}>
                    <Image src="/Barrier.png" height="24" width="24" alt="not found icon" style={{ float: 'left', marginRight: '5px' }} />
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
