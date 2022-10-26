/* eslint-disable jsx-a11y/anchor-is-valid */
import moment from 'moment'
import Link from 'next/link'
import React, { ChangeEvent, useEffect, useRef, useState } from 'react'
import { Button, Card, Form } from 'react-bootstrap'
import InfiniteScroll from 'react-infinite-scroll-component'
import api from '../../api/ApiHelper'
import { numberWithThousandsSeperators } from '../../utils/Formatter'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { getHighestPriorityPremiumProduct, getPremiumType, PREMIUM_RANK } from '../../utils/PremiumTypeUtils'
import { CopyButton } from '../CopyButton/CopyButton'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import styles from './ActiveAuctions.module.css'

interface Props {
    item: Item
    filter?: ItemFilter
}

const ORDERS = [
    { label: 'Lowest price', value: 'LOWEST_PRICE' },
    { label: 'Highest price', value: 'HIGHEST_PRICE' },
    { label: 'Ending soon', value: 'ENDING_SOON' }
]

let FETCH_RESULT_SIZE = 12

let currentLoad

function ActiveAuctions(props: Props) {
    let [activeAuctions, setActiveAuctions] = useState<RecentAuction[]>([])
    let [order, setOrder] = useState<string>(ORDERS[0].value)
    let [allElementsLoaded, setAllElementsLoaded] = useState(false)
    let [premiumRank, setPremiumRank] = useState<PremiumType>(null)
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let isLoadingElements = useRef(false)

    useEffect(() => {
        loadActiveAuctions()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.item.tag, JSON.stringify(props.filter), order])

    function loadActiveAuctions() {
        var filterString = JSON.stringify({
            item: props.item,
            filter: props.filter
        })
        if (isLoadingElements.current) {
            return
        }
        isLoadingElements.current = true
        currentLoad = filterString

        let page = Math.ceil(activeAuctions.length / FETCH_RESULT_SIZE)
        let maxPages = 10
        switch (premiumRank?.priority) {
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

        let filter = { ...props.filter }

        if (page >= maxPages) {
            setAllElementsLoaded(true)
            isLoadingElements.current = false
            return
        }
        filter['page'] = page.toString()

        api.getActiveAuctions(props.item, order, filter)
            .then(auctions => {
                if (currentLoad !== filterString) {
                    return
                }
                isLoadingElements.current = false
                if (auctions.length < FETCH_RESULT_SIZE) {
                    setAllElementsLoaded(true)
                }
                setActiveAuctions([...activeAuctions, ...auctions])
            })
            .catch(() => {
                isLoadingElements.current = false
                setActiveAuctions([])
            })
    }

    let onOrderChange = (event: ChangeEvent<HTMLSelectElement>) => {
        let selectedIndex = event.target.options.selectedIndex
        let order = event.target.options[selectedIndex].getAttribute('data-id')!

        setOrder(order)
    }

    function onAfterLogin() {
        api.getPremiumProducts().then(products => {
            setIsLoggedIn(true)
            let highestPremium = getPremiumType(getHighestPriorityPremiumProduct(products))
            premiumRank = highestPremium
            setPremiumRank(() => {
                setAllElementsLoaded(() => {
                    if (highestPremium !== null) {
                        loadActiveAuctions()
                    }
                    return false
                })
                return highestPremium
            })
        })
    }

    let activeAuctionList = activeAuctions.map((activeAuction, i) => {
        return (
            <div className={styles.cardWrapper} key={activeAuction.uuid}>
                <Card>
                    <span>
                        <Link href={`/auction/${activeAuction.uuid}`}>
                            <a className="disableLinkStyle">
                                <Card.Header style={{ padding: '10px' }}>
                                    <div style={{ display: 'flex', alignContent: 'center', justifyContent: 'space-between' }}>
                                        <img
                                            crossOrigin="anonymous"
                                            className="playerHeadIcon"
                                            src={props.item.iconUrl}
                                            height="32"
                                            alt=""
                                            style={{ marginRight: '5px' }}
                                            loading="lazy"
                                        />
                                        <span style={{ padding: '2px', textAlign: 'center' }}>{numberWithThousandsSeperators(activeAuction.price)} Coins</span>
                                        <div onClick={e => e.preventDefault()}>
                                            <CopyButton
                                                buttonVariant="primary"
                                                copyValue={'/viewauction ' + activeAuction.uuid}
                                                successMessage={
                                                    <p>
                                                        Copied ingame link <br />
                                                        <i>/viewauction {activeAuction.uuid}</i>
                                                    </p>
                                                }
                                            />
                                        </div>
                                    </div>
                                </Card.Header>
                            </a>
                        </Link>
                    </span>
                    <Card.Body style={{ padding: '10px' }}>
                        <img
                            style={{ marginRight: '15px' }}
                            crossOrigin="anonymous"
                            className="playerHeadIcon"
                            src={activeAuction.seller.iconUrl}
                            alt=""
                            height="24"
                            width="24"
                            loading="lazy"
                        />
                        <span>{activeAuction.playerName}</span>
                        <hr />
                        <p>{'ends ' + moment(activeAuction.end).fromNow()}</p>
                    </Card.Body>
                </Card>
            </div>
        )
    })

    let orderListElement = ORDERS.map(order => {
        return (
            <option key={order.value} value={order.value} data-id={order.value}>
                {order.label}
            </option>
        )
    })

    return (
        <div className="active-auctions">
            <div className="active-auctions-list">
                <div style={{ margin: '20px' }}>
                    <Form.Control as="select" onChange={onOrderChange}>
                        {orderListElement}
                    </Form.Control>
                </div>
                {activeAuctions.length > 0 ? (
                    <InfiniteScroll
                        style={{ overflow: 'hidden' }}
                        dataLength={activeAuctionList.length}
                        next={() => {
                            loadActiveAuctions()
                        }}
                        hasMore={!allElementsLoaded}
                        loader={
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <div>
                                    <div>{getLoadingElement()}</div>
                                    <Button
                                        onClick={() => {
                                            loadActiveAuctions()
                                        }}
                                    >
                                        Click here to manually load new data...
                                    </Button>
                                </div>
                            </div>
                        }
                    >
                        {activeAuctionList}
                    </InfiniteScroll>
                ) : (
                    <p style={{ textAlign: 'center' }}>No active auctions found</p>
                )}
            </div>
            {!isLoggedIn ? (
                <p>
                    You can see more auctions with{' '}
                    <Link href={'/premium'}>
                        <a>Premium:</a>
                    </Link>
                    <div style={{ marginTop: '15px' }}>
                        <GoogleSignIn onAfterLogin={onAfterLogin} />
                    </div>
                </p>
            ) : null}
        </div>
    )
}

export default ActiveAuctions
