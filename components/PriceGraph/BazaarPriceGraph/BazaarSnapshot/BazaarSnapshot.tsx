import moment from 'moment'
import React, { useEffect, useRef, useState } from 'react'
import { Card, ListGroup, Table } from 'react-bootstrap'
import api from '../../../../api/ApiHelper'
import { CUSTOM_EVENTS } from '../../../../api/ApiTypes.d'
import { numberWithThousandsSeperators } from '../../../../utils/Formatter'
import { useDebounce } from '../../../../utils/Hooks'
import styles from './BazaarSnapshot.module.css'

interface Props {
    item: Item
}

function BazaarSnapshot(props: Props) {
    let [timestamp, setTimestamp] = useState(null)
    let [bazaarSnapshot, setBazaarSnapshot] = useState<BazaarSnapshot>()

    let debouncedTimestamp = useDebounce(timestamp, 100)
    let bazaarSnapshotDateRef = useRef(null)

    useEffect(() => {
        setTimestamp(new Date())
        document.addEventListener(CUSTOM_EVENTS.BAZAAR_SNAPSHOT_UPDATE, onTimestampChangeEvent)

        return () => {
            document.removeEventListener(CUSTOM_EVENTS.BAZAAR_SNAPSHOT_UPDATE, onTimestampChangeEvent)
        }
    }, [])

    useEffect(() => {
        loadBazaarSnapshot()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.item.tag])

    useEffect(() => {
        loadBazaarSnapshot()
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                    {numberWithThousandsSeperators(data.orderCount)}
                </p>
                <p>
                    <span className={styles.label}>Price:</span>
                    {numberWithThousandsSeperators(data.price)} Coins
                </p>
                <p>
                    <span className={styles.label}>Volume:</span>
                    {data.volume}
                </p>
                <p>
                    <span className={styles.label}>Movement:</span>
                    {numberWithThousandsSeperators(data.moving)} Coins
                </p>
            </div>
        )
    }

    function getOrderListElement(orders: BazaarOrder[]): JSX.Element {
        return (
            <Table>
                <thead>
                    <tr>
                        <th>Price per unit</th>
                        <th>Amount</th>
                        <th>Orders</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                        <tr key={order.pricePerUnit}>
                            <td>{numberWithThousandsSeperators(order.pricePerUnit)} Coins</td>
                            <td>{order.amount}</td>
                            <td>{order.orders}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        )
    }

    if (!bazaarSnapshot) {
        return null
    }

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
                        <Card.Title>Buy orders</Card.Title>
                    </Card.Header>
                    <Card.Body>{getOrderListElement(bazaarSnapshot.buyOrders)}</Card.Body>
                </Card>
                <Card className={styles.informationField}>
                    <Card.Header>
                        <Card.Title>Sell orders</Card.Title>
                    </Card.Header>
                    <Card.Body>{getOrderListElement(bazaarSnapshot.sellOrders)}</Card.Body>
                </Card>
            </div>
        </>
    )
}

export default BazaarSnapshot
