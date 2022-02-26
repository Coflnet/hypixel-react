/* eslint-disable jsx-a11y/anchor-is-valid */
import moment from 'moment'
import Link from 'next/link'
import React, { ChangeEvent, useEffect, useState } from 'react'
import { Card, Form } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { numberWithThousandsSeperators } from '../../utils/Formatter'
import { getLoadingElement } from '../../utils/LoadingUtils'
import { CopyButton } from '../CopyButton/CopyButton'
import styles from './ActiveAuctions.module.css'

interface Props {
    item: Item
    filter?: ItemFilter
}

const ORDERS = [
    { label: 'Lowest price', value: 2 },
    { label: 'Highest price', value: 1 },
    { label: 'Ending soon', value: 4 }
]

let currentLoad

function ActiveAuctions(props: Props) {
    let [activeAuctions, setActiveAuctions] = useState<RecentAuction[]>([])
    let [isLoading, setIsLoading] = useState(true)
    let [order, setOrder] = useState<number>(ORDERS[0].value)

    useEffect(() => {
        loadActiveAuctions(props.item, order, props.filter)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.item.tag, JSON.stringify(props.filter), order])

    function loadActiveAuctions(item: Item, order: number, filter?: ItemFilter) {
        setIsLoading(true)
        var filterString = JSON.stringify({
            item,
            filter
        })
        currentLoad = filterString
        api.getActiveAuctions(item, order, filter)
            .then(auctions => {
                if (currentLoad !== filterString) {
                    return
                }
                setIsLoading(false)
                setActiveAuctions(auctions)
            })
            .catch(() => {
                setIsLoading(false)
                setActiveAuctions([])
            })
    }

    let onOrderChange = (event: ChangeEvent<HTMLSelectElement>) => {
        let selectedIndex = event.target.options.selectedIndex
        let order = event.target.options[selectedIndex].getAttribute('data-id')!

        setOrder(parseInt(order))
    }

    let activeAuctionList = activeAuctions.map(activeAuction => {
        return (
            <div className={styles.cardWrapper} key={activeAuction.uuid}>
                <Card>
                    <span className="disableLinkStyle">
                        <Link href={`/auction/${activeAuction.uuid}`}>
                            <Card.Header style={{ padding: '10px' }}>
                                <div style={{ display: 'flex', alignContent: 'center', justifyContent: 'space-between' }}>
                                    <img
                                        crossOrigin="anonymous"
                                        className="playerHeadIcon"
                                        src={props.item.iconUrl}
                                        width="32"
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
                {isLoading ? (
                    <div style={{ marginTop: '20px' }}>{getLoadingElement()}</div>
                ) : activeAuctions.length > 0 ? (
                    activeAuctionList
                ) : (
                    <p style={{ textAlign: 'center' }}>No active auctions found</p>
                )}
            </div>
        </div>
    )
}

export default ActiveAuctions
