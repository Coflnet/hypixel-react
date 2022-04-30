import React, { useEffect, useState } from 'react'
import { Card } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { numberWithThousandsSeperators } from '../../utils/Formatter'
import moment from 'moment'
import { getLoadingElement } from '../../utils/LoadingUtils'
import Link from 'next/link'
import styles from './RecentAuctions.module.css'

interface Props {
    item: Item
    itemFilter: ItemFilter
}

let currentLoadingString

// Boolean if the component is mounted. Set to false in useEffect cleanup function
let mounted = true

function RecentAuctions(props: Props) {
    let [recentAuctions, setRecentAuctions] = useState<RecentAuction[]>([])
    let [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        mounted = true
    })

    useEffect(() => {
        setIsLoading(true)

        currentLoadingString = props.item.tag

        api.getRecentAuctions(props.item.tag, props.itemFilter).then(recentAuctions => {
            if (!mounted || currentLoadingString !== props.item.tag) {
                return
            }

            setIsLoading(false)
            setRecentAuctions(recentAuctions)
        })

        return () => {
            mounted = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.item.tag, JSON.stringify(props.itemFilter)])

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
            <h3>Recent auctions</h3>
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
