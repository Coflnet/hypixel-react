'use client'
import React, { useRef, useState } from 'react'
import { Button, Card } from 'react-bootstrap'
import styles from './ArchivedAuctions.module.css'
import Link from 'next/link'
import Image from 'next/image'
import NumberElement from '../Number/Number'
import moment from 'moment'
import api from '../../api/ApiHelper'
import { getLoadingElement } from '../../utils/LoadingUtils'
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn'
import { PREMIUM_RANK, hasHighEnoughPremium } from '../../utils/PremiumTypeUtils'
import DatePicker from 'react-datepicker'
import ItemFilter from '../ItemFilter/ItemFilter'
import Tooltip from '../Tooltip/Tooltip'
import { Help as HelpIcon } from '@mui/icons-material'
import InfiniteScroll from 'react-infinite-scroll-component'
import ExportArchivedData from './ExportArchivedData/ExportArchivedData'

interface Props {
    item: Item
}

const ArchivedAuctionsList = (props: Props) => {
    let [archivedAuctions, setArchivedAuctions] = useState<ArchivedAuction[]>([])
    let [isLoggedIn, setIsLoggedIn] = useState(false)
    let [premiumProducts, setPremiumProducts] = useState<PremiumProduct[]>([])
    let [from, setFrom] = useState(new Date(Date.now() - 1000 * 60 * 60 * 24 * 1000))
    let [to, setTo] = useState(new Date())
    let [filters, setFilters] = useState<FilterOptions[]>([])
    let [selectedFilter, setSelectedFilter] = useState<ItemFilter>()
    let [isLoading, setIsLoading] = useState(false)
    let [currentPage, setCurrentPage] = useState(0)
    let [allElementsLoaded, setAllElementsLoaded] = useState(false)
    let [noResults, setNoResults] = useState(false)
    let [showExportDataDialog, setShowExportDataDialog] = useState(false)

    let currentPageRef = useRef(currentPage)
    currentPageRef.current = currentPage
    let allElementsLoadedRef = useRef(allElementsLoaded)
    allElementsLoadedRef.current = allElementsLoaded
    let archivedAuctionsRef = useRef(archivedAuctions)
    archivedAuctionsRef.current = archivedAuctions

    function handleDateChange(date: Date, type: 'from' | 'to') {
        if (type === 'from') {
            setFrom(date)
        } else if (type === 'to') {
            setTo(date)
        }
        setArchivedAuctions([])
        setCurrentPage(0)
        setAllElementsLoaded(false)
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

    async function search(reset: boolean = false) {
        if (isLoading) return
        if (reset) {
            setArchivedAuctions([])
            setCurrentPage(0)
            setAllElementsLoaded(false)
            setNoResults(false)

            archivedAuctionsRef.current = []
            currentPageRef.current = 0
            allElementsLoadedRef.current = false
        }

        setIsLoading(true)
        try {
            let filter = (selectedFilter as any) || {}
            const data = await api.requestArchivedAuctions(props.item.tag, {
                ...filter,
                EndAfter: Math.floor(from.getTime() / 1000).toString(),
                EndBefore: Math.floor(to.getTime() / 1000).toString(),
                page: reset ? 0 : currentPageRef.current.toString()
            })

            if (data.queryStatus === 'Pending') {
                setTimeout(() => {
                    search()
                }, 1000)
                return
            }

            let newAuctions = [...archivedAuctionsRef.current, ...data.auctions]
            archivedAuctionsRef.current = newAuctions
            setArchivedAuctions(newAuctions)
            let newPage = currentPageRef.current + 1
            currentPageRef.current = newPage
            setCurrentPage(newPage)

            if (newAuctions.length === 0) {
                setNoResults(true)
            }

            if (newAuctions.length < 12) {
                setAllElementsLoaded(true)
                setIsLoading(false)
                return
            }

            if (reset) {
                search()
            } else {
                setIsLoading(false)
            }
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
                {premiumProducts.length > 0 && !hasHighEnoughPremium(premiumProducts, PREMIUM_RANK.PREMIUM_PLUS) ? <p>You do not have Premium+.</p> : null}
                <GoogleSignIn key="googleSignin" onAfterLogin={onAfterLogin} />
            </div>
        )
    }

    let archivedAuctionsList = archivedAuctions.map(auction => {
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

    let exportFilterProp: ItemFilter = { ...selectedFilter }
    exportFilterProp['EndBefore'] = Math.floor(to.getTime() / 1000).toString()
    exportFilterProp['EndAfter'] = Math.floor(from.getTime() / 1000).toString()

    let exportArchivedDataDialog = (
        <ExportArchivedData itemTag={props.item.tag} filter={exportFilterProp} show={showExportDataDialog} onShowChange={setShowExportDataDialog} />
    )

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
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                    onClick={() => {
                        search(true)
                    }}
                >
                    Search
                </Button>
                <Button
                    onClick={() => {
                        setShowExportDataDialog(true)
                    }}
                >
                    Download Data
                </Button>
            </div>
            <hr />
            {isLoading && archivedAuctions.length === 0 ? getLoadingElement(<p>Loading archived auctions...</p>) : null}
            {archivedAuctions.length > 0 ? (
                <>
                    <InfiniteScroll
                        loader={<div>{getLoadingElement(<p>Loading archived auctions...</p>)}</div>}
                        dataLength={archivedAuctions.length}
                        next={search}
                        hasMore={!allElementsLoaded}
                    >
                        {archivedAuctionsList}
                    </InfiniteScroll>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div>
                            <Button
                                onClick={() => {
                                    search()
                                }}
                            >
                                Click here to manually load new data...
                            </Button>
                        </div>
                    </div>
                </>
            ) : null}
            {noResults ? <p style={{ textAlign: 'center' }}>No auctions found</p> : null}
            <GoogleSignIn key="googleSignin" onAfterLogin={onAfterLogin} />
            {exportArchivedDataDialog}
        </>
    )
}

export default ArchivedAuctionsList
