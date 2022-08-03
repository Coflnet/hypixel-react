import React, { ChangeEvent, useEffect, useState } from 'react'
import { Card, Form } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { numberWithThousandsSeperators } from '../../utils/Formatter'
import moment from 'moment'
import { getLoadingElement } from '../../utils/LoadingUtils'
import Link from 'next/link'
import styles from './RecentAuctions.module.css'
import { isClientSideRendering } from '../../utils/SSRUtils'
import { RECENT_AUCTIONS_FETCH_TYPE_KEY } from '../../utils/SettingsUtils'

interface Props {
    item: Item
    itemFilter: ItemFilter
}

enum RECENT_AUCTIONS_FETCH_TYPE {
    ALL = 'all',
    SOLD = 'sold',
    UNSOLD = 'unsold'
}

let currentLoadingString

// Boolean if the component is mounted. Set to false in useEffect cleanup function
let mounted = true

function RecentAuctions(props: Props) {
    let [recentAuctions, setRecentAuctions] = useState<RecentAuction[]>([])
    let [isLoading, setIsLoading] = useState(true)
    let [isSSR, setIsSSR] = useState(!isClientSideRendering())

    useEffect(() => {
        mounted = true
        setIsSSR(false)
        return () => {
            mounted = false
        }
    }, [])

    useEffect(() => {
        loadRecentAuctions()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.item.tag, JSON.stringify(props.itemFilter)])

    function loadRecentAuctions() {
        setIsLoading(true)
        currentLoadingString = props.item.tag

        let itemFilter = { ...props.itemFilter }

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
                    break
            }
        }

        api.getRecentAuctions(props.item.tag, itemFilter).then(recentAuctions => {
            if (!mounted || currentLoadingString !== props.item.tag) {
                return
            }

            setIsLoading(false)
            setRecentAuctions(recentAuctions)
        })
    }

    function onFetchTypeChange(e: ChangeEvent<HTMLInputElement>) {
        localStorage.setItem(RECENT_AUCTIONS_FETCH_TYPE_KEY, e.target.value)
        loadRecentAuctions()
    }

    let recentAuctionList = recentAuctions.map(recentAuction => {
        return (
            <div className={styles.cardWrapper} key={recentAuction.uuid}>
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
                {isLoading ? (
                    getLoadingElement()
                ) : recentAuctions.length > 0 ? (
                    recentAuctionList
                ) : (
                    <p style={{ textAlign: 'center' }}>No recent auctions found</p>
                )}
            </div>
        </div>
    )
}

export default RecentAuctions
