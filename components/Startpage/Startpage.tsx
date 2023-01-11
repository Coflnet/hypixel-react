import React, { useEffect, useState } from 'react'
import api from '../../api/ApiHelper'
import { Badge, Card } from 'react-bootstrap'
import { getMinecraftColorCodedElement, numberWithThousandsSeperators } from '../../utils/Formatter'
import { Person as PersonIcon, Timer as TimerIcon, FiberNew as NewIcon, Fireplace as FireIcon, Announcement as AnnouncementIcon } from '@mui/icons-material'
import moment from 'moment'
import Tooltip from '../Tooltip/Tooltip'
import { useMatomo } from '@datapunt/matomo-tracker-react'
import { FixedSizeList as List } from 'react-window'
import Link from 'next/link'
import styles from './Startpage.module.css'
import AutoSizer from 'react-virtualized-auto-sizer'
import { getSSRElement, isClientSideRendering } from '../../utils/SSRUtils'

interface Props {
    newAuctions?: Auction[]
    endedAuctions?: Auction[]
    popularSearches?: PopularSearch[]
    newPlayers?: Player[]
    newItems?: Item[]
}

function Startpage(props: Props) {
    let { trackEvent } = useMatomo()

    let [newAuctions, setNewAuctions] = useState<Auction[]>(props.newAuctions || [])
    let [endedAuctions, setEndedAuctions] = useState<Auction[]>(props.endedAuctions || [])
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
                <Link href={`/auction/${auction.uuid}`}>
                    <a className="disableLinkStyle">
                        <Card>
                            <Card.Header style={{ padding: '10px' }}>
                                <p className={styles.ellipsis}>
                                    <img crossOrigin="anonymous" src={auction.item.iconUrl} height="32" alt="" style={{ marginRight: '5px' }} />
                                    {getMinecraftColorCodedElement(auction.item.name)}
                                </p>
                            </Card.Header>
                            <Card.Body>
                                <div>
                                    <ul>
                                        <li>{getEndString(auction.end)}</li>
                                        <li>{numberWithThousandsSeperators(auction.highestBid || auction.startingBid)} Coins</li>
                                        {auction.bin ? (
                                            <li>
                                                <Badge style={{ marginLeft: '5px' }} variant="success">
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
                    </a>
                </Link>
            </div>
        )
    }

    function getNewPlayerElement(newPlayer: Player, style: React.CSSProperties) {
        return (
            <div className={`${styles.cardWrapper} ${styles.disableLinkStyle}`} key={newPlayer.name} style={style}>
                <Link href={`/player/${newPlayer.uuid}`}>
                    <a className="disableLinkStyle">
                        <Card>
                            <Card.Header style={{ height: '100%', padding: '20px' }}>
                                <div style={{ float: 'left' }}>
                                    <img
                                        crossOrigin="anonymous"
                                        className="playerHeadIcon"
                                        src={newPlayer.iconUrl}
                                        height="32"
                                        alt=""
                                        style={{ marginRight: '5px' }}
                                        loading="lazy"
                                    />
                                </div>
                                <Card.Title className={styles.ellipsis}>{newPlayer.name}</Card.Title>
                            </Card.Header>
                        </Card>
                    </a>
                </Link>
            </div>
        )
    }

    function getPopularSearchElement(search: PopularSearch, style: React.CSSProperties) {
        return (
            <div className={`${styles.cardWrapper} ${styles.disableLinkStyle}`} key={search.url} style={style}>
                <Link href={search.url}>
                    <a className="disableLinkStyle">
                        <Card>
                            <Card.Header style={{ height: '100%' }}>
                                <div style={{ float: 'left' }}>
                                    <img
                                        crossOrigin="anonymous"
                                        className="playerHeadIcon"
                                        src={search.url.includes('/player') ? search.img + '?size=8' : search.img}
                                        height="32"
                                        alt=""
                                        style={{ marginRight: '5px' }}
                                        loading="lazy"
                                    />
                                </div>
                                <Card.Title className={styles.ellipsis}>{search.title}</Card.Title>
                            </Card.Header>
                        </Card>
                    </a>
                </Link>
            </div>
        )
    }

    function getNewItemElement(newItem: Item, style: React.CSSProperties) {
        return (
            <div className={`${styles.cardWrapper} ${styles.disableLinkStyle}`} key={newItem.tag} style={style}>
                <Link href={`/item/${newItem.tag}`}>
                    <a className="disableLinkStyle">
                        <Card>
                            <Card.Header style={{ height: '100%', padding: '20px' }}>
                                <div style={{ float: 'left' }}>
                                    <img crossOrigin="anonymous" src={newItem.iconUrl} height="32" alt="" style={{ marginRight: '5px' }} loading="lazy" />
                                </div>
                                <Card.Title className={styles.ellipsis}>{newItem.name}</Card.Title>
                            </Card.Header>
                        </Card>
                    </a>
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
        <div className={`${styles.cardsWrapper} ${styles.newAuctions}`}>
            <AutoSizer>
                {({ height, width }) => {
                    return (
                        <List
                            className={styles.startpageListElementWrapper}
                            height={height - 15}
                            itemCount={newAuctions.length}
                            itemSize={200}
                            layout="horizontal"
                            width={width}
                        >
                            {({ index, style }) => {
                                return getAuctionElement(newAuctions[index], style)
                            }}
                        </List>
                    )
                }}
            </AutoSizer>
        </div>
    )

    let popularSearchesElement = (
        <div className={`${styles.cardsWrapper} ${styles.popularSearches}`}>
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        className={styles.startpageListElementWrapper}
                        height={height - 15}
                        itemCount={popularSearches.length}
                        itemSize={200}
                        layout="horizontal"
                        width={width}
                    >
                        {({ index, style }) => {
                            return getPopularSearchElement(popularSearches[index], style)
                        }}
                    </List>
                )}
            </AutoSizer>
        </div>
    )

    let endedAuctionsElement = (
        <div className={`${styles.cardsWrapper} ${styles.endedAuctions}`}>
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        className={styles.startpageListElementWrapper}
                        height={height - 15}
                        itemCount={endedAuctions.length}
                        itemSize={200}
                        layout="horizontal"
                        width={width}
                    >
                        {({ index, style }) => {
                            return getAuctionElement(endedAuctions[index], style)
                        }}
                    </List>
                )}
            </AutoSizer>
        </div>
    )

    let newPlayersElement = (
        <div className={`${styles.cardsWrapper} ${styles.newPlayers}`}>
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        className={styles.startpageListElementWrapper}
                        height={height - 15}
                        itemCount={newPlayers.length}
                        itemSize={200}
                        layout="horizontal"
                        width={width}
                    >
                        {({ index, style }) => {
                            return getNewPlayerElement(newPlayers[index], style)
                        }}
                    </List>
                )}
            </AutoSizer>
        </div>
    )

    let newItemsElement = (
        <div className={`${styles.cardsWrapper} ${styles.newItems}`}>
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        className={styles.startpageListElementWrapper}
                        height={height - 15}
                        itemCount={newItems.length}
                        itemSize={200}
                        layout="horizontal"
                        width={width}
                    >
                        {({ index, style }) => {
                            return getNewItemElement(newItems[index], style)
                        }}
                    </List>
                )}
            </AutoSizer>
        </div>
    )

    return (
        <div>
            <div style={{ textAlign: 'center' }}>
                <hr />
                <h1>Skyblock AH history</h1>
                <p style={{ fontSize: 'larger' }}>Browse through over 400 million auctions, over two million players and the bazaar of hypixel skyblock</p>
                <hr />
            </div>
            <div className={styles.statusElementWrapper}>
                <Card style={{ width: '100%' }}>
                    <Card.Header>
                        <Card.Title>
                            <AnnouncementIcon />
                            <span className={styles.statusTitle}> News / Announcements</span>
                        </Card.Title>
                        <Card.Subtitle>Flip Tracking</Card.Subtitle>
                    </Card.Header>
                    <Card.Body>
                        <p>You can now look up a detailed breakdown of your flips in the last week.</p>
                        <p>To look up your (or someone elses) flips, just search the player and click the blue "Check tracked flips" button.</p>
                        <hr />
                        <div style={{ marginTop: '20px' }}>
                            <p>Recent changes (last change: 18. April 2022):</p>
                            <Tooltip
                                onClick={onRecentChangesClick}
                                content={
                                    <p>
                                        <NewIcon /> <span style={{ color: '#007bff', cursor: 'pointer' }}>Click here to open</span>
                                    </p>
                                }
                                tooltipContent={
                                    <ul key="changelogList">
                                        <li className={styles.changelogItem}>
                                            Settings are now stored on the server. That means you have the same settings on different devices and can change
                                            them in game.
                                        </li>
                                        <li className={styles.changelogItem}>Multiple tabs dont overwrite each others anymore</li>
                                        <li className={styles.changelogItem}>
                                            Added a new payment system and CoflCoins as a way to easier reward/compensate user
                                        </li>
                                        <li className={styles.changelogItem}>Added Kat flips</li>
                                    </ul>
                                }
                                type="click"
                                tooltipTitle={<span>Recent changes</span>}
                            />
                        </div>
                    </Card.Body>
                </Card>
            </div>

            <Card className={styles.startpageCard}>
                <Card.Header>
                    <Card.Title>
                        <NewIcon /> New auctions
                    </Card.Title>
                </Card.Header>
                <Card.Body className={styles.startpageCardBody} id="new-auctions-body">
                    {!isSSR ? (
                        newAuctionsElement
                    ) : (
                        <div className={`${styles.SSRcardsWrapper} ${styles.startpageListElementWrapper}`}>
                            {newAuctions.map(auction => {
                                return getAuctionElement(auction, { height: 180, width: 200 })
                            })}
                        </div>
                    )}
                </Card.Body>
            </Card>

            <Card className={styles.startpageCard}>
                <Card.Header>
                    <Card.Title>
                        <TimerIcon /> Ended auctions
                    </Card.Title>
                </Card.Header>
                <Card.Body className={styles.startpageCardBody} id="ended-auctions-body">
                    {!isSSR ? (
                        endedAuctionsElement
                    ) : (
                        <div className={`${styles.SSRcardsWrapper} ${styles.startpageListElementWrapper}`}>
                            {endedAuctions.map(auction => {
                                return getAuctionElement(auction, { height: 180, width: 200 })
                            })}
                        </div>
                    )}
                </Card.Body>
            </Card>

            <Card className={styles.startpageCard}>
                <Card.Header>
                    <Card.Title>
                        <PersonIcon /> New players
                    </Card.Title>
                </Card.Header>
                <Card.Body className={styles.startpageCardBody} id="new-players-body">
                    {!isSSR ? (
                        newPlayersElement
                    ) : (
                        <div className={`${styles.SSRcardsWrapper} ${styles.startpageListElementWrapper}`}>
                            {newPlayers.map(player => {
                                return getNewPlayerElement(player, { height: 70, width: 200 })
                            })}
                        </div>
                    )}
                </Card.Body>
            </Card>

            <Card className={styles.startpageCard}>
                <Card.Header>
                    <Card.Title>
                        <FireIcon /> Popular searches
                    </Card.Title>
                </Card.Header>
                <Card.Body className={styles.startpageCardBody} id="popular-searches-body">
                    {!isSSR ? (
                        popularSearchesElement
                    ) : (
                        <div className={`${styles.SSRcardsWrapper} ${styles.startpageListElementWrapper}`}>
                            {popularSearches.map(search => {
                                return getPopularSearchElement(search, { height: 70, width: 200 })
                            })}
                        </div>
                    )}
                </Card.Body>
            </Card>

            <Card className={styles.startpageCard}>
                <Card.Header>
                    <Card.Title>
                        <NewIcon /> New items
                    </Card.Title>
                </Card.Header>
                <Card.Body className={styles.startpageCardBody} id="new-items-body">
                    {!isSSR ? (
                        newItemsElement
                    ) : (
                        <div className={`${styles.SSRcardsWrapper} ${styles.startpageListElementWrapper}`}>
                            {newItems.map(search => {
                                return getNewItemElement(search, { height: 70, width: 200 })
                            })}
                        </div>
                    )}
                </Card.Body>
            </Card>

            <Card className={styles.startpageCard} style={{ marginTop: '40px' }}>
                <Card.Header>
                    <Card.Title>Hypixel AH history</Card.Title>
                </Card.Header>
                <Card.Body>
                    <p>View, search, browse, and filter by reforge or enchantment.</p>
                    <p>You can find all current and historic prices for the auction house and bazaar on this web tracker.</p>
                    <p>
                        We're tracking over 400 million auctions. We've saved more than 250 million bazaar prices in intervals of 10 seconds. Furthermore,
                        there are over two million skyblock players that you can search by their Minecraft usernames. You can browse through the auctions they
                        made over the past two years. New Items are added automatically and available within two minutes after the first auction is started.
                    </p>
                    <p>
                        The search autocomplete is ranked by popularity and allows you to find whatever item you want faster. Quick urls allow you to link to
                        specific sites. /p/Steve or /i/Oak allows you to create a link without visiting the site first.
                    </p>
                    <p>
                        The free accessible <Link href="/flipper">auction house flipper</Link> allows you to find profitable ah flips in no time. It supplements
                        the option to browse all of the skyblock history on the web tracker. Whats more you can see what auctions were used as reference to
                        determine if a flip is profitable.
                    </p>
                    <p>
                        We allow you to subscribe to auctions, item prices and being outbid with more to come. Please use the contact on the Feedback site to
                        send us suggestions or bug reports.
                    </p>
                </Card.Body>
            </Card>
        </div>
    )
}

export default Startpage
