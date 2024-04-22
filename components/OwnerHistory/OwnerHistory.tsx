'use client'
import React, { useEffect, useState } from 'react'
import { Card, ListGroup } from 'react-bootstrap'
import api from '../../api/ApiHelper'
import { getLoadingElement } from '../../utils/LoadingUtils'
import styles from './OwnerHistory.module.css'
import ArrowRightIcon from '@mui/icons-material/ArrowRightAlt'
import moment from 'moment'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import Number from '../Number/Number'

interface Props {
    uid: string
}

function ItemHistory(props: Props) {
    let [historyEntries, setHistoryEntries] = useState<OwnerHistory[]>([])
    let [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        loadOwnerHistory()
    }, [])

    async function loadOwnerHistory() {
        setIsLoading(true)

        let ownerHistory = await api.getOwnerHistory(props.uid)

        let prevOwnerObjects: OwnerHistory[] = []

        let namesToFetch: string[] = []
        ownerHistory.forEach(history => {
            namesToFetch.push(history.buyer.uuid)
            namesToFetch.push(history.seller.uuid)
        })
        let names = await api.getPlayerNames(namesToFetch)

        ownerHistory.forEach(history => {
            history.seller.name = names[history.seller.uuid]
            history.buyer.name = names[history.buyer.uuid]

            prevOwnerObjects.push(history)
        })

        let sorted = prevOwnerObjects.sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())
        for (let i = 0; i < sorted.length; i++) {
            let entry = sorted[i]
            if (i === 0) {
                continue
            }
            if (entry.buyer.uuid !== sorted[i - 1].seller.uuid) {
                sorted.splice(i, 0, {
                    highestBid: -1,
                    itemTag: sorted[i - 1].itemTag,
                    timestamp: null,
                    buyer: sorted[i - 1].seller,
                    seller: entry.buyer,
                    uuid: entry.uuid
                })
                i++
            }
        }
        setHistoryEntries(prevOwnerObjects)
        setIsLoading(false)
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
                                    <img
                                        crossOrigin="anonymous"
                                        className="playerHeadIcon"
                                        src={api.getItemImageUrl({
                                            tag: historyEntry.itemTag
                                        })}
                                        alt="player icon"
                                        height="36"
                                        style={{ marginRight: '10px' }}
                                        loading="lazy"
                                    />
                                    {historyEntry.timestamp ? moment(historyEntry.timestamp).format('MMMM Do YYYY, h:mm:ss a') : 'Outside of AH'}
                                    {historyEntry.uuid ? (
                                        <a style={{ float: 'right', cursor: 'pointer' }} href={`/auction/${historyEntry.uuid}`} className="disableLinkStyle">
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
                                        {historyEntry.highestBid === -1 ? null : <Number number={historyEntry.highestBid} />}
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
