'use client'
import moment from 'moment'
import { useEffect, useRef, useState, type JSX } from 'react';
import Card from 'react-bootstrap/Card'
import { Table } from 'react-bootstrap'
import api from '../../../../api/ApiHelper'
import { CUSTOM_EVENTS } from '../../../../api/ApiTypes.d'
import { useDebounce } from '../../../../utils/Hooks'
import Number from '../../../Number/Number'
import styles from './BazaarSnapshot.module.css'

interface Props {
    item: Item
}

function BazaarSnapshot(props: Props) {
    let [timestamp, setTimestamp] = useState<Date>(new Date())
    let [bazaarSnapshot, setBazaarSnapshot] = useState<BazaarSnapshot>()

    let debouncedTimestamp = useDebounce(timestamp, 100)
    let bazaarSnapshotDateRef = useRef(null)

    useEffect(() => {
        if (!bazaarSnapshot) {
            return
        }

        // Only auto-refresh if the user is looking at recent data (less than a minute old)
        if (new Date().getTime() - timestamp.getTime() > 60000) {
            return
        }

        const lastUpdate = new Date(bazaarSnapshot.timeStamp).getTime()
        const nextUpdate = lastUpdate + 25000
        const timeoutDuration = Math.max(0, nextUpdate - Date.now())

        const timer = setTimeout(() => {
            setTimestamp(new Date())
        }, timeoutDuration)

        return () => clearTimeout(timer)
    }, [bazaarSnapshot])

    useEffect(() => {
        document.addEventListener(CUSTOM_EVENTS.BAZAAR_SNAPSHOT_UPDATE, onTimestampChangeEvent)

        return () => {
            document.removeEventListener(CUSTOM_EVENTS.BAZAAR_SNAPSHOT_UPDATE, onTimestampChangeEvent)
        }
    }, [])

    useEffect(() => {
        loadBazaarSnapshot()
    }, [props.item.tag])

    useEffect(() => {
        loadBazaarSnapshot()
    }, [debouncedTimestamp])

    function onTimestampChangeEvent(e) {
        if ((e as any).detail?.timestamp) {
            let t = (e as any).detail?.timestamp
            setTimestamp(t)
        }
    }

    function loadBazaarSnapshot() {
        bazaarSnapshotDateRef.current = typeof debouncedTimestamp?.getTime === 'function' ? (debouncedTimestamp as Date).getTime() : debouncedTimestamp

        api.getBazaarSnapshot(props.item.tag, debouncedTimestamp).then(snapshot => {
            if (
                bazaarSnapshotDateRef.current ===
                (typeof debouncedTimestamp?.getTime === 'function' ? (debouncedTimestamp as Date).getTime() : debouncedTimestamp)
            ) {
                setBazaarSnapshot(snapshot)
            }
        })
    }

    function getInformationBody(data: BazaarSnapshotData): JSX.Element {
        return (
            <div>
                <p>
                    <span className={styles.label}>Orders:</span>
                    <Number number={data.orderCount} />
                </p>
                <p>
                    <span className={styles.label}>Price:</span>
                    <Number number={data.price} /> Coins
                </p>
                <p>
                    <span className={styles.label}>Volume:</span>
                    <Number number={data.volume} />
                </p>
                <p>
                    <span className={styles.label}>Movement:</span>
                    <Number number={data.moving} /> Coins
                </p>
            </div>
        )
    }

    function getOrderListElement(orders: BazaarOrder[], maxAmount: number, type: 'buy' | 'sell'): JSX.Element {
        const color = type === 'buy' ? 'rgba(40, 167, 69, 0.2)' : 'rgba(220, 53, 69, 0.2)'
        return (
            <Table style={{ borderCollapse: 'separate', borderSpacing: '0 4px' }}>
                <thead>
                    <tr>
                        <th>Price per unit</th>
                        <th>Amount</th>
                        <th>Orders</th>
                        <th>Coin Equivalent</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr
                            key={order.pricePerUnit}
                            className={styles.orderRow}
                            style={
                                {
                                    '--gradient-color': color,
                                    '--gradient-width': `${(order.amount / maxAmount) * 100}%`,
                                } as React.CSSProperties
                            }
                        >
                            <td>
                                <Number number={order.pricePerUnit} /> Coins
                            </td>
                            <td>
                                <Number number={order.amount} />
                            </td>
                            <td>{order.orders}</td>
                            <td>
                                <Number number={order.pricePerUnit * order.amount} /> Coins
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        )
    }

    if (!bazaarSnapshot) {
        return null
    }

    const allOrders = [...bazaarSnapshot.buyOrders, ...bazaarSnapshot.sellOrders]
    const maxAmount = Math.max(...allOrders.map(o => o.amount), 0)

    return (
        <>
            <h3 className={styles.headline}>
                {bazaarSnapshot.item.name}Bazaar Snaphot ({moment(bazaarSnapshot.timeStamp).format('MMMM Do YYYY, h:mm:ss a')})
            </h3>
            <div className={styles.flex}>
                <Card className={styles.informationField}>
                    <Card.Header>
                        <Card.Title>Buy information</Card.Title>
                    </Card.Header>
                    <Card.Body>{getInformationBody(bazaarSnapshot.buyData)}</Card.Body>
                </Card>
                <Card className={styles.informationField}>
                    <Card.Header>
                        <Card.Title>Sell information</Card.Title>
                    </Card.Header>
                    <Card.Body>{getInformationBody(bazaarSnapshot.sellData)}</Card.Body>
                </Card>
            </div>
            <div className={styles.flex}>
                <Card className={styles.informationField}>
                    <Card.Header>
                        <Card.Title>Sell orders</Card.Title>
                    </Card.Header>
                    <Card.Body>{getOrderListElement(bazaarSnapshot.buyOrders, maxAmount, 'sell')}</Card.Body>
                </Card>
                <Card className={styles.informationField}>
                    <Card.Header>
                        <Card.Title>Buy orders</Card.Title>
                    </Card.Header>
                    <Card.Body>{getOrderListElement(bazaarSnapshot.sellOrders, maxAmount, 'buy')}</Card.Body>
                </Card>
            </div>
        </>
    )
}

export default BazaarSnapshot
