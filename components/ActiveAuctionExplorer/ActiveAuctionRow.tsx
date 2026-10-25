'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Badge, Spinner } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { formatTimeLeft, getAuctionPrice } from '../../utils/ActiveAuctionUtils'
import { convertTagToName, getMinecraftColorCodedElement, getStyleForTier, numberWithThousandsSeparators } from '../../utils/Formatter'
import { CopyButton } from '../CopyButton/CopyButton'
import styles from './ActiveAuctionExplorer.module.css'

const playerNameCache = new Map<string, Promise<string>>()

function resolvePlayerName(uuid: string): Promise<string> {
    let cached = playerNameCache.get(uuid)
    if (!cached) {
        cached = api.getPlayerName(uuid).catch(() => '')
        playerNameCache.set(uuid, cached)
    }
    return cached
}

interface Props {
    auction: ActiveAuctionPreview
    flash?: boolean
    gone?: boolean
}

export default function ActiveAuctionRow(props: Props) {
    const { auction } = props
    const [expanded, setExpanded] = useState(false)
    const [details, setDetails] = useState<AuctionDetails | null>(null)
    const [detailsError, setDetailsError] = useState(false)
    const [sellerName, setSellerName] = useState(auction.playerName || '')
    const [now, setNow] = useState(() => Date.now())

    useEffect(() => {
        if (auction.playerName) {
            setSellerName(auction.playerName)
            return
        }
        let cancelled = false
        resolvePlayerName(auction.auctioneerId).then(name => !cancelled && setSellerName(name))
        return () => {
            cancelled = true
        }
    }, [auction.auctioneerId, auction.playerName])

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(interval)
    }, [])

    function toggle() {
        const next = !expanded
        setExpanded(next)
        // calling the details endpoint also makes the backend re-check this seller
        if (next && !details) {
            setDetailsError(false)
            api.getAuctionDetails(auction.uuid)
                .then(result => setDetails(result.parsed))
                .catch(() => setDetailsError(true))
        }
    }

    const highlights = Object.entries(auction.highlights || {})
    const name = auction.itemName || convertTagToName(auction.tag)

    return (
        <div className={`${styles.row} ${props.flash ? styles.flash : ''} ${props.gone ? styles.gone : ''}`} data-uuid={auction.uuid}>
            <div
                className={styles.rowMain}
                role="button"
                tabIndex={0}
                aria-expanded={expanded}
                onClick={toggle}
                onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggle()
                    }
                }}
            >
                <Image
                    crossOrigin="anonymous"
                    className="playerHeadIcon"
                    src={api.getItemImageUrl({ tag: auction.tag })}
                    height={32}
                    width={32}
                    alt=""
                    loading="lazy"
                />
                <div className={styles.rowTitle}>
                    <span className={styles.itemName} style={getStyleForTier(auction.tier)}>
                        {getMinecraftColorCodedElement(name, false)}
                        {auction.count > 1 ? ` x${auction.count}` : ''}
                    </span>
                    <span className={styles.rowMeta}>
                        {auction.bin ? <Badge bg="success">BIN</Badge> : <Badge bg="secondary">bid</Badge>}
                        <span>{formatTimeLeft(auction.end, now)}</span>
                        {sellerName ? <span className={styles.seller}>by {sellerName}</span> : null}
                    </span>
                    {highlights.length > 0 ? (
                        <span className={styles.highlights}>
                            {highlights.map(([key, value]) => (
                                <span key={key} className={styles.highlight}>
                                    {key}: {value}
                                </span>
                            ))}
                        </span>
                    ) : null}
                </div>
                <div className={styles.price}>{numberWithThousandsSeparators(getAuctionPrice(auction))}</div>
            </div>
            {expanded ? (
                <div className={styles.details}>
                    {!details && !detailsError ? <Spinner animation="border" size="sm" /> : null}
                    {detailsError ? <span>Could not load the auction details.</span> : null}
                    {details ? (
                        <ul className={styles.detailList}>
                            <li>Bids: {details.bids?.length ?? 0}</li>
                            <li>Started: {details.start.toLocaleString()}</li>
                            <li>Ends: {auction.end.toLocaleString()}</li>
                            {details.reforge ? <li>Reforge: {details.reforge}</li> : null}
                            {details.enchantments?.length ? <li>Enchantments: {details.enchantments.map(e => `${e.name ?? e.id} ${e.level ?? ''}`.trim()).join(', ')}</li> : null}
                        </ul>
                    ) : null}
                    <div className={styles.detailActions}>
                        <CopyButton
                            buttonVariant="primary"
                            copyValue={'/viewauction ' + auction.uuid}
                            buttonContent={<span>Copy /viewauction</span>}
                            successMessage={
                                <p>
                                    Copied ingame link <br />
                                    <i>/viewauction {auction.uuid}</i>
                                </p>
                            }
                        />
                        <Link href={`/auction/${auction.uuid}`} className={styles.linkButton}>
                            Open auction page
                        </Link>
                    </div>
                </div>
            ) : null}
        </div>
    )
}
