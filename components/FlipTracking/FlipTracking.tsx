import React, { useEffect, useState } from 'react'
import { Badge, Card, ListGroup } from 'react-bootstrap'
import { ArrowRightAlt as ArrowRightIcon } from '@mui/icons-material'
import { getStyleForTier, numberWithThousandsSeperators } from '../../utils/Formatter'
import styles from './FlipTracking.module.css'

interface Props {
    totalProfit?: number
    trackedFlips?: FlipTrackingFlip[]
}

export function FlipTracking(props: Props) {
    let [totalProfit, setTotalProfit] = useState(props.totalProfit || 0)
    let [trackedFlips, setTrackedFlips] = useState<FlipTrackingFlip[]>(props.trackedFlips || [])

    let list = trackedFlips
        .sort((a, b) => b.sellTime.getTime() - a.sellTime.getTime())
        .map((trackedFlip, i) => {
            return (
                <ListGroup.Item className={styles.listGroupItem}>
                    <h1 style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', fontSize: 'x-large' }}>
                        <div className="ellipse">
                            <img
                                crossOrigin="anonymous"
                                src={trackedFlip.item.iconUrl}
                                height="36"
                                width="36"
                                alt=""
                                style={{ marginRight: '5px' }}
                                loading="lazy"
                            />
                            <span style={{ ...getStyleForTier(trackedFlip.item.tier), whiteSpace: 'nowrap' }}>{trackedFlip.item.name}</span>
                        </div>
                        {trackedFlip.soldFor - trackedFlip.pricePaid > 0 ? (
                            <span style={{ color: 'lime', whiteSpace: 'nowrap', marginLeft: '5px' }}>
                                +{numberWithThousandsSeperators(trackedFlip.soldFor - trackedFlip.pricePaid)} Coins
                            </span>
                        ) : (
                            <span style={{ color: 'red', whiteSpace: 'nowrap', marginLeft: '5px' }}>
                                {numberWithThousandsSeperators(trackedFlip.soldFor - trackedFlip.pricePaid)} Coins
                            </span>
                        )}
                    </h1>
                    <hr />
                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                        <Card style={{ width: '45%' }}>
                            <Card.Header>
                                <Card.Title>{numberWithThousandsSeperators(trackedFlip.pricePaid)} Coins</Card.Title>
                            </Card.Header>
                        </Card>
                        <ArrowRightIcon style={{ fontSize: '50px' }} />
                        <Card style={{ width: '45%' }}>
                            <Card.Header>
                                <Card.Title>{numberWithThousandsSeperators(trackedFlip.soldFor)} Coins</Card.Title>
                            </Card.Header>
                        </Card>
                    </div>
                    <p style={{ marginTop: '10px' }}>
                        Finder: <Badge variant="dark">{trackedFlip.finder.shortLabel}</Badge>
                    </p>
                    <p style={{ marginTop: '10px' }}>Sell: {trackedFlip.sellTime.toLocaleDateString() + ' ' + trackedFlip.sellTime.toLocaleTimeString()}</p>
                </ListGroup.Item>
            )
        })

    return (
        <div>
            <b>
                <p style={{ fontSize: 'larger' }}>
                    Total Profit: <span style={{ color: 'gold' }}>{numberWithThousandsSeperators(totalProfit)} Coins</span>
                </p>
            </b>
            <hr />
            {trackedFlips.length === 0 ? (
                <div className={styles.noAuctionFound}>
                    <img src="/Barrier.png" width="24" height="24" alt="not found icon" style={{ float: 'left', marginRight: '5px' }} />{' '}
                    <p>We couldn't find any tracked flips.</p>
                </div>
            ) : (
                <ListGroup className={styles.list}>{list}</ListGroup>
            )}
        </div>
    )
}
