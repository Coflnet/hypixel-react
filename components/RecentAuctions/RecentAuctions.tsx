import React, { ChangeEvent, useEffect, useRef, useState } from 'react'
import { Button, Card, Form } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { numberWithThousandsSeperators } from '../../utils/Formatter'
import moment from 'moment'
import { getLoadingElement } from '../../utils/LoadingUtils'
import Link from 'next/link'
import styles from './RecentAuctions.module.css'
import { isClientSideRendering } from '../../utils/SSRUtils'
import { RECENT_AUCTIONS_FETCH_TYPE_KEY } from '../../utils/SettingsUtils'
import InfiniteScroll from 'react-infinite-scroll-component'
import { getHighestPriorityPremiumProduct, getPremiumType, PREMIUM_RANK } from '../../utils/PremiumTypeUtils'
import { useStateWithRef } from '../../utils/Hooks'
import { getMoreAuctionsElement } from '../../utils/ListUtils'

interface Props {
    item: Item
    itemFilter: ItemFilter
}

enum RECENT_AUCTIONS_FETCH_TYPE {
    ALL = 'all',
    SOLD = 'sold',
    UNSOLD = 'unsold'
}

const FETCH_RESULT_SIZE = 12

let currentLoadingString

// Boolean if the component is mounted. Set to false in useEffect cleanup function
let mounted = true

