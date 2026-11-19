'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Badge, Card } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { formatTimeLeft, getAuctionPrice, getSellerLabel } from '../../utils/ActiveAuctionUtils'
import { convertTagToName, getMinecraftColorCodedElement, getStyleForTier } from '../../utils/Formatter'
import { useHoverPrefetch } from '../../hooks/useHoverPrefetch'
import { CopyButton } from '../CopyButton/CopyButton'
import Number from '../Number/Number'
import styles from './ActiveAuctionExplorer.module.css'

interface Props {
    auction: ActiveAuctionPreview
    flash?: boolean
    gone?: boolean
}

/** same look as the cards of ActiveAuctions/RecentAuctions; a click opens the auction page */
export default function ActiveAuctionCard(props: Props) {
    const { auction } = props
    const { bind } = useHoverPrefetch()
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(interval)
    }, [])

    const highlights = Object.entries(auction.highlights || {})
    const name = auction.itemName || convertTagToName(auction.tag)

    return (
        <div className={`${styles.cardWrapper} ${props.flash ? styles.flash : ''} ${props.gone ? styles.gone : ''}`} data-uuid={auction.uuid}>
            <Card className={styles.auctionCard}>
                <Link href={`/auction/${auction.uuid}`} className="disableLinkStyle" {...bind(`/auction/${auction.uuid}`)}>
                    <Card.Header style={{ padding: '10px' }}>
                        <div className={styles.cardHeader}>
                            <Image
                                crossOrigin="anonymous"
                                className="playerHeadIcon"
                                src={api.getItemImageUrl({ tag: auction.tag })}
                                height={32}
                                width={32}
                                alt=""
                                style={{ marginRight: '5px' }}
                                loading="lazy"
                            />
                            <span className={styles.itemName} style={getStyleForTier(auction.tier)}>
                                {getMinecraftColorCodedElement(name, false)}
                                {auction.count > 1 ? ` x${auction.count}` : ''}
                            </span>
                        </div>
                        <div className={styles.cardPrice}>
                            <span>
                                <Number number={getAuctionPrice(auction)} /> Coins
                            </span>
                            <div onClick={e => e.preventDefault()}>
                                <CopyButton
                                    buttonVariant="primary"
                                    copyValue={'/viewauction ' + auction.uuid}
                                    runInGame
                                    successMessage={
                                        <p>
                                            Copied ingame link <br />
                                            <i>/viewauction {auction.uuid}</i>
                                        </p>
                                    }
                                />
                            </div>
                        </div>
                    </Card.Header>
                    <Card.Body style={{ padding: '10px' }}>
                        <div className={styles.rowMeta}>
                            {auction.bin ? <Badge bg="success">BIN</Badge> : <Badge bg="secondary" className={styles.bidBadge}>
                                    bid
                                </Badge>}
                            <span>{formatTimeLeft(auction.end, now)}</span>
                            <span>by {getSellerLabel(auction)}</span>
                        </div>
                        {highlights.length > 0 ? (
                            <span className={styles.highlights}>
                                {highlights.map(([key, value]) => (
                                    <span key={key} className={styles.highlight}>
                                        {key}: {value}
                                    </span>
                                ))}
                            </span>
                        ) : null}
                    </Card.Body>
                </Link>
            </Card>
        </div>
    )
}
