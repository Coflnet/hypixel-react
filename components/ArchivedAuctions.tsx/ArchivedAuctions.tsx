'use client'
import React, { useEffect, useState } from 'react'
import { Button, Card, ListGroup } from 'react-bootstrap'
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
import ItemFilter from '../ItemFilter/ItemFilter'
import Tooltip from '../Tooltip/Tooltip'
import { Help as HelpIcon } from '@mui/icons-material'

interface Props {
    item: Item
}

const ArchivedAuctionsList = (props: Props) => {
    let [archivedAuctionsData, setArchivedAuctionsData] = useState<ArchivedAuctionResponse>()
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [premiumProducts, setPremiumProducts] = useState<PremiumProduct[]>([])
    let [from, setFrom] = useState(new Date(Date.now() - 1000 * 60 * 60 * 24 * 1000))
    let [to, setTo] = useState(new Date())
    let [filters, setFilters] = useState<FilterOptions[]>([])
    let [selectedFilter, setSelectedFilter] = useState<ItemFilter>()
    let [isLoading, setIsLoading] = useState(false)

    function handleDateChange(date: Date, type: 'from' | 'to') {
        if (type === 'from') {
            setFrom(date)
        } else if (type === 'to') {
            setTo(date)
        }
        setArchivedAuctionsData(undefined)
    }

    function loadFilters(): Promise<FilterOptions[]> {
        return Promise.all([api.getFilters(props.item?.tag || '*'), api.flipFilters(props.item?.tag || '*')]).then(filters => {
            let result = [...(filters[0] || []), ...(filters[1] || [])]
            return result
        })
    }

    async function onAfterLogin() {
        setIsLoggedIn(true)
        try {
            let [products, filters] = await Promise.all([api.getPremiumProducts(), loadFilters()])
            setIsLoggedIn(true)
            setPremiumProducts(products)
            setFilters(filters)
        } catch (e) {
            setIsLoggedIn(false)
        }
    }

    function search() {
        setIsLoading(true)
        try {
            let filter = (selectedFilter as any) || {}
            api.requestArchivedAuctions(props.item.tag, {
                ...filter,
                EndAfter: Math.floor(from.getTime() / 1000).toString(),
                EndBefore: Math.floor(to.getTime() / 1000).toString()
            }).then(data => {
                setArchivedAuctionsData(data)
                setIsLoading(false)
            })
        } catch {
            setIsLoading(false)
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

    let archivedAuctionsList = archivedAuctionsData?.auctions.map(auction => {
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
            <h3 style={{ marginBottom: '15px' }}>
                Archived Auctions{' '}
                <Tooltip
                    type="hover"
                    content={<HelpIcon style={{ color: '#007bff', cursor: 'pointer' }} />}
                    tooltipContent={<span>Showing the player name takes additional processing time and therefore may add a bit of a delay for the flips.</span>}
                />
            </h3>
            <div className={styles.datepickerContainer}>
                <label style={{ marginRight: 15 }}>From: </label>
                <div style={{ paddingRight: 15 }}>
                    <DatePicker selected={from} onChange={date => handleDateChange(date, 'from')} className={'form-control'} />
                </div>
                <label style={{ marginRight: 15 }}>To: </label>
                <DatePicker selected={to} onChange={date => handleDateChange(date, 'to')} className={'form-control'} />
            </div>
            <ItemFilter filters={filters} onFilterChange={filter => setSelectedFilter(filter)} />
            <Button onClick={search}>Search</Button>
            <hr />
            {isLoading ? getLoadingElement(<p>Loading archived auctions...</p>) : <div>{archivedAuctionsList}</div>}
            <GoogleSignIn key="googleSignin" onAfterLogin={onAfterLogin} />
        </>
    )
}

export default ArchivedAuctionsList