function RecentAuctions(props: Props) {
    let [recentAuctions, setRecentAuctions, recentAuctionsRef] = useStateWithRef<RecentAuction[]>([])
    let [isSSR, setIsSSR] = useState(!isClientSideRendering())
    let [allElementsLoaded, setAllElementsLoaded] = useState(false)
    let [premiumType, setPremiumType] = useState<PremiumType>(null)
    let [isLoggedIn, setIsLoggedIn] = useState(false)

    let itemFilterRef = useRef<ItemFilter>(null)
    itemFilterRef.current = props.itemFilter

    useEffect(() => {
        mounted = true
        setIsSSR(false)
        return () => {
            mounted = false
        }
    }, [])

    useEffect(() => {
        loadRecentAuctions(true)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.item.tag, JSON.stringify(props.itemFilter)])

    function loadRecentAuctions(reset: boolean = false) {
        let recentAuctions = reset ? [] : recentAuctionsRef.current
        if (reset) {
            setRecentAuctions([])
        }

        let itemFilter = { ...itemFilterRef.current }
        currentLoadingString = JSON.stringify({ tag: props.item.tag, filter: itemFilterRef.current })

        if (!props.itemFilter || props.itemFilter['HighestBid'] === undefined) {
            let fetchType = localStorage.getItem(RECENT_AUCTIONS_FETCH_TYPE_KEY)

            switch (fetchType) {
                case RECENT_AUCTIONS_FETCH_TYPE.UNSOLD:
                    itemFilter['HighestBid'] = '0'
                    break
                case RECENT_AUCTIONS_FETCH_TYPE.ALL:
                    break
                case RECENT_AUCTIONS_FETCH_TYPE.SOLD:
                default:
                    itemFilter['HighestBid'] = '>0'
                    break
            }
        }

        let page = Math.ceil(recentAuctions.length / FETCH_RESULT_SIZE)
        let maxPages = 10
        switch (premiumType?.priority) {
            case PREMIUM_RANK.STARTER:
                maxPages = 5
                break
            case PREMIUM_RANK.PREMIUM:
            case PREMIUM_RANK.PREMIUM_PLUS:
                maxPages = 10
                break
            default:
                maxPages = 1
                break
        }

        if (page >= maxPages) {
            setAllElementsLoaded(true)
            return
        }
        itemFilter['page'] = page.toString()

        api.getRecentAuctions(props.item.tag, itemFilter).then(newRecentAuctions => {
            if (!mounted || currentLoadingString !== JSON.stringify({ tag: props.item.tag, filter: itemFilterRef.current })) {
                return
            }
            if (newRecentAuctions.length < FETCH_RESULT_SIZE) {
                setAllElementsLoaded(true)
            }
            setRecentAuctions([...recentAuctions, ...newRecentAuctions])
        })
    }

    function onFetchTypeChange(e: ChangeEvent<HTMLInputElement>) {
        localStorage.setItem(RECENT_AUCTIONS_FETCH_TYPE_KEY, e.target.value)
        loadRecentAuctions(true)
    }

    function onAfterLogin() {
        api.getPremiumProducts().then(products => {
            setIsLoggedIn(true)
            let activePremium = getHighestPriorityPremiumProduct(products)
            if (!activePremium) {
                return
            }
            let highestPremium = getPremiumType(activePremium)
            premiumType = highestPremium
            setPremiumType(() => {
                setAllElementsLoaded(() => {
                    if (highestPremium !== null) {
                        loadRecentAuctions()
                    }
                    return false
                })
                return highestPremium
            })
        })
    }

    let recentAuctionList = recentAuctions.map(recentAuction => {
        return (
            <div className={styles.cardWrapper}>
                <span className="disableLinkStyle">
                    <Link href={`/auction/${recentAuction.uuid}`}>
                        <a className="disableLinkStyle">
                            <Card className="card">
                                <Card.Header style={{ padding: '10px' }}>
                                    <div style={{ float: 'left' }}>
                                        <img
                                            crossOrigin="anonymous"
                                            className="playerHeadIcon"
                                            src={props.item.iconUrl}
                                            height="32"
                                            alt=""
                                            style={{ marginRight: '5px' }}
                                            loading="lazy"
                                        />
                                    </div>
                                    <div>{numberWithThousandsSeperators(recentAuction.price)} Coins</div>
                                </Card.Header>
                                <Card.Body style={{ padding: '10px' }}>
                                    <img
                                        style={{ marginRight: '15px' }}
                                        crossOrigin="anonymous"
                                        className="playerHeadIcon"
                                        src={recentAuction.seller.iconUrl}
                                        alt=""
                                        height="24"
                                        loading="lazy"
                                    />
                                    <span>{recentAuction.playerName}</span>
                                    <hr />
                                    <p>{'ended ' + moment(recentAuction.end).fromNow()}</p>
                                </Card.Body>
                            </Card>
                        </a>
                    </Link>
                </span>
            </div>
        )
    })

    return (
        <div className={styles.recentAuctions}>
            <h3>
                Recent auctions
                {!isSSR ? (
                    <Form.Control
                        as="select"
                        defaultValue={localStorage.getItem(RECENT_AUCTIONS_FETCH_TYPE_KEY) || RECENT_AUCTIONS_FETCH_TYPE.SOLD}
                        className={styles.recentAuctionsFetchType}
                        onChange={onFetchTypeChange}
                    >
                        <option value={RECENT_AUCTIONS_FETCH_TYPE.ALL}>ALL</option>
                        <option value={RECENT_AUCTIONS_FETCH_TYPE.SOLD}>Sold</option>
                        <option value={RECENT_AUCTIONS_FETCH_TYPE.UNSOLD}>Unsold</option>
                    </Form.Control>
                ) : null}
            </h3>
            <div>
                {recentAuctions.length > 0 ? (
                    <InfiniteScroll
                        style={{ overflow: 'clip' }}
                        dataLength={recentAuctions.length}
                        next={() => {
                            loadRecentAuctions()
                        }}
                        hasMore={!allElementsLoaded}
                        loader={
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <div>
                                    <div>{getLoadingElement()}</div>
                                    <Button
                                        onClick={() => {
                                            loadRecentAuctions()
                                        }}
                                    >
                                        Click here to manually load new data...
                                    </Button>
                                </div>
                            </div>
                        }
                    >
                        {recentAuctionList}
                    </InfiniteScroll>
                ) : (
                    <p style={{ textAlign: 'center' }}>No recent auctions found</p>
                )}
            </div>
            {getMoreAuctionsElement(
                isLoggedIn,
                premiumType,
                onAfterLogin,
                <span>
                    You currently use Starter Premium. You can see up to 120 recent auctions with
                    <Link href={'/premium'}>
                        <a>Premium</a>
                    </Link>
                </span>
            )}
        </div>
    )
}

export default RecentAuctions
