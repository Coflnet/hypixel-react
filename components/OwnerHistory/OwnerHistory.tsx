'use client'
import React, { useEffect, useState } from 'react'
import { Button, Card, ListGroup } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { parsePlayer } from '../../utils/Parser/APIResponseParser'
import { getLoadingElement } from '../../utils/LoadingUtils'
import styles from './OwnerHistory.module.css'
import ArrowRightIcon from '@mui/icons-material/ArrowRightAlt'
import moment from 'moment'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Number } from '../Number/Number'

interface Props {
    uid: string
}

interface HistoryEntry {
    buyer: Player
    seller: Player
    timestamp: Date | null
    auctionDetails: AuctionDetails | null
}

function ItemHistory(props: Props) {
    let [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([])
    let [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadOwnerHistory()
    }, [])

    async function loadOwnerHistory() {
        setIsLoading(true)

        let ownerHistory = await api.getOwnerHistory(props.uid)

        let prevOwnerObjects: HistoryEntry[] = []
        let promises: Promise<void>[] = []

        ownerHistory.forEach(history => {
            promises.push(
                Promise.all([api.getPlayerName(history.buyer), api.getPlayerName(history.seller), api.getAuctionDetails(history.uuid)]).then(results => {
                    let prevOwnerObject: HistoryEntry = {
                        buyer: parsePlayer({ name: results[0], uuid: history.buyer }),
                        seller: parsePlayer({ name: results[1], uuid: history.seller }),
                        auctionDetails: results[2].parsed,
                        timestamp: new Date(history.timestamp)
                    }
                    prevOwnerObjects.push(prevOwnerObject)
                })
            )
        })

        Promise.all(promises).then(() => {
            let sorted = prevOwnerObjects.sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime())
            for (let i = 0; i < sorted.length; i++) {
                let entry = sorted[i]
                if (i === sorted.length - 1) {
                    continue
                }
                if (entry.buyer.uuid !== sorted[i + 1].seller.uuid) {
                    sorted.splice(i + 1, 0, {
                        auctionDetails: null,
                        timestamp: null,
                        buyer: sorted[i + 1].seller,
                        seller: entry.buyer
                    })
                    i++
                }
            }
            setHistoryEntries(prevOwnerObjects)
            setIsLoading(false)
        })
    }

    function getPlayerElement(player: Player) {
        return (
            <div className={styles.playerElement}>
                <img
                    crossOrigin="anonymous"
                    className="playerHeadIcon"
                    src={player.iconUrl}
                    alt="player icon"
                    height="36"
                    style={{ marginRight: '10px' }}
                    loading="lazy"
                />
                {player.name}
            </div>
        )
    }

    return (
        <>
            {isLoading ? (
                getLoadingElement()
            ) : (
                <ListGroup className={styles.list}>
                    {historyEntries.map((historyEntry, i) => {
                        return (
                            <ListGroup.Item className={styles.listGroupItem}>
                                <h1 style={{ fontSize: 'large' }}>
                                    {historyEntry.auctionDetails?.auction.item || historyEntries[i - 1].auctionDetails?.auction.item ? (
                                        <img
                                            crossOrigin="anonymous"
                                            className="playerHeadIcon"
                                            src={api.getItemImageUrl(
                                                historyEntry.auctionDetails
                                                    ? historyEntry.auctionDetails?.auction.item
                                                    : historyEntries[i - 1].auctionDetails!.auction.item
                                            )}
                                            alt="player icon"
                                            height="36"
                                            style={{ marginRight: '10px' }}
                                            loading="lazy"
                                        />
                                    ) : null}
                                    {historyEntry.timestamp ? moment(historyEntry.timestamp).format('MMMM Do YYYY, h:mm:ss a') : 'Outside of AH'}
                                    {historyEntry.auctionDetails ? (
                                        <a
                                            style={{ float: 'right', cursor: 'pointer' }}
                                            href={`/auction/${historyEntry.auctionDetails.uuid}`}
                                            className="disableLinkStyle"
                                        >
                                            Open auction
                                            <OpenInNewIcon />
                                        </a>
                                    ) : null}
                                </h1>
                                <hr />
                                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                                    <Card className={styles.playerField}>
                                        <a href={`/player/${historyEntry.seller.uuid}`} target={'_blank'} className="disableLinkStyle">
                                            <Card.Header className={styles.playerFieldHeader}>
                                                <Card.Title style={{ margin: 0 }}>{getPlayerElement(historyEntry.seller)}</Card.Title>
                                            </Card.Header>
                                        </a>
                                    </Card>
                                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                        <ArrowRightIcon style={{ fontSize: '50px' }} />
                                        {historyEntry.auctionDetails ? <Number number={historyEntry.auctionDetails.auction.highestBid} /> : null}
                                    </div>
                                    <Card className={styles.playerField}>
                                        <a href={`/player/${historyEntry.buyer.uuid}`} target={'_blank'} className="disableLinkStyle">
                                            <Card.Header className={styles.playerFieldHeader}>
                                                <Card.Title style={{ margin: 0 }}>{getPlayerElement(historyEntry.buyer)}</Card.Title>
                                            </Card.Header>
                                        </a>
                                    </Card>
                                </div>
                            </ListGroup.Item>
                        )
                    })}
                </ListGroup>
            )}
        </>
    )
}

export default ItemHistory
