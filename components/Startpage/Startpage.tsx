'use client'

import { useMatomo } from '@jonkoops/matomo-tracker-react'
import NewIcon from '@mui/icons-material/FiberNew'
import FireIcon from '@mui/icons-material/Fireplace'
import PersonIcon from '@mui/icons-material/Person'
import TimerIcon from '@mui/icons-material/Timer'
import moment from 'moment'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import Card from 'react-bootstrap/Card'
import Badge from 'react-bootstrap/Badge'
import { FixedSizeList as List } from 'react-window'
import api from '../../api/ApiHelper'
import { getMinecraftColorCodedElement } from '../../utils/Formatter'
import Number from '../Number/Number'
import styles from './Startpage.module.css'
import { StartpageLargeElementSkeleton } from './StartpageLargeElementSkeleton'

interface Props {
    newAuctions?: Auction[]
    popularSearches?: PopularSearch[]
    newPlayers?: Player[]
    newItems?: Item[]
}

function Startpage(props: Props) {
    let { trackEvent } = useMatomo()

    let [newAuctions, setNewAuctions] = useState<Auction[]>(props.newAuctions || [])
    let [endedAuctions, setEndedAuctions] = useState<Auction[]>([])
    let [popularSearches, setPopularSearches] = useState<PopularSearch[]>(props.popularSearches || [])
    let [newPlayers, setNewPlayers] = useState<Player[]>(props.newPlayers || [])
    let [newItems, setNewItems] = useState<Item[]>(props.newItems || [])
    let [isSSR, setIsSSR] = useState(true)

    useEffect(() => {
        setIsSSR(false)
        setTimeout(() => {
            attachScrollEvent(styles.startpageListElementWrapper)
        }, 500)
        loadEndedAuctions()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function loadEndedAuctions() {
        api.getEndedAuctions().then(endedAuctions => {
            setEndedAuctions(endedAuctions)
        })
    }

    function getEndString(end: Date) {
        let momentDate = moment(end)
        return end.getTime() < new Date().getTime() ? 'Ended ' + momentDate.fromNow() : 'Ends ' + momentDate.fromNow()
    }

    function getAuctionElement(auction: Auction, style: React.CSSProperties) {
        return (
            <div className={`${styles.cardWrapper}`} key={auction.uuid} style={style}>
                <Link href={`/auction/${auction.uuid}`} className="disableLinkStyle">
                    <Card>
                        <Card.Header style={{ padding: '10px' }}>
                            <p className={styles.ellipsis}>
                                <Image
                                    crossOrigin="anonymous"
                                    src={api.getItemImageUrl(auction.item) || ''}
                                    height="32"
                                    width="32"
                                    alt=""
                                    style={{ marginRight: '5px' }}
                                />
                                {getMinecraftColorCodedElement(auction.item.name)}
                            </p>
                        </Card.Header>
                        <Card.Body>
                            <div>
                                <ul>
                                    <li>{getEndString(auction.end)}</li>
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
            </div>
        )
    }

    function getNewPlayerElement(newPlayer: Player, style: React.CSSProperties) {
        return (
            <div className={`${styles.cardWrapper} ${styles.disableLinkStyle}`} key={newPlayer.name} style={style}>
                <Link href={`/player/${newPlayer.uuid}`} className="disableLinkStyle">
                    <Card>
                        <Card.Header style={{ height: '100%', padding: '20px' }}>
                            <div style={{ float: 'left' }}>
                                <Image
                                    crossOrigin="anonymous"
                                    className="playerHeadIcon"
                                    src={newPlayer.iconUrl || ''}
                                    height="32"
                                    width="32"
                                    alt=""
                                    style={{ marginRight: '5px' }}
                                    loading="lazy"
                                />
                            </div>
                            <Card.Title className={styles.ellipsis}>{newPlayer.name}</Card.Title>
                        </Card.Header>
                    </Card>
                </Link>
            </div>
        )
    }

    function getPopularSearchElement(search: PopularSearch, style: React.CSSProperties) {
        return (
            <div className={`${styles.cardWrapper} ${styles.disableLinkStyle}`} key={search.url} style={style}>
                <Link href={search.url} className="disableLinkStyle">
                    <Card>
                        <Card.Header style={{ height: '100%' }}>
                            <div style={{ float: 'left' }}>
                                <Image
                                    crossOrigin="anonymous"
                                    className="playerHeadIcon"
                                    src={search.url.includes('/player') ? search.img + '?size=8' : search.img}
                                    height="32"
                                    width="32"
                                    alt=""
                                    style={{ marginRight: '5px' }}
                                    loading="lazy"
                                />
                            </div>
                            <Card.Title className={styles.ellipsis}>{search.title}</Card.Title>
                        </Card.Header>
                    </Card>
                </Link>
            </div>
        )
    }

    function getNewItemElement(newItem: Item, style: React.CSSProperties) {
        return (
            <div className={`${styles.cardWrapper} ${styles.disableLinkStyle}`} key={newItem.tag} style={style}>
                <Link href={`/item/${newItem.tag}`} className="disableLinkStyle">
                    <Card>
                        <Card.Header style={{ height: '100%', padding: '20px' }}>
                            <div style={{ float: 'left' }}>
                                <Image
                                    crossOrigin="anonymous"
                                    src={newItem.iconUrl || ''}
                                    height="32"
                                    width="32"
                                    alt=""
                                    style={{ marginRight: '5px' }}
                                    loading="lazy"
                                />
                            </div>
                            <Card.Title className={styles.ellipsis}>{newItem.name}</Card.Title>
                        </Card.Header>
                    </Card>
                </Link>
            </div>
        )
    }

    function onRecentChangesClick() {
        trackEvent({
            category: 'recentChanges',
            action: 'recentChangesClicked'
        })
    }

    function attachScrollEvent(className: string) {
        let scrollContainers = document.getElementsByClassName(className)
        for (var i = 0; i < scrollContainers.length; i++) {
            let container = scrollContainers.item(i)
            if (container) {
                container.addEventListener('wheel', evt => {
                    evt.preventDefault()
                    let scrollAmount = 0
                    var slideTimer = setInterval(() => {
                        container!.scrollLeft += (evt as WheelEvent).deltaY / 10
                        scrollAmount += Math.abs((evt as WheelEvent).deltaY) / 10
                        if (scrollAmount >= Math.abs((evt as WheelEvent).deltaY)) {
                            clearInterval(slideTimer)
                        }
                    }, 25)
                })
            }
        }
    }

    let newAuctionsElement = (
        <div id="new-auctions-element" className={`${styles.cardsWrapper} ${styles.newAuctions}`}>
            <List
                className={styles.startpageListElementWrapper}
                height={260 - 15}
                itemCount={newAuctions.length}
                itemSize={200}
                layout="horizontal"
                width={isSSR ? 10000 : document.getElementById('new-auctions-element')?.offsetWidth}
            >
                {({ index, style }) => {
                    return getAuctionElement(newAuctions[index], style)
                }}
            </List>
        </div>
    )

    let popularSearchesElement = (
        <div className={`${styles.cardsWrapper} ${styles.popularSearches}`}>
            <List
                className={styles.startpageListElementWrapper}
                height={130 - 15}
                itemCount={popularSearches.length}
                itemSize={200}
                layout="horizontal"
                width={isSSR ? 10000 : document.getElementById('new-auctions-element')?.offsetWidth}
            >
                {({ index, style }) => {
                    return getPopularSearchElement(popularSearches[index], style)
                }}
            </List>
        </div>
    )

    let endedAuctionsElement = (
        <div className={`${styles.cardsWrapper} ${styles.endedAuctions}`}>
            <List
                className={styles.startpageListElementWrapper}
                height={260 - 15}
                itemCount={endedAuctions.length === 0 ? 20 : endedAuctions.length}
                itemSize={200}
                layout="horizontal"
                width={isSSR ? 10000 : document.getElementById('new-auctions-element')?.offsetWidth}
            >
                {({ index, style }) => {
                    return endedAuctions.length === 0 ? <StartpageLargeElementSkeleton style={style} /> : getAuctionElement(endedAuctions[index], style)
                }}
            </List>
        </div>
    )

    let newPlayersElement = (
        <div className={`${styles.cardsWrapper} ${styles.newPlayers}`}>
            <List
                className={styles.startpageListElementWrapper}
                height={130 - 15}
                itemCount={newPlayers.length}
                itemSize={200}
                layout="horizontal"
                width={isSSR ? 10000 : document.getElementById('new-auctions-element')?.offsetWidth}
            >
                {({ index, style }) => {
                    return getNewPlayerElement(newPlayers[index], style)
                }}
            </List>
        </div>
    )
    let newItemsElement = (
        <div className={`${styles.cardsWrapper} ${styles.newItems}`}>
            <List
                className={styles.startpageListElementWrapper}
                height={130 - 15}
                itemCount={newItems.length}
                itemSize={200}
                layout="horizontal"
                width={isSSR ? 10000 : document.getElementById('new-auctions-element')?.offsetWidth}
            >
                {({ index, style }) => {
                    return getNewItemElement(newItems[index], style)
                }}
            </List>
        </div>
    )

    return (
        <div>
            <div style={{ textAlign: 'center' }}>
                <hr />
                <h1>Skyblock Auction House History</h1>
                <p style={{ fontSize: 'larger' }}>Browse through over 800 million auctions, over two million players and the bazaar of hypixel skyblock</p>
                <hr />
            </div>
            <Card className={styles.startpageCard}>
                <Card.Header>
                    <Card.Title>
                        <NewIcon /> New Auctions
                    </Card.Title>
                </Card.Header>
                <Card.Body className={styles.startpageCardBody} id="new-auctions-body">
                    {newAuctionsElement}
                </Card.Body>
            </Card>

            <Card className={styles.startpageCard}>
                <Card.Header>
                    <Card.Title>
                        <TimerIcon /> Ended Auctions
                    </Card.Title>
                </Card.Header>
                <Card.Body className={styles.startpageCardBody} id="ended-auctions-body">
                    {endedAuctionsElement}
                </Card.Body>
            </Card>

            <Card className={styles.startpageCard}>
                <Card.Header>
                    <Card.Title>
                        <PersonIcon /> New Players
                    </Card.Title>
                </Card.Header>
                <Card.Body className={styles.startpageCardBody} id="new-players-body">
                    {newPlayersElement}
                </Card.Body>
            </Card>

            <Card className={styles.startpageCard}>
                <Card.Header>
                    <Card.Title>
                        <FireIcon /> Popular Searches
                    </Card.Title>
                </Card.Header>
                <Card.Body className={styles.startpageCardBody} id="popular-searches-body">
                    {popularSearchesElement}
                </Card.Body>
            </Card>

            <Card className={styles.startpageCard}>
                <Card.Header>
                    <Card.Title>
                        <NewIcon /> New Items
                    </Card.Title>
                </Card.Header>
                <Card.Body className={styles.startpageCardBody} id="new-items-body">
                    {newItemsElement}
                </Card.Body>
            </Card>

            <Card className={styles.startpageCard} style={{ marginTop: '40px' }}>
                <Card.Header>
                    <Card.Title>SkyCofl - Hypixel Auction House and Bazaar History</Card.Title>
                </Card.Header>
                <Card.Body>
                    <p>View, search, browse, and filter by reforge or enchantment.</p>
                    <p>You can find all current and historic prices for the auction house and bazaar on this web tracker.</p>
                    <p>
                        We're tracking over 800 million auctions. We've saved more than a billion bazaar orders. Furthermore, there
                        are over three million skyblock players that you can search by their Minecraft usernames. You can browse through the auctions they made
                        over the past six years. New items are added automatically and are available within two minutes after the first auction is started.
                        Elisabet Firesale items are also added ahead of time so they are checked easily as soon as the firesale starts.
                    </p>
                    <p>
                        The search autocomplete is ranked by popularity and allows you to find whatever item you want faster. Quick URLs allow you to link to
                        specific sites. /p/Steve or /i/Oak allows you to create a link without visiting the site first.
                    </p>
                    <p>
                        The free accessible{' '}
                        <Link href="/flipper" style={{ backgroundColor: 'white', textDecoration: 'none', color: 'black', borderRadius: '3px' }}>
                            auction house flipper ↗️
                        </Link>{' '}
                        allows you to find profitable AH flips in no time. It supplements the option to browse all of the Skyblock history on the web tracker.
                        What's more is that you can see what auctions were used as reference to determine if a flip is profitable.
                    </p>
                    <p>
                        We have the longest bazaar history database and you can browser through bazaar items just as easily as through the auction house.
                        See the full orderbook of any point in the last 5 years and discorver {' '}
                        <Link href="/bazaar" style={{ backgroundColor: 'white', textDecoration: 'none', color: 'black', borderRadius: '3px' }}>
                            Bazaar Flips ↗️
                        </Link>{' '}
                        we calculate based on the current bazaar prices.
                    </p>
                    <p>
                        We built a mod, discord bot and android app as well as provide access to most of our data via a free API. You can find
                        more information on the <Link href="/wiki/api">wiki api page</Link>. 
                    </p>
                </Card.Body>
            </Card>
        </div>
    )
}

export default Startpage
