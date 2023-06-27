'use client'
import moment from 'moment'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Badge, Card, Form } from 'react-bootstrap'
import api from '../../../api/ApiHelper'
import { useForceUpdate } from '../../../utils/Hooks'
import { getLoadingElement } from '../../../utils/LoadingUtils'
import { Number } from '../../Number/Number'
import styles from './FlipBased.module.css'

interface Props {
    auctionUUID: string
    item: Item
}

function FlipBased(props: Props) {
    let [auctions, setAuctions] = useState<Auction[]>([])
    let [isLoading, setIsLoading] = useState(true)
    let [hasLoadingFailed, setHasLoadingFailed] = useState(false)
    let [orderBy, setOrderBy] = useState('time')

    let forceUpdate = useForceUpdate()

    useEffect(() => {
        api.getFlipBasedAuctions(props.auctionUUID)
            .then(auctions => {
                setAuctions(auctions)
                setIsLoading(false)
            })
            .catch(() => {
                setIsLoading(false)
                setHasLoadingFailed(true)
            })
    }, [props.auctionUUID])

    useEffect(() => {
        forceUpdate()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.item.iconUrl, props.item.name])

    auctions = orderBy === 'time' ? auctions.sort((a, b) => b.end.getTime() - a.end.getTime()) : auctions.sort((a, b) => b.highestBid - a.highestBid)
    let auctionsElement = auctions.map(auction => {
        return (
            <>
                <div className={styles.cardWrapper} style={{ display: 'inline-block' }} key={auction.uuid}>
                    <span className="disableLinkStyle">
                        <Link href={`/auction/${auction.uuid}`} className="disableLinkStyle">
                            <Card className="card">
                                <Card.Header style={{ padding: '10px' }}>
                                    <p className="ellipsis" style={{ width: '180px' }}>
                                        <Image
                                            crossOrigin="anonymous"
                                            src={props.item.iconUrl || ''}
                                            height="32"
                                            width="32"
                                            alt=""
                                            style={{ marginRight: '5px' }}
                                            loading="lazy"
                                        />
                                        {auction.item.name}
                                    </p>
                                </Card.Header>
                                <Card.Body>
                                    <div>
                                        <ul>
                                            <li>Ended {moment(auction.end).fromNow()}</li>
                                            <li>
                                                <Number number={auction.highestBid || auction.startingBid} /> Coins
                                            </li>
                                            {auction.bin ? (
                                                <li>
                                                    <Badge style={{ marginLeft: '5px' }} bg="success">
                                                        BIN
                                                    </Badge>
                                                </li>
                                            ) : (
                                                ''
                                            )}
                                        </ul>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Link>
                    </span>
                </div>
            </>
        )
    })

    return (
        <div>
            {isLoading ? getLoadingElement() : null}
            {!isLoading && !hasLoadingFailed && auctions.length > 0 ? (
                <>
                    <div className={styles.filterContainer}>
                        <Form.Select
                            className={styles.filterInput}
                            defaultValue={'time'}
                            onChange={e => {
                                setOrderBy(e.target.value)
                            }}
                        >
                            <option key="time" value="time">
                                Time
                            </option>
                            <option key="price" value="price">
                                Price
                            </option>
                        </Form.Select>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'stretch' }}>{auctionsElement}</div>
                </>
            ) : null}
            {!isLoading && !hasLoadingFailed && auctions.length === 0 ? <p>No auctions found</p> : null}
            {hasLoadingFailed ? <p>An error occured while loading the auctions</p> : null}
        </div>
    )
}

export default FlipBased
