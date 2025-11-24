'use client'

import { useMatomo } from '@jonkoops/matomo-tracker-react'
import NewIcon from '@mui/icons-material/FiberNew'
import StorefrontIcon from '@mui/icons-material/Storefront'
import MergeTypeIcon from '@mui/icons-material/MergeType'
import BuildIcon from '@mui/icons-material/Build'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import HandymanIcon from '@mui/icons-material/Handyman'
import moment from 'moment'
import Link from 'next/link'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { useFavorites } from '../Favorites/FavoritesContext'
import Card from 'react-bootstrap/Card'
import styles from './Startpage.module.css'
import MarkdownIt from 'markdown-it'
import api from '../../api/ApiHelper'
import { FixedSizeList as List } from 'react-window'
import { getApiDataUpdatesYearMonth } from '../../api/_generated/skyApi'

interface Props {
    // No props needed as we fetch client side
}

function Startpage(props: Props) {
    let { trackEvent } = useMatomo()
    const { favorites } = useFavorites()
    const [recentUpdate, setRecentUpdate] = useState<any | null>(null)
    const [newItems, setNewItems] = useState<Item[]>([])
    const [isSSR, setIsSSR] = useState(true)

    const mdRenderer = new MarkdownIt({ html: false, linkify: true, typographer: true, breaks: true })

    useEffect(() => {
        setIsSSR(false)
        loadRecentUpdate()
        loadNewItems()
        setTimeout(() => {
            attachScrollEvent(styles.startpageListElementWrapper)
        }, 500)
    }, [])

    async function loadRecentUpdate() {
        try {
            const now = new Date()
            const year = now.getFullYear()
            const month = now.getMonth() + 1
            const res = await getApiDataUpdatesYearMonth(year, month)
            const messages = res?.data || []
            if (messages.length > 0) {
                setRecentUpdate(messages[messages.length - 1])
            } else {
                 // Try previous month if no news this month
                 const lastMonth = new Date(now.setMonth(now.getMonth() - 1))
                 const resPrev = await getApiDataUpdatesYearMonth(lastMonth.getFullYear(), lastMonth.getMonth() + 1)
                 const messagesPrev = resPrev?.data || []
                 if (messagesPrev.length > 0) {
                     setRecentUpdate(messagesPrev[messagesPrev.length - 1])
                 }
            }
        } catch (e) {
            console.error("Failed to load updates", e)
        }
    }

    function loadNewItems() {
        api.getNewItems().then(items => {
            setNewItems(items.filter(i => i.name !== 'null'))
        }).catch(e => console.error("Failed to load new items", e))
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

    function getNewItemElement(newItem: Item, style: React.CSSProperties) {
        return (
            <div className={`${styles.cardWrapper} ${styles.disableLinkStyle}`} key={newItem.tag} style={style}>
                <Link href={`/item/${newItem.tag}`} className="disableLinkStyle" style={{ textDecoration: 'none' }}>
                    <Card style={{ backgroundColor: '#343a40', border: '1px solid #495057' }}>
                        <Card.Header style={{ height: '100%', padding: '20px', borderBottom: 'none' }}>
                            <div style={{ float: 'left' }}>
                                <Image
                                    crossOrigin="anonymous"
                                    src={newItem.iconUrl || ''}
                                    height="32"
                                    width="32"
                                    alt=""
                                    style={{ marginRight: '10px' }}
                                    loading="lazy"
                                />
                            </div>
                            <Card.Title className={styles.ellipsis} style={{ color: '#f8f9fa', fontSize: '1rem' }}>{newItem.name}</Card.Title>
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

    const discountCode = "BLACKFRIDAY" // Example code
    const discountAmount = "20%"

    const salesBanner = discountCode ? (
        <Link href={`/premium?code=${discountCode}`} style={{ textDecoration: 'none' }}>
            <div style={{ 
                background: 'linear-gradient(90deg, #d32f2f 0%, #b71c1c 100%)', 
                color: 'white', 
                padding: '15px', 
                textAlign: 'center', 
                borderRadius: '8px', 
                marginBottom: '20px', 
                fontWeight: 'bold',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s'
            }} className={styles.salesBanner}>
                🔥 <span style={{ fontSize: '1.1em' }}>Special Offer!</span> Get <span style={{ color: '#ffeb3b' }}>{discountAmount} OFF</span> Premium with code <span style={{ backgroundColor: 'white', color: '#d32f2f', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>{discountCode}</span>! Click here to redeem! 🔥
            </div>
        </Link>
    ) : null

    const flipFeatures = (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <Link href="/bazaar" style={{ textDecoration: 'none' }}>
                <Card className={`h-100 text-center shadow-sm ${styles.hoverEffect}`} style={{ border: 'none', backgroundColor: '#343a40' }}>
                    <Card.Body style={{ padding: '2rem' }}>
                        <StorefrontIcon style={{ fontSize: 48, marginBottom: '15px', color: '#ffc107' }} />
                        <Card.Title style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f8f9fa' }}>Bazaar Flips</Card.Title>
                        <Card.Text style={{ color: '#e9ecef' }}>Discover high-margin bazaar flips instantly.</Card.Text>
                    </Card.Body>
                </Card>
            </Link>
            <Link href="/fusion" style={{ textDecoration: 'none' }}>
                <Card className={`h-100 text-center shadow-sm ${styles.hoverEffect}`} style={{ border: 'none', backgroundColor: '#343a40' }}>
                    <Card.Body style={{ padding: '2rem' }}>
                        <MergeTypeIcon style={{ fontSize: 48, marginBottom: '15px', color: '#9c27b0' }} />
                        <Card.Title style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f8f9fa' }}>Fusion Flips</Card.Title>
                        <Card.Text style={{ color: '#e9ecef' }}>Combine items for guaranteed profit.</Card.Text>
                    </Card.Body>
                </Card>
            </Link>
            <Link href="/crafts" style={{ textDecoration: 'none' }}>
                <Card className={`h-100 text-center shadow-sm ${styles.hoverEffect}`} style={{ border: 'none', backgroundColor: '#343a40' }}>
                    <Card.Body style={{ padding: '2rem' }}>
                        <BuildIcon style={{ fontSize: 48, marginBottom: '15px', color: '#4caf50' }} />
                        <Card.Title style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f8f9fa' }}>Craft Flips</Card.Title>
                        <Card.Text style={{ color: '#e9ecef' }}>Find profitable crafting recipes.</Card.Text>
                    </Card.Body>
                </Card>
            </Link>
            <Link href="/reverseNpc" style={{ textDecoration: 'none' }}>
                <Card className={`h-100 text-center shadow-sm ${styles.hoverEffect}`} style={{ border: 'none', backgroundColor: '#343a40' }}>
                    <Card.Body style={{ padding: '2rem' }}>
                        <SmartToyIcon style={{ fontSize: 48, marginBottom: '15px', color: '#2196f3' }} />
                        <Card.Title style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f8f9fa' }}>NPC Flips</Card.Title>
                        <Card.Text style={{ color: '#e9ecef' }}>Buy from Bazaar, sell to NPC.</Card.Text>
                    </Card.Body>
                </Card>
            </Link>
        </div>
    )

    const moreToolsSection = (
        <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '15px', fontWeight: 'bold' }}>More Tools</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                 <Link href="/flips" style={{ textDecoration: 'none' }}>
                    <Card className={`h-100 shadow-sm ${styles.hoverEffect}`} style={{ border: 'none', backgroundColor: '#343a40' }}>
                        <Card.Body>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                <HandymanIcon style={{ marginRight: '10px', color: '#00bcd4' }} />
                                <Card.Title style={{ margin: 0, color: '#f8f9fa' }}>Flipping Hub</Card.Title>
                            </div>
                            <Card.Text style={{ color: '#e9ecef' }}>
                                Your central hub for skyblock money making.
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Link>
                 <Link href="/subscriptions" style={{ textDecoration: 'none' }}>
                    <Card className={`h-100 shadow-sm ${styles.hoverEffect}`} style={{ border: 'none', backgroundColor: '#343a40' }}>
                        <Card.Body>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                <NotificationsActiveIcon style={{ marginRight: '10px', color: '#ff9800' }} />
                                <Card.Title style={{ margin: 0, color: '#f8f9fa' }}>Notifiers</Card.Title>
                            </div>
                            <Card.Text style={{ color: '#e9ecef' }}>
                                Get notified about price changes or new auctions.
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Link>
            </div>
        </div>
    )

    const wikiModSection = (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
             <Card style={{ border: 'none', backgroundColor: '#343a40' }}>
                <Card.Body>
                    <Card.Title style={{ color: '#f8f9fa' }}>📚 Wiki</Card.Title>
                    <Card.Text style={{ color: '#e9ecef' }}>
                        Learn everything about our tools, API, and how to maximize your profits.
                    </Card.Text>
                    <Link href="/wiki" className="btn btn-outline-primary">Visit Wiki</Link>
                </Card.Body>
            </Card>
             <Card style={{ border: 'none', backgroundColor: '#343a40' }}>
                <Card.Body>
                    <Card.Title style={{ color: '#f8f9fa' }}>🛠️ Mod</Card.Title>
                    <Card.Text style={{ color: '#e9ecef' }}>
                        Enhance your in-game experience with our Skyblock Mod. Features include price checking and more.
                    </Card.Text>
                    <Link href="/mod" className="btn btn-outline-primary">Get the Mod</Link>
                </Card.Body>
            </Card>
        </div>
    )

    let newItemsElement = (
        <div className={`${styles.cardsWrapper} ${styles.newItems}`} style={{ marginBottom: '30px' }}>
            <List
                className={styles.startpageListElementWrapper}
                height={130 - 15}
                itemCount={newItems.length}
                itemSize={200}
                layout="horizontal"
                width={isSSR ? 1000 : (typeof window !== 'undefined' ? window.innerWidth * 0.9 : 1000)}
            >
                {({ index, style }) => {
                    return getNewItemElement(newItems[index], style)
                }}
            </List>
        </div>
    )

    return (
        <div className={styles.startpageContainer}>
            {salesBanner}
            
            {favorites.length === 0 ? (
                <div style={{ textAlign: 'center', marginBottom: '40px', marginTop: '20px' }}>
                    <h1 style={{ fontWeight: 'bold', fontSize: '2.5rem', marginBottom: '10px' }}>Skyblock Auction House History</h1>
                    <p style={{ fontSize: '1.2rem', color: '#aaa', maxWidth: '800px', margin: '0 auto' }}>
                        The ultimate tool for Hypixel Skyblock players. Track prices, find flips, and dominate the economy.
                    </p>
                </div>
            ) : null}

            {/* News Section */}
            <Card className={styles.startpageCard} style={{ marginBottom: '30px', borderLeft: '5px solid #007bff', backgroundColor: '#343a40', border: 'none' }}>
                <Card.Header style={{ backgroundColor: 'transparent', borderBottom: '1px solid #495057' }}>
                    <Card.Title style={{ margin: 0, display: 'flex', alignItems: 'center', color: '#f8f9fa' }}>
                        <NewIcon style={{ marginRight: '10px', color: '#007bff' }} /> Latest News
                    </Card.Title>
                </Card.Header>
                <Card.Body style={{ color: '#e9ecef' }}>
                    {recentUpdate ? (
                        <div style={{ marginBottom: '15px' }}>
                            <div 
                                className={styles.markdownContent}
                                dangerouslySetInnerHTML={{ __html: mdRenderer.render(recentUpdate.content) }} 
                            />
                        </div>
                    ) : <p>Check out what's new this month!</p>}
                    <Link href={`/updates/${new Date().getFullYear()}/${new Date().getMonth() + 1}`} className="btn btn-primary btn-sm">
                        View News from {moment().format('MMMM YYYY')}
                    </Link>
                </Card.Body>
            </Card>

            {/* Flip Features */}
            <h3 style={{ marginBottom: '20px', fontWeight: 'bold' }}>Flip Tools</h3>
            {flipFeatures}

            {/* More Tools */}
            {moreToolsSection}

            {/* Wiki & Mod */}
            <h3 style={{ marginBottom: '20px', fontWeight: 'bold' }}>Resources</h3>
            {wikiModSection}

            {/* New Items */}
            {newItems.length > 0 && (
                <>
                    <h3 style={{ marginBottom: '15px', fontWeight: 'bold' }}>New Items</h3>
                    {newItemsElement}
                </>
            )}

            <Card className={styles.startpageCard} style={{ marginTop: '40px', backgroundColor: '#343a40', border: 'none' }}>
                <Card.Header style={{ backgroundColor: 'transparent', borderBottom: '1px solid #495057' }}>
                    <Card.Title style={{ color: '#f8f9fa' }}>SkyCofl - Hypixel Auction House and Bazaar History</Card.Title>
                </Card.Header>
                <Card.Body style={{ color: '#e9ecef' }}>
                    <p>View, search, browse, and filter by reforge or enchantment.</p>
                    <p>You can find all current and historic prices for the auction house and bazaar on this web tracker.</p>
                    <p>
                        We're tracking over 800 million auctions. We've saved more than a billion bazaar orders. Furthermore, there are over three million
                        skyblock players that you can search by their Minecraft usernames. You can browse through the auctions they made over the past six
                        years. New items are added automatically and are available within two minutes after the first auction is started. Elisabet Firesale
                        items are also added ahead of time so they are checked easily as soon as the firesale starts.
                    </p>
                    <p>
                        The search autocomplete is ranked by popularity and allows you to find whatever item you want faster. Quick URLs allow you to link to
                        specific sites. /p/Steve or /i/Oak allows you to create a link without visiting the site first.
                    </p>
                    <p>
                        The free accessible{' '}
                        <Link href="/flipper" style={{ backgroundColor: 'white', textDecoration: 'none', color: 'black', borderRadius: '3px', padding: '0 4px' }}>
                            auction house flipper ↗️
                        </Link>{' '}
                        allows you to find profitable AH flips in no time. It supplements the option to browse all of the Skyblock history on the web tracker.
                        What's more is that you can see what auctions were used as reference to determine if a flip is profitable.
                    </p>
                    <p>
                        We have the longest bazaar history database and you can browser through our hypixel skyblock bazaar tracker just as easily as through
                        the auction house. See the full orderbook of any point in the last 5 years and discorver profitable{' '}
                        <Link href="/bazaar" style={{ backgroundColor: 'white', textDecoration: 'none', color: 'black', borderRadius: '3px', padding: '0 4px' }}>
                            Bazaar Flips ↗️
                        </Link>{' '}
                        we calculate based on the current bazaar prices.
                    </p>
                    <p>
                        We built a mod, discord bot and android app as well as provide access to most of our data via a free API. You can find more information
                        on the <Link href="/wiki/api" style={{ color: '#6ea8fe' }}>wiki api page</Link>.
                    </p>

                    <p>
                        Update ads privacy settings on the{' '}
                        <a href="/about" style={{ textDecoration: 'underline', color: '#6ea8fe' }} onClick={onRecentChangesClick}>
                            about page
                        </a> (ads are not loaded on this page)
                        .
                    </p>
                </Card.Body>
            </Card>
        </div>
    )
}

export default Startpage
