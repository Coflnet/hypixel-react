'use client'
import React, { useEffect, useState } from 'react'
import { Card, ListGroup } from 'react-bootstrap'
import styles from './ArchivedAuctions.module.css'
import Link from 'next/link'
import Image from 'next/image'
import NumberElement from '../Number/Number'
import moment from 'moment'
import api from '../../api/ApiHelper'
import { getLoadingElement } from '../../utils/LoadingUtils'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import { PREMIUM_RANK, getHighestPriorityPremiumProduct, hasHighEnoughPremium } from '../../utils/PremiumTypeUtils'
import DatePicker from 'react-datepicker'

interface Props {
    item: Item
}

const ArchivedAuctionsList = (props: Props) => {
    let [archivedAuctionsData, setArchivedAuctionsData] = useState<ArchivedAuctionResponse>()
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [premiumProducts, setPremiumProducts] = useState<PremiumProduct[]>([])
    let [from, setFrom] = useState(new Date(Date.now() - 1000 * 60 * 60 * 24 * 1000))
    let [to, setTo] = useState(new Date())

    function handleDateChange(date: Date, type: 'from' | 'to') {
        if (type === 'from') {
            setFrom(date)
        } else if (type === 'to') {
            setTo(date)
        }
        setArchivedAuctionsData(undefined)
    }

    async function onAfterLogin() {
        setIsLoggedIn(true)
        try {
            let products = await api.getPremiumProducts()
            setIsLoggedIn(true)
            setPremiumProducts(products)

            if (!hasHighEnoughPremium(products, PREMIUM_RANK.PREMIUM_PLUS)) {
                return
            }

            api.requestArchivedAuctions(props.item.tag, {
                EndBefore: Math.floor(from.getTime() / 1000).toString(),
                EndAfter: Math.floor(to.getTime() / 1000).toString()
            }).then(data => {
                setArchivedAuctionsData(data)
            })
        } catch (e) {
            setIsLoggedIn(false)
        }
    }

    if (!isLoggedIn || !hasHighEnoughPremium(premiumProducts, PREMIUM_RANK.PREMIUM_PLUS)) {
        return (
            <div>
                <div>
                    <p>To see archived auctions, you need to sign in with Google and be a Premium+ user.</p>
                </div>
                {!hasHighEnoughPremium(premiumProducts, PREMIUM_RANK.PREMIUM_PLUS) ? <p>You do not have Premium+.</p> : null}
                <GoogleSignIn key="googleSignin" onAfterLogin={onAfterLogin} />
            </div>
        )
    }

    if (archivedAuctionsData === undefined) {
        return getLoadingElement(<p>Loading archived auctions...</p>)
    }

    if (archivedAuctionsData.auctions.length === 0) {
        return getLoadingElement(<p>No archived auctions found for this item.</p>)
    }

    let archivedAuctionsList = archivedAuctionsData.auctions.map(auction => {
        return (
            <div key={auction.uuid} className={styles.cardWrapper}>
                <span className="disableLinkStyle">
                    <Link href={`/auction/${auction.uuid}`} className="disableLinkStyle">
                        <Card className="card">
                            <Card.Header style={{ padding: '10px' }}>
                                <div style={{ float: 'left' }}>
                                    <Image
                                        crossOrigin="anonymous"
                                        className="playerHeadIcon"
                                        src={props.item.iconUrl || ''}
                                        height="32"
                                        width="32"
                                        alt=""
                                        style={{ marginRight: '5px' }}
                                        loading="lazy"
                                    />
                                </div>
                                <div>
                                    <NumberElement number={auction.price} /> Coins
                                </div>
                            </Card.Header>
                            <Card.Body style={{ padding: '10px' }}>
                                <Image
                                    style={{ marginRight: '15px' }}
                                    crossOrigin="anonymous"
                                    className="playerHeadIcon"
                                    src={auction.seller.iconUrl || ''}
                                    alt=""
                                    height="24"
                                    width="24"
                                    loading="lazy"
                                />
                                <span>{auction.seller.name}</span>
                                <hr />
                                <p>{'ended ' + moment(auction.end).fromNow()}</p>
                            </Card.Body>
                        </Card>
                    </Link>
                </span>
            </div>
        )
    })

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <DatePicker selected={from} onChange={date => handleDateChange(date, 'from')} />
                <DatePicker selected={to} onChange={date => handleDateChange(date, 'to')} />
            </div>
            <ListGroup className={styles.list}>{archivedAuctionsList}</ListGroup>
            <GoogleSignIn key="googleSignin" onAfterLogin={onAfterLogin} />
        </>
    )
}

export default ArchivedAuctionsList
